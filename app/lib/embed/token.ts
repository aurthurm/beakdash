import crypto from 'crypto';

export interface EmbedPayload {
  dashboardId: number | string;
  userId: number | string;
  allowedOrigins?: string[];
  theme?: 'light' | 'dark' | 'system';
  showHeader?: boolean;
  showControls?: boolean;
  refreshInterval?: number;
  customStyles?: Record<string, string>;
  exp: number; // Unix timestamp in seconds
  iat: number; // Issued at timestamp
}

export interface CreateEmbedTokenOptions {
  dashboardId: number | string;
  userId: number | string;
  expiresInSeconds?: number; // Defaults to 24 hours (86400)
  allowedOrigins?: string[];
  theme?: 'light' | 'dark' | 'system';
  showHeader?: boolean;
  showControls?: boolean;
  refreshInterval?: number;
  customStyles?: Record<string, string>;
}

const DEFAULT_SECRET = process.env.EMBED_TOKEN_SECRET || process.env.NEXTAUTH_SECRET || 'beakdash-secure-embed-key-salt-2026';

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf-8');
}

/**
 * Generate a signed HMAC-SHA256 embed token
 */
export function generateEmbedToken(
  options: CreateEmbedTokenOptions,
  secretKey: string = DEFAULT_SECRET
): { token: string; expiresAt: string } {
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = options.expiresInSeconds || 86400; // 24 hours default
  const exp = now + expiresIn;

  const payload: EmbedPayload = {
    dashboardId: options.dashboardId,
    userId: options.userId,
    allowedOrigins: options.allowedOrigins,
    theme: options.theme || 'system',
    showHeader: options.showHeader !== undefined ? options.showHeader : true,
    showControls: options.showControls !== undefined ? options.showControls : false,
    refreshInterval: options.refreshInterval,
    customStyles: options.customStyles,
    exp,
    iat: now,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(encodedPayload)
    .digest('base64url');

  const token = `${encodedPayload}.${signature}`;

  return {
    token,
    expiresAt: new Date(exp * 1000).toISOString(),
  };
}

/**
 * Verify and decode an embed token
 */
export function verifyEmbedToken(
  token: string,
  requestOrigin?: string | null,
  secretKey: string = DEFAULT_SECRET
): { valid: boolean; payload?: EmbedPayload; error?: string } {
  if (!token || !token.includes('.')) {
    return { valid: false, error: 'Malformed or missing embed token' };
  }

  const [encodedPayload, providedSignature] = token.split('.');
  if (!encodedPayload || !providedSignature) {
    return { valid: false, error: 'Invalid token structure' };
  }

  // Re-calculate expected signature
  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(encodedPayload)
    .digest('base64url');

  const providedBuf = Buffer.from(providedSignature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (providedBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return { valid: false, error: 'Invalid token signature' };
  }

  try {
    const payload: EmbedPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    // Expiration check
    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Embed token has expired' };
    }

    // Domain whitelist / Origin check if configured
    if (payload.allowedOrigins && payload.allowedOrigins.length > 0 && requestOrigin) {
      const normalizedOrigin = requestOrigin.toLowerCase().replace(/\/$/, '');
      const isAllowed = payload.allowedOrigins.some((allowed) => {
        const normAllowed = allowed.toLowerCase().replace(/\/$/, '');
        return normAllowed === '*' || normAllowed === normalizedOrigin;
      });

      if (!isAllowed) {
        return {
          valid: false,
          error: `Origin "${requestOrigin}" is not authorized by this embed token`,
        };
      }
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: 'Failed to decode token payload' };
  }
}
