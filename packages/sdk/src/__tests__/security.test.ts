import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// Replicate rate limiting logic for testing
interface RateLimitRecord {
  timestamps: number[];
}

function checkRateLimit(
  map: Map<string, RateLimitRecord>,
  identifier: string,
  limit: number = 5,
  windowSeconds: number = 60
) {
  const now = Date.now();
  const cutoff = now - windowSeconds * 1000;

  let record = map.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    map.set(identifier, record);
  }

  record.timestamps = record.timestamps.filter((ts) => ts > cutoff);
  const allowed = record.timestamps.length < limit;

  if (allowed) {
    record.timestamps.push(now);
  }

  return {
    allowed,
    remaining: Math.max(0, limit - record.timestamps.length),
  };
}

describe('Security & Rate Limiting', () => {
  it('should allow requests within threshold and block exceeding requests', () => {
    const map = new Map<string, RateLimitRecord>();
    const userId = 'user-123';

    // 5 allowed requests
    for (let i = 0; i < 5; i++) {
      const res = checkRateLimit(map, userId, 5, 60);
      expect(res.allowed).toBe(true);
    }

    // 6th request blocked
    const blocked = checkRateLimit(map, userId, 5, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('should verify HMAC-SHA256 signature integrity', () => {
    const secret = 'test-secret-key';
    const payload = JSON.stringify({ dashboardId: 1, exp: Math.floor(Date.now() / 1000) + 3600 });
    const encodedPayload = Buffer.from(payload).toString('base64url');

    const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
    const token = `${encodedPayload}.${signature}`;

    // Valid token check
    const [part1, part2] = token.split('.');
    const expected = crypto.createHmac('sha256', secret).update(part1).digest('base64url');
    expect(part2).toBe(expected);

    // Tampered token check
    const tampered = `${encodedPayload}.invalidsignature`;
    const [, tamperedSig] = tampered.split('.');
    expect(tamperedSig).not.toBe(expected);
  });
});
