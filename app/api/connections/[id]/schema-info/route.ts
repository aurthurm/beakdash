import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { connections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSchemaInfo } from '@/lib/db/schema-info';
import { BaseConnectionConfig } from '@/lib/db/connection-pool';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    const { id } = await params;
    const connectionId = parseInt(id, 10);

    if (isNaN(connectionId)) {
      return NextResponse.json(
        { error: 'Invalid connection ID' },
        { status: 400 }
      );
    }

    // Get connection details
    const connection = await db.query.connections.findFirst({
      where: and(eq(connections.id, connectionId), eq(connections.userId, userId)),
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found or unauthorized' },
        { status: 404 }
      );
    }

    const config = (connection.config as unknown as BaseConnectionConfig) || {};
    const normalizedConfig: BaseConnectionConfig = {
      ...config,
      user: config.user || config.username,
      type: config.type || connection.type,
    };

    const forceRefresh = request.nextUrl.searchParams.get('refresh') === 'true';

    // Get schema info with caching
    const schemaInfo = await getSchemaInfo(normalizedConfig, forceRefresh);

    return NextResponse.json({
      success: true,
      schemaInfo,
    });
  } catch (error: any) {
    console.error('Schema info error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get schema info' },
      { status: 500 }
    );
  }
}
