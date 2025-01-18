import { DataPoint, TransformConf } from "@/app/types/data";
import type { EChartsOption } from 'echarts';

/**
 * Transforms data for scatter plots EChartsOption
 */
export function transformToScatterChart(data: DataPoint[], config: TransformConf): EChartsOption {
    const seriesConfig = config.series?.[0] ?? {
      nameKey: Object.keys(data[0])[0],
      valueKey: Object.keys(data[0])[1]
    };

    return {
      series: [{
        type: 'scatter',
        data: data.map(item => [
          Number(item[seriesConfig.nameKey!]),
          Number(item[seriesConfig.valueKey!])
        ])
      }]
    };
}