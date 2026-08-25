import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { dashboards } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { generateEmbedToken } from '@/lib/embed/token';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const body = await request.json();

    const { dashboardId, theme, showHeader, showControls, refreshInterval, allowedOrigins, expiresInSeconds } = body;

    if (!dashboardId) {
      return NextResponse.json({ error: 'dashboardId is required' }, { status: 400 });
    }

    const parsedDashboardId = parseInt(String(dashboardId), 10);

    // Verify dashboard ownership
    const dashboard = await db.query.dashboards.findFirst({
      where: and(eq(dashboards.id, parsedDashboardId), eq(dashboards.userId, userId)),
    });

    if (!dashboard) {
      return NextResponse.json({ error: 'Dashboard not found or unauthorized' }, { status: 404 });
    }

    const tokenResult = generateEmbedToken({
      dashboardId: parsedDashboardId,
      userId,
      theme,
      showHeader,
      showControls,
      refreshInterval,
      allowedOrigins,
      expiresInSeconds,
    });

    return NextResponse.json({
      success: true,
      data: {
        token: tokenResult.token,
        expiresAt: tokenResult.expiresAt,
      },
    });
  } catch (error: any) {
    console.error('Error generating embed token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create embed token' },
      { status: 500 }
    );
  }
}
