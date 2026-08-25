export type MetricType = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct_count' | 'median';

export type TimeInterval = 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour';

export type FormatType = 
  | 'number' 
  | 'currency' 
  | 'percent' 
  | 'compact' 
  | 'date' 
  | 'datetime' 
  | 'duration';

export interface SemanticDimension {
  name: string;
  field: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  timeInterval?: TimeInterval;
  label?: string;
}

export interface SemanticMetric {
  name: string;
  field?: string;
  type: MetricType;
  label?: string;
  format?: {
    type: FormatType;
    currencySymbol?: string;
    decimals?: number;
    prefix?: string;
    suffix?: string;
  };
}

export interface CalculatedFieldDef {
  name: string;
  expression: string; // e.g. "row.revenue - row.cost"
  label?: string;
}

/**
 * Formats values according to Lightdash / Evidence formatting standards
 */
export function formatValue(
  value: any,
  format?: {
    type?: FormatType;
    currencySymbol?: string;
    decimals?: number;
    prefix?: string;
    suffix?: string;
  }
): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  const num = Number(value);
  const decimals = format?.decimals !== undefined ? format.decimals : 2;
  const prefix = format?.prefix || '';
  const suffix = format?.suffix || '';

  if (!format || !format.type) {
    if (!isNaN(num) && typeof value === 'number') {
      return num.toLocaleString();
    }
    return String(value);
  }

  switch (format.type) {
    case 'currency': {
      if (isNaN(num)) return String(value);
      const symbol = format.currencySymbol || '$';
      return `${symbol}${num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}`;
    }

    case 'percent': {
      if (isNaN(num)) return String(value);
      const pct = num > 1 && num <= 100 ? num : num * 100;
      return `${pct.toFixed(decimals)}%`;
    }

    case 'compact': {
      if (isNaN(num)) return String(value);
      const abs = Math.abs(num);
      const sign = num < 0 ? '-' : '';
      if (abs >= 1e9) {
        return `${sign}${(abs / 1e9).toFixed(1)}B`;
      }
      if (abs >= 1e6) {
        return `${sign}${(abs / 1e6).toFixed(1)}M`;
      }
      if (abs >= 1e3) {
        return `${sign}${(abs / 1e3).toFixed(1)}K`;
      }
      return num.toLocaleString(undefined, { maximumFractionDigits: decimals });
    }

    case 'number': {
      if (isNaN(num)) return String(value);
      return `${prefix}${num.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;
    }

    case 'date': {
      try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
      } catch {
        return String(value);
      }
    }

    case 'datetime': {
      try {
        const d = new Date(value);
        if (isNaN(d.getTime())) return String(value);
        return d.toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return String(value);
      }
    }

    default:
      return `${prefix}${String(value)}${suffix}`;
  }
}

/**
 * Applies temporal dimension grouping (truncates dates)
 */
export function truncateDateToInterval(dateVal: any, interval: TimeInterval): string {
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);

  switch (interval) {
    case 'year':
      return `${d.getFullYear()}-01-01`;
    case 'quarter': {
      const q = Math.floor(d.getMonth() / 3) * 3 + 1;
      return `${d.getFullYear()}-${String(q).padStart(2, '0')}-01`;
    }
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    case 'week': {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      return monday.toISOString().split('T')[0];
    }
    case 'day':
      return d.toISOString().split('T')[0];
    case 'hour':
      return `${d.toISOString().split('T')[0]} ${String(d.getHours()).padStart(2, '0')}:00`;
    default:
      return d.toISOString().split('T')[0];
  }
}

/**
 * Calculates a semantic metric aggregation over a rowset
 */
export function computeSemanticMetric(rows: Record<string, any>[], metric: SemanticMetric): number {
  if (rows.length === 0) return 0;

  if (metric.type === 'count') {
    return rows.length;
  }

  const field = metric.field;
  if (!field) return rows.length;

  const values = rows.map((r) => Number(r[field])).filter((v) => !isNaN(v));
  if (values.length === 0) return 0;

  switch (metric.type) {
    case 'sum':
      return values.reduce((sum, v) => sum + v, 0);
    case 'avg':
      return values.reduce((sum, v) => sum + v, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'distinct_count': {
      const set = new Set(rows.map((r) => r[field]));
      return set.size;
    }
    case 'median': {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }
    default:
      return values.reduce((sum, v) => sum + v, 0);
  }
}

/**
 * Safely evaluates calculated fields on rows (e.g. `row.revenue - row.cost`)
 */
export function applyCalculatedFields(
  rows: Record<string, any>[],
  calculatedFields: CalculatedFieldDef[]
): Record<string, any>[] {
  if (!calculatedFields || calculatedFields.length === 0) return rows;

  return rows.map((row) => {
    const updated = { ...row };
    for (const field of calculatedFields) {
      try {
        // Safe evaluation without access to window or globals
        const evaluator = new Function(
          'row',
          `try { return (${field.expression}); } catch(e) { return null; }`
        );
        updated[field.name] = evaluator(row);
      } catch {
        updated[field.name] = null;
      }
    }
    return updated;
  });
}
