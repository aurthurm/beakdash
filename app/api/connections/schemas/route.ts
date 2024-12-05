import { NextResponse } from 'next/server';
import { ClientConfig, Client as PgClient } from 'pg';
import * as mysql from 'mysql2/promise';
import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { SchemaInfo, SQLConnectionConfig } from '@/app/types/datasource';

export async function POST(request: Request) {
  try {
    const config: SQLConnectionConfig = await request.json();
    const schemaInfo = await getSchemaInfo(config);
    return NextResponse.json(schemaInfo);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getSchemaInfo(config: SQLConnectionConfig): Promise<SchemaInfo> {
  switch(config.driver) {
    case 'postgresql':
      return getPgSchema(config as ClientConfig);
    case 'mysql':
      return getMysqlSchema(config);
    case 'sqlite':
      if (!config?.filePath) throw new Error('File path is required for SQLite connections');
      return getSqliteSchema(config.filePath);
    default:
      throw new Error('Unsupported database type');
  }
}

async function getPgSchema(config: ClientConfig): Promise<SchemaInfo> {
  const client = new PgClient({
    ...config,
    statement_timeout: 5000,
    connectionTimeoutMillis: 5000,
  });
  try {
    const query = `
      SELECT 
          c.table_schema AS schema,
          c.table_name,
          c.column_name,
          c.data_type AS type
      FROM information_schema.columns c
      LEFT JOIN (
          SELECT tc.table_schema, tc.table_name, kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
          WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk
      ON c.table_schema = pk.table_schema
      AND c.table_name = pk.table_name
      AND c.column_name = pk.column_name
      WHERE c.table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY c.table_schema, c.table_name, c.ordinal_position;
    `;

    await client.connect();
    const result = await client.query(query);
    return formatResults(result.rows, 'postgres');
  } finally {
    await client.end();
  }
}

async function getMysqlSchema(config: SQLConnectionConfig): Promise<SchemaInfo> {
  const conUrl = `mysql://${config.user}:${config.password}@${config.host}:${config.port}/${config.database}`;
  const connection = await mysql.createConnection(conUrl);
  try {
    const query = `
      SELECT 
        TABLE_SCHEMA as schema,
        TABLE_NAME as table_name,
        COLUMN_NAME as column_name,
        DATA_TYPE as type,
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA NOT IN ('mysql', 'information_schema', 'performance_schema', 'sys')
      ORDER BY TABLE_SCHEMA, TABLE_NAME, ORDINAL_POSITION;
    `;
    const [rows] = await connection.execute(query);
    return formatResults(rows as any[], 'mysql');
  } finally {
    await connection.end();
  }
}

async function getSqliteSchema(url: string): Promise<SchemaInfo> {
  const db = new sqlite3.Database(url);
  const getAllTables = promisify(db.all.bind(db));
  
  try {
    const tables = await getAllTables(`
      SELECT name as table_name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `);
    
    let results: any[] = [];
    for (const table of tables) {
      const tableInfo = await getAllTables(`PRAGMA table_info('${table.table_name}')`);
      results = results.concat(tableInfo.map(info => ({
        table_name: table.table_name,
        name: info.name,
        type: info.type,
        notnull: info.notnull,
        pk: info.pk
      })));
    }
    return formatResults(results, 'sqlite');
  } finally {
    db.close();
  }
}

function formatResults(results: any[], dbType: string): SchemaInfo {
  const schemaMap: SchemaInfo = {};

  results.forEach(row => {
    const schema = dbType === 'sqlite' ? 'main' : row.schema;
    const tableName = dbType === 'sqlite' ? row.table_name : row.table_name;
    const columnName = dbType === 'sqlite' ? row.name : row.column_name;
    const type = dbType === 'sqlite' ? row.type : row.type;

    if (!schemaMap[schema]) {
      schemaMap[schema] = {};
    }
    if (!schemaMap[schema][tableName]) {
      schemaMap[schema][tableName] = [];
    }

    schemaMap[schema][tableName].push({
      column: columnName,
      type
    });
  });

  return schemaMap;
}