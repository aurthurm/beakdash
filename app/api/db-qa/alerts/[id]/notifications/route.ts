import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// GET handler for retrieving alert notification history
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

    // Check if notifications table exists
    const tableCheck = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'db_qa_alert_notifications'
      );
    `);
    
    const tableExists = Array.isArray(tableCheck) && tableCheck.length > 0 && tableCheck[0].exists;
    
    if (!tableExists) {
      // If table doesn't exist yet, return empty array
      return NextResponse.json([]);
    }

    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const channel = searchParams.get('channel');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit') as string) : 50;

    // Build the query with filters
    let queryStr = `
      SELECT n.*, h.triggered_at as alert_triggered_at 
      FROM db_qa_alert_notifications n
      LEFT JOIN db_qa_alert_history h ON n.alert_history_id = h.id
      WHERE n.alert_id = ${alertId}
    `;
    
    const queryParams: any[] = [];
    let paramCounter = 1;
    
    if (status) {
      queryStr += ` AND n.status = $${paramCounter}`;
      queryParams.push(status);
      paramCounter++;
    }
    
    if (channel) {
      queryStr += ` AND n.channel = $${paramCounter}`;
      queryParams.push(channel);
      paramCounter++;
    }
    
    queryStr += ` ORDER BY n.sent_at DESC LIMIT ${limit}`;
    
    // Execute the query with parameters
    let notificationsResult;
    if (queryParams.length > 0) {
      // We have parameters, use parameterized query
      let parametrizedQuery = queryStr;
      for (let i = 0; i < queryParams.length; i++) {
        // Replace $N with actual parameter value
        parametrizedQuery = parametrizedQuery.replace(`$${i+1}`, Array.isArray(queryParams[i]) ? 
          `'${queryParams[i].join("','")}'` : 
          typeof queryParams[i] === 'string' ? `'${queryParams[i]}'` : String(queryParams[i]));
      }
      notificationsResult = await db.execute(sql.raw(parametrizedQuery));
    } else {
      // No parameters, simpler query
      notificationsResult = await db.execute(sql.raw(queryStr));
    }

    // Process and return the results
    const notifications = Array.isArray(notificationsResult) ? notificationsResult : [];
    
    // Serialize the notification entries
    const serializedNotifications = notifications.map(notification => {
      const serialized: Record<string, any> = {};
      
      for (const key in notification) {
        let value = notification[key];
        if (value instanceof Date) {
          value = value.toISOString();
        }
        serialized[key] = value;
      }
      
      return serialized;
    });

    return NextResponse.json(serializedNotifications);
  } catch (error) {
    console.error('Error fetching alert notification history:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch alert notification history' },
      { status: 500 }
    );
  }
}