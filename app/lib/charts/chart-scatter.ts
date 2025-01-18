import { DataPoint, TransformConf, AntChartOptions } from "@/app/types/data";

/**
 * Transforms data for scatter plots AntChartOptions
 */
export function transformToScatterChart(data: DataPoint[], config: TransformConf): AntChartOptions {
    return {
      xField: config.options?.xField,
      yField: config.options?.yField,
      colorField: config.options?.colorField,
    } as AntChartOptions;
  }