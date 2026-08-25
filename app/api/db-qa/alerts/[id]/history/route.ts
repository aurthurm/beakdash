import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { dbQaAlerts, dbQaExecutionResults, dbQaQueries } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET handler for retrieving alert history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const alertId = parseInt(id, 10);
    const userId = parseInt(session.user.id, 10);
    
    if (isNaN(alertId)) {
      return NextResponse.json(
        { error: 'Invalid alert ID' },
        { status: 400 }
      );
    }

    // Check if alert exists and belongs to the user
    const alert = await db.query.dbQaAlerts.findFirst({
      where: and(eq(dbQaAlerts.id, alertId), eq(dbQaAlerts.userId, userId)),
    });

    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch execution results for this alert's query
    const results = await db.query.dbQaExecutionResults.findMany({
      where: eq(dbQaExecutionResults.queryId, alert.queryId),
      orderBy: [desc(dbQaExecutionResults.executionTime)],
      limit: 50,
    });

    return NextResponse.json({
      success: true,
      alertId,
      alertName: alert.name,
      history: results,
    });
  } catch (error: any) {
    console.error('Error fetching alert history:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch alert history' },
      { status: 500 }
    );
  }
}