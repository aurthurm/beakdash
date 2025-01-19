import { AntChartOptions, DataPoint, TransformConf } from "@/app/types/data";

/**
 * Pie chart transformation AntChartOptions
 */
export function transformDualAxesChart(data: DataPoint[], config: TransformConf): AntChartOptions {
    const xField = config.options?.xField;
    const options = {
      xField,
      children: [],
    } as AntChartOptions

    if(config.options?.children && config.options?.children.length > 0) {      
      let style = config.options.children[0].type == 'interval' ? { maxWidth: 70 } : { lineWidth: 2 }
      if(config.options.children[1].type == 'interval') {
        style = { lineWidth: 2, stroke: '#5AD8A6'  }
      }
      options.children?.push({
        type: config.options.children[0].type,
        yField: config.options.children[0]?.yField,
        colorField: config.options.children[0]?.colorField,
        style,
      })
    }

    if(config.options?.children && config.options?.children.length > 1) {
      let style = config.options.children[0].type == 'interval' ? { maxWidth: 80 } : { lineWidth: 2 }
      if(config.options.children[0].type == 'interval') {
        style = { lineWidth: 2, stroke: '#5AD8A6' }
      }
      options.children?.push({
        type: config.options.children[1].type,
        yField: config.options.children[1].yField,
        colorField: config.options.children[1].colorField,
        style,
        axis: { y: { position: 'right' } },
      })
    }
    console.log("-----options-----", options)
    return options;
}
