import { DataPoint, AggregationMethod } from "@/app/types/data";

/**
 * Aggregates data based on specified method and grouping
 */
export function aggregate(
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