import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

// POST handler for toggling the alert enabled status
export async function POST(
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

    // Get current enabled status
    const currentStatus = (alertRows[0] as Record<string, any>).enabled;
    
    // Toggle the status
    await db.execute(sql`
      UPDATE db_qa_alerts
      SET enabled = ${!currentStatus}, updated_at = NOW()
      WHERE id = ${alertId} AND user_id = ${userId}
    `);

    return NextResponse.json({
      success: true,
      message: `Alert ${!currentStatus ? 'enabled' : 'disabled'} successfully`,
      enabled: !currentStatus
    });
  } catch (error) {
    console.error('Error toggling alert status:', error);
    
    return NextResponse.json(
      { error: 'Failed to toggle alert status' },
      { status: 500 }
    );
  }
}