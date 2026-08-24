import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { datasets, connections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { recommendCharts } from '@/lib/ai/chart-recommender';
import { executeQuery } from '@/lib/db/query-engine';
import { BaseConnectionConfig } from '@/lib/db/connection-pool';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const body = await req.json();
    const { datasetId, sampleData: directData, columns: directCols } = body;

    let dataToAnalyze: Record<string, any>[] = directData || [];
    let columnsToAnalyze: { name: string; type: string }[] = directCols || [];
    let datasetName = 'Dataset';

    if (datasetId) {
      const parsedDatasetId = parseInt(String(datasetId), 10);
      const dataset = await db.query.datasets.findFirst({
        where: and(eq(datasets.id, parsedDatasetId), eq(datasets.userId, userId)),
      });

      if (!dataset) {
        return NextResponse.json({ error: 'Dataset not found' }, { status: 404 });
      }

      datasetName = dataset.name;

      if (dataset.connectionId && dataset.query && (!directData || directData.length === 0)) {
        const connection = await db.query.connections.findFirst({
          where: and(eq(connections.id, dataset.connectionId), eq(connections.userId, userId)),
        });

        if (connection) {
          const config = (connection.config as BaseConnectionConfig) || {};
          const queryResult = await executeQuery(
            connection.type,
            { ...config, type: connection.type },
            dataset.query,
            { readOnly: true, maxRows: 100 }
          );
          dataToAnalyze = queryResult.data;
          columnsToAnalyze = queryResult.columns;
        }
      }
    }

    if (columnsToAnalyze.length === 0 && dataToAnalyze.length > 0) {
      columnsToAnalyze = Object.keys(dataToAnalyze[0]).map((key) => ({
        name: key,
        type: typeof dataToAnalyze[0][key] === 'number' ? 'number' : 'string',
      }));
    }

    const recommendation = await recommendCharts(dataToAnalyze, columnsToAnalyze, datasetName);

    return NextResponse.json({
      success: true,
      datasetId,
      ...recommendation,
    });
  } catch (error: any) {
    console.error('Error in AI chart recommendation route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
