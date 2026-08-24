import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// GET handler for retrieving a specific alert
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

    // Get the alert details
    const result = await db.execute(sql`
      SELECT a.*, 
        q.name as query_name,
        s.name as space_name
      FROM db_qa_alerts a
      LEFT JOIN db_qa_queries q ON a.query_id = q.id
      LEFT JOIN spaces s ON a.space_id = s.id
      WHERE a.id = ${alertId} AND a.user_id = ${userId}
    `);

    // Check if alert exists
    const rows = Array.isArray(result) ? result : [];
    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    // Get the alert details
    const alert = rows[0] as Record<string, any>;

    // Convert date fields to ISO strings
    const serializedAlert: Record<string, any> = {};
    for (const key in alert) {
      let value = alert[key];
      if (value instanceof Date) {
        value = value.toISOString();
      }
      serializedAlert[key] = value;
    }

    return NextResponse.json(serializedAlert);
  } catch (error) {
    console.error('Error fetching alert details:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch alert details' },
      { status: 500 }
    );
  }
}

// PUT handler for updating an alert
export async function PUT(
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

    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.queryId || !body.severity || !body.condition || !body.notificationChannels) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Convert queryId to number
    const queryIdNum = parseInt(body.queryId, 10);
    
    // Check if the query exists and belongs to the user
    const queryResult = await db.execute(sql`
      SELECT * FROM db_qa_queries 
      WHERE id = ${queryIdNum} AND user_id = ${userId}
    `);
    
    const queryRows = Array.isArray(queryResult) ? queryResult : [];
    if (queryRows.length === 0) {
      return NextResponse.json(
        { error: 'Query not found or access denied' },
        { status: 404 }
      );
    }
    
    // Get the query's space_id if present
    const spaceId = (queryRows[0] as Record<string, any>).space_id;
    
    // Update the alert
    await db.execute(sql`
      UPDATE db_qa_alerts
      SET 
        query_id = ${queryIdNum},
        space_id = ${spaceId},
        name = ${body.name},
        description = ${body.description || null},
        severity = ${body.severity},
        condition = ${JSON.stringify(body.condition)}::jsonb,
        notification_channels = ${JSON.stringify(body.notificationChannels)}::jsonb,
        email_recipients = ${body.emailRecipients || null},
        slack_webhook = ${body.slackWebhook || null},
        custom_webhook = ${body.customWebhook || null},
        enabled = ${body.enabled !== undefined ? body.enabled : true},
        throttle_minutes = ${body.throttleMinutes || 60},
        status = ${body.status || 'pending'},
        updated_at = NOW()
      WHERE id = ${alertId} AND user_id = ${userId}
    `);

    // Get the updated alert
    const updatedAlertResult = await db.execute(sql`
      SELECT * FROM db_qa_alerts 
      WHERE id = ${alertId}
    `);
    
    // Serialize the updated alert
    let updatedAlert = null;
    if (Array.isArray(updatedAlertResult) && updatedAlertResult.length > 0) {
      const row = updatedAlertResult[0] as Record<string, any>;
      updatedAlert = {} as Record<string, any>;
      
      // Create a serializable object from the row
      for (const key in row) {
        let value = row[key];
        // Convert dates to ISO strings
        if (value instanceof Date) {
          value = value.toISOString();
        }
        updatedAlert[key] = value;
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Alert updated successfully',
      alert: updatedAlert
    });
  } catch (error: any) {
    console.error('Error updating alert:', error);
    
    return NextResponse.json(
      { error: `Failed to update alert: ${error.message}` },
      { status: 500 }
    );
  }
}

// DELETE handler for deleting an alert
export async function DELETE(
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
      SELECT id FROM db_qa_alerts 
      WHERE id = ${alertId} AND user_id = ${userId}
    `);

    const alertRows = Array.isArray(alertCheckResult) ? alertCheckResult : [];
    if (alertRows.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found or access denied' },
        { status: 404 }
      );
    }

    // Delete associated notifications first
    await db.execute(sql`
      DELETE FROM db_qa_alert_notifications 
      WHERE alert_id = ${alertId}
    `);

    // Delete the alert
    await db.execute(sql`
      DELETE FROM db_qa_alerts 
      WHERE id = ${alertId} AND user_id = ${userId}
    `);

    return NextResponse.json({
      success: true,
      message: 'Alert deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting alert:', error);
    
    return NextResponse.json(
      { error: `Failed to delete alert: ${error.message}` },
      { status: 500 }
    );
  }
}