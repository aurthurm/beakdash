import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    const datasetList = await db.query.datasets.findMany({
      where: eq(datasets.userId, userId),
      orderBy: [desc(datasets.createdAt)],
      with: {
        connection: true,
      },
    });

    return NextResponse.json(datasetList);
  } catch (error: any) {
    console.error('Datasets fetch error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch datasets' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const body = await request.json();

    const { name, connectionId, query, sqlQuery, refreshFrequency, refreshInterval, config = {} } = body;

    if (!name) {
      return NextResponse.json({ error: 'Dataset name is required' }, { status: 400 });
    }

    if (!connectionId) {
      return NextResponse.json({ error: 'Data connection is required' }, { status: 400 });
    }

    const effectiveQuery = sqlQuery || query || '';
    const effectiveRefresh = refreshFrequency || refreshInterval || 'manual';
    const parsedConnectionId = parseInt(String(connectionId), 10);

    const [inserted] = await db
      .insert(datasets)
      .values({
        name,
        userId,
        connectionId: parsedConnectionId,
        query: effectiveQuery,
        refreshInterval: effectiveRefresh,
        config,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: 'Dataset created successfully',
      dataset: inserted,
    });
  } catch (error: any) {
    console.error('Dataset creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create dataset' },
      { status: 500 }
    );
  }
}