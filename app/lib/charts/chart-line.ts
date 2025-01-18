import { DataPoint, TransformConf,AntChartOptions } from "@/app/types/data";


/**
 * Main entry point for transforming data to chart options AntChartOptions
 */
export function transformToLineChart(data: DataPoint[], config: TransformConf): AntChartOptions {
    return {
      xField: config.options?.xField,
      yField: config.options?.yField,
      // colorField: config.options?.colorField,
    } as AntChartOptions;
  }