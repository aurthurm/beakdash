export type DataSourceType = 'csv' | 'sql' | 'rest' | 'websocket' | 'firebase' | 'static' | 'javascript';

export interface BaseDataSource {
  type: DataSourceType;
  refreshInterval?: number; // in milliseconds
}

export interface CSVDataSource extends BaseDataSource {
  type: 'csv';
  fileId?: string;
  columnMapping: {
    xAxis: string;
    yAxis: string;
  };
}

export interface SQLDataSource extends BaseDataSource {
  type: 'sql';
  query: string;
  connectionString?: string;
}

export interface RESTDataSource extends BaseDataSource {
  type: 'rest';
  endpoint: string;
  method: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: any;
  dataPath?: string; // JSONPath to extract data
}

export interface WebSocketDataSource extends BaseDataSource {
  type: 'websocket';
  url: string;
  channel?: string;
  eventName?: string;
}

export interface StaticDataSource extends BaseDataSource {
  type: 'static';
  data: any[];
}

export interface JavaScriptDataSource extends BaseDataSource {
  type: 'javascript';
  code: string;
  refreshInterval?: number;
}

export type DataSource = 
  | CSVDataSource 
  | SQLDataSource 
  | RESTDataSource 
  | WebSocketDataSource 
  | StaticDataSource
  | JavaScriptDataSource;

