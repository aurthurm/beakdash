import { DataPoint, TransformConf, AntChartOptions } from "@/app/types/data";

/**
 * Transforms data for scatter plots AntChartOptions
 */
export function transformToScatterChart(data: DataPoint[], config: TransformConf): AntChartOptions {
    const options = {
      xField: config.options?.xField,
      yField: config.options?.yField,
    } as AntChartOptions
    
    if(config.options?.colorField) {
      options.colorField = config.options?.colorField;
    }

    if(config.options?.shapeField) {
      options.shapeField = config.options?.shapeField;
    }
    return options;
  }