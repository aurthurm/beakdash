import { IChart } from "../lib/drizzle/schemas";

export interface DataPoint {
    [key: string]: string | number;
}

export interface SeriesConfig {
    nameKey?: string;     // Column to use as series name
    valueKey?: string;    // Column to use as series value
    categoryKey?: string; // Column to use as category (x-axis)
    stackKey?: string;    // Column to use for stacking
    extraKeys?: string[]; // Additional data columns to include
    color?: string;       // Custom color for series
    visible?: boolean;    // Toggle series visibility
    type?: IChart;       // Allow mixed chart types (e.g., line + bar)
    axis?: 'primary' | 'secondary';  // Support dual axis
    showLabel?: boolean;  // Toggle data labels
    labelPosition?: 'inside' | 'outside' | 'top' | 'bottom';
    [key: string]: any;  // Add index signature
}

export type AggregationMethod = 'sum' | 'avg' | 'max' | 'min' | 'count' | 'median' | 'distinct';

export type SortingOrder = 'asc' | 'desc' | 'none';

export interface Aggregation {
  enabled: boolean;
  method?: AggregationMethod;
  groupBy?: string[];
  excludeNull?: boolean;  // Whether to exclude null values
  customAggregation?: (values: any[]) => number;  // Custom aggregation function
}

export interface Sorting {
  enabled: boolean;
  key: string;
  order: SortingOrder;
  preserveOrder?: boolean;  // Maintain original order for tied values
  customSort?: (a: any, b: any) => number;  // Custom sorting function
}

export type NumberFormatStyle = 
  | 'decimal'      // Plain number formatting: "1,234.56"
  | 'currency'     // Currency formatting: "$1,234.56"
  | 'percent'      // Percentage formatting: "12.34%"
  | 'unit'         // Unit formatting: "123 km/h"

export interface NumberFormatOptions {
  style?: NumberFormatStyle;
  currency?: string;         // Required when style is 'currency': 'USD', 'EUR', etc.
  currencyDisplay?: 'symbol' | 'narrowSymbol' | 'code' | 'name'; // "$" vs "US dollars"
  currencySign?: 'standard' | 'accounting';  // Accounting shows negative numbers in parentheses
  unit?: string;            // Required when style is 'unit': 'kilometer-per-hour'
  unitDisplay?: 'short' | 'long' | 'narrow';  // How to display the unit
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  prefix?: string;
  suffix?: string;
}

export interface Formatting {
  enabled: boolean;
  numberFormat?: NumberFormatOptions;
  dateFormat?: string;  // For date formatting
  conditionalFormatting?: {
      condition: (value: any) => boolean;
      style: object;
  }[];
}

export type FiltersOps = 
    'equals' | 
    'notEquals' |
    'contains' | 
    'notContains' |
    'startsWith' |
    'endsWith' |
    'gt' | 
    'gte' |
    'lt' | 
    'lte' |
    'between' |
    'in' |
    'notIn' |
    'isNull' |
    'isNotNull' |
    'regex';

export interface Filters {
    column: string;
    operator: FiltersOps;
    value: any;
    caseSensitive?: boolean;
    // Added fields for more control
    enabled?: boolean;
    treatAsNumber?: boolean;
    treatAsDate?: boolean;
    customFormatter?: (value: any) => any;
    nullValue?: any;
    // Range filter options
    inclusiveRange?: boolean;
    // Regex options
    regexFlags?: string;
}

export interface FilterGroup {
    filters: Filters[];
    operator: 'AND' | 'OR';
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
  type: IChart
}