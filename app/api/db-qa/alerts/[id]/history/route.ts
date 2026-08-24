import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// GET handler for retrieving alert history
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
    const alertCheckResult = await db.execute(sql`
      SELECT * FROM db_qa_alerts 
      WHERE id = ${alertId} AND user_id = ${userId}
    `);


    const alertRows = Array.isArray(alertCheckResult) ? alertCheckResult : [];
    if (alertRows.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found or access denied' },
        { status: 404 }
      );
    }

    // Check if alert history table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'db_qa_alert_history'
      );
    `);
    
    const tableExists = Array.isArray(tableCheck) && tableCheck.length > 0 && tableCheck[0].exists;
    
    if (!tableExists) {
      // If table doesn't exist yet, return empty array
      return NextResponse.json([]);
    }

    // Get alert history
    const historyResult = await db.execute(sql`
      SELECT h.*, er.execution_time, er.status as execution_status, q.name as query_name
      FROM db_qa_alert_history h
      LEFT JOIN db_qa_execution_results er ON h.execution_id = er.id
      LEFT JOIN db_qa_queries q ON er.query_id = q.id
      WHERE h.alert_id = ${alertId}
      ORDER BY h.triggered_at DESC
      LIMIT 100
    `);

    // Process and return the results
    const history = Array.isArray(historyResult) ? historyResult : [];
    
    // Serialize the history entries
    const serializedHistory = history.map(entry => {
      const serialized: Record<string, any> = {};
      
      for (const key in entry) {
        let value = entry[key];
        if (value instanceof Date) {
          value = value.toISOString();
        }
        serialized[key] = value;
      }
      
      return serialized;
    });

    return NextResponse.json(serializedHistory);
  } catch (error) {
    console.error('Error fetching alert history:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch alert history' },
      { status: 500 }
    );
  }
}