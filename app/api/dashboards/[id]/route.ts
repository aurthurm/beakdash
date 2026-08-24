import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { dashboards } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const dashboardId = parseInt(id, 10);
    if (isNaN(dashboardId)) {
      return NextResponse.json({ error: 'Invalid dashboard ID' }, { status: 400 });
    }

    const dashboard = await db.query.dashboards.findFirst({
      where: eq(dashboards.id, dashboardId),
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Dashboard fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const dashboardId = parseInt(id, 10);
    if (isNaN(dashboardId)) {
      return NextResponse.json({ error: 'Invalid dashboard ID' }, { status: 400 });
    }

    const body = await request.json();

    const [updatedDashboard] = await db
      .update(dashboards)
      .set({
        name: body.name,
        description: body.description,
        spaceId: body.spaceId ? parseInt(body.spaceId, 10) : undefined,
        layout: body.layout,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        updatedAt: new Date(),
      })
      .where(eq(dashboards.id, dashboardId))
      .returning();

    if (!updatedDashboard) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 });
    }

    return NextResponse.json(updatedDashboard);
  } catch (error) {
    console.error('Dashboard update error:', error);
    return NextResponse.json({ error: 'Failed to update dashboard' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const dashboardId = parseInt(id, 10);
    if (isNaN(dashboardId)) {
      return NextResponse.json({ error: 'Invalid dashboard ID' }, { status: 400 });
    }

    await db.delete(dashboards).where(eq(dashboards.id, dashboardId));

    return NextResponse.json({ success: true, message: 'Dashboard deleted successfully' });
  } catch (error) {
    console.error('Dashboard deletion error:', error);
    return NextResponse.json({ error: 'Failed to delete dashboard' }, { status: 500 });
  }
}