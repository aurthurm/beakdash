import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, dashboards, connections, datasets } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);

    // Get user profile
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return new NextResponse('User not found', { status: 404 });
    }

    // Get user stats
    const [userDashboards, userConnections, userDatasets] = await Promise.all([
      db.query.dashboards.findMany({
        where: eq(dashboards.userId, userId),
      }),
      db.query.connections.findMany({
        where: eq(connections.userId, userId),
      }),
      db.query.datasets.findMany({
        where: eq(datasets.userId, userId),
      }),
    ]);

    const settings = (user.settings as Record<string, any>) || {};

    return NextResponse.json({
      username: user.username,
      displayName: user.displayName || user.username,
      email: user.email,
      bio: settings.bio || '',
      avatarUrl: user.avatarUrl || '',
      createdAt: user.createdAt,
      stats: {
        dashboards: userDashboards.length,
        connections: userConnections.length,
        datasets: userDatasets.length,
      },
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    const body = await req.json();
    const { displayName, bio, avatarUrl } = body;

    if (!displayName) {
      return new NextResponse('Display name is required', { status: 400 });
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    const currentSettings = (existingUser?.settings as Record<string, any>) || {};
    const updatedSettings = {
      ...currentSettings,
      bio: bio !== undefined ? bio : currentSettings.bio,
    };

    // Update user profile
    await db
      .update(users)
      .set({
        displayName,
        avatarUrl: avatarUrl !== undefined ? avatarUrl : existingUser?.avatarUrl,
        settings: updatedSettings,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
 