import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { dbQaAlerts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// POST handler for toggling the alert enabled status
export async function POST(
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

    const nextStatus = !alert.enabled;

    await db
      .update(dbQaAlerts)
      .set({
        enabled: nextStatus,
        updatedAt: new Date(),
      })
      .where(eq(dbQaAlerts.id, alertId));

    return NextResponse.json({
      success: true,
      message: `Alert ${nextStatus ? 'enabled' : 'disabled'} successfully`,
      enabled: nextStatus,
    });
  } catch (error: any) {
    console.error('Error toggling alert status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to toggle alert status' },
      { status: 500 }
    );
  }
}