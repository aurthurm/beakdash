import React from 'react';
import { Widget, WidgetConfig } from "@/lib/db/schema";
import * as renders from './renders';
import StatCardWidget from './stat-card-widget';
import CounterWidget from './counter-widget';

interface ChartWidgetProps {
  widget: Widget;
  dimensions?: {
    width: number;
    height: number;
  };
}

export function ChartWidget({ widget, dimensions }: ChartWidgetProps) {
  let { data, config } = widget;
  
  if (!data || !data.length) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">No data available</div>;
  }

  const commonConfig = {
    height: dimensions?.height,
    width: dimensions?.width,
  };
  config = { ...commonConfig, ...config } as WidgetConfig;

  switch (config.chartType) {
    case "stat-card":
      return <StatCardWidget data={data} config={config as any} />;
    case "counter":
      return <CounterWidget data={data} config={config as any} />;
    case "bar":
      return renders.renderBarChart(config, data);
    case "column":
      return renders.renderColumnChart(config, data);
    case "line":
      return renders.renderLineChart(config, data);
    case "area":
      return renders.renderAreaChart(config, data);
    case "pie":
      return renders.renderPieChart(config, data);  
    case "scatter":
      return renders.renderScatterPlot(config, data);
    case "dual-axes":
      return renders.renderDualAxisChart(config, data);
    case "histogram":
      return renders.renderHistogramChart(config, data);
    case "word-cloud":
      return renders.renderWordCloud(config, data);
    default:
      return renders.renderColumnChart(config, data);
  }
}

export default ChartWidget;
