import { DataPoint, TransformConf, SeriesConfig, Formatting, Filters, FilterGroup, SortingOrder, AggregationMethod } from "@/app/types/data";
import type { EChartsOption } from 'echarts';

interface HierarchicalNode {
  name: string;
  value: number;
  children: HierarchicalNode[];
}

type SeriesChartType = 'line' | 'bar';

export class ChartDataTransformer {
  // Cache for memoized results
  private static cache = new Map<string, EChartsOption>();

  static transform(data: DataPoint[], config: TransformConf): EChartsOption | null {
      // Input validation
      if (!data?.length || !config) {
          return null;
      }

      const cacheKey = this.generateCacheKey(data, config);
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
          return cachedResult;
      }

      const processedData = this.preProcessData(data, config);
      const result = this.transformByType(processedData, config);
      
      // Cache and return
      this.cache.set(cacheKey, result);
      return result;
  }

  // New method for data preprocessing
  private static preProcessData(data: DataPoint[], config: TransformConf): DataPoint[] {
    let processedData = [...data];

    // Apply filters first
    if (config.filters?.length) {
        processedData = this.applyFilters(processedData, config.filters);
    }

    // Then aggregation
    if (config.aggregation?.enabled) {
        processedData = this.aggregate(
            processedData,
            config.aggregation.method,
            config.aggregation.groupBy
        );
    }

    // Then sorting
    if (config.sorting?.enabled) {
        processedData = this.sort(
            processedData,
            config.sorting.key,
            config.sorting.order
        );
    }

    return processedData;
  }
  
  /**
   * Transforms data based on specific chart type
   */
  private static transformByType(data: DataPoint[], config: TransformConf): EChartsOption {
    switch (config.type) {
      case 'pie':
        return this.transformToPieChart(data, config);
      case 'line':
      case 'bar':
        return this.transformToAxisChart(data, config);
      // case 'scatter':
      //   return this.transformToScatterChart(data, config);
      // case 'radar':
      //   return this.transformToRadarChart(data);
      // case 'heatmap':
      //   return this.transformToHeatmap(data, config);
      // case 'tree':
      // case 'sunburst':
      //   return this.transformToHierarchical(data, config);
      default:
        throw new Error(`Unsupported chart type: ${config.type}`);
    }
  }
  
  /**
   * Transforms data for axis-based charts (line, bar)
   */
  private static transformToAxisChart(data: DataPoint[], config: TransformConf): EChartsOption {
      const seriesConfigs = config.series ?? [{
          categoryKey: Object.keys(data[0])[0],
          valueKey: Object.keys(data[0])[1]
      }];

      const isGrouped = !seriesConfigs[0].stackKey && seriesConfigs[0].nameKey;

      const result: {
        xAxis: { type: 'category'; data: string[]; axisLabel?: { rotate: number } };
        yAxis: [{ type: 'value'; splitLine?: { show: boolean } }];
        series: Array<{
          name: string;
          type: SeriesChartType;
          data: number[];
          yAxisIndex?: number;
        }>;
      } = {
          xAxis: {
              type: 'category',
              data: [] as string[],
              axisLabel: config.rotateLabels ? { rotate: config.rotateLabels } : undefined
          },
          yAxis: [{
              type: 'value',
              // Add support for dual axis if needed
              ...(config.series?.some(s => s.axis === 'secondary') ? { splitLine: { show: false } } : {})
          }],
          series: []
      };

      // Process stacked charts
      const isStacked = seriesConfigs.some(config => config.stackKey);
      if (isStacked) {
          return this.transformToStackedChart(data, config);
      }

      // Handle regular axis charts
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

      result.xAxis.data = Array.from(categories);
      result.series = Array.from(seriesData.entries()).map(([name, values], index) => {
          const seriesType = (seriesConfigs[index]?.type || config.type) as SeriesChartType;
          return {
          name,
          type: seriesType, // Use series-specific type or fall back to main type
          data: result.xAxis.data.map(cat => values.get(cat) ?? 0),
          ...(seriesConfigs[index]?.axis === 'secondary' ? { yAxisIndex: 1 } : {}),
          // Add any other series-specific configurations
          ...(seriesConfigs[index]?.color ? { itemStyle: { color: seriesConfigs[index].color } } : {}),
          ...(seriesConfigs[index]?.showLabel ? {
              label: {
                  show: true,
                  position: seriesConfigs[index].labelPosition || 'top'
              }
          } : {})
        }}
      );

      // If grouped, add specific bar chart settings
      if (isGrouped && config.type === 'bar') {
        // Optional: Add settings for bar width and spacing
        result.series = result.series.map(series => ({
          ...series,
          barGap: '10%',  // Gap between bars in different groups
          barCategoryGap: '20%'  // Gap between bar groups
        }));
      }

      // Add secondary axis if needed
      if (seriesConfigs.some(s => s.axis === 'secondary')) {
        result.yAxis.push({
            type: 'value',
            splitLine: { show: false }
        });
      }

      return result;
  }

  /**
   * stacked chart transformation
   */
  private static transformToStackedChart(data: DataPoint[], config: TransformConf): EChartsOption {
      const seriesConfig = config.series?.[0];
      if (!seriesConfig?.stackKey) return this.transformToAxisChart(data, config);

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
              type: config.type === 'bar' ? 'bar' : 'line' as const,
              stack: 'total',
              data: Array.from(categories).map(cat => 
                  seriesData.get(stack)?.get(cat) ?? 0
              )
          }))
      };
  }

  /**
   * Pie chart transformation
   */
  private static transformToPieChart(data: DataPoint[], config: TransformConf): EChartsOption {
      const seriesConfig = config.series?.[0] ?? {
          nameKey: Object.keys(data[0])[0],
          valueKey: Object.keys(data[0])[1]
      };

      const aggregatedData = this.aggregatePieData(data, seriesConfig);
      
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
  private static aggregatePieData(data: DataPoint[], seriesConfig: SeriesConfig): Record<string, { name: string; value: number; [key: string]: any }> {
      return data.reduce((acc, item) => {
          const categoryName = item[seriesConfig.nameKey!];
          const value = Number(item[seriesConfig.valueKey!]);
          
          if (!acc[categoryName]) {
              acc[categoryName] = {
                  name: categoryName?.toString(),
                  value: 0,
                  ...this.extractExtraData(item, seriesConfig.extraKeys)
              };
          }
          
          acc[categoryName].value += value;
          return acc;
      }, {} as Record<string, { name: string; value: number; [key: string]: any }>);
  }

  /**
   * Transforms data for scatter plots
   */
  private static transformToScatterChart(data: DataPoint[], config: TransformConf): EChartsOption {
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

  /**
   * Transforms data for radar charts
   */
  private static transformToRadarChart(data: DataPoint[]): EChartsOption {
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

  /**
   * Transforms data for heatmaps
   */
  private static transformToHeatmap(data: DataPoint[], config: TransformConf): EChartsOption {
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

  /**
   * Transforms data for hierarchical charts (tree, sunburst)
   */
  // private static transformToHierarchical(data: DataPoint[], config: TransformConf): EChartsOption {
  //   const buildHierarchy = (items: DataPoint[], parentId: any = null): HierarchicalNode[] => {
  //     return items
  //       .filter(item => item.parentId === parentId)
  //       .map(item => ({
  //         name: String(item.name),
  //         value: Number(item.value),
  //         children: this.buildHierarchy(items, item.id)
  //       }));
  //   };

  //   return {
  //     series: [{
  //       type: config.type === 'tree' ? 'tree' : 'sunburst' as const,
  //       data: buildHierarchy(data)
  //     }]
  //   };
  // }

  /**
   * Aggregates data based on specified method and grouping
   */
  private static aggregate(
    data: DataPoint[],
    method?: AggregationMethod,
    groupBy?: string[]
  ): DataPoint[] {
    const groups = new Map<string, DataPoint[]>();

    // Group data
    data.forEach(item => {
      const key = groupBy?.map(col => item[col]).join('|');
      if(!key) return;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    });

    // Apply aggregation method
    return Array.from(groups.entries()).map(([key, group]) => {
      const result: DataPoint = {};
      
      // Add grouping columns
      groupBy?.forEach((col, index) => {
        result[col] = key.split('|')[index];
      });

      // Add aggregated values
      Object.keys(group[0])
        .filter(col => !groupBy?.includes(col))
        .forEach(col => {
          const values = group.map(item => Number(item[col]));
          switch (method) {
            case 'sum':
              result[col] = values.reduce((a, b) => a + b, 0);
              break;
            case 'avg':
              result[col] = values.reduce((a, b) => a + b, 0) / values.length;
              break;
            case 'max':
              result[col] = Math.max(...values);
              break;
            case 'min':
              result[col] = Math.min(...values);
              break;
            case 'count':
              result[col] = values.length;
              break;
          }
        });

      return result;
    });
  }

  private static evaluateFilterGroup(item: DataPoint, filterGroup: FilterGroup): boolean {
    if (filterGroup.operator === 'AND') {
        return filterGroup.filters.every(filter => 
            this.evaluateFilter(
                this.getFilterValue(item[filter.column], filter),
                this.getFilterValue(filter.value, filter),
                filter
            )
        );
    } else {
        return filterGroup.filters.some(filter => 
            this.evaluateFilter(
                this.getFilterValue(item[filter.column], filter),
                this.getFilterValue(filter.value, filter),
                filter
            )
        );
    }
}


  /**
   * Applies formatting to values
   */
  private static applyFormatting(data: any, formatting: Formatting) {
    if (!formatting?.enabled) return data;

    const formatValue = (value: any) => {
        if (typeof value === 'number') {
            return new Intl.NumberFormat(formatting.numberFormat?.locale, {
                minimumFractionDigits: formatting.numberFormat?.minimumFractionDigits,
                maximumFractionDigits: formatting.numberFormat?.maximumFractionDigits,
                style: formatting.numberFormat?.style,
            }).format(value);
        }
        return value;
    };

    const formatDataPoint = (point: any): any => {
        if (Array.isArray(point)) {
            return point.map(formatDataPoint);
        }
        if (point && typeof point === 'object') {
            const formatted: any = {};
            for (const [key, value] of Object.entries(point)) {
                formatted[key] = formatDataPoint(value);
            }
            return formatted;
        }
        return formatValue(point);
    };

    return formatDataPoint(data);
  }

  /**
   * Applies filters to data
   */
  private static applyFilters(data: DataPoint[], filters: Filters[]): DataPoint[] {
    if (!filters?.length) return data;

    return data.filter(item => 
        filters.every(filter => {
            if (!filter.enabled) return true;
            
            const itemValue = this.getFilterValue(item[filter.column], filter);
            const filterValue = this.getFilterValue(filter.value, filter);

            return this.evaluateFilter(itemValue, filterValue, filter);
        })
    );
}

private static getFilterValue(value: any, filter: Filters): any {
    if (value === null || value === undefined) {
        return filter.nullValue ?? null;
    }

    if (filter.customFormatter) {
        return filter.customFormatter(value);
    }

    if (filter.treatAsNumber) {
        return Number(value);
    }

    if (filter.treatAsDate) {
        return new Date(value);
    }

    if (typeof value === 'string' && !filter.caseSensitive) {
        return value.toLowerCase();
    }

    return value;
}

private static evaluateFilter(itemValue: any, filterValue: any, filter: Filters): boolean {
    if (filter.operator === 'isNull') {
        return itemValue === null || itemValue === undefined;
    }

    if (filter.operator === 'isNotNull') {
        return itemValue !== null && itemValue !== undefined;
    }

    // Handle null values
    if (itemValue === null || itemValue === undefined) {
        return false;
    }

    switch (filter.operator) {
        case 'equals':
            return itemValue === filterValue;
            
        case 'notEquals':
            return itemValue !== filterValue;
            
        case 'contains':
            return String(itemValue).includes(String(filterValue));
            
        case 'notContains':
            return !String(itemValue).includes(String(filterValue));
            
        case 'startsWith':
            return String(itemValue).startsWith(String(filterValue));
            
        case 'endsWith':
            return String(itemValue).endsWith(String(filterValue));
            
        case 'gt':
            return itemValue > filterValue;
            
        case 'gte':
            return itemValue >= filterValue;
            
        case 'lt':
            return itemValue < filterValue;
            
        case 'lte':
            return itemValue <= filterValue;
            
        case 'between':
            if (!Array.isArray(filterValue) || filterValue.length !== 2) {
                return false;
            }
            return filter.inclusiveRange ? 
                (itemValue >= filterValue[0] && itemValue <= filterValue[1]) :
                (itemValue > filterValue[0] && itemValue < filterValue[1]);
            
        case 'in':
            return Array.isArray(filterValue) && filterValue.includes(itemValue);
            
        case 'notIn':
            return Array.isArray(filterValue) && !filterValue.includes(itemValue);
            
        case 'regex':
            try {
                const regex = new RegExp(String(filterValue), filter.regexFlags);
                return regex.test(String(itemValue));
            } catch (e) {
                console.error('Invalid regex pattern:', e);
                return false;
            }
            
        default:
            return true;
    }
}

  /**
   * Applies sorting to data
   */
  private static sort(
    data: DataPoint[],
    key: keyof DataPoint | 'none',
    order: SortingOrder
  ): DataPoint[] {
    if (order === 'none' || key === 'none') return data;

    return [...data].sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];

      // Handle undefined or null values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return order === 'asc' ? -1 : 1;
      if (bVal == null) return order === 'asc' ? 1 : -1;

      // Handle strings (case-insensitive sorting)
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal, undefined, { sensitivity: 'base' });
        return order === 'asc' ? comparison : -comparison;
      }

      // Handle numbers and other comparable types
      return order === 'asc'
        ? aVal > bVal
          ? 1
          : -1
        : aVal < bVal
        ? 1
        : -1;
    });
  }

  /**
   * Extracts additional data fields
   */
  private static extractExtraData(item: DataPoint, extraKeys?: string[]) {
    if (!extraKeys) return {};
    
    const extra: DataPoint = {};
    extraKeys.forEach(key => {
      extra[key] = item[key];
    });
    return extra;
  }

  /**
   * Generates cache key for data and config
   */
  private static generateCacheKey(data: DataPoint[], config: TransformConf): string {
    return JSON.stringify({
      dataHash: this.hashData(data),
      config
    });
  }

  /**
   * Creates a simple hash of the data for caching
   */
  private static hashData(data: DataPoint[]): string {
    return data
      .map(item => Object.values(item).join('|'))
      .join('_');
  }

  /**
   * Clears the transformer's cache
   */
  static clearCache() {
    this.cache.clear();
  }

  // 2. Improve buildHierarchy type safety
  private static buildHierarchy(items: DataPoint[], parentId: any = null): HierarchicalNode[] {
    return items
      .filter(item => item.parentId === parentId)
      .map(item => ({
        name: String(item.name),
        value: Number(item.value),
        children: this.buildHierarchy(items, item.id)
      }));
  }

  // 3. Add error handling for missing required fields
  private static validateSeriesConfig(config: SeriesConfig, requiredFields: string[]) {
    requiredFields.forEach(field => {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    });
  }

  // 4. Consider adding method for handling missing values
  private static handleMissingValue(value: any, defaultValue: number = 0): number {
    return value === null || value === undefined ? defaultValue : Number(value);
  }
}
  

