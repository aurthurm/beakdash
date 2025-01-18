import { AntChartOptions, DataPoint, TransformConf } from "@/app/types/data";

/**
 * Pie chart transformation AntChartOptions
 */
export function transformToPieChart(data: DataPoint[], config: TransformConf): AntChartOptions {
    return {
      angleField: config.options?.angleField || config.options?.yField,
      colorField: config.options?.colorField || config.options?.xField,
      // radius
    } as AntChartOptions;
}