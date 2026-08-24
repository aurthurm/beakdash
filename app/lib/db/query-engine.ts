import { promisify } from 'util';
import { 
  BaseConnectionConfig, 
  DatabaseDialect, 
  detectDialect, 
  getPgPool, 
  getMysqlPool, 
  getSqliteDb 
} from './connection-pool';

export interface QueryColumnMetadata {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'json' | 'unknown';
  originalType?: string;
}

export interface QueryExecutionResult {
  data: Record<string, any>[];
  columns: QueryColumnMetadata[];
  rowCount: number;
  totalCount?: number;
  truncated: boolean;
  executionTimeMs: number;
  dialect: DatabaseDialect;
}

export interface QueryOptions {
  readOnly?: boolean;
  maxRows?: number;
  timeoutMs?: number;
}

const FORBIDDEN_READONLY_COMMANDS = [
  'ALTER',
  'CREATE',
  'DELETE',
  'DROP',
  'EXEC',
  'EXECUTE',
  'GRANT',
  'INSERT',
  'MERGE',
  'REPLACE',
  'REVOKE',
  'TRUNCATE',
  'UPDATE',
];

/**
 * Validate whether a SQL query is safe to execute in read-only mode
 */
export function validateQuerySafety(query: string, readOnly: boolean = true): { safe: boolean; reason?: string } {
  const trimmed = query.trim();
  if (!trimmed) {
    return { safe: false, reason: 'Query cannot be empty.' };
  }

  if (!readOnly) {
    return { safe: true };
  }

  // Remove single line and multiline comments before analyzing keywords
  const sanitized = trimmed
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .trim();

  const words = sanitized.split(/\s+/).map((w) => w.toUpperCase());

  for (const forbidden of FORBIDDEN_READONLY_COMMANDS) {
    if (words.includes(forbidden)) {
      return {
        safe: false,
        reason: `Destructive command "${forbidden}" is not permitted in read-only query mode.`,
      };
    }
  }

  return { safe: true };
}

/**
 * Infer high-level column types from sample data
 */
function inferColumnMetadata(data: Record<string, any>[]): QueryColumnMetadata[] {
  if (!data || data.length === 0) {
    return [];
  }

  const columns: QueryColumnMetadata[] = [];
  const keys = Object.keys(data[0]);

  for (const key of keys) {
    let inferredType: QueryColumnMetadata['type'] = 'unknown';

    for (const row of data.slice(0, 100)) {
      const val = row[key];
      if (val === null || val === undefined) continue;

      if (typeof val === 'number') {
        inferredType = 'number';
        break;
      } else if (typeof val === 'boolean') {
        inferredType = 'boolean';
        break;
      } else if (val instanceof Date) {
        inferredType = 'date';
        break;
      } else if (typeof val === 'object') {
        inferredType = 'json';
        break;
      } else if (typeof val === 'string') {
        // Check if ISO date string
        if (!isNaN(Date.parse(val)) && (val.includes('-') || val.includes(':')) && !/^\d+$/.test(val)) {
          inferredType = 'date';
        } else if (!isNaN(Number(val)) && val.trim() !== '') {
          inferredType = 'number';
        } else {
          inferredType = 'string';
        }
        break;
      }
    }

    if (inferredType === 'unknown') {
      inferredType = 'string';
    }

    columns.push({
      name: key,
      type: inferredType,
    });
  }

  return columns;
}

/**
 * Parse CSV data string into structured objects
 */
function parseCsv(csvText: string, delimiter: string = ','): Record<string, any>[] {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(delimiter).map((v) => v.trim().replace(/^["']|["']$/g, ''));
    const row: Record<string, any> = {};
    headers.forEach((header, idx) => {
      const val = values[idx] ?? '';
      const num = Number(val);
      if (!isNaN(num) && val !== '') {
        row[header] = num;
      } else if (val.toLowerCase() === 'true') {
        row[header] = true;
      } else if (val.toLowerCase() === 'false') {
        row[header] = false;
      } else {
        row[header] = val;
      }
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Execute a query safely across any supported database or API data source
 */
export async function executeQuery(
  connectionType: string,
  config: BaseConnectionConfig,
  query: string,
  options: QueryOptions = {}
): Promise<QueryExecutionResult> {
  const { readOnly = true, maxRows = 5000, timeoutMs = 15000 } = options;

  const safetyCheck = validateQuerySafety(query, readOnly);
  if (!safetyCheck.safe) {
    throw new Error(safetyCheck.reason);
  }

  const dialect = detectDialect(connectionType, config);
  const startTime = Date.now();

  switch (dialect) {
    case 'postgresql': {
      const pool = getPgPool(config);
      const client = await pool.connect();
      try {
        await client.query(`SET statement_timeout = ${timeoutMs}`);
        const result = await client.query(query);
        const executionTimeMs = Date.now() - startTime;
        
        const rawRows = result.rows || [];
        const truncated = rawRows.length > maxRows;
        const data = truncated ? rawRows.slice(0, maxRows) : rawRows;

        const columns = (result.fields || []).map((f) => ({
          name: f.name,
          type: (typeof f.dataTypeID === 'number' && [20, 21, 23, 700, 701, 1700].includes(f.dataTypeID))
            ? ('number' as const)
            : [1082, 1114, 1184].includes(f.dataTypeID)
            ? ('date' as const)
            : f.dataTypeID === 16
            ? ('boolean' as const)
            : ('string' as const),
        }));

        return {
          data,
          columns: columns.length > 0 ? columns : inferColumnMetadata(data),
          rowCount: data.length,
          totalCount: rawRows.length,
          truncated,
          executionTimeMs,
          dialect: 'postgresql',
        };
      } finally {
        client.release();
      }
    }

    case 'mysql': {
      const pool = getMysqlPool(config);
      const [rows, fields] = await pool.query(query);
      const executionTimeMs = Date.now() - startTime;

      const rawRows = (rows as any[]) || [];
      const truncated = rawRows.length > maxRows;
      const data = truncated ? rawRows.slice(0, maxRows) : rawRows;

      const columns = (fields as any[] || []).map((f: any) => ({
        name: f.name,
        type: inferColumnMetadata(data).find(c => c.name === f.name)?.type || 'string',
        originalType: String(f.type),
      }));

      return {
        data,
        columns: columns.length > 0 ? columns : inferColumnMetadata(data),
        rowCount: data.length,
        totalCount: rawRows.length,
        truncated,
        executionTimeMs,
        dialect: 'mysql',
      };
    }

    case 'sqlite': {
      const filePath = config.filePath || config.database;
      if (!filePath) {
        throw new Error('SQLite database file path is required');
      }
      const db = getSqliteDb(filePath);
      const allAsync = promisify(db.all.bind(db));

      const rawRows: any = await allAsync(query);
      const executionTimeMs = Date.now() - startTime;

      const rowsArray = Array.isArray(rawRows) ? rawRows : [];
      const truncated = rowsArray.length > maxRows;
      const data = truncated ? rowsArray.slice(0, maxRows) : rowsArray;

      return {
        data,
        columns: inferColumnMetadata(data),
        rowCount: data.length,
        totalCount: rowsArray.length,
        truncated,
        executionTimeMs,
        dialect: 'sqlite',
      };
    }

    case 'rest': {
      const targetUrl = config.baseUrl || config.url;
      if (!targetUrl) {
        throw new Error('REST API URL is required');
      }

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        ...(config.headers || {}),
      };

      if (config.authType === 'apikey' && config.apiKey && config.headerName) {
        headers[config.headerName] = config.apiKey;
      } else if (config.authType === 'bearer' && config.apiKey) {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
      } else if (config.authType === 'basic' && config.apiKey) {
        headers['Authorization'] = `Basic ${Buffer.from(config.apiKey).toString('base64')}`;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(targetUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`REST request failed with HTTP ${response.status}: ${response.statusText}`);
        }

        const json = await response.json();
        const executionTimeMs = Date.now() - startTime;

        let rawRows: Record<string, any>[] = [];
        if (Array.isArray(json)) {
          rawRows = json;
        } else if (typeof json === 'object' && json !== null) {
          // If response has a data / results / items array
          const possibleArray = json.data || json.results || json.items || json.rows;
          if (Array.isArray(possibleArray)) {
            rawRows = possibleArray;
          } else {
            rawRows = [json];
          }
        }

        const truncated = rawRows.length > maxRows;
        const data = truncated ? rawRows.slice(0, maxRows) : rawRows;

        return {
          data,
          columns: inferColumnMetadata(data),
          rowCount: data.length,
          totalCount: rawRows.length,
          truncated,
          executionTimeMs,
          dialect: 'rest',
        };
      } catch (err: any) {
        clearTimeout(timeout);
        throw err;
      }
    }

    case 'csv': {
      const csvData = config.csvData || config.file || '';
      const rawRows = parseCsv(csvData, config.delimiter || ',');
      const executionTimeMs = Date.now() - startTime;

      const truncated = rawRows.length > maxRows;
      const data = truncated ? rawRows.slice(0, maxRows) : rawRows;

      return {
        data,
        columns: inferColumnMetadata(data),
        rowCount: data.length,
        totalCount: rawRows.length,
        truncated,
        executionTimeMs,
        dialect: 'csv',
      };
    }

    default:
      throw new Error(`Unsupported database dialect: ${dialect}`);
  }
}
