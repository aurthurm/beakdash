import { IWidget } from "../drizzle/schemas";

// Common options shared across all chart types 
export const getCommonOptions = () => ({
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
  
export const getBaseOptions = (widget: IWidget) => {
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