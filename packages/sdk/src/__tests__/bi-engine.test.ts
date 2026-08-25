import { describe, it, expect } from 'vitest';

// 1. Query Parameters Engine Logic
interface QueryParamDef {
  name: string;
  type: string;
  defaultValue?: any;
}

function extractParams(sql: string): QueryParamDef[] {
  const regex = /\{\{\s*([a-zA-Z0-9_]+)(?::([a-zA-Z0-9_]+))?(?::([^}]+))?\s*\}\}/g;
  const list: QueryParamDef[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(sql)) !== null) {
    list.push({
      name: m[1].trim(),
      type: (m[2] || 'text').trim(),
      defaultValue: m[3]?.trim(),
    });
  }
  return list;
}

function substituteParams(sql: string, params: Record<string, any>): string {
  let res = sql;
  for (const [k, v] of Object.entries(params)) {
    const val = typeof v === 'number' ? String(v) : `'${String(v).replace(/'/g, "''")}'`;
    res = res.replace(new RegExp(`\\{\\{\\s*${k}(?::[a-zA-Z0-9_]+)?(?::[^}]+)?\\s*\\}\\}`, 'g'), val);
  }
  return res;
}

// 2. Semantic Layer Formatter Logic
function formatMetric(val: number, type: 'currency' | 'percent' | 'compact', symbol = '$') {
  if (type === 'currency') return `${symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (type === 'percent') return `${val.toFixed(1)}%`;
  if (type === 'compact') {
    if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
    return String(val);
  }
  return String(val);
}

// 3. KPI Delta Analytics Logic
function computeDelta(history: number[]) {
  const curr = history[history.length - 1] || 0;
  const prev = history.length > 1 ? history[history.length - 2] : undefined;
  const delta = prev !== undefined ? curr - prev : 0;
  const pct = prev && prev !== 0 ? (delta / Math.abs(prev)) * 100 : 0;
  return {
    current: curr,
    delta,
    pct,
    direction: delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat',
  };
}

describe('Production BI Engine (Redash, Lightdash & Evidence best practices)', () => {
  describe('Query Parameters Engine (Redash-Style)', () => {
    it('should extract query parameters with types and defaults', () => {
      const sql = 'SELECT * FROM sales WHERE amount >= {{ min_amount:number:500 }} AND region = {{ region:text:US }}';
      const params = extractParams(sql);
      expect(params).toHaveLength(2);
      expect(params[0]).toEqual({ name: 'min_amount', type: 'number', defaultValue: '500' });
      expect(params[1]).toEqual({ name: 'region', type: 'text', defaultValue: 'US' });
    });

    it('should safely substitute parameters preventing SQL injection', () => {
      const sql = 'SELECT * FROM users WHERE name = {{ user_name:text }} AND age >= {{ min_age:number }}';
      const result = substituteParams(sql, { user_name: "O'Reilly", min_age: 21 });
      expect(result).toBe("SELECT * FROM users WHERE name = 'O''Reilly' AND age >= 21");
    });
  });

  describe('Semantic Layer & Value Formatter (Lightdash-Style)', () => {
    it('should format currency correctly', () => {
      expect(formatMetric(1250000.5, 'currency', '$')).toBe('$1,250,000.50');
    });

    it('should format compact notation correctly', () => {
      expect(formatMetric(2400000, 'compact')).toBe('2.4M');
      expect(formatMetric(85000, 'compact')).toBe('85.0K');
    });

    it('should format percentages', () => {
      expect(formatMetric(24.56, 'percent')).toBe('24.6%');
    });
  });

  describe('Delta & Trend Analytics (Evidence-Style)', () => {
    it('should compute period-over-period delta and trend direction', () => {
      const history = [100, 125];
      const result = computeDelta(history);
      expect(result.current).toBe(125);
      expect(result.delta).toBe(25);
      expect(result.pct).toBe(25);
      expect(result.direction).toBe('up');
    });

    it('should detect downward trends accurately', () => {
      const history = [200, 150];
      const result = computeDelta(history);
      expect(result.delta).toBe(-50);
      expect(result.pct).toBe(-25);
      expect(result.direction).toBe('down');
    });
  });
});
