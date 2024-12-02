import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import * as mysql from 'mysql2/promise';
import * as sqlite3 from 'sqlite3';
import { promisify } from 'util';

interface DatabaseConfig {
  type: 'postgres' | 'mysql' | 'sqlite';
  url: string;
}

interface SchemaInfo {
  [schemaName: string]: {
    [tableName: string]: Array<{
      column: string;
      type: string;
      nullable: 'NULL' | 'NOT NULL';
      constraint: 'PRIMARY KEY' | 'UNIQUE' | '';
    }>;
  };
}

export async function POST(request: Request) {
  try {
    const config: DatabaseConfig = await request.json();
    const schemaInfo = await getSchemaInfo(config);
    return NextResponse.json(schemaInfo);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function getSchemaInfo(config: DatabaseConfig): Promise<SchemaInfo> {
  switch(config.type) {
    case 'postgres':
      return getPgSchema(config.url);
    case 'mysql':
      return getMysqlSchema(config.url);
    case 'sqlite':
      return getSqliteSchema(config.url);
    default:
      throw new Error('Unsupported database type');
  }
}

async function getPgSchema(url: string): Promise<SchemaInfo> {
  const pool = new Pool({ connectionString: url });
  try {
    const query = `
      SELECT 
        table_schema as schema,
        table_name,
        column_name,
        data_type as type,
        is_nullable as nullable,
        CASE WHEN pk.column_name IS NOT NULL THEN 'PRIMARY KEY' ELSE '' END as constraint
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
      WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
      ORDER BY table_schema, table_name, ordinal_position;
    `;
    const result = await pool.query(query);
    return formatResults(result.rows, 'postgres');
  } finally {
    await pool.end();
  }
}

async function getMysqlSchema(url: string): Promise<SchemaInfo> {
  const connection = await mysql.createConnection(url);
  try {
    const query = `
      SELECT 
        TABLE_SCHEMA as schema,
        TABLE_NAME as table_name,
        COLUMN_NAME as column_name,
        DATA_TYPE as type,
        IS_NULLABLE as nullable,
        CASE WHEN COLUMN_KEY = 'PRI' THEN 'PRIMARY KEY' ELSE '' END as constraint
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
    const nullable = dbType === 'sqlite' 
      ? row.notnull ? 'NOT NULL' : 'NULL'
      : row.nullable === 'YES' ? 'NULL' : 'NOT NULL';
    const constraint = dbType === 'sqlite'
      ? row.pk ? 'PRIMARY KEY' : ''
      : row.constraint;

    if (!schemaMap[schema]) {
      schemaMap[schema] = {};
    }
    if (!schemaMap[schema][tableName]) {
      schemaMap[schema][tableName] = [];
    }

    schemaMap[schema][tableName].push({
      column: columnName,
      type,
      nullable: nullable as 'NULL' | 'NOT NULL',
      constraint: constraint as 'PRIMARY KEY' | 'UNIQUE' | ''
    });
  });

  return schemaMap;
}