import { generateStructuredJson, isAIConfigured, ChatMessage } from './client';

export interface AnomalyPoint {
  index: number;
  label: string;
  value: number;
  zScore: number;
  type: 'spike' | 'drop';
  description: string;
}

export interface ChartImprovementResult {
  suggestions: string[];
  anomalies: AnomalyPoint[];
  explanation: string;
  isAIGenerated: boolean;
}

/**
 * Calculate statistical Z-score anomalies on a numeric series
 */
export function detectAnomalies(
  data: Record<string, any>[],
  valueField: string,
  labelField?: string
): AnomalyPoint[] {
  if (!data || data.length < 4) return [];

  const values: number[] = [];
  const entries: { index: number; label: string; value: number }[] = [];

  data.forEach((row, index) => {
    const val = Number(row[valueField]);
    if (!isNaN(val)) {
      values.push(val);
      entries.push({
        index,
        label: labelField ? String(row[labelField] || index) : `Row ${index + 1}`,
        value: val,
      });
    }
  });

  if (values.length < 4) return [];

  // Compute Mean and Standard Deviation
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev === 0) return [];

  const anomalies: AnomalyPoint[] = [];

  entries.forEach((entry) => {
    const zScore = (entry.value - mean) / stdDev;
    if (Math.abs(zScore) >= 2.0) {
      anomalies.push({
        index: entry.index,
        label: entry.label,
        value: entry.value,
        zScore: Number(zScore.toFixed(2)),
        type: zScore > 0 ? 'spike' : 'drop',
        description: `${entry.label} has an unusual ${zScore > 0 ? 'spike' : 'drop'} of ${entry.value} (${Math.abs(Number(zScore.toFixed(1)))} standard deviations from mean ${mean.toFixed(1)}).`,
      });
    }
  });

  return anomalies;
}

/**
 * Generate heuristic chart improvement recommendations
 */
export function getChartImprovementsHeuristic(
  chartType: string,
  config: Record<string, any> = {}
): string[] {
  const type = chartType.toLowerCase();
  const suggestions: string[] = [];

  switch (type) {
    case 'bar':
    case 'column':
      suggestions.push('Sort bars by value descending to highlight top performers.');
      if (!config.colorField) suggestions.push('Add a color grouping dimension to enable segmented comparisons.');
      suggestions.push('Enable value labels on bars to remove visual ambiguity.');
      break;

    case 'line':
    case 'area':
      suggestions.push('Add point markers on lines with fewer than 30 points to aid exact readings.');
      suggestions.push('Ensure time increments are evenly spaced across the X-axis.');
      suggestions.push('Include smooth curves or a moving average trendline for noisy datasets.');
      break;

    case 'pie':
      suggestions.push('Limit pie slices to maximum 6 items and group remaining into "Other".');
      suggestions.push('Switch to a donut chart to utilize the central whitespace for aggregate totals.');
      break;

    case 'scatter':
      suggestions.push('Apply point opacity (alpha 0.7) to reveal high-density cluster overlaps.');
      suggestions.push('Add a linear regression trendline to clarify correlation strength.');
      break;

    default:
      suggestions.push('Ensure high-contrast color palettes for accessibility compliance.');
      suggestions.push('Add contextual subtitle descriptions summarizing the primary takeaway.');
      suggestions.push('Enable interactive tooltips with explicit currency/percentage formatting.');
      break;
  }

  return suggestions;
}

/**
 * Run full chart improvement and anomaly diagnosis
 */
export async function analyzeChartImprovements(
  chartType: string,
  config: Record<string, any> = {},
  data: Record<string, any>[] = []
): Promise<ChartImprovementResult> {
  const valField = config.yField || config.valueField;
  const labelField = config.xField || config.categoryField;

  const anomalies = valField ? detectAnomalies(data, valField, labelField) : [];

  if (!isAIConfigured()) {
    const suggestions = getChartImprovementsHeuristic(chartType, config);
    return {
      suggestions,
      anomalies,
      explanation: `Analyzed ${chartType} visualization with ${anomalies.length} statistical anomaly flags.`,
      isAIGenerated: false,
    };
  }

  const prompt = `Analyze this ${chartType} chart with configuration:
${JSON.stringify(config, null, 2)}
Detected statistical anomalies:
${JSON.stringify(anomalies, null, 2)}

Provide:
1. 3 actionable, specific chart improvement suggestions.
2. A clear explanation of what to optimize and why.

Respond in JSON format:
{
  "suggestions": ["Suggestion 1", "Suggestion 2", "Suggestion 3"],
  "explanation": "Summary of visual and statistical insights"
}`;

  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are an expert Data Visualization & Information Designer.' },
    { role: 'user', content: prompt },
  ];

  try {
    const result = await generateStructuredJson<{
      suggestions: string[];
      explanation: string;
    }>(messages);

    return {
      suggestions: result.suggestions || getChartImprovementsHeuristic(chartType, config),
      anomalies,
      explanation: result.explanation || 'AI analysis completed.',
      isAIGenerated: true,
    };
  } catch (err) {
    console.error('AI Chart improvement error, falling back to heuristic:', err);
    return {
      suggestions: getChartImprovementsHeuristic(chartType, config),
      anomalies,
      explanation: `Analyzed ${chartType} visualization with ${anomalies.length} anomaly detections.`,
      isAIGenerated: false,
    };
  }
}
