import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { db } from "@/lib/db";
import { dbQaQueries, dbQaExecutionResults } from "@/lib/db/schema";
import { authOptions } from "@/lib/auth";

// GET /api/db-qa/queries/[id]/results
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id: paramId } = await params;
    const id = Number(paramId);
    
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid query ID" }, { status: 400 });
    }

    
    // Check if the query exists and belongs to the user
    const query = await db.query.dbQaQueries.findFirst({
      where: and(
        eq(dbQaQueries.id, id),
        eq(dbQaQueries.userId, Number(session.user.id))
      ),
    });
    
    if (!query) {
      return NextResponse.json({ error: "Query not found" }, { status: 404 });
    }
    
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 10;
    
    // Get the execution results for this query
    const results = await db.query.dbQaExecutionResults.findMany({
      where: eq(dbQaExecutionResults.queryId, id),
      orderBy: (executionResults, { desc }) => [desc(executionResults.executionTime)],
      limit,
    });
    
    return NextResponse.json(results);
  } catch (error) {
    console.error("Error fetching DB QA query results:", error);
    return NextResponse.json({ error: "Failed to fetch DB QA query results" }, { status: 500 });
  }
}