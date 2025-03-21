import { NextResponse } from 'next/server';
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { datasetsTable, datasetsSchema } from '@/app/lib/drizzle/schemas';
import { db } from '@/app/lib/drizzle';

export async function GET(request: Request) {
    try {    
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
          return NextResponse.json(
            { error: "userId is required" },
            { status: 400 }
          );
        }
        const data = await db.select().from(datasetsTable)
        .where(eq(datasetsTable.userId, userId)); 
        return NextResponse.json(data);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
      const body = await request.json();
      const validated = datasetsSchema.parse(body);
      
      if (validated.id) {
        const data = await db.update(datasetsTable)
          .set({ ...validated, updatedAt: new Date() })
          .where(eq(datasetsTable.id, validated.id))
          .returning();
        
        if (!data.length) {
          return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
        }
        return NextResponse.json(data[0]);
      }
  
      const data = await db.insert(datasetsTable)
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