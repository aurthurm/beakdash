import { NextResponse } from 'next/server';
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { widgetsTable, widgetSchema } from '@/app/lib/drizzle/schemas';
import { db } from '@/app/lib/drizzle';

export async function GET() {
    try {
        const data = await db.select().from(widgetsTable); 
        return NextResponse.json(data);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
      const body = await request.json();
      const validated = widgetSchema.parse(body);
      
      if (validated.id) {
        const data = await db.update(widgetsTable)
          .set({ ...validated, updatedAt: new Date() })
          .where(eq(widgetsTable.id, validated.id))
          .returning();
        
        if (!data.length) {
          return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
        }
        return NextResponse.json(data[0]);
      }
  
      const data = await db.insert(widgetsTable)
        .values({ ...validated, createdAt: new Date(), updatedAt: new Date() })
        .returning();
        
      return NextResponse.json(data[0]);
    } catch (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: error instanceof z.ZodError ? error.errors : 'Operation failed' },
        { status: 400 }
      );
    }
  }