import { generateCompletion, generateStructuredJson, isAIConfigured, ChatMessage } from './client';
import { SchemaInfo } from '../db/schema-info';
import { validateQuerySafety } from '../db/query-engine';

export interface CopilotRequest {
  prompt: string;
  context?: { role: 'user' | 'assistant'; content: string }[];
  schemaInfo?: SchemaInfo | null;
  datasetContext?: {
    id?: number | string;
    name?: string;
    query?: string;
    columns?: { name: string; type: string }[];
    sampleData?: Record<string, any>[];
  } | null;
  widgetContext?: {
    id?: number | string;
    name?: string;
    type?: string;
    config?: Record<string, any>;
  } | null;
  dialect?: 'postgresql' | 'mysql' | 'sqlite' | string;
}

export interface CopilotResponse {
  message: string;
  generatedSql?: string;
  explanation?: string;
  suggestedChartType?: string;
  suggestedConfig?: Record<string, any>;
  insights?: string[];
  isAIGenerated: boolean;
}

/**
 * Format SchemaInfo into a clean, LLM-friendly schema representation
 */
function formatSchemaForPrompt(schemaInfo?: SchemaInfo | null): string {
  if (!schemaInfo || Object.keys(schemaInfo).length === 0) {
    return 'No schema information provided.';
  }

  const lines: string[] = [];
  for (const [schemaName, tables] of Object.entries(schemaInfo)) {
    for (const [tableName, columns] of Object.entries(tables)) {
      const colDefs = columns.map(c => {
        let def = `${c.column} (${c.type})`;
        if (c.isPrimaryKey) def += ' [PRIMARY KEY]';
        if (c.nullable === false) def += ' [NOT NULL]';
        return def;
      });
      lines.push(`Table "${schemaName}.${tableName}": [${colDefs.join(', ')}]`);
    }
  }

  return lines.join('\n');
}

/**
 * Heuristic fallback when no OpenAI API key is present
 */
function generateHeuristicResponse(req: CopilotRequest): CopilotResponse {
  const { prompt, widgetContext, datasetContext } = req;
  const lowerPrompt = prompt.toLowerCase();

  // Chart explanation
  if (widgetContext && (lowerPrompt.includes('explain') || lowerPrompt.includes('what is this'))) {
    const { name = 'Chart', type = 'bar', config = {} } = widgetContext;
    const xField = config.xField || config.categoryField || 'category';
    const yField = config.yField || config.valueField || 'metric';

    return {
      message: `The widget **"${name}"** is a **${type}** chart visualising **${yField}** grouped by **${xField}**.`,
      explanation: `This chart allows you to compare and track ${yField} across different ${xField} buckets to identify trends and performance drivers.`,
      insights: [
        `Ensure ${xField} values are sorted logically for easier comparison.`,
        `Filter out null or empty ${yField} records to maintain clear visual proportions.`,
      ],
      isAIGenerated: false,
    };
  }

  // Text to SQL heuristic generator
  if (lowerPrompt.includes('select') || lowerPrompt.includes('count') || lowerPrompt.includes('total') || lowerPrompt.includes('show')) {
    let tableName = 'sales';
    if (datasetContext?.name) {
      tableName = datasetContext.name.toLowerCase().replace(/\s+/g, '_');
    }

    const sampleCol = datasetContext?.columns?.[0]?.name || 'id';
    const sampleValCol = datasetContext?.columns?.find(c => c.type === 'number')?.name || 'value';

    const generatedSql = `SELECT ${sampleCol}, SUM(${sampleValCol}) AS total\nFROM ${tableName}\nGROUP BY ${sampleCol}\nORDER BY total DESC\nLIMIT 50;`;

    return {
      message: `Here is a suggested SQL query based on your request:`,
      generatedSql,
      explanation: `Aggregates ${sampleValCol} by ${sampleCol} sorted in descending order.`,
      suggestedChartType: 'bar',
      suggestedConfig: { xField: sampleCol, yField: 'total' },
      isAIGenerated: false,
    };
  }

  return {
    message: `I can help you build queries, design visualizations, and discover insights. To enable full AI Copilot reasoning with GPT-4o, set the OPENAI_API_KEY environment variable.`,
    isAIGenerated: false,
    insights: [
      'Ask me to generate SQL queries from natural language questions.',
      'Ask me to recommend the best chart type for your dataset.',
      'Ask me to analyze trends and anomalies in your metrics.',
    ],
  };
}

/**
 * Run Copilot reasoning with real LLM and schema context
 */
export async function runCopilot(req: CopilotRequest): Promise<CopilotResponse> {
  if (!isAIConfigured()) {
    return generateHeuristicResponse(req);
  }

  const { prompt, context = [], schemaInfo, datasetContext, widgetContext, dialect = 'postgresql' } = req;

  const formattedSchema = formatSchemaForPrompt(schemaInfo);
  const datasetInfoStr = datasetContext
    ? `Dataset: "${datasetContext.name || 'Current Dataset'}"\nColumns: ${JSON.stringify(datasetContext.columns || [])}\nSample rows: ${JSON.stringify(datasetContext.sampleData?.slice(0, 3) || [])}`
    : 'No specific dataset loaded.';

  const widgetInfoStr = widgetContext
    ? `Widget: "${widgetContext.name || 'Current Widget'}", Type: ${widgetContext.type || 'unknown'}, Config: ${JSON.stringify(widgetContext.config || {})}`
    : 'No specific widget context.';

  const systemPrompt = `You are BeakDash Copilot, an expert AI data analyst and SQL engineer.
Your role:
1. Translate natural language into efficient, accurate, read-only SQL queries tailored to dialect: ${dialect.toUpperCase()}.
2. Recommend the best chart type (bar, column, line, area, pie, scatter, counter, stat-card, dual-axes, histogram, word-cloud).
3. Provide chart configuration mappings (xField, yField, colorField, seriesField).
4. Explain charts and generate actionable business insights.

AVAILABLE DATABASE SCHEMA:
${formattedSchema}

CONTEXT:
${datasetInfoStr}
${widgetInfoStr}

CRITICAL RULES:
- Always generate safe, READ-ONLY queries (SELECT statements only). Never generate DROP, DELETE, UPDATE, INSERT, ALTER, or TRUNCATE.
- Use explicit column names from the schema.
- Respond with a JSON object matching this schema:
{
  "message": "Direct user response in markdown",
  "generatedSql": "SQL query string (if applicable)",
  "explanation": "Brief explanation of query or chart",
  "suggestedChartType": "bar | line | pie | area | scatter | counter | stat-card | dual-axes",
  "suggestedConfig": { "xField": "...", "yField": "..." },
  "insights": ["Insight 1", "Insight 2"]
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...context.map(c => ({ role: c.role, content: c.content })),
    { role: 'user', content: prompt }
  ];

  try {
    const aiResult = await generateStructuredJson<{
      message: string;
      generatedSql?: string;
      explanation?: string;
      suggestedChartType?: string;
      suggestedConfig?: Record<string, any>;
      insights?: string[];
    }>(messages);

    // Validate generated SQL safety if present
    if (aiResult.generatedSql) {
      const safety = validateQuerySafety(aiResult.generatedSql, true);
      if (!safety.safe) {
        aiResult.generatedSql = undefined;
        aiResult.message += `\n\n*(Note: Generated query was blocked due to read-only safety restrictions)*`;
      }
    }

    return {
      message: aiResult.message || 'Here are the results for your request.',
      generatedSql: aiResult.generatedSql,
      explanation: aiResult.explanation,
      suggestedChartType: aiResult.suggestedChartType,
      suggestedConfig: aiResult.suggestedConfig,
      insights: aiResult.insights,
      isAIGenerated: true,
    };
  } catch (err) {
    console.error('AI Copilot generation error, falling back to heuristic:', err);
    return generateHeuristicResponse(req);
  }
}
