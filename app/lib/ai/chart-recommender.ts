import { generateStructuredJson, isAIConfigured, ChatMessage } from './client';

export interface ColumnDetail {
  name: string;
  type: string;
  cardinality?: number;
  sampleValues?: any[];
}

export interface ChartRecommendation {
  chartType: 'bar' | 'column' | 'line' | 'area' | 'pie' | 'scatter' | 'counter' | 'stat-card' | 'dual-axes' | 'histogram' | 'word-cloud';
  title: string;
  confidence: number;
  explanation: string;
  config: {
    xField?: string;
    yField?: string;
    categoryField?: string;
    valueField?: string;
    colorField?: string;
    seriesField?: string;
    binField?: string;
    aggregation?: string;
    [key: string]: any;
  };
}

export interface RecommenderResult {
  primary: ChartRecommendation;
  alternatives: ChartRecommendation[];
  summary: string;
  isAIGenerated: boolean;
}

/**
 * Perform statistical analysis on sample dataset rows
 */
export function analyzeColumns(data: Record<string, any>[], columns: { name: string; type: string }[]): ColumnDetail[] {
  return columns.map((col) => {
    const values = data.map((d) => d[col.name]).filter((v) => v !== null && v !== undefined);
    const distinctSet = new Set(values);
    return {
      name: col.name,
      type: col.type,
      cardinality: distinctSet.size,
      sampleValues: Array.from(distinctSet).slice(0, 5),
    };
  });
}

/**
 * Heuristic chart recommendation engine based on data shapes and cardinality
 */
export function recommendChartsHeuristic(
  analyzedCols: ColumnDetail[],
  datasetName: string = 'Dataset'
): RecommenderResult {
  const dateCols = analyzedCols.filter((c) => c.type === 'date' || c.name.toLowerCase().includes('date') || c.name.toLowerCase().includes('time'));
  const numCols = analyzedCols.filter((c) => c.type === 'number' || (!isNaN(Number(c.sampleValues?.[0])) && c.type !== 'date'));
  const catCols = analyzedCols.filter((c) => !dateCols.includes(c) && !numCols.includes(c));

  const recommendations: ChartRecommendation[] = [];

  // Case 1: Time series (Date + Numeric)
  if (dateCols.length > 0 && numCols.length > 0) {
    recommendations.push({
      chartType: 'line',
      title: `${numCols[0].name} Trend Over Time`,
      confidence: 0.95,
      explanation: `A line chart is optimal for visualizing how ${numCols[0].name} changes over ${dateCols[0].name}.`,
      config: {
        xField: dateCols[0].name,
        yField: numCols[0].name,
        colorField: catCols[0]?.name,
      },
    });

    recommendations.push({
      chartType: 'area',
      title: `${numCols[0].name} Volume Over Time`,
      confidence: 0.85,
      explanation: `An area chart emphasizes the magnitude of ${numCols[0].name} progression.`,
      config: {
        xField: dateCols[0].name,
        yField: numCols[0].name,
      },
    });
  }

  // Case 2: Categorical comparison (Category + Numeric)
  if (catCols.length > 0 && numCols.length > 0) {
    const lowCardinalityCat = catCols.find((c) => (c.cardinality || 0) <= 7 && (c.cardinality || 0) > 1);

    if (lowCardinalityCat) {
      recommendations.push({
        chartType: 'pie',
        title: `Distribution of ${numCols[0].name} by ${lowCardinalityCat.name}`,
        confidence: 0.88,
        explanation: `With only ${lowCardinalityCat.cardinality} categories, a donut/pie chart clearly shows part-to-whole share.`,
        config: {
          categoryField: lowCardinalityCat.name,
          valueField: numCols[0].name,
          xField: lowCardinalityCat.name,
          yField: numCols[0].name,
        },
      });
    }

    recommendations.push({
      chartType: 'column',
      title: `${numCols[0].name} by ${catCols[0].name}`,
      confidence: 0.92,
      explanation: `A column/bar chart provides crisp visual comparison of ${numCols[0].name} across ${catCols[0].name}.`,
      config: {
        xField: catCols[0].name,
        yField: numCols[0].name,
      },
    });
  }

  // Case 3: Correlation (2 Numeric Columns)
  if (numCols.length >= 2) {
    recommendations.push({
      chartType: 'scatter',
      title: `Correlation: ${numCols[0].name} vs ${numCols[1].name}`,
      confidence: 0.82,
      explanation: `A scatter plot reveals correlation, clustering, and outliers between two quantitative metrics.`,
      config: {
        xField: numCols[0].name,
        yField: numCols[1].name,
        colorField: catCols[0]?.name,
      },
    });
  }

  // Case 4: Single Numeric Metric (KPI Summary)
  if (numCols.length > 0) {
    recommendations.push({
      chartType: 'stat-card',
      title: `Total ${numCols[0].name}`,
      confidence: 0.78,
      explanation: `A KPI stat card provides a prominent executive summary number.`,
      config: {
        valueField: numCols[0].name,
        aggregation: 'sum',
      },
    });
  }

  // Fallback defaults if no patterns matched
  if (recommendations.length === 0) {
    recommendations.push({
      chartType: 'bar',
      title: `${datasetName} Summary`,
      confidence: 0.5,
      explanation: `Standard bar chart representation for the dataset.`,
      config: {
        xField: analyzedCols[0]?.name || 'id',
        yField: analyzedCols[1]?.name || analyzedCols[0]?.name || 'value',
      },
    });
  }

  // Sort by confidence descending
  recommendations.sort((a, b) => b.confidence - a.confidence);

  return {
    primary: recommendations[0],
    alternatives: recommendations.slice(1),
    summary: `Recommended ${recommendations[0].chartType} chart with ${Math.round(recommendations[0].confidence * 100)}% confidence based on detected dimensions.`,
    isAIGenerated: false,
  };
}

/**
 * Recommend charts with AI model or fall back to heuristic
 */
export async function recommendCharts(
  data: Record<string, any>[],
  columns: { name: string; type: string }[],
  datasetName: string = 'Dataset'
): Promise<RecommenderResult> {
  const analyzedCols = analyzeColumns(data, columns);

  if (!isAIConfigured()) {
    return recommendChartsHeuristic(analyzedCols, datasetName);
  }

  const prompt = `Given the following dataset schema and column profiles for "${datasetName}":
${JSON.stringify(analyzedCols, null, 2)}

Recommend:
1. The single best primary chart type and its field mappings.
2. 2-3 alternative chart options.
3. A clear analytical summary.

Respond in this exact JSON structure:
{
  "primary": {
    "chartType": "bar | column | line | area | pie | scatter | counter | stat-card | dual-axes | histogram | word-cloud",
    "title": "Chart Title",
    "confidence": 0.95,
    "explanation": "Why this chart fits",
    "config": { "xField": "...", "yField": "..." }
  },
  "alternatives": [
    {
      "chartType": "...",
      "title": "...",
      "confidence": 0.8,
      "explanation": "...",
      "config": { "xField": "...", "yField": "..." }
    }
  ],
  "summary": "High-level visualization strategy"
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are an expert data visualization designer.' },
    { role: 'user', content: prompt },
  ];

  try {
    const result = await generateStructuredJson<{
      primary: ChartRecommendation;
      alternatives: ChartRecommendation[];
      summary: string;
    }>(messages);

    return {
      primary: result.primary,
      alternatives: result.alternatives || [],
      summary: result.summary || 'AI-recommended visual representation.',
      isAIGenerated: true,
    };
  } catch (err) {
    console.error('AI Chart recommendation error, falling back to heuristic:', err);
    return recommendChartsHeuristic(analyzedCols, datasetName);
  }
}
