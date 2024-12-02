import crypto from 'crypto';
import { Queue } from 'bullmq';
import { Webhook, WebhookEvent } from '@/app/types/webhook';

export class WebhookManager {
  private queue: Queue;

  constructor() {
    this.queue = new Queue('webhooks', {
      connection: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    });
  }

  // Generate signature for webhook payload
  private generateSignature(payload: any, secret: string): string {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(JSON.stringify(payload));
    return hmac.digest('hex');
  }

  // Add webhook event to queue
  async dispatch(webhook: Webhook, event: WebhookEvent, data: any) {
    const payload = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      event,
      data,
    };

    const signature = this.generateSignature(payload, webhook.secret);

    await this.queue.add('webhook', {
      url: webhook.url,
      payload,
      signature,
      webhookId: webhook.id,
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }
}