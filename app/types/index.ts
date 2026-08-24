export interface SQLConnectionConfig {
  type: 'postgresql' | 'mysql' | 'sqlite';
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean;
  filePath?: string;
}

export interface SQLiteTable {
  name: string;
}

export interface SQLiteColumn {
  name: string;
  type: string;
  notnull: number;
  pk: number;
} 

export interface IWidgetDimensions {
  width: number;
  height: number;
}

export interface IFilterConfig {
  field: string;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains";
  value: string | number | boolean;
}

export interface ITableConfig {
  headers?: string[];
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc" | "none";
  filters?: IFilterConfig[];
}

/**
 * Schema information structure for SQL autocompletion
 */
export interface IColumnInfo {
  column: string;
  type: string;
}

export interface ISchemaInfo {
  [schemaName: string]: {
    [tableName: string]: IColumnInfo[];
  };
}

export interface ChartConfig {
  valueField?: string;
  categoryField?: string;
  aggregation?: string;
  format?: 'number' | 'currency' | 'percentage' | string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  showIcon?: boolean;
  icon?: string;
  colorCode?: boolean;
  chartTitle?: string;
  comparison?: {
    enabled?: boolean;
    value?: number;
    label?: string;
    type?: 'percentage' | 'absolute';
  };
  [key: string]: any;
}