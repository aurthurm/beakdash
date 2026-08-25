import { describe, it, expect } from 'vitest';

// Test evaluator logic matching the core DB-QA engine
interface AlertCondition {
  operator: string;
  field?: string;
  threshold?: any;
  thresholdMax?: any;
}

function evaluateAlertCondition(
  rows: Record<string, any>[],
  condition: AlertCondition
): { triggered: boolean; actualValue: any } {
  const operator = (condition.operator || 'greaterThan').toLowerCase();
  const threshold = condition.threshold;

  let actualValue: any = null;
  if (operator.startsWith('rowcount')) {
    actualValue = rows.length;
  } else if (rows.length > 0) {
    actualValue = condition.field ? rows[0][condition.field] : rows[0][Object.keys(rows[0])[0]];
  }

  const numActual = Number(actualValue);
  const numThreshold = Number(threshold);

  switch (operator) {
    case 'equals':
    case 'eq':
      return { triggered: actualValue === threshold || String(actualValue) === String(threshold), actualValue };
    case 'notequals':
    case 'neq':
      return { triggered: actualValue !== threshold, actualValue };
    case 'greaterthan':
    case 'gt':
      return { triggered: numActual > numThreshold, actualValue };
    case 'greaterthanorequal':
    case 'gte':
      return { triggered: numActual >= numThreshold, actualValue };
    case 'lessthan':
    case 'lt':
      return { triggered: numActual < numThreshold, actualValue };
    case 'lessthanorequal':
    case 'lte':
      return { triggered: numActual <= numThreshold, actualValue };
    case 'between':
      return { triggered: numActual >= numThreshold && numActual <= Number(condition.thresholdMax), actualValue };
    case 'rowcountequals':
      return { triggered: rows.length === numThreshold, actualValue: rows.length };
    case 'rowcountgreaterthan':
      return { triggered: rows.length > numThreshold, actualValue: rows.length };
    case 'isnull':
      return { triggered: actualValue === null || actualValue === undefined, actualValue };
    default:
      return { triggered: Boolean(actualValue), actualValue };
  }
}

describe('DB-QA Condition Evaluator', () => {
  const sampleRows = [
    { id: 1, error_count: 15, latency_ms: 250, status: 'FAILED' },
    { id: 2, error_count: 5, latency_ms: 120, status: 'OK' },
  ];

  it('should trigger greaterThan threshold accurately', () => {
    const result = evaluateAlertCondition(sampleRows, {
      operator: 'greaterThan',
      field: 'error_count',
      threshold: 10,
    });
    expect(result.triggered).toBe(true);
    expect(result.actualValue).toBe(15);
  });

  it('should not trigger greaterThan when below threshold', () => {
    const result = evaluateAlertCondition(sampleRows, {
      operator: 'greaterThan',
      field: 'error_count',
      threshold: 20,
    });
    expect(result.triggered).toBe(false);
  });

  it('should evaluate rowCountEquals for zero-record detection', () => {
    const emptyRows: Record<string, any>[] = [];
    const result = evaluateAlertCondition(emptyRows, {
      operator: 'rowCountEquals',
      threshold: 0,
    });
    expect(result.triggered).toBe(true);
    expect(result.actualValue).toBe(0);
  });

  it('should evaluate between range condition', () => {
    const result = evaluateAlertCondition(sampleRows, {
      operator: 'between',
      field: 'latency_ms',
      threshold: 200,
      thresholdMax: 300,
    });
    expect(result.triggered).toBe(true);
    expect(result.actualValue).toBe(250);
  });

  it('should evaluate string equality', () => {
    const result = evaluateAlertCondition(sampleRows, {
      operator: 'equals',
      field: 'status',
      threshold: 'FAILED',
    });
    expect(result.triggered).toBe(true);
    expect(result.actualValue).toBe('FAILED');
  });
});
