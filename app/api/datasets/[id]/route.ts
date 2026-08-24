import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { datasets } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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

    const userId = parseInt(session.user.id, 10);
    const { id } = await params;
    const datasetId = parseInt(id, 10);
    
    if (isNaN(datasetId)) {
      return NextResponse.json(
        { error: 'Invalid dataset ID' },
        { status: 400 }
      );
    }
    
    // Get dataset
    const dataset = await db.query.datasets.findFirst({
      where: and(eq(datasets.id, datasetId), eq(datasets.userId, userId)),
    });
    
    if (!dataset) {
      return NextResponse.json(
        { error: 'Dataset not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(dataset);
  } catch (error) {
    console.error('Dataset fetch error:', error);
    
    return NextResponse.json(
      { error: 'Failed to fetch dataset' },
      { status: 500 }
    );
  }
}

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

    const userId = parseInt(session.user.id, 10);
    const { id } = await params;
    const datasetId = parseInt(id, 10);
    
    if (isNaN(datasetId)) {
      return NextResponse.json(
        { error: 'Invalid dataset ID' },
        { status: 400 }
      );
    }
    
    const existing = await db.query.datasets.findFirst({
      where: and(eq(datasets.id, datasetId), eq(datasets.userId, userId)),
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Dataset not found or you do not have permission to delete it' },
        { status: 404 }
      );
    }
    
    await db.delete(datasets).where(and(eq(datasets.id, datasetId), eq(datasets.userId, userId)));
    
    return NextResponse.json({
      success: true,
      message: 'Dataset deleted successfully'
    });
  } catch (error) {
    console.error('Dataset deletion error:', error);
    
    return NextResponse.json(
      { error: 'Failed to delete dataset' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const userId = parseInt(session.user.id, 10);
    const { id } = await params;
    const datasetId = parseInt(id, 10);
    
    if (isNaN(datasetId)) {
      return NextResponse.json(
        { error: 'Invalid dataset ID' },
        { status: 400 }
      );
    }
    
    // Get request body
    const body = await request.json();
    
    const existing = await db.query.datasets.findFirst({
      where: and(eq(datasets.id, datasetId), eq(datasets.userId, userId)),
    });
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Dataset not found or you do not have permission to update it' },
        { status: 404 }
      );
    }
    
    const updateData: Partial<typeof datasets.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.query !== undefined) updateData.query = body.query;
    if (body.refresh_interval !== undefined || body.refreshInterval !== undefined) {
      updateData.refreshInterval = body.refresh_interval || body.refreshInterval;
    }
    if (body.connection_id !== undefined || body.connectionId !== undefined) {
      updateData.connectionId = parseInt(body.connection_id || body.connectionId, 10);
    }
    if (body.config !== undefined) updateData.config = body.config;
    
    const [updated] = await db
      .update(datasets)
      .set(updateData)
      .where(and(eq(datasets.id, datasetId), eq(datasets.userId, userId)))
      .returning();
    
    return NextResponse.json({
      success: true,
      message: 'Dataset updated successfully',
      dataset: updated,
    });
  } catch (error) {
    console.error('Dataset update error:', error);
    
    return NextResponse.json(
      { error: 'Failed to update dataset' },
      { status: 500 }
    );
  }
}