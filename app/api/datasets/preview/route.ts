import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { connections, datasets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { executeQuery } from '@/lib/db/query-engine';
import { transformData, TransformPipelineOptions } from '@/lib/data/transformer';
import { BaseConnectionConfig } from '@/lib/db/connection-pool';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const body = await request.json();

    const { datasetId, connectionId, query, transformOptions, maxRows = 100 } = body;

    let targetConnectionId: number | null = null;
    let targetQuery: string = '';

    // If datasetId is provided, fetch dataset query and connection
    if (datasetId) {
      const parsedDatasetId = parseInt(String(datasetId), 10);
      const dataset = await db.query.datasets.findFirst({
        where: and(eq(datasets.id, parsedDatasetId), eq(datasets.userId, userId)),
      });

      if (!dataset) {
        return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
      }

      targetConnectionId = dataset.connectionId;
      targetQuery = query || dataset.query || '';
    } else {
      targetConnectionId = connectionId ? parseInt(String(connectionId), 10) : null;
      targetQuery = query || '';
    }

    if (!targetConnectionId) {
      return NextResponse.json({ error: 'Connection ID is required' }, { status: 400 });
    }

    // Fetch and authorize connection
    const connection = await db.query.connections.findFirst({
      where: and(eq(connections.id, targetConnectionId), eq(connections.userId, userId)),
    });

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found or unauthorized' }, { status: 404 });
    }

    const config = (connection.config as unknown as BaseConnectionConfig) || {};
    const normalizedConfig: BaseConnectionConfig = {
      ...config,
      user: config.user || config.username,
      type: config.type || connection.type,
    };

    // Execute query
    const rawResult = await executeQuery(
      connection.type,
      normalizedConfig,
      targetQuery || 'SELECT 1',
      { readOnly: true, maxRows: 1000 }
    );

    // Apply transformation pipeline if options are supplied
    let transformedData = rawResult.data;
    let totalCount = rawResult.totalCount || rawResult.data.length;

    if (transformOptions) {
      const transformResult = transformData(rawResult.data, {
        ...(transformOptions as TransformPipelineOptions),
        limit: maxRows,
      });
      transformedData = transformResult.data;
      totalCount = transformResult.totalCount;
    } else if (transformedData.length > maxRows) {
      transformedData = transformedData.slice(0, maxRows);
    }

    return NextResponse.json({
      success: true,
      data: transformedData,
      columns: rawResult.columns,
      rowCount: transformedData.length,
      totalCount,
      executionTimeMs: rawResult.executionTimeMs,
      dialect: rawResult.dialect,
    });
  } catch (error: any) {
    console.error('Dataset preview error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate dataset preview' },
      { status: 400 }
    );
  }
}
