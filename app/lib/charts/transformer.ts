import { AntChartOptions, DataPoint, TransformConf } from "@/app/types/data";
import { sort } from "./sorting";
import { aggregate } from "./aggregation";
import { applyFilters } from "./filter";
import { transformToPieChart } from "./chart-pie";
import { transformToLineChart } from "./chart-line";
import { transformToBarChart } from "./chart-bar";
import { transformToColumnChart } from "./chart-column";
import { transformToScatterChart } from "./chart-scatter";
import { transformDualAxesChart } from "./chart-dual-axes";


export class ChartDataTransformer {
  // Cache for memoized results
  private static cache = new Map<string, AntChartOptions>();

  static transform(data: DataPoint[], config: TransformConf): {
    options: AntChartOptions;
    data: DataPoint[];
  } | null {
      // Input validation
      if (!data?.length || !config) {
          return null;
      }

      const cacheKey = this.generateCacheKey(data, config);
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
          return {
              options: cachedResult,
              data
          };
      }

      const processedData = this.preProcessData(data, config);
      const result = this.transformByType(processedData, config);
      
      // Cache and return
      this.cache.set(cacheKey, result);
      return {
          options: result,
          data: processedData
      };
  }

  // method for data preprocessing
  private static preProcessData(data: DataPoint[], config: TransformConf): DataPoint[] {
    let processedData = [...data];

    // Apply filters first
    if (config.filters?.length) {
        processedData = applyFilters(processedData, config.filters);
    }

    // Then aggregation
    if (config.aggregation?.enabled) {
        processedData = aggregate(
            processedData,
            config.aggregation.method,
            config.aggregation.groupBy
        );
    }

    // Then sorting
    if (config.sorting?.enabled) {
        processedData = sort(
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
  private static transformByType(data: DataPoint[], config: TransformConf): AntChartOptions {
    switch (config.type) {
      case 'pie':
        return transformToPieChart(data, config);
      case 'line':
        return transformToLineChart(data, config);
      case 'bar':
        return transformToBarChart(data, config);
      case 'column':
        return transformToColumnChart(data, config);
      case 'scatter':
        return transformToScatterChart(data, config);
      case 'dual-axes':
        return transformDualAxesChart(data, config);
      default:
        throw new Error(`Unsupported chart type: ${config.type}`);
    }
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
  

