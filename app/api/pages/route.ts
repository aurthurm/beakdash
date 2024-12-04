import { NextResponse } from 'next/server';
import { db } from '@/app/lib/drizzle';
import { eq } from 'drizzle-orm';
import { pagesTable, pageSchema } from '@/app/lib/drizzle/schemas';

export async function GET() {
    try {
        const data = await db.select().from(pagesTable); 
        return NextResponse.json(data);
    } catch (error) {
        console.error('Database error:', error);
        return NextResponse.json({ error: error }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
      const body = await request.json();
      const validated = pageSchema.parse(body);
      
      if (validated.id) {
        const data = await db.update(pagesTable)
          .set({ ...validated, updatedAt: new Date() })
          .where(eq(pagesTable.id, validated.id))
          .returning();
        
        if (!data.length) {
          return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }
        return NextResponse.json(data[0]);
      }
  
      const data = await db.insert(pagesTable)
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