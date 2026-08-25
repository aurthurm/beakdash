import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runCopilot, CopilotRequest } from '@/lib/ai/copilot';
import { db } from '@/lib/db';
import { datasets, connections } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSchemaInfo } from '@/lib/db/schema-info';
import { BaseConnectionConfig } from '@/lib/db/connection-pool';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    // Apply Rate Limiting (20 requests per minute per user)
    const ip = getClientIp(req.headers);
    const rateLimit = checkRateLimit(`ai:copilot:${userId}:${ip}`, 20, 60);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many AI requests. Please wait a moment before trying again.',
          retryAfter: rateLimit.resetSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.resetSeconds),
            'X-RateLimit-Limit': String(rateLimit.limit),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
          },
        }
      );
    }

    const body = await req.json();
    const { prompt, context = [], datasetId, connectionId, chartType, widgetContext } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    let schemaInfo = null;
    let datasetContext = null;
    let targetDialect = 'postgresql';

    // 1. If datasetId is provided, resolve dataset metadata
    if (datasetId) {
      const parsedDatasetId = parseInt(String(datasetId), 10);
      const dataset = await db.query.datasets.findFirst({
        where: and(eq(datasets.id, parsedDatasetId), eq(datasets.userId, userId)),
      });

      if (dataset) {
        datasetContext = {
          id: dataset.id,
          name: dataset.name,
          query: dataset.query || undefined,
        };

        if (dataset.connectionId) {
          const connection = await db.query.connections.findFirst({
            where: and(eq(connections.id, dataset.connectionId), eq(connections.userId, userId)),
          });

          if (connection) {
            targetDialect = connection.type;
            const config = (connection.config as BaseConnectionConfig) || {};
            schemaInfo = await getSchemaInfo({ ...config, type: connection.type });
          }
        }
      }
    } else if (connectionId) {
      // If direct connectionId is provided
      const parsedConnectionId = parseInt(String(connectionId), 10);
      const connection = await db.query.connections.findFirst({
        where: and(eq(connections.id, parsedConnectionId), eq(connections.userId, userId)),
      });

      if (connection) {
        targetDialect = connection.type;
        const config = (connection.config as BaseConnectionConfig) || {};
        schemaInfo = await getSchemaInfo({ ...config, type: connection.type });
      }
    }

    const copilotRequest: CopilotRequest = {
      prompt,
      context,
      schemaInfo,
      datasetContext,
      widgetContext,
      dialect: targetDialect,
    };

    const response = await runCopilot(copilotRequest);

    return NextResponse.json(
      {
        success: true,
        ...response,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (error: any) {
    console.error('Error in AI Copilot route:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal AI Copilot Error' },
      { status: 500 }
    );
  }
}
