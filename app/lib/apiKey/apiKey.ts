import crypto from 'crypto';

export class ApiKeyGenerator {
  static generate(): { prefix: string; key: string; hashedKey: string } {
    // Generate a random key with prefix for easy identification
    const prefix = 'dk';
    const randomBytes = crypto.randomBytes(24);
    const key = `${prefix}_${randomBytes.toString('base64url')}`;
    
    // Hash the key for storage
    const hashedKey = crypto.createHash('sha256')
      .update(key)
      .digest('hex');

    return { prefix, key, hashedKey };
  }

  static hashKey(key: string): string {
    return crypto.createHash('sha256')
      .update(key)
      .digest('hex');
  }
}