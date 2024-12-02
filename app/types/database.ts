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
