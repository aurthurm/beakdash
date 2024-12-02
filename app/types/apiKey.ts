export interface ApiKey {
    id: string;
    key: string;
    name: string;
    userId: string;
    permissions: string[];
    createdAt: Date;
    lastUsed: Date;
    expiresAt?: Date;
    rateLimit: {
      requests: number;
      duration: number; // in seconds
    };
  }
  