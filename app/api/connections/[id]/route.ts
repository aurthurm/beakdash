import { NextResponse } from 'next/server';
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { connectionsTable, connectionSchema } from '@/app/lib/drizzle/schemas';
import { db } from '@/app/lib/drizzle';


export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { id } = params;
    const validated = connectionSchema.parse(body);

    const data = await db.update(connectionsTable)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(connectionsTable.id, id))
    .returning();
  
    if (!data.length) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }
    return NextResponse.json(data[0]);

  } catch (error) {
    console.error("[CONNECTION_PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await db.delete(connectionsTable)
    .where(eq(connectionsTable.id, id))

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[CONNECTION_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}