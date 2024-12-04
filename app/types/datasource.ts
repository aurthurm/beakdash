export type Nullable = 'NULL' | 'NOT NULL';

export type Constraint = 'PRIMARY KEY' | 'UNIQUE' | '';

export interface ColumnInfo {
    column: string;
    type: string;
    nullable: Nullable;
    constraint: Constraint;
}

export interface TableInfo {
    [tableName: string]: ColumnInfo[];
}

export interface SchemaInfo {
    [schemaName: string]: TableInfo;
}

export type SQLDriver = 
  | 'postgresql'
  | 'mysql'
  | 'mssql'
  | 'sqlite'
  | 'oracle'
  | 'snowflake'
  | 'redshift';

// Define SQL-based connection configuration
export interface SQLConnectionConfig {
  host?: string; // Hostname or IP address (optional for SQLite)
  port?: number; // Default: 5432 for PostgreSQL, 1433 for MSSQL, etc.
  user?: string; // Username for authentication
  password?: string; // Password for authentication
  database?: string; // Database name
  driver?: SQLDriver; // Specify the database type (e.g., 'postgresql', 'mysql', etc.)
  serviceName?: string; // For Oracle: service name (optional)
  sid?: string; // For Oracle: SID (optional)
  ssl?: boolean; // Use SSL/TLS (optional)
  filePath?: string; // For SQLite: path to the .db file
  timeout?: number; // Connection timeout in seconds (optional)
  options?: Record<string, unknown>; // Driver-specific options (e.g., encrypt, trustServerCertificate)
  warehouse?: string; // For Snowflake: warehouse name (optional)
  role?: string; // For Snowflake: role name (optional)
  account?: string; // For Snowflake: account identifier (optional)
  schema?: SchemaInfo; // Optional: schema information for the connection
}

// Define general connection types
export type ConnectionConfig = 
  | SQLConnectionConfig // For SQL-based connections
  | { filePath: string }; // For CSV-based connections (e.g., file path to CSV)

  // Add a classification for connection types
export type ConnectionType = 'csv' | 'sql' | 'nosql' | 'rest';

interface ConnectionBase {
  id?: string;
  userId: string;
  name: string;
  type: ConnectionType;
  createdAt?: string;
  updatedAt?: string;
}

export interface SQLConnection extends ConnectionBase {
  config: SQLConnectionConfig;
}

export type Connection = SQLConnection ;

// Define dataset types (table-based or query-based)
export type DatasetType = 
  | 'table'
  | 'query';

// Main dataset interface, supporting multiple connection types
export interface Dataset {
  id: string;
  name: string;
  type: DatasetType; // Specifies if it's a table or a query
  connectionType: ConnectionType; // Classifies the type of connection
  connection: Connection; // Connection details
  schema?: string; // Schema name (optional, for SQL-based connections)
  table?: string; // Table name (if the dataset is table-based)
  query?: string; // Query (if the dataset is query-based)
  refreshInterval?: number; // Interval for refreshing data in seconds (optional)
}
