import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sql } from "@/lib/db/postgres";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    const queryId = parseInt(id, 10);
    
    if (isNaN(queryId)) {
      return NextResponse.json(
        { error: "Invalid query ID" },
        { status: 400 }
      );
    }
    
    // Get user ID from session
    const userId = parseInt(session.user.id, 10);
    
    // Check if query exists and belongs to the user
    const queryResult = await sql`
      SELECT q.*, s.name as space_name
      FROM db_qa_queries q
      LEFT JOIN spaces s ON q.space_id = s.id
      WHERE q.id = ${queryId}
      AND q.user_id = ${userId}
    `;

    
    if (queryResult.length === 0) {
      return NextResponse.json(
        { error: "Query not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }
    
    // Delete the query
    await sql`
      DELETE FROM db_qa_queries
      WHERE id = ${queryId}
    `;
    
    return NextResponse.json({
      success: true,
      message: "Query deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting query:", error);
    
    return NextResponse.json(
      { error: error.message || "Failed to delete query" },
      { status: 500 }
    );
  }
}