import { DataPoint, TransformConfig } from "@/app/types/data";

interface TransformConf extends TransformConfig {
  type: string;
}

export class ChartDataTransformer {
    // Cache for memoized results
    private static cache = new Map<string, any>();
  
    /**
     * Main transformation method
     * @param data Raw SQL data (DataPoint[])
     * @param config Transform configuration (TransformConf)
     * @returns Formatted chart data
     */
    static transform(data: DataPoint[], config: TransformConf): any {
      // Generate cache key based on data and config
      const cacheKey = this.generateCacheKey(data, config);
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey);
      }
  
      let processedData = [...data];
  
      // Apply filters if specified
      if (config.filters) {
        processedData = this.applyFilters(processedData, config.filters);
      }
  
      // Apply aggregation if specified
      if (config.aggregation?.enabled) {
        processedData = this.aggregate(
          processedData,
          config.aggregation.method,
          config.aggregation.groupBy
        );
      }
  
      // Apply sorting if specified
      if (config.sorting?.enabled) {
        processedData = this.sort(
          processedData,
          config.sorting.key,
          config.sorting.order
        );
      }
  
      // Transform data based on chart type
      const result = this.transformByType(processedData, config);
  
      // Apply formatting
      if (config.formatting) {
        this.applyFormatting(result, config.formatting);
      }
  
      // Cache the result
      this.cache.set(cacheKey, result);
      return result;
    }
  
    /**
     * Transforms data based on specific chart type
     */
    private static transformByType(data: DataPoint[], config: TransformConf): any {
      switch (config.type) {
        case 'pie':
          return this.transformToPieChart(data, config);
        case 'line':
        case 'bar':
          return this.transformToAxisChart(data, config);
        case 'scatter':
          return this.transformToScatterChart(data, config);
        case 'radar':
          return this.transformToRadarChart(data);
        case 'heatmap':
          return this.transformToHeatmap(data, config);
        case 'tree':
        case 'sunburst':
          return this.transformToHierarchical(data, config);
        default:
          throw new Error(`Unsupported chart type: ${config.type}`);
      }
    }
  
    /**
     * Transforms data for pie charts
     */
    private static transformToPieChart(data: DataPoint[], config: TransformConf) {
      const seriesConfig = config.series?.[0] ?? {
        nameKey: Object.keys(data[0])[0],
        valueKey: Object.keys(data[0])[1]
      };

      // First, aggregate the data by category
      const aggregatedData = data.reduce((acc, item) => {
        const categoryName = item[seriesConfig.nameKey!];
        const value = Number(item[seriesConfig.valueKey!]);
        
        if (!acc[categoryName]) {
          acc[categoryName] = {
            name: categoryName,
            value: 0,
            ...this.extractExtraData(item, seriesConfig.extraKeys)
          };
        }
        
        acc[categoryName].value += value;
        return acc;
      }, {} as Record<string, { name: string; value: number; [key: string]: any }>);

        
      return {
        series: [{
          name: seriesConfig.nameKey,
          type: 'pie',
          radius: '50%',
          data:  Object.values(aggregatedData),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };
    }
  
    /**
     * Transforms data for axis-based charts (line, bar)
     */
    private static transformToAxisChart(data: DataPoint[], config: TransformConf) {
        const seriesConfigs = config.series ?? [{
            categoryKey: Object.keys(data[0])[0],
            valueKey: Object.keys(data[0])[1]
        }];
    
        const categories = new Set<string>();
        const seriesMap = new Map<string, Map<string, number>>();
    
        // Process data into series
        data.forEach(item => {
            seriesConfigs.forEach(seriesConfig => {
                const category = String(item[seriesConfig.categoryKey!]);
                const seriesName = seriesConfig.nameKey ? 
                    String(item[seriesConfig.nameKey]) : 
                    seriesConfig.valueKey!;
                const value = Number(item[seriesConfig.valueKey!]);
    
                categories.add(category);
                
                if (!seriesMap.has(seriesName)) {
                    seriesMap.set(seriesName, new Map());
                }
                seriesMap.get(seriesName)!.set(category, value);
            });
        });
    
        // Format data for chart
        const categoriesArray = Array.from(categories);
        const series = Array.from(seriesMap.entries()).map(([name, values]) => ({
            name,
            type: config.type,
            data: categoriesArray.map(cat => values.get(cat) ?? 0)
        }));
    
        // Fix: Return properly structured xAxis object
        return {
            xAxis: {
                type: 'category',
                data: categoriesArray
            },
            series
        };
    }
  
    /**
     * Transforms data for scatter plots
     */
    private static transformToScatterChart(data: DataPoint[], config: TransformConf) {
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
    private static transformToRadarChart(data: DataPoint[]) {
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
    private static transformToHeatmap(data: DataPoint[], config: TransformConf) {
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
        }]
      };
    }
  
    /**
     * Transforms data for hierarchical charts (tree, sunburst)
     */
    private static transformToHierarchical(data: DataPoint[], config: TransformConf) {
      const buildHierarchy = (items: DataPoint[], parentId: any = null): any[] => {
        return items
          .filter(item => item.parentId === parentId)
          .map(item => ({
            name: item.name,
            value: item.value,
            children: buildHierarchy(items, item.id)
          }));
      };
  
      return {
        series: [{
          type: config.type,
          data: buildHierarchy(data)
        }]
      };
    }
  
    /**
     * Aggregates data based on specified method and grouping
     */
    private static aggregate(
      data: DataPoint[],
      method: 'sum' | 'avg' | 'max' | 'min' | 'count',
      groupBy: string[]
    ): DataPoint[] {
      const groups = new Map<string, DataPoint[]>();
  
      // Group data
      data.forEach(item => {
        const key = groupBy?.map(col => item[col]).join('|');
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
  
    /**
     * Applies filters to data
     */
    private static applyFilters(data: DataPoint[], filters: TransformConf['filters']): DataPoint[] {
      return data.filter(item => 
        filters!.every(filter => {
          const value = item[filter.column];
          switch (filter.operator) {
            case 'equals':
              return value === filter.value;
            case 'contains':
              return String(value).includes(String(filter.value));
            case 'gt':
              return Number(value) > Number(filter.value);
            case 'lt':
              return Number(value) < Number(filter.value);
            case 'between':
              return Array.isArray(filter.value) &&
                Number(value) >= filter.value[0] &&
                Number(value) <= filter.value[1];
            default:
              return true;
          }
        })
      );
    }
  
    /**
     * Applies sorting to data
     */
    private static sort(
      data: DataPoint[],
      key: string,
      order: 'asc' | 'desc'
    ): DataPoint[] {
      return [...data].sort((a, b) => {
        const aVal = a[key];
        const bVal = b[key];
        return order === 'asc' ? 
          (aVal > bVal ? 1 : -1) :
          (aVal < bVal ? 1 : -1);
      });
    }
  
    /**
     * Applies formatting to values
     */
    private static applyFormatting(data: any, formatting: TransformConf['formatting']) {
      const formatValue = (value: any) => {
        if (formatting?.customFormatter) {
          return formatting.customFormatter(value);
        }
        if (formatting?.numberFormat && typeof value === 'number') {
          return new Intl.NumberFormat(undefined, formatting.numberFormat).format(value);
        }
        if (formatting?.dateFormat && value instanceof Date) {
          return new Intl.DateTimeFormat(undefined, formatting.dateFormat).format(value);
        }
        return value;
      };
  
      const formatObject = (obj: any) => {
        if (Array.isArray(obj)) {
          return obj.map(item => formatObject(item));
        }
        if (obj && typeof obj === 'object') {
          const formatted: any = {};
          for (const key in obj) {
            formatted[key] = formatObject(obj[key]);
          }
          return formatted;
        }
        return formatValue(obj);
      };
  
      return formatObject(data);
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
  }
  

