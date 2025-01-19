import { AntChartOptions, DataPoint, TransformConf } from "@/app/types/data";

/**
 * Pie chart transformation AntChartOptions
 */
export function transformToPieChart(data: DataPoint[], config: TransformConf): AntChartOptions {
    const angleField = config.options?.angleField || config.options?.xField;
    const colorField = config.options?.colorField || config.options?.xField;
    return {
      angleField,
      colorField,
    } as AntChartOptions;
}