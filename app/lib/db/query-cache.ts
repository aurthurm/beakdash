import crypto from 'crypto';
import { QueryExecutionResult } from './query-engine';

export interface CachedQueryResult extends QueryExecutionResult {
  cachedAt: string;
  cacheExpiresAt: string;
  queryHash: string;
  fromCache: boolean;
}

interface CacheEntry {
  result: QueryExecutionResult;
  cachedAt: number;
  expiresAt: number;
  queryHash: string;
}

const queryCache = new Map<string, CacheEntry>();

// Prune expired cache entries every 60 seconds
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of queryCache.entries()) {
      if (entry.expiresAt < now) {
        queryCache.delete(key);
      }
    }
  }, 60 * 1000).unref?.();
}

/**
 * Compute deterministic query hash from connection ID, normalized SQL, and parameters
 */
export function computeQueryHash(
  connectionId: string | number,
  sql: string,
  parameters: Record<string, any> = {}
): string {
  const normalizedSql = sql.trim().replace(/\s+/g, ' ').toLowerCase();
  const sortedParams = Object.keys(parameters)
    .sort()
    .reduce((acc, k) => {
      acc[k] = parameters[k];
      return acc;
    }, {} as Record<string, any>);

  const payload = JSON.stringify({
    connectionId: String(connectionId),
    sql: normalizedSql,
    parameters: sortedParams,
  });

  return crypto.createHash('sha256').update(payload).digest('hex');
}

/**
 * Retrieve cached query result if valid
 */
export function getCachedQueryResult(
  queryHash: string,
  maxAgeSeconds: number = 300
): CachedQueryResult | null {
  if (maxAgeSeconds <= 0) return null;

  const entry = queryCache.get(queryHash);
  if (!entry) return null;

  const now = Date.now();
  if (entry.expiresAt < now) {
    queryCache.delete(queryHash);
    return null;
  }

  return {
    ...entry.result,
    cachedAt: new Date(entry.cachedAt).toISOString(),
    cacheExpiresAt: new Date(entry.expiresAt).toISOString(),
    queryHash: entry.queryHash,
    fromCache: true,
  };
}

/**
 * Store query execution result into the query cache
 */
export function setCachedQueryResult(
  queryHash: string,
  result: QueryExecutionResult,
  ttlSeconds: number = 300
): CachedQueryResult {
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;

  queryCache.set(queryHash, {
    result,
    cachedAt: now,
    expiresAt,
    queryHash,
  });

  return {
    ...result,
    cachedAt: new Date(now).toISOString(),
    cacheExpiresAt: new Date(expiresAt).toISOString(),
    queryHash,
    fromCache: false,
  };
}

/**
 * Invalidate all or specific query cache entries
 */
export function clearQueryCache(): void {
  queryCache.clear();
}
