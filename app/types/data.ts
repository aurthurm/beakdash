import { IChart } from "../lib/drizzle/schemas";

export interface DataPoint {
    [key: string]: string | number;
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

export interface AntChartOptions {
  xField?: string;
  yField?: string;
  angleField?: string;
  seriesField?: string;
  shapeField?: string;
  colorField?: string;
  stack?: {
    groupBy: string[],
    series: boolean,
  } | boolean,
  group?: boolean,
}

// Notes on fields required for each chart type:

//           axis charts
// bar       : xField, yField, colorField, stack (if stacked), normalize for 100% bar
// column    : xField, yField, colorField, stack, normalize for 100% column, group
// line      : xField, yField, colorField
// area      : xField, yField, colorField, shapeField, stack, normalise
// dual-axes : xField, children [{ yField, colorField }]

// pie       : angleField, colorField, radius 

export interface AntAsthetics {
  colorField: string,
  label: {
    text: string,
    position: 'outside' | 'inside' | 'top' | 'bottom',
    style: {
      fontWeight: 'bold',
    },
  },
  style: {
    lineWidth: number,
  },
  normalize: boolean,
  sort: {
    reverse: boolean,
    by: string,
  },
  percent: boolean,
  radius: number,
  innerRadius: number,
}

export interface TransformConfig {
    options?: AntChartOptions;
    aggregation?: Aggregation;
    sorting?: Sorting;
    formatting?: Formatting;
    filters?: Filters[];
}

export interface TransformConf extends TransformConfig {
  type: IChart
}