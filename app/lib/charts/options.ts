import { DataPoint } from "@/app/types/data";
import { ChartDataTransformer } from "./transformer";
import { IWidget } from "../drizzle/schemas";
import { cloneDeep } from "lodash";
import { deepMerge } from "./utils";
import { getBaseOptions, getCommonOptions } from "./common";

/**
 * Generates chart options with proper deep merging of configurations
 */
export function getChartOptions(widget: IWidget, data: DataPoint[]): Record<string, any> {
  if (!widget.type) return {};

  // Create fresh copies to avoid mutations
  const baseOptions = cloneDeep(getBaseOptions(widget));
  const commonOptions = cloneDeep(getCommonOptions());
  
  // Transform data according to widget configuration
  const transformerConfig = {
    type: widget.type,
    ...widget.transformConfig
  };
  const transformedData = ChartDataTransformer.transform(data, transformerConfig);

  // Define chart-specific options
  const chartSpecificOptions = {
    tooltip: {
      trigger: widget.type === 'pie' ? 'item' : 'axis'
    }
  };

  // Merge all options with proper precedence
  const finalOptions = deepMerge(
    {},
    baseOptions,
    commonOptions,
    chartSpecificOptions,
    transformedData
  );

  // Log final configuration for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Final Chart Options:', finalOptions);
  }

  return finalOptions;
}

