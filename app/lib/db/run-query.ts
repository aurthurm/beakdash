import { executeQuery, QueryExecutionResult, QueryOptions } from './query-engine';
import { BaseConnectionConfig } from './connection-pool';

export interface RunQueryOptions {
  query: string;
  connectionConfig: BaseConnectionConfig;
  connectionType: string;
  options?: QueryOptions;
}

/**
 * Run a query on a database connection safely using the unified Query Engine
 *
 * @param options Object containing query, connection config, connection type, and execution options
 * @returns Query results
 */
export async function runQueryOnConnection(options: RunQueryOptions): Promise<QueryExecutionResult> {
  const { query, connectionConfig, connectionType, options: execOptions } = options;

  return await executeQuery(
    connectionType,
    connectionConfig,
    query,
    execOptions || { readOnly: true, maxRows: 5000, timeoutMs: 15000 }
  );
}