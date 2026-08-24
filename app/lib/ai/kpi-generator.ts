import { generateStructuredJson, isAIConfigured, ChatMessage } from './client';

export interface KPISuggestion {
  title: string;
  description: string;
  widgetType: 'counter' | 'stat-card';
  config: {
    valueField: string;
    aggregation: 'sum' | 'avg' | 'nunique' | 'count' | 'min' | 'max';
    format?: 'currency' | 'number' | 'percentage';
    prefix?: string;
    suffix?: string;
    decimals?: number;
    comparison?: {
      enabled: boolean;
      type: 'percentage' | 'absolute';
      label: string;
    };
  };
}

export interface KPIGeneratorResult {
  kpis: KPISuggestion[];
  summary: string;
  isAIGenerated: boolean;
}

/**
 * Generate heuristic KPIs from column definitions
 */
export function generateKPIsHeuristic(
  columns: { name: string; type: string }[],
  datasetName: string = 'Dataset'
): KPIGeneratorResult {
  const kpis: KPISuggestion[] = [];

  const numCols = columns.filter((c) => c.type === 'number');
  const catCols = columns.filter((c) => c.type === 'string' || c.type === 'category');

  // Revenue / Amount / Sales column
  const revenueCol = numCols.find((c) => 
    /revenue|sales|price|amount|cost|income|spend|total/i.test(c.name)
  );

  if (revenueCol) {
    kpis.push({
      title: `Total ${revenueCol.name.replace(/_/g, ' ').toUpperCase()}`,
      description: `Cumulative sum of ${revenueCol.name} across all records.`,
      widgetType: 'counter',
      config: {
        valueField: revenueCol.name,
        aggregation: 'sum',
        format: 'currency',
        prefix: '$',
        decimals: 2,
      },
    });

    kpis.push({
      title: `Average ${revenueCol.name.replace(/_/g, ' ').toUpperCase()}`,
      description: `Average value of ${revenueCol.name} per transaction.`,
      widgetType: 'stat-card',
      config: {
        valueField: revenueCol.name,
        aggregation: 'avg',
        format: 'currency',
        prefix: '$',
        decimals: 2,
      },
    });
  }

  // Count / Volume KPI
  kpis.push({
    title: 'Total Records',
    description: `Total number of entries recorded in ${datasetName}.`,
    widgetType: 'counter',
    config: {
      valueField: columns[0]?.name || 'id',
      aggregation: 'count',
      format: 'number',
      decimals: 0,
    },
  });

  // Unique Categories / Users
  const userOrCatCol = catCols.find((c) => 
    /user|customer|category|product|account|client/i.test(c.name)
  );

  if (userOrCatCol) {
    kpis.push({
      title: `Unique ${userOrCatCol.name.replace(/_/g, ' ').toUpperCase()}s`,
      description: `Count of distinct ${userOrCatCol.name} entities.`,
      widgetType: 'stat-card',
      config: {
        valueField: userOrCatCol.name,
        aggregation: 'nunique',
        format: 'number',
        decimals: 0,
      },
    });
  }

  return {
    kpis,
    summary: `Suggested ${kpis.length} core business metrics for ${datasetName}.`,
    isAIGenerated: false,
  };
}

/**
 * Generate KPIs using AI model or heuristic fallback
 */
export async function generateKPIs(
  columns: { name: string; type: string }[],
  datasetName: string = 'Dataset',
  sampleData?: Record<string, any>[]
): Promise<KPIGeneratorResult> {
  if (!isAIConfigured()) {
    return generateKPIsHeuristic(columns, datasetName);
  }

  const prompt = `Analyze the dataset "${datasetName}" with the following schema and sample data:
Columns: ${JSON.stringify(columns)}
Sample data (up to 3 rows): ${JSON.stringify(sampleData?.slice(0, 3) || [])}

Generate 3-5 high-impact business KPIs. For each KPI:
1. Provide a concise business title.
2. Description of what it measures.
3. Widget type ('counter' or 'stat-card').
4. Configuration with valueField, aggregation ('sum' | 'avg' | 'nunique' | 'count' | 'min' | 'max'), format ('currency' | 'number' | 'percentage'), and optional prefix/suffix.

Respond in this JSON format:
{
  "kpis": [
    {
      "title": "Total Revenue",
      "description": "Gross sales across all channels",
      "widgetType": "counter",
      "config": {
        "valueField": "amount",
        "aggregation": "sum",
        "format": "currency",
        "prefix": "$",
        "decimals": 2
      }
    }
  ],
  "summary": "Executive KPI overview"
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are a Chief Data Officer and BI analytics architect.' },
    { role: 'user', content: prompt },
  ];

  try {
    const result = await generateStructuredJson<{
      kpis: KPISuggestion[];
      summary: string;
    }>(messages);

    return {
      kpis: result.kpis || [],
      summary: result.summary || 'AI-generated executive metrics.',
      isAIGenerated: true,
    };
  } catch (err) {
    console.error('AI KPI generation error, falling back to heuristic:', err);
    return generateKPIsHeuristic(columns, datasetName);
  }
}
