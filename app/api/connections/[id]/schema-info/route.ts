import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { connections } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSchemaInfo } from '@/lib/db/schema-info';
import { SQLConnectionConfig } from '@/types';

export interface ColumnInfo {
  column: string;
  type: string;
}

export interface TableInfo {
  [tableName: string]: ColumnInfo[];
}

export interface SchemaInfo {
  [schemaName: string]: TableInfo;
}

export type SQLDriver = 'postgresql' | 'mysql' | 'sqlite';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const { id } = await params;
    const connectionId = parseInt(id);

    // Get connection details
    const connection = await db.query.connections.findFirst({
      where: eq(connections.id, connectionId)
    });

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this connection
    if (Number(connection.userId) !== Number(userId)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const config = connection.config as unknown as any;

    // Get schema info based on connection type
    const schemaInfo = await getSchemaInfo({...config, user: config.username} as SQLConnectionConfig);

    return NextResponse.json(schemaInfo);
  } catch (error) {
    console.error('Schema info error:', error);
    return NextResponse.json(
      { error: 'Failed to get schema info' },
      { status: 500 }
    );
  }
}

