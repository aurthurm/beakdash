import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// GET handler for retrieving query execution history
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
    const queryId = parseInt(id, 10);
    const userId = parseInt(session.user.id, 10);
    
    if (isNaN(queryId)) {
      return NextResponse.json(
        { error: 'Invalid query ID' },
        { status: 400 }
      );
    }

    // Get query first to verify ownership
    const queryResult = await db.execute(sql`
      SELECT * FROM db_qa_queries 
      WHERE id = ${queryId} AND user_id = ${userId}
    `);


    const queryRows = Array.isArray(queryResult) ? queryResult : [];
    
    if (queryRows.length === 0) {
      return NextResponse.json(
        { error: 'Query not found' },
        { status: 404 }
      );
    }

    // Get execution history for the query
    const historyResult = await db.execute(sql`
      SELECT 
        er.id,
        er.query_id,
        er.execution_time,
        er.status,
        er.execution_duration,
        er.error_message,
        er.metrics,
        er.result as result_summary
      FROM db_qa_execution_results er
      WHERE er.query_id = ${queryId}
      ORDER BY er.execution_time DESC
      LIMIT 50
    `);

    // Transform the result to a serializable array
    const rows = Array.isArray(historyResult) ? historyResult : [];
    
    const serializedRows = rows.map(row => {
      // Create a plain object with all enumerable properties
      const plainObject: Record<string, any> = {};
      for (const key in row) {
        let value = row[key];
        // Convert dates to ISO strings
        if (value instanceof Date) {
          value = value.toISOString();
        }
        // Parse JSON fields if they're strings
        if (typeof value === 'string' && (key === 'metrics' || key === 'result_summary')) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            // Keep as string if not valid JSON
          }
        }
        plainObject[key] = value;
      }
      return plainObject;
    });
    
    return NextResponse.json(serializedRows);
  } catch (error) {
    console.error('Error fetching execution history:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch execution history' },
      { status: 500 }
    );
  }
}