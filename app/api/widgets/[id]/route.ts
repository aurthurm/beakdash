import { NextResponse } from 'next/server';
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { widgetsTable, widgetSchema } from '@/app/lib/drizzle/schemas';
import { db } from '@/app/lib/drizzle';


export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { id } = await params;
    const validated = widgetSchema.parse(body);

    const data = await db.update(widgetsTable)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(widgetsTable.id, id))
    .returning();
  
    if (!data.length) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }
    return NextResponse.json(data[0]);

  } catch (error) {
    console.error("[WIDGET_PATCH]", error);
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
    const { id } = await params;

    await db.delete(widgetsTable)
    .where(eq(widgetsTable.id, id))

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WIDGET_DELETE]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}