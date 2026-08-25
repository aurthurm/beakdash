import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/postgres';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = 'healthy';
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    const dbPingStart = Date.now();
    await sql.unsafe('SELECT 1 as ping');
    dbLatencyMs = Date.now() - dbPingStart;
  } catch (err: any) {
    dbStatus = 'unhealthy';
    dbError = err.message || 'Database connection error';
  }

  const memoryUsage = process.memoryUsage();
  const totalResponseTimeMs = Date.now() - startTime;

  const isHealthy = dbStatus === 'healthy';

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'BeakDash API',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          error: dbError,
        },
      },
      system: {
        memory: {
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        },
        responseTimeMs: totalResponseTimeMs,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}