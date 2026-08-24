import { promisify } from 'util';
import { 
  BaseConnectionConfig, 
  detectDialect, 
  getPgPool, 
  getMysqlPool, 
  getSqliteDb 
} from './connection-pool';

export interface ColumnInfo {
  column: string;
  type: string;
  nullable?: boolean;
  isPrimaryKey?: boolean;
}

export interface TableInfo {
  [tableName: string]: ColumnInfo[];
}

export interface SchemaInfo {
  [schemaName: string]: TableInfo;
}

// In-memory schema cache with 5-minute TTL
interface CachedSchema {
  schema: SchemaInfo;
  timestamp: number;
}
const schemaCache = new Map<string, CachedSchema>();
const SCHEMA_CACHE_TTL_MS = 5 * 60 * 1000;

function getSchemaCacheKey(config: BaseConnectionConfig): string {
  return `${config.type || ''}:${config.host || ''}:${config.port || ''}:${config.database || ''}:${config.filePath || ''}`;
}

/**
 * Get schema information for a database connection with caching
 */
export async function getSchemaInfo(
  config: BaseConnectionConfig,
  forceRefresh: boolean = false
): Promise<SchemaInfo> {
  const cacheKey = getSchemaCacheKey(config);

  if (!forceRefresh) {
    const cached = schemaCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SCHEMA_CACHE_TTL_MS) {
      return cached.schema;
    }
  }

  const dialect = detectDialect(config.type, config);
  let schema: SchemaInfo;

  switch (dialect) {
    case 'postgresql':
      schema = await getPgSchema(config);
      break;
    case 'mysql':
      schema = await getMysqlSchema(config);
      break;
    case 'sqlite':
      schema = await getSqliteSchema(config.filePath || config.database || '');
      break;
    case 'rest':
    case 'csv':
      // For REST and CSV, provide a virtual schema
      schema = {
        main: {
          data: [
            { column: 'id', type: 'string', isPrimaryKey: true, nullable: false },
            { column: 'raw', type: 'json', nullable: true },
          ],
        },
      };
      break;
    default:
      throw new Error(`Unsupported database type: ${dialect}`);
  }

  schemaCache.set(cacheKey, {
    schema,
    timestamp: Date.now(),
  });

  return schema;
}

/**
 * Clear cached schema for a specific connection
 */
export function invalidateSchemaCache(config: BaseConnectionConfig): void {
  const cacheKey = getSchemaCacheKey(config);
  schemaCache.delete(cacheKey);
}

async function getPgSchema(config: BaseConnectionConfig): Promise<SchemaInfo> {
  const pool = getPgPool(config);
  const client = await pool.connect();

  try {
    const query = `
      SELECT 
          c.table_schema AS schema,
          c.table_name,
          c.column_name,
          c.data_type AS type,
          (c.is_nullable = 'YES') AS nullable,
          (pk.column_name IS NOT NULL) AS is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
          SELECT tc.table_schema, tc.table_name, kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk
        ON c.table_schema = pk.table_schema
        AND c.table_name = pk.table_name
        AND c.column_name = pk.column_name
      WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY c.table_schema, c.table_name, c.ordinal_position;
    `;

    const result = await client.query(query);
    return formatResults(result.rows, 'postgres');
  } finally {
    client.release();
  }
}

async function getMysqlSchema(config: BaseConnectionConfig): Promise<SchemaInfo> {
  const pool = getMysqlPool(config);

  const query = `
    SELECT 
      c.TABLE_SCHEMA AS \`schema\`,
      c.TABLE_NAME AS table_name,
      c.COLUMN_NAME AS column_name,
      c.DATA_TYPE AS type,
      (c.IS_NULLABLE = 'YES') AS nullable,
      (c.COLUMN_KEY = 'PRI') AS is_primary_key
    FROM INFORMATION_SCHEMA.COLUMNS c
    WHERE c.TABLE_SCHEMA NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')
    ORDER BY c.TABLE_SCHEMA, c.TABLE_NAME, c.ORDINAL_POSITION;
  `;

  const [rows] = await pool.query(query);
  return formatResults(rows as any[], 'mysql');
}

async function getSqliteSchema(filePath: string): Promise<SchemaInfo> {
  if (!filePath) {
    throw new Error('SQLite file path is required');
  }

  const db = getSqliteDb(filePath);
  const getAllTables = promisify(db.all.bind(db));

  const tables: any = await getAllTables(`
    SELECT name AS table_name 
    FROM sqlite_master 
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
  `);

  const results: any[] = [];
  for (const table of tables || []) {
    const tableInfo: any = await getAllTables(`PRAGMA table_info('${table.table_name}')`);
    if (Array.isArray(tableInfo)) {
      results.push(...tableInfo.map((info: any) => ({
        table_name: table.table_name,
        name: info.name,
        type: info.type || 'TEXT',
        notnull: info.notnull,
        pk: info.pk > 0,
      })));
    }
  }

  return formatResults(results, 'sqlite');
}

function formatResults(results: any[], dbType: string): SchemaInfo {
  const schemaMap: SchemaInfo = {};

  results.forEach((row) => {
    const schema = dbType === 'sqlite' ? 'main' : row.schema || 'public';
    const tableName = row.table_name;
    const columnName = dbType === 'sqlite' ? row.name : row.column_name;
    const type = row.type;
    const nullable = dbType === 'sqlite' ? row.notnull === 0 : Boolean(row.nullable);
    const isPrimaryKey = dbType === 'sqlite' ? Boolean(row.pk) : Boolean(row.is_primary_key);

    if (!schemaMap[schema]) {
      schemaMap[schema] = {};
    }
    if (!schemaMap[schema][tableName]) {
      schemaMap[schema][tableName] = [];
    }

    schemaMap[schema][tableName].push({
      column: columnName,
      type,
      nullable,
      isPrimaryKey,
    });
  });

  return schemaMap;
}