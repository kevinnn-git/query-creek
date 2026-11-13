export interface QueryResult {
  columns: string[];
  rows: (string | number | boolean | null)[][];
  rowCount: number;
  executionTimeMs: number;
}

export interface TableColumn {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: any;
  pk: number;
}

export interface TableSchema {
  tableName: string;
  sql: string;
  columns: TableColumn[];
}

export interface WorkerRequest {
  id: string;
  type: 'init' | 'query' | 'getSchema' | 'reset';
  payload?: any;
}

export interface WorkerResponse {
  id: string;
  type: 'init' | 'query' | 'getSchema' | 'reset';
  success: boolean;
  data?: any;
  error?: string;
}

