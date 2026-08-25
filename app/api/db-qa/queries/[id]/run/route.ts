import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { runDbQaQuery } from "@/lib/db-qa/runner";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    
    const userId = parseInt(session.user.id, 10);
    const result = await runDbQaQuery(queryId, userId);

    return NextResponse.json({
      success: result.status !== 'error',
      ...result,
    });
  } catch (error: any) {
    console.error("Error running DB-QA query:", error);
    
    return NextResponse.json(
      { success: false, error: error.message || "Failed to run DB-QA query" },
      { status: 500 }
    );
  }
}