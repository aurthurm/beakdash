import { merge } from 'lodash';
import { DataPoint } from "@/app/types/data";
import { Widget } from "@/app/types/widget";
import { ChartDataTransformer } from "@/app/lib/transformers/data-transformer";

export const getChartOptions = (widget: Widget, data: DataPoint[]) => {
  if (!widget.type.chart) return {};

  const transformerConfig = {type: widget.type.chart, ...widget.transformConfig};
  const transformedData = ChartDataTransformer.transform(data, transformerConfig);

  const baseChartOptions = getBaseOptions(widget);
  const commonOptions = getCommonOptions();

  // Merge options in correct order: base -> common -> transformed -> widget specific
  return merge({}, 
    baseChartOptions, 
    commonOptions,
    {
      title: { text: widget.title },
      tooltip: { trigger: widget.type.chart === 'pie' ? 'item' : 'axis' },
      ...transformedData
    }
  );
};

// Common options shared across all chart types
const getCommonOptions = () => ({
  title: {
    textStyle: {
      fontSize: 16,
      fontWeight: 'normal'
    },
    left: 'center'
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  tooltip: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#ccc',
    borderWidth: 1,
    textStyle: {
      color: '#333'
    },
    extraCssText: 'box-shadow: 0 2px 4px rgba(0,0,0,0.1);'
  },
  toolbox: {
    feature: {
      saveAsImage: {},
      dataZoom: {},
      dataView: { readOnly: true },
      restore: {},
    },
    right: '20px'
  },
  legend: {
    type: 'scroll',
    bottom: 0,
    textStyle: {
      fontSize: 12
    }
  }
});

const getBaseOptions = (widget: Widget) => {
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

  switch (widget.type.chart) {
    case 'line':
      return {
        xAxis: {
          type: 'category',
          ...commonAxisConfig,
          axisLabel: {
            rotate: 45,
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
            rotate: widget.transformConfig?.rotateLabels ? 45 : 0,
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
        legend: {
          type: 'scroll',
          orient: 'horizontal',
          bottom: 0,
          textStyle: {
            fontSize: 12
          }
        },
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

    case 'scatter':
      return {
        xAxis: {
          type: 'value',
          ...commonAxisConfig,
          scale: true
        },
        yAxis: {
          type: 'value',
          ...commonAxisConfig,
          scale: true
        },
        series: [{
          type: 'scatter',
          symbolSize: 10,
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

    default:
      return {};
  }
};