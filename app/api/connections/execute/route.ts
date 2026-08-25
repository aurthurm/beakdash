import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connections } from '@/lib/db/schema';
import { db } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { executeQuery } from '@/lib/db/query-engine';
import { BaseConnectionConfig } from '@/lib/db/connection-pool';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

export async function POST(request: NextRequest) {
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
    const ip = getClientIp(request.headers);

    // Apply Rate Limiting (60 query executions per minute per user)
    const rateLimit = checkRateLimit(`sql:exec:${userId}:${ip}`, 60, 60);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'Query execution rate limit exceeded. Please wait a moment before executing more queries.',
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
    
    // Get request body
    const body = await request.json();
    const { query, connectionId, options = {} } = body;

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'A valid SQL query is required' },
        { status: 400 }
      );
    }

    if (!connectionId) {
      return NextResponse.json(
        { error: 'Connection ID is required' },
        { status: 400 }
      );
    }

    const parsedConnectionId = parseInt(String(connectionId), 10);

    // Get connection details and verify ownership
    const connection = await db.query.connections.findFirst({
      where: and(eq(connections.id, parsedConnectionId), eq(connections.userId, userId))
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

    // Execute query using the unified safe execution engine
    const executionResult = await executeQuery(
      connection.type,
      normalizedConfig,
      query,
      {
        readOnly: options.readOnly !== false,
        maxRows: options.maxRows || 5000,
        timeoutMs: options.timeoutMs || 15000,
      }
    );

    return NextResponse.json(
      {
        success: true,
        ...executionResult,
      },
      {
        headers: {
          'X-RateLimit-Limit': String(rateLimit.limit),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      }
    );
  } catch (error: any) {
    console.error('Query execution error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'An unexpected error occurred during query execution'
    }, { status: 400 });
  }
}
