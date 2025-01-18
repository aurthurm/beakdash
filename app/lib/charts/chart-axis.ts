import { DataPoint, TransformConf } from "@/app/types/data";
import type { EChartsOption } from 'echarts';

type SeriesChartType = 'line' | 'bar';
type ChartData = {
    categories: string[];
    seriesData: Map<string, Map<string, number>>;
};

interface BaseChartOptions {
    xAxis: {
        type: 'category';
        data: string[];
        axisLabel?: { rotate: number };
    };
    yAxis: Array<{
        type: 'value';
        splitLine?: { show: boolean };
    }>;
    series: Array<{
        name: string;
        type: SeriesChartType;
        data: number[];
        yAxisIndex?: number;
        itemStyle?: { color: string };
        label?: {
            show: boolean;
            position: string;
        };
    }>;
}

/**
 * Processes raw data into structured format for charts
 */
function processChartData(data: DataPoint[], config: TransformConf): ChartData {
    const seriesConfigs = config.series ?? [{
        categoryKey: Object.keys(data[0])[0],
        valueKey: Object.keys(data[0])[1]
    }];

    const categories = new Set<string>();
    const seriesData = new Map<string, Map<string, number>>();

    data.forEach(item => {
        seriesConfigs.forEach(seriesConfig => {
            const category = String(item[seriesConfig.categoryKey!]);
            const seriesName = seriesConfig.nameKey ? 
                String(item[seriesConfig.nameKey]) : 
                seriesConfig.valueKey!;
            const value = Number(item[seriesConfig.valueKey!]);

            categories.add(category);
            
            if (!seriesData.has(seriesName)) {
                seriesData.set(seriesName, new Map());
            }
            
            const existingValue = seriesData.get(seriesName)!.get(category) || 0;
            seriesData.get(seriesName)!.set(category, existingValue + value);
        });
    });

    return {
        categories: Array.from(categories),
        seriesData
    };
}

/**
 * Creates base chart configuration shared by all chart types
 */
function createBaseChartConfig(
    chartData: ChartData,
    config: TransformConf,
    hasSecondaryAxis: boolean
): BaseChartOptions {
    return {
        xAxis: {
            type: 'category',
            data: chartData.categories,
            axisLabel: config.rotateLabels ? { rotate: config.rotateLabels } : undefined
        },
        yAxis: [
            {
                type: 'value',
                ...(hasSecondaryAxis ? { splitLine: { show: false } } : {})
            },
            ...(hasSecondaryAxis ? [{
                type: 'value' as const,
                splitLine: { show: false }
            }] : [])
        ],
        series: []
    };
}

/**
 * Transforms data for line charts
 */
function transformToLineChart(data: DataPoint[], config: TransformConf): EChartsOption {
    if (config.series?.some(config => config.stackKey)) {
        return transformToStackedChart(data, config, 'line');
    }

    const chartData = processChartData(data, config);
    const hasSecondaryAxis = config.series?.some(s => s.axis === 'secondary') ?? false;
    const chartConfig = createBaseChartConfig(chartData, config, hasSecondaryAxis);

    chartConfig.series = Array.from(chartData.seriesData.entries()).map(([name, values], index) => ({
        name,
        type: 'line',
        data: chartData.categories.map(cat => values.get(cat) ?? 0),
        ...(config.series?.[index]?.axis === 'secondary' ? { yAxisIndex: 1 } : {}),
        ...(config.series?.[index]?.color ? { itemStyle: { color: config.series[index].color } } : {}),
        ...(config.series?.[index]?.showLabel ? {
            label: {
                show: true,
                position: config.series[index].labelPosition || 'top'
            }
        } : {})
    }));

    return chartConfig as EChartsOption;
}

/**
 * Transforms data for bar charts
 */
function transformToBarChart(data: DataPoint[], config: TransformConf): EChartsOption {
    if (config.series?.some(config => config.stackKey)) {
        return transformToStackedChart(data, config, 'bar');
    }

    const chartData = processChartData(data, config);
    const hasSecondaryAxis = config.series?.some(s => s.axis === 'secondary') ?? false;
    const chartConfig = createBaseChartConfig(chartData, config, hasSecondaryAxis);

    const isGrouped = config.series?.[0]?.nameKey && !config.series?.[0]?.stackKey;

    chartConfig.series = Array.from(chartData.seriesData.entries()).map(([name, values], index) => ({
        name,
        type: 'bar',
        data: chartData.categories.map(cat => values.get(cat) ?? 0),
        ...(config.series?.[index]?.axis === 'secondary' ? { yAxisIndex: 1 } : {}),
        ...(config.series?.[index]?.color ? { itemStyle: { color: config.series[index].color } } : {}),
        ...(config.series?.[index]?.showLabel ? {
            label: {
                show: true,
                position: config.series[index].labelPosition || 'top'
            }
        } : {}),
        ...(isGrouped ? {
            barGap: '10%',
            barCategoryGap: '20%'
        } : {})
    }));

    return chartConfig as EChartsOption;
}

/**
 * Transforms data for stacked charts (both line and bar)
 */
function transformToStackedChart(
    data: DataPoint[], 
    config: TransformConf, 
    chartType: SeriesChartType
): EChartsOption {
    const seriesConfig = config.series?.[0];
    if (!seriesConfig?.stackKey) {
        return chartType === 'bar' ? 
            transformToBarChart(data, config) : 
            transformToLineChart(data, config);
    }

    const categories = new Set<string>();
    const stacks = new Set<string>();
    const seriesData = new Map<string, Map<string, number>>();

    data.forEach(item => {
        const category = String(item[seriesConfig.categoryKey!]);
        const stack = String(item[seriesConfig.stackKey!]);
        const value = Number(item[seriesConfig.valueKey!]);

        categories.add(category);
        stacks.add(stack);

        if (!seriesData.has(stack)) {
            seriesData.set(stack, new Map());
        }
        
        const existingValue = seriesData.get(stack)!.get(category) || 0;
        seriesData.get(stack)!.set(category, existingValue + value);
    });

    return {
        xAxis: {
            type: 'category',
            data: Array.from(categories),
            axisLabel: config.rotateLabels ? { rotate: config.rotateLabels } : undefined
        },
        yAxis: { type: 'value' },
        series: Array.from(stacks).map(stack => ({
            name: stack,
            type: chartType,
            stack: 'total',
            data: Array.from(categories).map(cat => 
                seriesData.get(stack)?.get(cat) ?? 0
            )
        }))
    };
}

/**
 * Main entry point for transforming data to chart options
 */
export function transformToAxisChart(data: DataPoint[], config: TransformConf): EChartsOption {
    switch (config.type) {
        case 'bar':
            return transformToBarChart(data, config);
        case 'line':
            return transformToLineChart(data, config);
        default:
            throw new Error(`Unsupported axis chart type: ${config.type}`);
    }
}
