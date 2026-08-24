import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { dashboards, spaces } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const spaceId = searchParams.get('spaceId');
    
    // Fetch dashboards with optional filters
    let allDashboards;
    
    if (userId && spaceId) {
      allDashboards = await db.select().from(dashboards)
        .where(and(eq(dashboards.userId, parseInt(userId, 10)), eq(dashboards.spaceId, parseInt(spaceId, 10))));
    } else if (userId) {
      allDashboards = await db.select().from(dashboards)
        .where(eq(dashboards.userId, parseInt(userId, 10)));
    } else if (spaceId) {
      allDashboards = await db.select().from(dashboards)
        .where(eq(dashboards.spaceId, parseInt(spaceId, 10)));
    } else {
      allDashboards = await db.select().from(dashboards);
    }

    
    return NextResponse.json(allDashboards);
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboards' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const description = formData.get('description') as string || null;
    const spaceId = parseInt(formData.get('spaceId') as string) || null;
    
    if (!name) {
      return NextResponse.json({ error: 'Dashboard name is required' }, { status: 400 });
    }
    
    // If no space is selected, try to find a default space
    let actualSpaceId = spaceId;
    if (!actualSpaceId) {
      const defaultSpace = await db.query.spaces.findFirst({
        where: eq(spaces.isDefault, true),
      });
      
      if (defaultSpace) {
        actualSpaceId = defaultSpace.id;
      }
    }
    
    // Insert the new dashboard
    const [newDashboard] = await db.insert(dashboards)
      .values({
        name,
        description,
        userId: parseInt(session.user.id as string),
        spaceId: actualSpaceId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    // Redirect to dashboard listing
    return NextResponse.redirect(new URL('/dashboard', request.url));
  } catch (error) {
    console.error('Error creating dashboard:', error);
    return NextResponse.json({ error: 'Failed to create dashboard' }, { status: 500 });
  }
}