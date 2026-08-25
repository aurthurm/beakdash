export type AlertOperator =
  | 'equals'
  | 'notEquals'
  | 'greaterThan'
  | 'greaterThanOrEqual'
  | 'lessThan'
  | 'lessThanOrEqual'
  | 'between'
  | 'notBetween'
  | 'isNull'
  | 'isNotNull'
  | 'rowCountEquals'
  | 'rowCountGreaterThan'
  | 'rowCountLessThan'
  | 'contains';

export interface AlertCondition {
  operator: AlertOperator | string;
  field?: string;
  threshold?: any;
  thresholdMax?: any; // For between conditions
  expectedValue?: any;
  aggregation?: 'none' | 'count' | 'sum' | 'avg' | 'min' | 'max';
}

export interface EvaluationResult {
  triggered: boolean;
  actualValue: any;
  threshold: any;
  operator: string;
  message: string;
  severity: string;
}

/**
 * Extract a target evaluation value from query result rows
 */
export function extractTargetValue(
  rows: Record<string, any>[],
  condition: AlertCondition
): any {
  if (!rows || !Array.isArray(rows)) {
    return condition.operator.startsWith('rowCount') ? 0 : null;
  }

  // Row count operators
  if (condition.operator.startsWith('rowCount')) {
    return rows.length;
  }

  if (rows.length === 0) {
    return null;
  }

  const field = condition.field;

  // If no field specified, use the first key of the first row or row count
  if (!field) {
    const firstRow = rows[0];
    const keys = Object.keys(firstRow);
    return keys.length > 0 ? firstRow[keys[0]] : rows.length;
  }

  // Aggregation over the field across rows
  if (condition.aggregation && condition.aggregation !== 'none') {
    const values = rows
      .map((r) => Number(r[field]))
      .filter((v) => !isNaN(v));

    switch (condition.aggregation) {
      case 'count':
        return rows.filter((r) => r[field] !== null && r[field] !== undefined).length;
      case 'sum':
        return values.reduce((sum, v) => sum + v, 0);
      case 'avg':
        return values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0;
      case 'min':
        return values.length > 0 ? Math.min(...values) : null;
      case 'max':
        return values.length > 0 ? Math.max(...values) : null;
      default:
        break;
    }
  }

  // Default to first row's field value
  return rows[0][field];
}

/**
 * Evaluate an alert rule against query execution results
 */
export function evaluateAlertCondition(
  rows: Record<string, any>[],
  condition: AlertCondition,
  severity: string = 'medium'
): EvaluationResult {
  const actualValue = extractTargetValue(rows, condition);
  const operator = (condition.operator || 'greaterThan').toLowerCase();
  const threshold = condition.threshold !== undefined ? condition.threshold : condition.expectedValue;

  let triggered = false;
  let reason = '';

  const numActual = Number(actualValue);
  const numThreshold = Number(threshold);

  switch (operator) {
    case 'equals':
    case 'eq':
    case '==':
      triggered = actualValue === threshold || String(actualValue) === String(threshold);
      reason = triggered 
        ? `Value ${actualValue} matches target ${threshold}` 
        : `Value ${actualValue} did not equal expected ${threshold}`;
      break;

    case 'notequals':
    case 'neq':
    case '!=':
      triggered = actualValue !== threshold && String(actualValue) !== String(threshold);
      reason = triggered 
        ? `Value ${actualValue} is not equal to ${threshold}` 
        : `Value ${actualValue} equaled ${threshold}`;
      break;

    case 'greaterthan':
    case 'gt':
    case '>':
      triggered = !isNaN(numActual) && !isNaN(numThreshold) && numActual > numThreshold;
      reason = triggered
        ? `Value ${numActual} exceeds threshold of ${numThreshold}`
        : `Value ${numActual} does not exceed threshold of ${numThreshold}`;
      break;

    case 'greaterthanorequal':
    case 'gte':
    case '>=':
      triggered = !isNaN(numActual) && !isNaN(numThreshold) && numActual >= numThreshold;
      reason = triggered
        ? `Value ${numActual} meets or exceeds threshold of ${numThreshold}`
        : `Value ${numActual} is strictly below threshold of ${numThreshold}`;
      break;

    case 'lessthan':
    case 'lt':
    case '<':
      triggered = !isNaN(numActual) && !isNaN(numThreshold) && numActual < numThreshold;
      reason = triggered
        ? `Value ${numActual} is below threshold of ${numThreshold}`
        : `Value ${numActual} is not below threshold of ${numThreshold}`;
      break;

    case 'lessthanorequal':
    case 'lte':
    case '<=':
      triggered = !isNaN(numActual) && !isNaN(numThreshold) && numActual <= numThreshold;
      reason = triggered
        ? `Value ${numActual} is at or below threshold of ${numThreshold}`
        : `Value ${numActual} is strictly above threshold of ${numThreshold}`;
      break;

    case 'between': {
      const maxVal = Number(condition.thresholdMax);
      triggered = !isNaN(numActual) && !isNaN(numThreshold) && !isNaN(maxVal) && numActual >= numThreshold && numActual <= maxVal;
      reason = triggered
        ? `Value ${numActual} falls between [${numThreshold}, ${maxVal}]`
        : `Value ${numActual} is outside range [${numThreshold}, ${maxVal}]`;
      break;
    }

    case 'notbetween': {
      const maxVal = Number(condition.thresholdMax);
      triggered = !isNaN(numActual) && !isNaN(numThreshold) && !isNaN(maxVal) && (numActual < numThreshold || numActual > maxVal);
      reason = triggered
        ? `Value ${numActual} is outside bounds [${numThreshold}, ${maxVal}]`
        : `Value ${numActual} falls within bounds [${numThreshold}, ${maxVal}]`;
      break;
    }

    case 'isnull':
      triggered = actualValue === null || actualValue === undefined || actualValue === '';
      reason = triggered ? `Field value is null/empty` : `Field value is not null (${actualValue})`;
      break;

    case 'isnotnull':
      triggered = actualValue !== null && actualValue !== undefined && actualValue !== '';
      reason = triggered ? `Field value is present (${actualValue})` : `Field value is null/empty`;
      break;

    case 'rowcountequals':
      triggered = rows.length === numThreshold;
      reason = triggered
        ? `Returned row count (${rows.length}) equals ${numThreshold}`
        : `Returned row count (${rows.length}) does not equal ${numThreshold}`;
      break;

    case 'rowcountgreaterthan':
      triggered = rows.length > numThreshold;
      reason = triggered
        ? `Returned row count (${rows.length}) is greater than threshold (${numThreshold})`
        : `Returned row count (${rows.length}) is within limits (<= ${numThreshold})`;
      break;

    case 'rowcountlessthan':
      triggered = rows.length < numThreshold;
      reason = triggered
        ? `Returned row count (${rows.length}) is less than expected minimum (${numThreshold})`
        : `Returned row count (${rows.length}) meets expected minimum (>= ${numThreshold})`;
      break;

    case 'contains':
      triggered = String(actualValue || '').toLowerCase().includes(String(threshold || '').toLowerCase());
      reason = triggered
        ? `Value "${actualValue}" contains pattern "${threshold}"`
        : `Value "${actualValue}" does not contain pattern "${threshold}"`;
      break;

    default:
      triggered = Boolean(actualValue);
      reason = `Evaluated with default truthiness: ${triggered}`;
  }

  return {
    triggered,
    actualValue,
    threshold,
    operator,
    message: reason,
    severity,
  };
}
