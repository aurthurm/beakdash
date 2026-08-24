import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string | null;
  permissions: string[];
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    // Get user API keys
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        settings: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Return API keys
    const settings = (user.settings as Record<string, any>) || {};
    return NextResponse.json({
      apiKeys: settings.apiKeys || [],
    });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const body = await req.json();
    const { name, permissions } = body;

    if (!name || !permissions) {
      return new NextResponse('Name and permissions are required', { status: 400 });
    }

    // Generate API key
    const apiKey = crypto.randomBytes(32).toString('hex');
    const apiKeyId = crypto.randomBytes(16).toString('hex');

    const newApiKey: ApiKey = {
      id: apiKeyId,
      name,
      key: apiKey,
      createdAt: new Date().toISOString(),
      lastUsed: null,
      permissions,
    };

    // Update user settings with new API key
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { settings: true },
    });

    const settings = (user?.settings as Record<string, any>) || {};
    const apiKeys = settings.apiKeys || [];

    await db
      .update(users)
      .set({
        settings: {
          ...settings,
          apiKeys: [...apiKeys, newApiKey],
        },
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ apiKey: newApiKey });
  } catch (error) {
    console.error('Error creating API key:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const { searchParams } = new URL(req.url);
    const apiKeyId = searchParams.get('id');

    if (!apiKeyId) {
      return new NextResponse('API key ID is required', { status: 400 });
    }

    // Get current API keys
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { settings: true },
    });

    const settings = (user?.settings as Record<string, any>) || {};
    const apiKeys = settings.apiKeys || [];

    // Remove the specified API key
    const updatedApiKeys = apiKeys.filter((key: ApiKey) => key.id !== apiKeyId);

    // Update user settings
    await db
      .update(users)
      .set({
        settings: {
          ...settings,
          apiKeys: updatedApiKeys,
        },
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
 