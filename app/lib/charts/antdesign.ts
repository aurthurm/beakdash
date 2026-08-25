import { WidgetConfig } from '@/lib/db/schema';

/**
 * Format categorical labels cleanly to prevent extreme vertical expansion
 */
export function formatAxisLabel(val: any, maxLen = 14): string {
  if (typeof val === 'string') {
    if (val.length > maxLen) {
      return `${val.slice(0, maxLen - 1)}…`;
    }
    return val;
  }
  return String(val ?? '');
}

/**
 * Format numeric axis values into compact human-readable representations (150K, 1.2M)
 */
export function formatAxisNumber(val: any): string {
  if (typeof val === 'number') {
    if (Math.abs(val) >= 1_000_000) {
      return `${(val / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(val) >= 1_000) {
      return `${(val / 1_000).toFixed(0)}K`;
    }
    return String(val);
  }
  if (typeof val === 'string' && !isNaN(Number(val))) {
    return formatAxisNumber(Number(val));
  }
  return String(val ?? '');
}

/**
 * Enforce the Proportional Height Rule:
 * Ensures the chart plot area is at least 2x to 5x the height of the X-axis labels
 */
export function getGuaranteedHeight(height?: number, minHeight = 260): number {
  if (!height || isNaN(height)) return minHeight;
  return Math.max(height, minHeight);
}

const commonConfig: WidgetConfig = { 
  autoFit: true,
  legend: {
    size: false,
    color: {
      position: 'bottom',
    },
  },
};

// Ant Design Bar Chart Config (Horizontal Bars - categories on Y axis)
const toAntBarConfig = (config: WidgetConfig): WidgetConfig => {
  const chartHeight = getGuaranteedHeight(config?.height, 260);

  return {
    autoFit: commonConfig?.autoFit,
    height: chartHeight,
    xField: config?.xField,
    yField: config?.yField,
    colorField: config?.colorField,
    stack: config?.stack,
    group: config?.group,
    normalize: config?.normalize,
    seriesField: config?.seriesField,
    interaction: {
      elementHighlight: false,
      tooltip: {
        shared: true,
      },
    },
    sort: {
      reverse: false,
    },
    paddingRight: 40,
    style: {
      inset: 2,
    },
    axis: {
      x: {
        grid: true,
        tick: true,
        title: false,
        labelFontSize: 11,
        labelFormatter: (val: any) => formatAxisNumber(val),
      },
      y: {
        tick: true,
        title: false,
        labelFontSize: 11,
        labelFormatter: (val: any) => formatAxisLabel(val, 18),
      },
    },
    legend: {
      ...commonConfig?.legend,
      ...config?.legend,
    },
  };
};
  
// Ant Design Column Chart Config (Vertical Columns - categories on X axis)
const toAntColumnConfig = (config: WidgetConfig): WidgetConfig => {
  const chartHeight = getGuaranteedHeight(config?.height, 260);

  return {
    autoFit: commonConfig?.autoFit,
    height: chartHeight,
    xField: config?.xField,
    yField: config?.yField,
    seriesField: config?.seriesField,
    stack: config?.stack,
    colorField: config?.colorField,
    sort: config?.sort,
    group: config?.group,
    percent: config?.percent,
    normalize: config?.normalize,
    style: {
      inset: 2,
      ...config?.style,
    },    
    interaction: {
      elementHighlight: false,
      tooltip: {
        shared: true,
      },
    },
    axis: {
      x: {
        tick: true,
        title: false,
        labelFontSize: 11,
        labelTransform: 'rotate(-35deg)',
        labelSpacing: 6,
        labelFormatter: (val: any) => formatAxisLabel(val, 14),
      },
      y: {
        grid: true,
        tick: true,
        title: false,
        labelFontSize: 11,
        labelFormatter: (val: any) => formatAxisNumber(val),
      },
    },
    legend: {
      ...commonConfig?.legend,
      ...config?.legend,
    },
  };
};
  
// Ant Design Line Chart Config
const toAntLineConfig = (config: WidgetConfig): WidgetConfig => {
  const chartHeight = getGuaranteedHeight(config?.height, 260);

  const lc = {
    autoFit: commonConfig?.autoFit,
    height: chartHeight,
    xField: config?.xField,
    yField: config?.yField,
    seriesField: config?.seriesField,
    colorField: config?.colorField,
    point: config?.point || { size: 3, shape: 'circle' },
    interaction: config?.interaction,
    style: config?.style,
    axis: {
      x: {
        tick: true,
        title: false,
        labelFontSize: 11,
        labelTransform: 'rotate(-35deg)',
        labelSpacing: 6,
        labelFormatter: (val: any) => formatAxisLabel(val, 14),
      },
      y: {
        grid: true,
        tick: true,
        title: false,
        labelFontSize: 11,
        labelFormatter: (val: any) => formatAxisNumber(val),
      },
    },
    legend: {
      ...commonConfig?.legend,
      ...config?.legend,
    },
  } as any;

  if (config?.tooltip === false) {
    lc['tooltip'] = false;
  }
  return lc;
};
  
// Ant Design Area Chart Config
const toAntAreaConfig = (config: WidgetConfig): WidgetConfig => {
  const chartHeight = getGuaranteedHeight(config?.height, 260);

  return {
    autoFit: commonConfig?.autoFit,
    height: chartHeight,
    xField: config?.xField,
    yField: config?.yField,
    colorField: config?.colorField,
    shapeField: 'smooth',
    stack: config?.stack, 
    normalize: config?.normalize,
    axis: {
      x: {
        tick: true,
        title: false,
        labelFontSize: 11,
        labelTransform: 'rotate(-35deg)',
        labelSpacing: 6,
        labelFormatter: (val: any) => formatAxisLabel(val, 14),
      },
      y: {
        grid: true,
        tick: true,
        title: false,
        labelFontSize: 11,
        labelFormatter: (val: any) => formatAxisNumber(val),
      },
    },
    tooltip: { channel: 'y0' },
    legend: {
      ...commonConfig?.legend,
      ...config?.legend,
    },
  };
};
  
// Ant Design Pie Chart Config
const toAntPieConfig = (config: WidgetConfig): WidgetConfig => {
  const chartHeight = getGuaranteedHeight(config?.height, 260);

  return {
    autoFit: commonConfig?.autoFit,
    height: chartHeight,
    angleField: config?.yField,
    colorField: config?.colorField || config?.xField,
    innerRadius: config?.innerRadius || 0.6,
    label: {
      text: (d: any) => `${d[config?.colorField || config?.xField || '']}: ${d[config?.yField || '']}`,
      position: 'outside',
      style: {
        fontSize: 10,
        fontWeight: 'normal',
      },
    },
    legend: {
      ...commonConfig?.legend,
      ...config?.legend,
    },
  };
};
  
// Ant Design Scatter Chart Config
const toAntScatterConfig = (config: WidgetConfig): WidgetConfig => {
  const chartHeight = getGuaranteedHeight(config?.height, 260);

  return {
    autoFit: commonConfig?.autoFit,
    height: chartHeight,
    xField: config?.xField,
    yField: config?.yField,
    colorField: config?.colorField,
    sizeField: config?.sizeField,
    shapeField: config?.shapeField,
    style: { fillOpacity: 0.5, lineWidth: 1 },
    axis: {
      x: {
        grid: true,
        tick: true,
        title: false,
        labelFontSize: 11,
        labelFormatter: (val: any) => formatAxisNumber(val),
      },
      y: {
        grid: true,
        tick: true,
        title: false,
        labelFontSize: 11,
        labelFormatter: (val: any) => formatAxisNumber(val),
      },
    },
    legend: {
      ...commonConfig?.legend,
      ...config?.legend,
    },
  };
};
  
// Ant Design Dual Axis Chart Config
const toAntDualAxisConfig = (config: WidgetConfig): WidgetConfig => {
  const chartHeight = getGuaranteedHeight(config?.height, 260);

  const legend = {
    ...commonConfig?.legend,
    ...config?.legend,
  };
  return {
    autoFit: commonConfig?.autoFit,
    height: chartHeight,
    xField: config?.xField,
    children: config?.children,
    legend: {
      ...legend,
      color: {
        ...legend.color,
        itemMarker: () => 'rect',
      },
    },
  };
};
  
// Ant Design Histogram Chart Config
const toAntHistogramConfig = (config: WidgetConfig): WidgetConfig => {
  const chartHeight = getGuaranteedHeight(config?.height, 260);

  return {
    autoFit: commonConfig?.autoFit,
    height: chartHeight,
    binField: config?.binField,
    binWidth: config?.binWidth,
    binNumber: config?.binNumber,
    colorField: config?.colorField,
    channel: 'count',
    stack: {
      orderBy: 'series',
    },
    style: {
      inset: 0.5,
    },
    interaction: {
      elementHighlight: false,
      tooltip: {
        shared: true,
      },
    },
    legend: {
      ...commonConfig?.legend,
      ...config?.legend,
    },
  };
};
  
// Ant Design Word Cloud Chart Config
const toAntWordCloudConfig = (config: WidgetConfig): WidgetConfig => {
  const chartHeight = getGuaranteedHeight(config?.height, 260);

  return {
    autoFit: commonConfig?.autoFit,
    height: chartHeight,
    layout: { spiral: 'rectangular' },
    textField: config?.colorField,
    colorField: config?.colorField,
  };
};
  
export { 
  toAntBarConfig,
  toAntColumnConfig,
  toAntLineConfig,
  toAntAreaConfig,
  toAntPieConfig,
  toAntScatterConfig,
  toAntDualAxisConfig,
  toAntHistogramConfig,
  toAntWordCloudConfig,
};