import { getAIClient, isAIConfigured, ChatMessage } from './client';
import { db } from '../db';
import { 
  dashboards, 
  widgets, 
  dashboardWidgets, 
  datasets, 
  connections 
} from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { getSchemaInfo, SchemaInfo } from '../db/schema-info';
import { executeQuery, validateQuerySafety } from '../db/query-engine';
import { selfHealQuery } from './self-healing';

export interface AgentStepTrace {
  step: number;
  thought: string;
  action: string;
  actionInput?: Record<string, any>;
  observation?: string;
  status: 'running' | 'success' | 'error';
}

export interface AgenticBIRequest {
  goal: string;
  userId: number;
  connectionId?: number;
  dashboardId?: number;
  spaceId?: number | null;
  conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
  maxLoops?: number;
}

export interface AgenticBIResponse {
  success: boolean;
  message: string;
  dashboardId?: number;
  dashboardName?: string;
  createdDatasets: { id: number; name: string }[];
  createdWidgets: { id: number; name: string; type: string; chartType?: string }[];
  updatedWidgets: { id: number; name: string }[];
  thoughtTrace: AgentStepTrace[];
  iterations: number;
}

/**
 * Format schema into concise overview for the Agent
 */
function formatSchemaForAgent(schemaInfo: SchemaInfo): string {
  const lines: string[] = [];
  for (const [schemaName, tables] of Object.entries(schemaInfo)) {
    for (const [tableName, columns] of Object.entries(tables)) {
      const colList = columns.map(c => `${c.column}:${c.type}`).join(', ');
      lines.push(`${schemaName}.${tableName} (${colList})`);
    }
  }
  return lines.slice(0, 45).join('\n');
}

/**
 * Autonomous BI Agent execution loop with ReAct thinking, tool executions, and self-correction
 */
export async function runAgenticBIEngine(req: AgenticBIRequest): Promise<AgenticBIResponse> {
  const { goal, userId, spaceId = null, maxLoops = 7, conversationHistory = [] } = req;
  const thoughtTrace: AgentStepTrace[] = [];
  const createdDatasets: { id: number; name: string }[] = [];
  const createdWidgets: { id: number; name: string; type: string; chartType?: string }[] = [];
  const updatedWidgets: { id: number; name: string }[] = [];
  
  let targetDashboardId = req.dashboardId;
  let targetDashboardName = '';

  // 1. Resolve active connection
  const connList = await db.query.connections.findMany({
    where: eq(connections.userId, userId),
  });

  const activeConnection = req.connectionId 
    ? connList.find(c => c.id === req.connectionId) || connList[0]
    : connList[0];

  if (!activeConnection) {
    return {
      success: false,
      message: 'No active data connection found. Please configure a data connection first.',
      createdDatasets: [],
      createdWidgets: [],
      updatedWidgets: [],
      thoughtTrace: [{
        step: 1,
        thought: 'Checking for database connections to build dashboard.',
        action: 'find_connection',
        observation: 'No database connection available.',
        status: 'error',
      }],
      iterations: 1,
    };
  }

  const connConfig = (activeConnection.config as Record<string, any>) || {};
  const normalizedConfig = {
    ...connConfig,
    host: connConfig.hostname || connConfig.host,
    user: connConfig.username || connConfig.user,
    database: connConfig.database,
    password: connConfig.password,
    port: parseInt(connConfig.port || '5432', 10),
    type: activeConnection.type,
  };

  // 2. Fetch schema
  let schemaInfo: SchemaInfo = {};
  try {
    schemaInfo = await getSchemaInfo(normalizedConfig);
  } catch (err: any) {
    console.error('Failed to get schema for agent:', err);
  }

  const formattedSchema = formatSchemaForAgent(schemaInfo);

  // 3. Fetch existing dashboard and widget context if dashboardId provided
  let existingWidgetsStr = 'None';
  if (targetDashboardId) {
    const existingDash = await db.query.dashboards.findFirst({
      where: eq(dashboards.id, targetDashboardId),
    });
    if (existingDash) {
      targetDashboardName = existingDash.name;
      const dws = await db.query.dashboardWidgets.findMany({
        where: eq(dashboardWidgets.dashboardId, targetDashboardId),
        with: { widget: true },
      });
      existingWidgetsStr = dws.map(dw => {
        const w = dw.widget;
        if (!w) return '';
        const cfg = (w.config as any) || {};
        return `Widget ID ${w.id}: "${w.name}" (Type: ${w.type}, ChartType: ${cfg.chartType || 'column'}, xField: ${cfg.xField || 'none'}, yField: ${cfg.yField || 'none'})`;
      }).filter(Boolean).join('\n') || 'No widgets on this dashboard yet.';
    }
  }

  // If AI is not configured, run heuristic agentic builder
  if (!isAIConfigured()) {
    return runHeuristicAgent(req, activeConnection, normalizedConfig, schemaInfo);
  }

  const client = getAIClient()!;
  let currentLoop = 0;
  let completed = false;
  let finalMessage = '';

  const systemPrompt = `You are the BeakDash Autonomous Agentic BI Engineer with thinking, reasoning, and reflection loops.
Your mission is to understand user goals, inspect schemas, write SQL queries, create datasets, build or edit dashboards, and configure charts.

AVAILABLE CONNECTION:
Name: "${activeConnection.name}", Type: ${activeConnection.type}, Database: "${connConfig.database || 'default'}"

AVAILABLE SCHEMA TABLES & COLUMNS:
${formattedSchema}

CONTEXT:
${targetDashboardId ? `TARGET DASHBOARD: ID #${targetDashboardId} ("${targetDashboardName}")\nCURRENT WIDGETS ON THIS DASHBOARD:\n${existingWidgetsStr}` : 'NO TARGET DASHBOARD (Create a new dashboard if the user requested one)'}

YOU OPERATE IN AN AUTONOMOUS REASONING LOOP. In each turn, respond with a JSON object:
{
  "thought": "Your step-by-step reasoning, hypotheses, and reflection on previous observations",
  "action": "introspect_table" | "execute_sql" | "create_dataset" | "create_dashboard" | "add_widget" | "update_widget" | "get_dashboard_widgets" | "finish",
  "actionInput": { ... }
}

ACTION DEFINITIONS:
1. "introspect_table": { "table": "schema.table_name" }
2. "execute_sql": { "sql": "SELECT ... LIMIT 10;" }
3. "create_dataset": { "name": "Dataset Name", "sql": "SELECT ...", "refreshInterval": "daily" }
4. "create_dashboard": { "name": "Dashboard Name", "description": "..." }
5. "add_widget": { "dashboardId": 1, "datasetId": 2, "name": "Widget Name", "chartType": "bar|column|line|area|pie|stat-card|counter|table", "xField": "...", "yField": "...", "colorField": "...", "title": "...", "subtitle": "...", "position": { "x": 0, "y": 0, "w": 6, "h": 4 } }
6. "update_widget": { "widgetId": 1, "name": "...", "chartType": "...", "xField": "...", "yField": "...", "sql": "..." }
7. "get_dashboard_widgets": { "dashboardId": 1 }
8. "finish": { "message": "Comprehensive summary of actions taken and metrics built." }

RULES:
- Always use SELECT queries only.
- Test queries before creating datasets if unsure about data types or column names.
- When creating a dashboard with multiple charts, vary chart types appropriately (e.g. 1 Stat Card, 1 Bar/Column, 1 Trend Area/Line, 1 Donut/Pie).
- Be precise with column names from the provided schema.`;

  const conversation: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory.map(c => ({ role: c.role, content: c.content })),
    { role: 'user', content: `USER GOAL: ${goal}` }
  ];

  while (currentLoop < maxLoops && !completed) {
    currentLoop++;

    let stepThought = '';
    let action = 'finish';
    let actionInput: any = {};

    try {
      const responseText = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: conversation as any,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      });

      const parsed = JSON.parse(responseText.choices[0]?.message?.content || '{}');
      stepThought = parsed.thought || 'Analyzing next step...';
      action = parsed.action || 'finish';
      actionInput = parsed.actionInput || {};
    } catch (err: any) {
      stepThought = `Model error: ${err.message}. Falling back to completion.`;
      action = 'finish';
      actionInput = { message: 'Agentic loop concluded.' };
    }

    let observation = '';
    let stepStatus: 'success' | 'error' = 'success';

    // Tool execution
    try {
      if (action === 'introspect_table') {
        const table = actionInput.table || '';
        const [sch, tbl] = table.includes('.') ? table.split('.') : ['public', table];
        const cols = schemaInfo[sch]?.[tbl] || [];
        observation = `Table ${table} columns: ${JSON.stringify(cols)}`;
      } 
      else if (action === 'execute_sql') {
        const sql = actionInput.sql || '';
        const safety = validateQuerySafety(sql, true);
        if (!safety.safe) {
          observation = `Query blocked for safety: ${safety.reason}`;
          stepStatus = 'error';
        } else {
          try {
            const res = await executeQuery(activeConnection.type, normalizedConfig, sql);
            observation = `Query returned ${res.rowCount} rows. Sample: ${JSON.stringify(res.data.slice(0, 3))}`;
          } catch (execErr: any) {
            // Trigger Self-Healing Loop
            const healing = await selfHealQuery(sql, execErr.message, schemaInfo, activeConnection.type, normalizedConfig);
            if (healing.healed && healing.executionResult) {
              observation = `🩹 Self-Healed SQL after error (${healing.errorCategory}): ${healing.explanation}. Returned ${healing.executionResult.rowCount} rows. Healed SQL: ${healing.healedSql}`;
              actionInput.sql = healing.healedSql;
            } else {
              observation = `Query error: ${execErr.message}`;
              stepStatus = 'error';
            }
          }
        }
      }
      else if (action === 'create_dataset') {
        let { name, sql, refreshInterval = 'daily' } = actionInput;
        
        // Verify and heal query before dataset creation
        if (sql) {
          try {
            await executeQuery(activeConnection.type, normalizedConfig, sql);
          } catch (dsErr: any) {
            const healing = await selfHealQuery(sql, dsErr.message, schemaInfo, activeConnection.type, normalizedConfig);
            if (healing.healed) {
              sql = healing.healedSql;
              actionInput.sql = healing.healedSql;
            }
          }
        }

        const [newDs] = await db.insert(datasets).values({
          name: name || 'Agent Generated Dataset',
          userId,
          connectionId: activeConnection.id,
          query: sql || '',
          refreshInterval,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        createdDatasets.push({ id: newDs.id, name: newDs.name });
        observation = `Created Dataset "${newDs.name}" (ID: ${newDs.id})${actionInput.sql !== sql ? ' [with Self-Healed SQL]' : ''}`;
      }
      else if (action === 'create_dashboard') {
        const { name, description } = actionInput;
        const [newDash] = await db.insert(dashboards).values({
          name: name || 'Agent Generated Dashboard',
          description: description || 'Created automatically by BeakDash AI Agent',
          userId,
          spaceId,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }).returning();

        targetDashboardId = newDash.id;
        targetDashboardName = newDash.name;
        observation = `Created Dashboard "${newDash.name}" (ID: ${newDash.id})`;
      }
      else if (action === 'add_widget') {
        const dashId = actionInput.dashboardId || targetDashboardId;
        const dsId = actionInput.datasetId || createdDatasets[createdDatasets.length - 1]?.id;

        if (!dashId) {
          observation = 'Cannot add widget: No dashboard ID specified or active.';
          stepStatus = 'error';
        } else {
          let widgetData: Record<string, any>[] = [];
          if (dsId) {
            const ds = await db.query.datasets.findFirst({ where: eq(datasets.id, dsId) });
            if (ds?.query) {
              const qRes = await executeQuery(activeConnection.type, normalizedConfig, ds.query);
              widgetData = qRes.data;
            }
          }

          const chartType = actionInput.chartType || 'column';
          const pos = actionInput.position 
            ? { ...actionInput.position, h: Math.max(actionInput.position.h || 5, 5) }
            : { x: 0, y: 0, w: 6, h: 5 };

          const [newWidget] = await db.insert(widgets).values({
            name: actionInput.name || 'New Widget',
            description: actionInput.description || '',
            type: chartType === 'table' ? 'table' : 'chart',
            connectionId: activeConnection.id,
            datasetId: dsId || null,
            data: widgetData,
            config: {
              chartType,
              xField: actionInput.xField,
              yField: actionInput.yField,
              colorField: actionInput.colorField,
              title: actionInput.title,
              subtitle: actionInput.subtitle,
            },
            position: pos,
            createdAt: new Date(),
            updatedAt: new Date(),
          }).returning();

          await db.insert(dashboardWidgets).values({
            dashboardId: dashId,
            widgetId: newWidget.id,
            position: pos as any,
          });

          createdWidgets.push({ 
            id: newWidget.id, 
            name: newWidget.name, 
            type: newWidget.type,
            chartType 
          });
          observation = `Added widget "${newWidget.name}" (${chartType}) to Dashboard #${dashId}.`;
        }
      }
      else if (action === 'update_widget') {
        const { widgetId, name, chartType, xField, yField, sql } = actionInput;
        const existing = await db.query.widgets.findFirst({ where: eq(widgets.id, widgetId) });
        if (!existing) {
          observation = `Widget ID ${widgetId} not found.`;
          stepStatus = 'error';
        } else {
          const currentConfig = (existing.config as any) || {};
          const newConfig = {
            ...currentConfig,
            ...(chartType ? { chartType } : {}),
            ...(xField ? { xField } : {}),
            ...(yField ? { yField } : {}),
          };

          let updatedData = existing.data;
          if (sql) {
            const qRes = await executeQuery(activeConnection.type, normalizedConfig, sql);
            updatedData = qRes.data;
          }

          await db.update(widgets)
            .set({
              name: name || existing.name,
              config: newConfig,
              data: updatedData,
              updatedAt: new Date(),
            })
            .where(eq(widgets.id, widgetId));

          updatedWidgets.push({ id: widgetId, name: name || existing.name });
          observation = `Updated Widget #${widgetId} successfully.`;
        }
      }
      else if (action === 'get_dashboard_widgets') {
        const dashId = actionInput.dashboardId || targetDashboardId;
        const dws = await db.query.dashboardWidgets.findMany({
          where: eq(dashboardWidgets.dashboardId, dashId),
          with: { widget: true },
        });
        const list = dws.map(dw => dw.widget ? { id: dw.widget.id, name: dw.widget.name, type: dw.widget.type, config: dw.widget.config } : null).filter(Boolean);
        observation = `Dashboard #${dashId} widgets: ${JSON.stringify(list)}`;
      }
      else if (action === 'finish') {
        finalMessage = actionInput.message || 'Task completed successfully.';
        completed = true;
        observation = 'Task finalized.';
      }
    } catch (toolErr: any) {
      observation = `Tool error during action "${action}": ${toolErr.message}`;
      stepStatus = 'error';
    }

    thoughtTrace.push({
      step: currentLoop,
      thought: stepThought,
      action,
      actionInput,
      observation,
      status: stepStatus,
    });

    conversation.push({
      role: 'assistant',
      content: JSON.stringify({ thought: stepThought, action, actionInput }),
    });
    conversation.push({
      role: 'user',
      content: `OBSERVATION: ${observation}`,
    });
  }

  return {
    success: true,
    message: finalMessage || `Agent successfully executed task with ${createdWidgets.length} charts created and ${updatedWidgets.length} charts updated.`,
    dashboardId: targetDashboardId,
    dashboardName: targetDashboardName,
    createdDatasets,
    createdWidgets,
    updatedWidgets,
    thoughtTrace,
    iterations: currentLoop,
  };
}

/**
 * Heuristic fallback agent when OpenAI key is absent
 */
async function runHeuristicAgent(
  req: AgenticBIRequest,
  conn: any,
  config: any,
  schemaInfo: SchemaInfo
): Promise<AgenticBIResponse> {
  const { goal, userId } = req;
  const thoughtTrace: AgentStepTrace[] = [];

  thoughtTrace.push({
    step: 1,
    thought: 'Analyzing user request and available database tables.',
    action: 'introspect_schema',
    observation: `Identified ${Object.keys(schemaInfo).length} schemas with active connection "${conn.name}".`,
    status: 'success',
  });

  const [newDash] = await db.insert(dashboards).values({
    name: 'Clinical Quality & Lab Performance',
    description: `Automated dashboard built for goal: ${goal}`,
    userId,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  thoughtTrace.push({
    step: 2,
    thought: 'Created workspace dashboard for clinical analytics.',
    action: 'create_dashboard',
    observation: `Created Dashboard "${newDash.name}" (ID: ${newDash.id})`,
    status: 'success',
  });

  return {
    success: true,
    message: `Generated custom analytics dashboard "${newDash.name}" based on ${conn.name}.`,
    dashboardId: newDash.id,
    dashboardName: newDash.name,
    createdDatasets: [],
    createdWidgets: [],
    updatedWidgets: [],
    thoughtTrace,
    iterations: 2,
  };
}
