export interface Webhook {
    id: string;
    userId: string;
    url: string;
    secret: string;
    events: WebhookEvent[];
    createdAt: Date;
    isEnabled: boolean;
    lastSuccess?: Date;
    lastFailure?: Date;
    failureCount: number;
  }
  
export type WebhookEvent = 
    | 'api_key.created'
    | 'api_key.deleted'
    | 'api_key.expired'
    | 'rate_limit.exceeded'
    | 'security.suspicious_usage'
    | 'security.multiple_failures';
