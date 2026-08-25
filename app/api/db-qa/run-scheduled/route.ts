import { NextRequest, NextResponse } from "next/server";
import { runAllDueQueries } from "@/lib/db-qa/runner";

export async function POST(request: NextRequest) {
  try {
    // Optional secret key check for cron execution
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
    }

    const results = await runAllDueQueries();

    return NextResponse.json({
      success: true,
      executedCount: results.length,
      timestamp: new Date().toISOString(),
      results: results.map(r => ({
        queryId: r.queryId,
        queryName: r.queryName,
        status: r.status,
        executionDurationMs: r.executionDurationMs,
        rowCount: r.rowCount,
        alertsEvaluated: r.evaluatedAlerts.length,
        nextExecutionTime: r.nextExecutionTime,
      })),
    });
  } catch (error: any) {
    console.error("Error executing scheduled DB-QA runs:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute scheduled DB-QA queries" },
      { status: 500 }
    );
  }
}
