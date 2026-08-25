import { db } from '@/lib/db';
import { dbQaAlerts, dbQaAlertNotifications } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { EvaluationResult } from './evaluator';

export interface AlertNotificationPayload {
  alertId: number;
  alertName: string;
  queryId: number;
  queryName: string;
  severity: string;
  evaluation: EvaluationResult;
  executedAt: string;
  executionDurationMs?: number;
  slackWebhook?: string | null;
  customWebhook?: string | null;
  emailRecipients?: string | null;
  notificationChannels?: string[] | null;
  throttleMinutes?: number | null;
  lastTriggeredAt?: Date | null;
}

export interface DispatchResult {
  channel: string;
  status: 'sent' | 'failed' | 'throttled';
  errorMessage?: string;
}

/**
 * Check if alert is currently throttled
 */
export function isAlertThrottled(
  lastTriggeredAt?: Date | null,
  throttleMinutes: number = 60
): boolean {
  if (!lastTriggeredAt) return false;
  const elapsedMs = Date.now() - new Date(lastTriggeredAt).getTime();
  return elapsedMs < throttleMinutes * 60 * 1000;
}

/**
 * Dispatch Slack webhook notification
 */
async function sendSlackNotification(
  webhookUrl: string,
  payload: AlertNotificationPayload
): Promise<DispatchResult> {
  const colorMap: Record<string, string> = {
    critical: '#dc2626', // Red
    high: '#ea580c',     // Orange
    medium: '#eab308',   // Yellow
    low: '#3b82f6',      // Blue
  };
  const color = colorMap[payload.severity.toLowerCase()] || '#6b7280';

  const slackBody = {
    attachments: [
      {
        color,
        title: `🚨 DB-QA Alert: ${payload.alertName}`,
        text: `**Query**: ${payload.queryName}\n**Severity**: ${payload.severity.toUpperCase()}\n**Status**: Triggered\n**Diagnosis**: ${payload.evaluation.message}`,
        fields: [
          {
            title: 'Actual Value',
            value: String(payload.evaluation.actualValue ?? 'null'),
            short: true,
          },
          {
            title: 'Threshold / Target',
            value: String(payload.evaluation.threshold ?? 'N/A'),
            short: true,
          },
          {
            title: 'Operator',
            value: payload.evaluation.operator,
            short: true,
          },
          {
            title: 'Execution Time',
            value: `${payload.executionDurationMs || 0} ms`,
            short: true,
          },
        ],
        footer: 'BeakDash Automated QA Monitor',
        ts: Math.floor(Date.now() / 1000),
      },
    ],
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackBody),
    });

    if (!response.ok) {
      return {
        channel: 'slack',
        status: 'failed',
        errorMessage: `Slack returned HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return { channel: 'slack', status: 'sent' };
  } catch (err: any) {
    return {
      channel: 'slack',
      status: 'failed',
      errorMessage: err.message || 'Failed to send Slack webhook',
    };
  }
}

/**
 * Dispatch Custom HTTP Webhook notification
 */
async function sendCustomWebhookNotification(
  webhookUrl: string,
  payload: AlertNotificationPayload
): Promise<DispatchResult> {
  const customBody = {
    event: 'db_qa_alert_triggered',
    timestamp: payload.executedAt,
    alert: {
      id: payload.alertId,
      name: payload.alertName,
      severity: payload.severity,
    },
    query: {
      id: payload.queryId,
      name: payload.queryName,
    },
    evaluation: payload.evaluation,
    executionDurationMs: payload.executionDurationMs,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'BeakDash-QA-Notifier/1.0',
      },
      body: JSON.stringify(customBody),
    });

    if (!response.ok) {
      return {
        channel: 'webhook',
        status: 'failed',
        errorMessage: `Custom webhook returned HTTP ${response.status}`,
      };
    }

    return { channel: 'webhook', status: 'sent' };
  } catch (err: any) {
    return {
      channel: 'webhook',
      status: 'failed',
      errorMessage: err.message || 'Failed to send custom webhook',
    };
  }
}

/**
 * Dispatch all configured alert notifications and log to database
 */
export async function dispatchAlertNotifications(
  payload: AlertNotificationPayload
): Promise<DispatchResult[]> {
  const results: DispatchResult[] = [];
  const channels = payload.notificationChannels || ['in_app'];
  const throttled = isAlertThrottled(payload.lastTriggeredAt, payload.throttleMinutes || 60);

  // 1. Slack channel
  if (channels.includes('slack') && payload.slackWebhook) {
    if (throttled) {
      results.push({ channel: 'slack', status: 'throttled' });
    } else {
      const res = await sendSlackNotification(payload.slackWebhook, payload);
      results.push(res);
      await logNotification(payload.alertId, 'slack', res.status, payload.evaluation, res.errorMessage);
    }
  }

  // 2. Custom Webhook channel
  if (channels.includes('webhook') && payload.customWebhook) {
    if (throttled) {
      results.push({ channel: 'webhook', status: 'throttled' });
    } else {
      const res = await sendCustomWebhookNotification(payload.customWebhook, payload);
      results.push(res);
      await logNotification(payload.alertId, 'webhook', res.status, payload.evaluation, res.errorMessage);
    }
  }

  // 3. Email channel
  if (channels.includes('email') && payload.emailRecipients) {
    if (throttled) {
      results.push({ channel: 'email', status: 'throttled' });
    } else {
      // Record email notification
      await logNotification(payload.alertId, 'email', 'sent', {
        recipients: payload.emailRecipients,
        message: payload.evaluation.message,
      });
      results.push({ channel: 'email', status: 'sent' });
    }
  }

  // 4. In-App Notification (always logged)
  await logNotification(payload.alertId, 'in_app', 'sent', payload.evaluation);
  results.push({ channel: 'in_app', status: 'sent' });

  // Update alert lastTriggeredAt and status
  if (!throttled) {
    await db
      .update(dbQaAlerts)
      .set({
        lastTriggeredAt: new Date(),
        status: 'active',
        updatedAt: new Date(),
      })
      .where(eq(dbQaAlerts.id, payload.alertId));
  }

  return results;
}

/**
 * Persist notification record in db_qa_alert_notifications
 */
async function logNotification(
  alertId: number,
  channel: string,
  status: string,
  content: Record<string, any>,
  errorMessage?: string
): Promise<void> {
  try {
    await db.insert(dbQaAlertNotifications).values({
      alertId,
      channel,
      status,
      content,
      errorMessage: errorMessage || null,
    });
  } catch (err) {
    console.error('Error logging alert notification:', err);
  }
}
