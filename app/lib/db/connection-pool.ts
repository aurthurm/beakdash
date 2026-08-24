import pg from 'pg';
import mysql from 'mysql2/promise';
import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import crypto from 'crypto';

export type DatabaseDialect = 'postgresql' | 'mysql' | 'sqlite' | 'rest' | 'csv';

export interface BaseConnectionConfig {
  type?: DatabaseDialect | string;
  host?: string;
  port?: number | string;
  user?: string;
  username?: string;
  password?: string;
  database?: string;
  ssl?: boolean | string | Record<string, any>;
  sslMode?: string;
  filePath?: string;
  // REST API configuration
  baseUrl?: string;
  url?: string;
  authType?: 'none' | 'apikey' | 'bearer' | 'basic';
  apiKey?: string;
  headerName?: string;
  headers?: Record<string, string>;
  // CSV configuration
  file?: string;
  csvData?: string;
  delimiter?: string;
  [key: string]: any;
}

export interface ConnectionTestResult {
  success: boolean;
  message?: string;
  error?: string;
  latencyMs?: number;
  dialect?: string;
}

// In-memory cache for connection pools with last-accessed timestamps
const pgPools = new Map<string, { pool: pg.Pool; lastUsed: number }>();
const mysqlPools = new Map<string, { pool: mysql.Pool; lastUsed: number }>();
const sqliteDbs = new Map<string, { db: sqlite3.Database; lastUsed: number }>();

const POOL_IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// Periodic cleanup of idle connection pools
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    
    // Cleanup PG pools
    for (const [key, entry] of pgPools.entries()) {
      if (now - entry.lastUsed > POOL_IDLE_TIMEOUT_MS) {
        entry.pool.end().catch(err => console.error('Error closing idle PG pool:', err));
        pgPools.delete(key);
      }
    }

    // Cleanup MySQL pools
    for (const [key, entry] of mysqlPools.entries()) {
      if (now - entry.lastUsed > POOL_IDLE_TIMEOUT_MS) {
        entry.pool.end().catch(err => console.error('Error closing idle MySQL pool:', err));
        mysqlPools.delete(key);
      }
    }

    // Cleanup SQLite DBs
    for (const [key, entry] of sqliteDbs.entries()) {
      if (now - entry.lastUsed > POOL_IDLE_TIMEOUT_MS) {
        entry.db.close((err) => {
          if (err) console.error('Error closing idle SQLite DB:', err);
        });
        sqliteDbs.delete(key);
      }
    }
  }, 60 * 1000).unref?.();
}

/**
 * Generate a consistent hash key for a connection config
 */
function getPoolKey(dialect: string, config: BaseConnectionConfig): string {
  const normalized = {
    dialect,
    host: config.host || '',
    port: String(config.port || ''),
    user: config.user || config.username || '',
    database: config.database || '',
    filePath: config.filePath || '',
    sslMode: config.sslMode || '',
  };
  return crypto.createHash('sha256').update(JSON.stringify(normalized)).digest('hex');
}

/**
 * Get or create a PostgreSQL connection pool
 */
export function getPgPool(config: BaseConnectionConfig): pg.Pool {
  const key = getPoolKey('postgresql', config);
  const existing = pgPools.get(key);
  
  if (existing) {
    existing.lastUsed = Date.now();
    return existing.pool;
  }

  const port = typeof config.port === 'string' ? parseInt(config.port, 10) : config.port || 5432;
  const user = config.user || config.username;
  
  let sslConfig: boolean | { rejectUnauthorized: boolean } = false;
  if (config.sslMode) {
    if (config.sslMode === 'disable') {
      sslConfig = false;
    } else if (config.sslMode === 'require') {
      sslConfig = { rejectUnauthorized: false };
    } else if (config.sslMode === 'verify-ca' || config.sslMode === 'verify-full') {
      sslConfig = { rejectUnauthorized: true };
    }
  } else if (typeof config.ssl === 'boolean') {
    sslConfig = config.ssl ? { rejectUnauthorized: false } : false;
  } else if (typeof config.ssl === 'object' && config.ssl !== null) {
    sslConfig = config.ssl as any;
  }

  const pool = new pg.Pool({
    host: config.host,
    port,
    database: config.database,
    user,
    password: config.password,
    ssl: sslConfig,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 8000,
    statement_timeout: 15000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client in pool:', err);
  });

  pgPools.set(key, { pool, lastUsed: Date.now() });
  return pool;
}

/**
 * Get or create a MySQL connection pool
 */
export function getMysqlPool(config: BaseConnectionConfig): mysql.Pool {
  const key = getPoolKey('mysql', config);
  const existing = mysqlPools.get(key);
  
  if (existing) {
    existing.lastUsed = Date.now();
    return existing.pool;
  }

  const port = typeof config.port === 'string' ? parseInt(config.port, 10) : config.port || 3306;
  const user = config.user || config.username || 'root';

  const pool = mysql.createPool({
    host: config.host || 'localhost',
    port,
    user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 8000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  mysqlPools.set(key, { pool, lastUsed: Date.now() });
  return pool;
}

/**
 * Get or create a SQLite database instance
 */
export function getSqliteDb(filePath: string): sqlite3.Database {
  const key = `sqlite:${filePath}`;
  const existing = sqliteDbs.get(key);
  
  if (existing) {
    existing.lastUsed = Date.now();
    return existing.db;
  }

  const db = new sqlite3.Database(filePath);
  sqliteDbs.set(key, { db, lastUsed: Date.now() });
  return db;
}

/**
 * Normalize and detect dialect from connection config and type
 */
export function detectDialect(type?: string, config?: BaseConnectionConfig): DatabaseDialect {
  const rawType = (config?.type || type || '').toLowerCase();
  
  if (rawType.includes('postgres') || rawType === 'pg') return 'postgresql';
  if (rawType.includes('mysql') || rawType.includes('mariadb')) return 'mysql';
  if (rawType.includes('sqlite')) return 'sqlite';
  if (rawType.includes('rest') || rawType.includes('api') || rawType.includes('http')) return 'rest';
  if (rawType.includes('csv') || rawType.includes('file')) return 'csv';
  
  // If connection type is generically 'sql', inspect config host/port/type
  if (rawType === 'sql') {
    if (config?.filePath || (typeof config?.database === 'string' && config.database.endsWith('.db'))) {
      return 'sqlite';
    }
    if (config?.port === 3306 || config?.port === '3306') {
      return 'mysql';
    }
    return 'postgresql';
  }

  return 'postgresql';
}

/**
 * Test connectivity for any supported data source dialect
 */
export async function testConnection(
  type: string,
  config: BaseConnectionConfig
): Promise<ConnectionTestResult> {
  const startTime = Date.now();
  const dialect = detectDialect(type, config);

  try {
    switch (dialect) {
      case 'postgresql': {
        const pool = getPgPool(config);
        const client = await pool.connect();
        try {
          const res = await client.query('SELECT version() AS version, NOW() AS server_time');
          const latencyMs = Date.now() - startTime;
          return {
            success: true,
            dialect: 'postgresql',
            latencyMs,
            message: `Successfully connected to PostgreSQL (Server time: ${new Date(res.rows[0].server_time).toISOString()})`,
          };
        } finally {
          client.release();
        }
      }

      case 'mysql': {
        const pool = getMysqlPool(config);
        const [rows] = await pool.query('SELECT VERSION() AS version, NOW() AS server_time');
        const latencyMs = Date.now() - startTime;
        const serverRows = rows as any[];
        return {
          success: true,
          dialect: 'mysql',
          latencyMs,
          message: `Successfully connected to MySQL ${serverRows?.[0]?.version || ''}`,
        };
      }

      case 'sqlite': {
        const filePath = config.filePath || config.database;
        if (!filePath) {
          throw new Error('SQLite database file path is required');
        }
        const db = getSqliteDb(filePath);
        const getAsync = promisify(db.get.bind(db));
        const res: any = await getAsync('SELECT sqlite_version() AS version');
        const latencyMs = Date.now() - startTime;
        return {
          success: true,
          dialect: 'sqlite',
          latencyMs,
          message: `Successfully connected to SQLite v${res?.version || ''}`,
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
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
          const response = await fetch(targetUrl, {
            method: 'GET',
            headers,
            signal: controller.signal,
          });
          clearTimeout(timeout);

          const latencyMs = Date.now() - startTime;
          if (response.ok) {
            return {
              success: true,
              dialect: 'rest',
              latencyMs,
              message: `REST API connection successful (HTTP ${response.status})`,
            };
          } else {
            return {
              success: false,
              dialect: 'rest',
              latencyMs,
              error: `API returned status ${response.status}: ${response.statusText}`,
            };
          }
        } catch (fetchErr: any) {
          clearTimeout(timeout);
          throw fetchErr;
        }
      }

      case 'csv': {
        if (!config.file && !config.csvData) {
          return {
            success: true,
            dialect: 'csv',
            latencyMs: 0,
            message: 'Ready to load CSV data',
          };
        }
        return {
          success: true,
          dialect: 'csv',
          latencyMs: Date.now() - startTime,
          message: 'CSV configuration valid',
        };
      }

      default:
        throw new Error(`Unsupported database dialect: ${dialect}`);
    }
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    return {
      success: false,
      dialect,
      latencyMs,
      error: error.message || 'Connection test failed',
    };
  }
}

/**
 * Gracefully close all connection pools
 */
export async function closeAllPools(): Promise<void> {
  for (const [, entry] of pgPools.entries()) {
    await entry.pool.end().catch(() => {});
  }
  pgPools.clear();

  for (const [, entry] of mysqlPools.entries()) {
    await entry.pool.end().catch(() => {});
  }
  mysqlPools.clear();

  for (const [, entry] of sqliteDbs.entries()) {
    await promisify(entry.db.close.bind(entry.db))().catch(() => {});
  }
  sqliteDbs.clear();
}
