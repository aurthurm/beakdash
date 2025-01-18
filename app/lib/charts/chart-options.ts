import { DataPoint } from "@/app/types/data";
import { ChartDataTransformer } from "@/app/lib/transformers/data-transformer";
import { IWidget } from "../drizzle/schemas";
import { cloneDeep } from "lodash";

/**
 * Deeply merges multiple objects, properly handling arrays and nested structures
 */
function deepMerge(target: any, ...sources: any[]): any {
  if (!sources.length) return target;
  const source = sources.shift();

  if (!source) return target;

  if (Array.isArray(source)) {
    return cloneDeep(source);
  }

  if (typeof source !== 'object') return source;

  for (const key in source) {
    if (Array.isArray(source[key])) {
      target[key] = cloneDeep(source[key]);
    } else if (typeof source[key] === 'object' && source[key] !== null) {
      if (!target[key] || Array.isArray(target[key])) {
        target[key] = {};
      }
      target[key] = deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Generates chart options with proper deep merging of configurations
 */
export function getChartOptions(widget: IWidget, data: DataPoint[]): Record<string, any> {
  if (!widget.type) return {};

  // Create fresh copies to avoid mutations
  const baseOptions = cloneDeep(getBaseOptions(widget));
  const commonOptions = cloneDeep(getCommonOptions());
  
  // Transform data according to widget configuration
  const transformerConfig = {
    type: widget.type,
    ...widget.transformConfig
  };
  const transformedData = ChartDataTransformer.transform(data, transformerConfig);

  // Define chart-specific options
  const chartSpecificOptions = {
    tooltip: {
      trigger: widget.type === 'pie' ? 'item' : 'axis'
    }
  };

  // Merge all options with proper precedence
  const finalOptions = deepMerge(
    {},
    baseOptions,
    commonOptions,
    chartSpecificOptions,
    transformedData
  );

  // Log final configuration for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Final Chart Options:', finalOptions);
  }

  return finalOptions;
}

// Common options shared across all chart types
const getCommonOptions = () => ({
  // title: {
  //   textStyle: {
  //     fontSize: 16,
  //     fontWeight: 'normal'
  //   },
  //   left: 'center'
  // },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  // tooltip: {
  //   backgroundColor: 'rgba(255, 255, 255, 0.9)',
  //   borderColor: '#ccc',
  //   borderWidth: 1,
  //   textStyle: {
  //     color: '#333'
  //   },
  //   extraCssText: 'box-shadow: 0 2px 4px rgba(0,0,0,0.1);'
  // },
  // toolbox: {
  //   feature: {
  //     saveAsImage: {},
  //     dataZoom: {},
  //     dataView: { readOnly: true },
  //     restore: {},
  //   },
  //   right: '20px'
  // },
  // legend: {
  //   type: 'scroll',
  //   top: 0,
  //   textStyle: {
  //     fontSize: 12
  //   }
  // }
});

const getBaseOptions = (widget: IWidget) => {
  const commonAxisConfig = {
    axisLine: {
      lineStyle: {
        color: '#ddd'
      }
    },
    splitLine: {
      lineStyle: {
        color: '#eee',
        type: 'dashed'
      }
    },
    axisTick: {
      show: false
    }
  };

  switch (widget.type) {
    case 'line':
      return {
        xAxis: {
          type: 'category',
          ...commonAxisConfig,
          axisLabel: {
            rotate: widget.transformConfig?.rotateLabels ?? 0,
            margin: 15,
            hideOverlap: true
          }
        },
        yAxis: {
          type: 'value',
          ...commonAxisConfig,
          scale: true
        },
        series: [{
          type: 'line',
          smooth: true,
          symbolSize: 6,
          lineStyle: {
            width: 2
          },
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          animationDuration: 1000,
          animationEasing: 'cubicOut'
        }]
      };

    case 'bar':
      return {
        xAxis: {
          type: 'category',
          ...commonAxisConfig,
          axisLabel: {
            interval: 0,
            rotate: widget.transformConfig?.rotateLabels ?? 0,
            margin: 15,
            hideOverlap: true
          }
        },
        yAxis: {
          type: 'value',
          ...commonAxisConfig,
          scale: true
        },
        series: [{
          type: 'bar',
          barMaxWidth: 50,
          emphasis: {
            focus: 'series',
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          animationDuration: 1000,
          animationEasing: 'cubicOut'
        }]
      };

    case 'pie':
      return {
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: true,
            formatter: '{b}: {d}%',
            position: 'outer'
          },
          labelLine: {
            show: true,
            length: 15,
            length2: 10
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            },
            label: {
              show: true,
              fontSize: 14,
              fontWeight: 'bold'
            }
          },
          animationType: 'scale',
          animationDuration: 1000,
          animationEasing: 'cubicOut'
        }]
      };
    default:
      return {};
  }
};