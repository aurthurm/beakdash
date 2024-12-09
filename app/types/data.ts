export interface DataPoint {
    [key: string]: string | number;
}

export interface SeriesConfig {
    nameKey?: string;     // Column to use as series name
    valueKey?: string;    // Column to use as series value
    categoryKey?: string; // Column to use as category (x-axis)
    stackKey?: string;    // Column to use for stacking
    extraKeys?: string[]; // Additional data columns to include
}

export type AggregationMethod = 'sum' | 'avg' | 'max' | 'min' | 'count';

export type SortingOrder = 'asc' | 'desc';

export interface Aggregation {
  enabled: boolean;
  method?: AggregationMethod;
  groupBy?: string[];
}

export interface Sorting {
  enabled: boolean;
  key: string;
  order: SortingOrder;
}

export interface Formatting {
  enabled: boolean;
  key: string;
  order: SortingOrder;
}

export type FiltersOps = 'equals' | 'contains' | 'gt' | 'lt' | 'between';

export interface Filters {
  column: string;
  operator: FiltersOps;
  value: number;
}
  
export interface TransformConfig {
    series?: SeriesConfig[];
    rotateLabels?: number;
    aggregation?: Aggregation;
    sorting?: Sorting;
    formatting?: Formatting;
    filters?: Filters[];
}
  
export interface TransformConf extends TransformConfig {
  type: string
}