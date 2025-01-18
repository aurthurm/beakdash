import { DataPoint, TransformConf, SeriesConfig } from "@/app/types/data";
import type { EChartsOption } from 'echarts';

/**
 * Pie chart transformation EChartsOption
 */
export function transformToPieChart(data: DataPoint[], config: TransformConf): EChartsOption {
    const seriesConfig = config.series?.[0] ?? {
        nameKey: Object.keys(data[0])[0],
        valueKey: Object.keys(data[0])[1]
    };

    const aggregatedData = aggregatePieData(data, seriesConfig);
    
    return {
        series: [{
            name: seriesConfig.nameKey,
            type: 'pie',
            radius: ['40%', '70%'], // Changed to donut by default
            data: Object.values(aggregatedData),
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            },
            label: {
                show: true,
                formatter: '{b}: {d}%' // Show both name and percentage
            }
        }]
    };
}


/**
 * Helper method for pie data aggregation
 */
function aggregatePieData(data: DataPoint[], seriesConfig: SeriesConfig): Record<string, { name: string; value: number; [key: string]: any }> {
    return data.reduce((acc, item) => {
        const categoryName = item[seriesConfig.nameKey!];
        const value = Number(item[seriesConfig.valueKey!]);
        
        if (!acc[categoryName]) {
            acc[categoryName] = {
                name: categoryName?.toString(),
                value: 0,
                ...extractExtraData(item, seriesConfig.extraKeys)
            };
        }
        
        acc[categoryName].value += value;
        return acc;
    }, {} as Record<string, { name: string; value: number; [key: string]: any }>);
}


/**
 * Extracts additional data fields
 */
function extractExtraData(item: DataPoint, extraKeys?: string[]) {
    if (!extraKeys) return {};
    
    const extra: DataPoint = {};
    extraKeys.forEach(key => {
      extra[key] = item[key];
    });
    return extra;
}