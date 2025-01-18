import { DataPoint } from "@/app/types/data";
import type { EChartsOption } from 'echarts';

/**
 * Transforms data for radar charts EChartsOption
 */
export function transformToRadarChart(data: DataPoint[]): EChartsOption {
    const indicators = Object.keys(data[0])
      .filter(key => typeof data[0][key] === 'number')
      .map(key => ({ name: key, max: Math.max(...data.map(item => Number(item[key]))) }));

    return {
      radar: {
        indicator: indicators
      },
      series: [{
        type: 'radar',
        data: data.map(item => ({
          value: indicators.map(ind => Number(item[ind.name])),
          name: item[Object.keys(data[0])[0]]
        }))
      }]
    };
  }