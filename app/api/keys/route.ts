// app/api/keys/route.ts
import { NextRequest } from 'next/server';
import { ApiKeyModel } from '@/app/lib/models/apiKey.model';
import { WebhookModel } from '@/app/lib/models/webhook.model';
import { WebhookManager } from '@/app/lib/webhook/webhook';

const webhook = new WebhookManager();

export async function POST(request: NextRequest) {
  try {
    const { name, permissions, rateLimit, expiresAt } = await request.json();
    
    // Get userId from auth (adjust based on your auth setup)
    const userId = request.user.id;

    const apiKey = await ApiKeyModel.create({
      name,
      userId,
      permissions,
      rateLimit,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    // Fetch relevant webhooks
    const userWebhooks = await WebhookModel.getByUserId(userId);
    const relevantWebhooks = userWebhooks.filter(
      hook => hook.isEnabled && hook.events.includes('api_key.created')
    );

    // Dispatch webhook events
    await Promise.all(
      relevantWebhooks.map(userWebhook =>
        webhook.dispatch(userWebhook, 'api_key.created', {
          keyId: apiKey.id,
          name: apiKey.name,
          createdAt: apiKey.createdAt
        })
      )
    );

    return Response.json(apiKey, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = request.user.id;
    
    const keys = await prisma.apiKey.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastUsed: true,
        expiresAt: true,
        permissions: true,
        rateLimit: true,
      },
    });

    return Response.json(keys);
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch API keys' },
      { status: 500 }
    );
  }
}