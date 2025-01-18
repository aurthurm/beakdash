import { DataPoint, TransformConf } from "@/app/types/data";
import type { EChartsOption } from 'echarts';

/**
 * Transforms data for heatmaps EChartsOption
 */
export function transformToHeatmap(data: DataPoint[], config: TransformConf): EChartsOption {
    const seriesConfig = config.series?.[0] ?? {
      categoryKey: Object.keys(data[0])[0],
      valueKey: Object.keys(data[0])[1],
      stackKey: Object.keys(data[0])[2]
    };

    const xCategories = [...new Set(data.map(item => item[seriesConfig.categoryKey!]))];
    const yCategories = [...new Set(data.map(item => item[seriesConfig.stackKey!]))];

    const series = data.map(item => [
      xCategories.indexOf(item[seriesConfig.categoryKey!]),
      yCategories.indexOf(item[seriesConfig.stackKey!]),
      Number(item[seriesConfig.valueKey!])
    ]);

    return {
      xAxis: { data: xCategories },
      yAxis: { data: yCategories },
      series: [{
        type: 'heatmap',
        data: series
      }],
      visualMap: {
        min: 0,
        max: 10,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: '15%'
      },
    };
  }