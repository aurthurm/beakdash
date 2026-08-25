import { db } from '@/lib/db';
import { dbQaQueries, dbQaExecutionResults, dbQaAlerts, connections } from '@/lib/db/schema';
import { eq, and, lte, or, isNull } from 'drizzle-orm';
import { executeQuery, QueryExecutionResult } from '@/lib/db/query-engine';
import { BaseConnectionConfig } from '@/lib/db/connection-pool';
import { evaluateAlertCondition, AlertCondition, EvaluationResult } from './evaluator';
import { dispatchAlertNotifications, DispatchResult } from './notifier';

export interface AlertEvaluationSummary {
  alertId: number;
  alertName: string;
  severity: string;
  evaluation: EvaluationResult;
  dispatches: DispatchResult[];
}

export interface QueryRunResult {
  queryId: number;
  queryName: string;
  status: 'success' | 'failure' | 'error';
  executionDurationMs: number;
  rowCount: number;
  data: Record<string, any>[];
  columns: any[];
  errorMessage?: string;
  evaluatedAlerts: AlertEvaluationSummary[];
  nextExecutionTime?: Date | null;
}

/**
 * Calculate the next execution timestamp based on frequency
 */
export function calculateNextExecutionTime(frequency: string, fromDate: Date = new Date()): Date | null {
  const next = new Date(fromDate);
  switch (frequency?.toLowerCase()) {
    case 'hourly':
      next.setHours(next.getHours() + 1);
      return next;
    case 'daily':
      next.setDate(next.getDate() + 1);
      return next;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      return next;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      return next;
    case 'manual':
    default:
      return null;
  }
}

/**
 * Run a specific DB-QA query and evaluate all associated alerts
 */
export async function runDbQaQuery(
  queryId: number,
  userId?: number
): Promise<QueryRunResult> {
  const startTime = Date.now();

  // Fetch query record
  const query = await db.query.dbQaQueries.findFirst({
    where: userId ? and(eq(dbQaQueries.id, queryId), eq(dbQaQueries.userId, userId)) : eq(dbQaQueries.id, queryId),
  });

  if (!query) {
    throw new Error(`DB-QA Query #${queryId} not found or unauthorized`);
  }

  // Fetch connection
  const connection = await db.query.connections.findFirst({
    where: eq(connections.id, query.connectionId),
  });

  if (!connection) {
    throw new Error(`Data connection #${query.connectionId} not found`);
  }

  const config = (connection.config as unknown as BaseConnectionConfig) || {};
  const normalizedConfig: BaseConnectionConfig = {
    ...config,
    user: config.user || config.username,
    type: config.type || connection.type,
  };

  let queryResult: QueryExecutionResult | null = null;
  let status: 'success' | 'failure' | 'error' = 'success';
  let errorMessage: string | undefined;

  try {
    queryResult = await executeQuery(
      connection.type,
      normalizedConfig,
      query.query,
      { readOnly: true, maxRows: 1000 }
    );
  } catch (err: any) {
    status = 'error';
    errorMessage = err.message || 'Query execution failed';
  }

  const executionDurationMs = Date.now() - startTime;
  const rows = queryResult?.data || [];

  // 1. Record execution result in db_qa_execution_results
  let executionResultId: number | undefined;
  try {
    const inserted = await db
      .insert(dbQaExecutionResults)
      .values({
        queryId: query.id,
        status,
        result: { rows: rows.slice(0, 100), totalCount: rows.length },
        metrics: {
          rowCount: rows.length,
          executionTimeMs: executionDurationMs,
        },
        executionDuration: executionDurationMs,
        errorMessage: errorMessage || null,
      })
      .returning({ id: dbQaExecutionResults.id });

    if (inserted && inserted.length > 0) {
      executionResultId = inserted[0].id;
    }
  } catch (dbErr) {
    console.error('Error logging DB-QA execution result:', dbErr);
  }

  // 2. Fetch all enabled alerts for this query
  const alerts = await db.query.dbQaAlerts.findMany({
    where: and(eq(dbQaAlerts.queryId, query.id), eq(dbQaAlerts.enabled, true)),
  });

  const evaluatedAlerts: AlertEvaluationSummary[] = [];

  for (const alert of alerts) {
    const condition = (alert.condition as unknown as AlertCondition) || { operator: 'greaterThan' };
    const evaluation = evaluateAlertCondition(rows, condition, alert.severity);

    let dispatches: DispatchResult[] = [];

    if (evaluation.triggered) {
      dispatches = await dispatchAlertNotifications({
        alertId: alert.id,
        alertName: alert.name,
        queryId: query.id,
        queryName: query.name,
        severity: alert.severity,
        evaluation,
        executedAt: new Date().toISOString(),
        executionDurationMs,
        slackWebhook: alert.slackWebhook,
        customWebhook: alert.customWebhook,
        emailRecipients: alert.emailRecipients,
        notificationChannels: alert.notificationChannels as string[],
        throttleMinutes: alert.throttleMinutes,
        lastTriggeredAt: alert.lastTriggeredAt,
      });

      // If any alert triggered, mark status as failure (quality rule broken)
      if (status === 'success') {
        status = 'failure';
      }
    }

    evaluatedAlerts.push({
      alertId: alert.id,
      alertName: alert.name,
      severity: alert.severity,
      evaluation,
      dispatches,
    });
  }

  // 3. Update query lastExecutionTime and nextExecutionTime
  const nextExecutionTime = calculateNextExecutionTime(query.executionFrequency || 'manual');
  await db
    .update(dbQaQueries)
    .set({
      lastExecutionTime: new Date(),
      nextExecutionTime,
      updatedAt: new Date(),
    })
    .where(eq(dbQaQueries.id, query.id));

  return {
    queryId: query.id,
    queryName: query.name,
    status,
    executionDurationMs,
    rowCount: rows.length,
    data: rows,
    columns: queryResult?.columns || [],
    errorMessage,
    evaluatedAlerts,
    nextExecutionTime,
  };
}

/**
 * Execute all scheduled recurring DB-QA queries due for execution
 */
export async function runAllDueQueries(): Promise<QueryRunResult[]> {
  const now = new Date();

  // Find queries that are enabled, non-manual, and due for run
  const dueQueries = await db.query.dbQaQueries.findMany({
    where: and(
      eq(dbQaQueries.enabled, true),
      or(
        lte(dbQaQueries.nextExecutionTime, now),
        isNull(dbQaQueries.nextExecutionTime)
      )
    ),
  });

  const results: QueryRunResult[] = [];

  for (const query of dueQueries) {
    if (query.executionFrequency === 'manual') continue;
    try {
      const res = await runDbQaQuery(query.id);
      results.push(res);
    } catch (err) {
      console.error(`Error running scheduled DB-QA query #${query.id}:`, err);
    }
  }

  return results;
}
