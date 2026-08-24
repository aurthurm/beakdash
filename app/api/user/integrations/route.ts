import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

interface Integration {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'inactive' | 'error';
  config: Record<string, any>;
  lastSync: string | null;
  error: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    // Get user integrations
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        settings: true,
      },
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Return integrations
    const settings = (user.settings as Record<string, any>) || {};
    return NextResponse.json({
      integrations: settings.integrations || [],
    });
  } catch (error) {
    console.error('Error fetching integrations:', error);
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
    const { name, type, config } = body;

    if (!name || !type || !config) {
      return new NextResponse('Name, type, and config are required', { status: 400 });
    }

    const newIntegration: Integration = {
      id: crypto.randomBytes(16).toString('hex'),
      name,
      type,
      status: 'active',
      config,
      lastSync: null,
      error: null,
    };

    // Update user settings with new integration
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { settings: true },
    });

    const settings = (user?.settings as Record<string, any>) || {};
    const integrations = settings.integrations || [];

    await db
      .update(users)
      .set({
        settings: {
          ...settings,
          integrations: [...integrations, newIntegration],
        },
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ integration: newIntegration });
  } catch (error) {
    console.error('Error creating integration:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const body = await req.json();
    const { id, name, type, config, status } = body;

    if (!id) {
      return new NextResponse('Integration ID is required', { status: 400 });
    }

    // Get current integrations
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { settings: true },
    });

    const settings = (user?.settings as Record<string, any>) || {};
    const integrations = settings.integrations || [];

    // Update the specified integration
    const updatedIntegrations = integrations.map((integration: Integration) => {
      if (integration.id === id) {
        return {
          ...integration,
          name: name || integration.name,
          type: type || integration.type,
          config: config || integration.config,
          status: status || integration.status,
        };
      }
      return integration;
    });

    // Update user settings
    await db
      .update(users)
      .set({
        settings: {
          ...settings,
          integrations: updatedIntegrations,
        },
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating integration:', error);
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
    const integrationId = searchParams.get('id');

    if (!integrationId) {
      return new NextResponse('Integration ID is required', { status: 400 });
    }

    // Get current integrations
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { settings: true },
    });

    const settings = (user?.settings as Record<string, any>) || {};
    const integrations = settings.integrations || [];

    // Remove the specified integration
    const updatedIntegrations = integrations.filter(
      (integration: Integration) => integration.id !== integrationId
    );

    // Update user settings
    await db
      .update(users)
      .set({
        settings: {
          ...settings,
          integrations: updatedIntegrations,
        },
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting integration:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
 