import { NextResponse } from 'next/server';
import 'dotenv/config';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { connectionsTable, connectionSchema } from '@/app/lib/drizzle/schemas';
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
        const data = await db.select().from(connectionsTable)
        .where(eq(connectionsTable.userId, userId)); 
        return NextResponse.json(data);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
      const body = await request.json();
      const validated = connectionSchema.parse(body);
      
      if (validated.id) {
        return NextResponse.json({ error: 'A new connection cannot have an id' }, { status: 500 });
      }
  
      const data = await db.insert(connectionsTable)
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