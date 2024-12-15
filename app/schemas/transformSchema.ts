// schemas/transformSchema.ts
import { z } from 'zod';

// Basic types
const dataPointSchema = z.record(z.union([z.string(), z.number()])).describe(
  'A key-value record representing a single data point where values can be strings or numbers'
);

const aggregationMethodSchema = z.enum(['sum', 'avg', 'max', 'min', 'count']).describe(
  'Method used to aggregate data: sum (total), avg (average), max (maximum), min (minimum), or count (number of occurrences)'
);

const sortingOrderSchema = z.enum(['asc', 'desc']).describe(
  'Sorting order: asc (ascending) or desc (descending)'
);

const filterOperationsSchema = z.enum(['equals', 'contains', 'gt', 'lt', 'between']).describe(
  'Filter operations: equals (exact match), contains (partial match), gt (greater than), lt (less than), between (range)'
);

// Series Configuration
const seriesConfigSchema = z.object({
  nameKey: z.string().nullish().describe(
    'Column to use as the series name in the visualization'
  ),
  valueKey: z.string().nullish().describe(
    'Column to use as the series value (y-axis) in the visualization'
  ),
  categoryKey: z.string().nullish().describe(
    'Column to use as the category (x-axis) in the visualization'
  ),
  stackKey: z.string().nullish().describe(
    'Column to use for stacking multiple series in stacked charts'
  ),
  extraKeys: z.array(z.string()).nullish().describe(
    'Additional data columns to include in the visualization for tooltips or other features'
  ),
}).describe('Configuration for how data series should be mapped to visual elements');

// Aggregation Configuration
const aggregationSchema = z.object({
  enabled: z.boolean().describe(
    'Whether data aggregation is enabled for this visualization'
  ),
  method: aggregationMethodSchema.nullish().describe(
    'The method to use when aggregating data points'
  ),
  groupBy: z.array(z.string()).nullish().describe(
    'Columns to group by when performing aggregation'
  ),
}).describe('Configuration for how data should be aggregated');

// Sorting Configuration
const sortingSchema = z.object({
  enabled: z.boolean().describe(
    'Whether sorting is enabled for this visualization'
  ),
  key: z.string().describe(
    'Column to sort by'
  ),
  order: sortingOrderSchema.describe(
    'Order in which to sort the data'
  ),
}).describe('Configuration for how data should be sorted');

// Formatting Configuration
const formattingSchema = z.object({
  enabled: z.boolean().describe(
    'Whether custom formatting is enabled for this visualization'
  ),
  key: z.string().describe(
    'Column to apply formatting to'
  ),
  order: sortingOrderSchema.describe(
    'Order to apply formatting in'
  ),
}).describe('Configuration for how data should be formatted');

// Filters Configuration
const filterSchema = z.object({
  column: z.string().describe(
    'Column to apply the filter to'
  ),
  operator: filterOperationsSchema.describe(
    'Operation to use when filtering'
  ),
  value: z.union([
    z.string(),
    z.number()
  ]).describe(
    'Value to compare against when filtering'
  ),
}).describe('Configuration for a single filter operation');

// Transform Configuration
const transformConfigSchema = z.object({
  series: z.array(seriesConfigSchema).nullish().describe(
    'Array of series configurations defining how data maps to visual elements'
  ),
  rotateLabels: z.number().nullish().describe(
    'Angle in degrees to rotate labels (useful for long category names)'
  ),
  aggregation: aggregationSchema.nullish().describe(
    'Configuration for data aggregation'
  ),
  sorting: sortingSchema.nullish().describe(
    'Configuration for data sorting'
  ),
  formatting: formattingSchema.nullish().describe(
    'Configuration for data formatting'
  ),
  filters: z.array(filterSchema).nullish().describe(
    'Array of filter configurations to apply to the data'
  ),
}).describe('Complete configuration for transforming and visualizing data');


const transformConfigSchemaSQL = z.object({
  series: z.array(seriesConfigSchema).nullish().describe(
    'Array of series configurations defining how data maps to visual elements'
  ),
  rotateLabels: z.number().nullish().describe(
    'Angle in degrees to rotate labels (useful for long category names)'
  ),
  formatting: formattingSchema.nullish().describe(
    'Configuration for data formatting'
  ),
}).describe('Complete configuration for transforming and visualizing data');


// Extended Transform Configuration
const transformConfSchema = transformConfigSchema.extend({
  type: z.enum(['line', 'bar', 'pie', 'count']).describe(
    'Type of visualization or transformation to apply'
  ),
}).describe('Extended transform configuration including visualization type');

// Extended Transform Configuration
const transformConfSchemaSQL = transformConfigSchemaSQL.extend({
  type: z.enum(['line', 'bar', 'pie', 'count']).describe(
    'Type of visualization or transformation to apply'
  ),
}).describe('Extended transform configuration including visualization type');


// Export schemas
export const schemas = {
  dataPoint: dataPointSchema,
  seriesConfig: seriesConfigSchema,
  aggregation: aggregationSchema,
  sorting: sortingSchema,
  formatting: formattingSchema,
  filter: filterSchema,
  transformConfig: transformConfigSchema,
  transformConf: transformConfSchema,
  transformConfSQL: transformConfSchemaSQL,
} as const;

// Export type inference helpers
export type IDataPoint = z.infer<typeof dataPointSchema>;
export type ISeriesConfig = z.infer<typeof seriesConfigSchema>;
export type IAggregation = z.infer<typeof aggregationSchema>;
export type ISorting = z.infer<typeof sortingSchema>;
export type IFormatting = z.infer<typeof formattingSchema>;
export type IFilter = z.infer<typeof filterSchema>;
export type ITransformConfig = z.infer<typeof transformConfigSchema>;
export type ITransformConf = z.infer<typeof transformConfSchema>;

// Helper function to validate configurations
export const validateConfig = {
  transformConfig: (data: unknown): ITransformConfig => transformConfigSchema.parse(data),
  transformConf: (data: unknown): ITransformConf => transformConfSchema.parse(data),
  seriesConfig: (data: unknown): ISeriesConfig => seriesConfigSchema.parse(data),
  aggregation: (data: unknown): IAggregation => aggregationSchema.parse(data),
  sorting: (data: unknown): ISorting => sortingSchema.parse(data),
  formatting: (data: unknown): IFormatting => formattingSchema.parse(data),
  filter: (data: unknown): IFilter => filterSchema.parse(data),
};