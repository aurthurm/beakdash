import { DataPoint, TransformConf } from "@/app/types/data";
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
    ...widget.transformConfig,
  } as TransformConf;
  data = handleNumbers(data);
  const transformedData = ChartDataTransformer.transform(data, transformerConfig);

  // Merge all options with proper precedence
  const finalOptions = deepMerge(
    baseOptions,
    commonOptions,
    transformedData?.options,
  );

  // Log final configuration for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Final Chart Options:', finalOptions);
  }

  return {
    data: transformedData?.data || data,
    ...finalOptions
  };
}


const handleNumbers = (data: DataPoint[]) => {
  if (!data.length) return [];

  // Get all unique keys from the data
  const allKeys = Array.from(new Set(data.flatMap(Object.keys)));
  
  // For each key, check if all values in its series can be converted to numbers
  const numericFields = allKeys.filter(key => {
    return data.every(item => {
      const value = item[key];
      if (value === undefined || value === null || value === '') return false;
      if (typeof value === 'number') return true;
      if (typeof value !== 'string') return false;
      
      // Try to convert to number and check if it's valid
      const num = Number(value);
      return !isNaN(num) && isFinite(num);
    });
  });

  // Convert the identified numeric fields
  return data.map(item => {
    const processedItem: DataPoint = { ...item };
    numericFields.forEach(field => {
      const value = item[field];
      if (typeof value === 'string') {
        processedItem[field] = Number(value);
      }
    });
    return processedItem;
  });
};