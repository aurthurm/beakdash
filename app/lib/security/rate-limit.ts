interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Cleanup stale records periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 120 * 1000);
      if (record.timestamps.length === 0) {
        rateLimitMap.delete(key);
      }
    }
  }, 60 * 1000).unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

/**
 * Check if an action by an identifier is within the rate limit
 *
 * @param identifier Unique key (IP address, user ID, API token)
 * @param limit Max requests allowed in the time window
 * @param windowSeconds Window length in seconds (default: 60s)
 */
export function checkRateLimit(
  identifier: string,
  limit: number = 60,
  windowSeconds: number = 60
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const cutoff = now - windowMs;

  let record = rateLimitMap.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(identifier, record);
  }

  // Filter timestamps within the current window
  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

  const currentCount = record.timestamps.length;
  const allowed = currentCount < limit;

  if (allowed) {
    record.timestamps.push(now);
  }

  const oldestTimestamp = record.timestamps[0] || now;
  const resetSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000));
  const remaining = Math.max(0, limit - record.timestamps.length);

  return {
    allowed,
    limit,
    remaining,
    resetSeconds,
  };
}

/**
 * Helper to extract client IP from Next.js request headers
 */
export function getClientIp(headers: Headers): string {
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}
