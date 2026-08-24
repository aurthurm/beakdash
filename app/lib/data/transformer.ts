export type FilterOperator = 
  | 'equals' 
  | 'notEquals' 
  | 'greaterThan' 
  | 'greaterThanOrEqual' 
  | 'lessThan' 
  | 'lessThanOrEqual' 
  | 'contains' 
  | 'notContains' 
  | 'startsWith' 
  | 'endsWith' 
  | 'in' 
  | 'notIn' 
  | 'isNull' 
  | 'isNotNull' 
  | 'between';

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value?: any;
  valueTo?: any; // For between
}

export type AggregationFunction = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinctCount' | 'first' | 'last';

export interface AggregateDefinition {
  field: string;
  func: AggregationFunction;
  alias?: string;
}

export interface SortDefinition {
  field: string;
  direction: 'asc' | 'desc';
}

export interface CalculatedFieldDefinition {
  name: string;
  expression: (row: Record<string, any>) => any;
}

export interface TransformPipelineOptions {
  filters?: FilterCondition[];
  groupBy?: string[];
  aggregations?: AggregateDefinition[];
  sortBy?: SortDefinition[];
  calculatedFields?: CalculatedFieldDefinition[];
  limit?: number;
  offset?: number;
}

/**
 * Apply filters to an array of rows
 */
export function applyFilters(data: Record<string, any>[], filters: FilterCondition[]): Record<string, any>[] {
  if (!filters || filters.length === 0) return data;

  return data.filter((row) => {
    return filters.every((filter) => {
      const rowVal = row[filter.field];
      const target = filter.value;

      switch (filter.operator) {
        case 'equals':
          return rowVal === target || String(rowVal) === String(target);
        case 'notEquals':
          return rowVal !== target && String(rowVal) !== String(target);
        case 'greaterThan':
          return Number(rowVal) > Number(target);
        case 'greaterThanOrEqual':
          return Number(rowVal) >= Number(target);
        case 'lessThan':
          return Number(rowVal) < Number(target);
        case 'lessThanOrEqual':
          return Number(rowVal) <= Number(target);
        case 'contains':
          return String(rowVal || '').toLowerCase().includes(String(target || '').toLowerCase());
        case 'notContains':
          return !String(rowVal || '').toLowerCase().includes(String(target || '').toLowerCase());
        case 'startsWith':
          return String(rowVal || '').toLowerCase().startsWith(String(target || '').toLowerCase());
        case 'endsWith':
          return String(rowVal || '').toLowerCase().endsWith(String(target || '').toLowerCase());
        case 'in':
          return Array.isArray(target) ? target.includes(rowVal) : [target].includes(rowVal);
        case 'notIn':
          return Array.isArray(target) ? !target.includes(rowVal) : ![target].includes(rowVal);
        case 'isNull':
          return rowVal === null || rowVal === undefined;
        case 'isNotNull':
          return rowVal !== null && rowVal !== undefined;
        case 'between':
          return Number(rowVal) >= Number(target) && Number(rowVal) <= Number(filter.valueTo);
        default:
          return true;
      }
    });
  });
}

/**
 * Apply grouping and aggregations to data
 */
export function applyGrouping(
  data: Record<string, any>[],
  groupBy: string[],
  aggregations: AggregateDefinition[] = []
): Record<string, any>[] {
  if (!groupBy || groupBy.length === 0) {
    if (!aggregations || aggregations.length === 0) {
      return data;
    }
    // Single summary row aggregation across all data
    const summaryRow: Record<string, any> = {};
    for (const agg of aggregations) {
      const alias = agg.alias || `${agg.func}_${agg.field}`;
      summaryRow[alias] = computeAggregate(data, agg.field, agg.func);
    }
    return [summaryRow];
  }

  const groups = new Map<string, { groupKeys: Record<string, any>; rows: Record<string, any>[] }>();

  for (const row of data) {
    const keyParts = groupBy.map((field) => `${field}:${row[field]}`);
    const key = keyParts.join('|');

    if (!groups.has(key)) {
      const groupKeys: Record<string, any> = {};
      groupBy.forEach((field) => {
        groupKeys[field] = row[field];
      });
      groups.set(key, { groupKeys, rows: [] });
    }

    groups.get(key)!.rows.push(row);
  }

  const result: Record<string, any>[] = [];

  for (const group of groups.values()) {
    const outputRow: Record<string, any> = { ...group.groupKeys };

    for (const agg of aggregations) {
      const alias = agg.alias || `${agg.func}_${agg.field}`;
      outputRow[alias] = computeAggregate(group.rows, agg.field, agg.func);
    }

    result.push(outputRow);
  }

  return result;
}

/**
 * Compute aggregate value for a single field in a rowset
 */
function computeAggregate(rows: Record<string, any>[], field: string, func: AggregationFunction): any {
  if (rows.length === 0) return 0;

  if (func === 'count') {
    return field === '*' || field === '' 
      ? rows.length 
      : rows.filter((r) => r[field] !== null && r[field] !== undefined).length;
  }

  const values = rows
    .map((r) => r[field])
    .filter((v) => v !== null && v !== undefined);

  if (values.length === 0) return null;

  switch (func) {
    case 'sum': {
      return values.reduce((acc, v) => acc + (Number(v) || 0), 0);
    }
    case 'avg': {
      const numeric = values.map((v) => Number(v)).filter((v) => !isNaN(v));
      if (numeric.length === 0) return 0;
      return numeric.reduce((acc, v) => acc + v, 0) / numeric.length;
    }
    case 'min': {
      return values.reduce((min, v) => (v < min ? v : min), values[0]);
    }
    case 'max': {
      return values.reduce((max, v) => (v > max ? v : max), values[0]);
    }
    case 'distinctCount': {
      return new Set(values).size;
    }
    case 'first': {
      return values[0];
    }
    case 'last': {
      return values[values.length - 1];
    }
    default:
      return null;
  }
}

/**
 * Apply sorting to rows
 */
export function applySorting(data: Record<string, any>[], sortBy: SortDefinition[]): Record<string, any>[] {
  if (!sortBy || sortBy.length === 0) return data;

  return [...data].sort((a, b) => {
    for (const sort of sortBy) {
      const aVal = a[sort.field];
      const bVal = b[sort.field];

      if (aVal === bVal) continue;
      if (aVal === null || aVal === undefined) return sort.direction === 'asc' ? 1 : -1;
      if (bVal === null || bVal === undefined) return sort.direction === 'asc' ? -1 : 1;

      let comparison = 0;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (aVal instanceof Date && bVal instanceof Date) {
        comparison = aVal.getTime() - bVal.getTime();
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      if (comparison !== 0) {
        return sort.direction === 'asc' ? comparison : -comparison;
      }
    }
    return 0;
  });
}

/**
 * Execute the full data transformation pipeline
 */
export function transformData(
  data: Record<string, any>[],
  options: TransformPipelineOptions
): {
  data: Record<string, any>[];
  totalCount: number;
} {
  let result = [...data];

  // 1. Calculated fields (pre-filter)
  if (options.calculatedFields && options.calculatedFields.length > 0) {
    result = result.map((row) => {
      const calculated: Record<string, any> = { ...row };
      for (const field of options.calculatedFields!) {
        try {
          calculated[field.name] = field.expression(row);
        } catch {
          calculated[field.name] = null;
        }
      }
      return calculated;
    });
  }

  // 2. Filter
  if (options.filters && options.filters.length > 0) {
    result = applyFilters(result, options.filters);
  }

  // 3. Group by & Aggregations
  if ((options.groupBy && options.groupBy.length > 0) || (options.aggregations && options.aggregations.length > 0)) {
    result = applyGrouping(result, options.groupBy || [], options.aggregations || []);
  }

  // 4. Sorting
  if (options.sortBy && options.sortBy.length > 0) {
    result = applySorting(result, options.sortBy);
  }

  const totalCount = result.length;

  // 5. Pagination
  if (options.offset !== undefined || options.limit !== undefined) {
    const offset = options.offset || 0;
    const limit = options.limit !== undefined ? options.limit : result.length;
    result = result.slice(offset, offset + limit);
  }

  return {
    data: result,
    totalCount,
  };
}
