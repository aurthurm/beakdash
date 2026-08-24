import {
  Bar,
  Column, 
  Line, 
  Area, 
  Pie,
  Scatter,
  DualAxes,
  Histogram,
  WordCloud,
} from '@ant-design/charts';
import { makesureNumeric } from "@/lib/utils";
import { normalizeData } from "@/lib/data/utils";
import { WidgetConfig } from '@/lib/db/schema';
import * as antConfig  from '@/lib/charts/antdesign';


// Render a bar chart
const renderBarChart = (config: WidgetConfig, data: Record<string, any>[]) => {
  if(!config?.xField || !config?.yField) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Configure Chart!!</div>;
  }
  data = makesureNumeric(data || []);
  const antBarConfig = antConfig.toAntBarConfig(config);
  return <Bar data={data} {...antBarConfig} />;
};

// Render a column chart
const renderColumnChart = (config: WidgetConfig, data: Record<string, any>[]) => {
  if(!config?.xField || !config?.yField) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Configure Chart!!</div>;
  }
  
  data = makesureNumeric(data || []);
  const antBarConfig = antConfig.toAntBarConfig(config);
  return <Column data={data} {...antBarConfig} />;
};

// Render a line chart
const renderLineChart = (config: WidgetConfig, data: Record<string, any>[]) => {  
  
  if(!config?.xField || !config?.yField) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Configure Chart!!</div>;
  }
  
  data = makesureNumeric(data || []);
  const antLineConfig = antConfig.toAntLineConfig(config);
  return <Line data={data} {...antLineConfig} />;
};

// Render an area chart
const renderAreaChart = (config: WidgetConfig, data: Record<string, any>[]) => {
  if(!config?.xField || !config?.yField) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Configure Chart!!</div>;
  }
  data = makesureNumeric(data || []);
  if(config?.colorField) {
    data = normalizeData(data, {
      xField: config?.xField!,
      yField: config?.yField!,
      colorField: config?.colorField!,
    });
  }
  const antAreaConfig = antConfig.toAntAreaConfig(config);
  return <Area data={data} {...(antAreaConfig as any)} />;

};

// Render a pie chart / donut chart
const renderPieChart = (config: WidgetConfig, data: Record<string, any>[]) => {
  if(!config?.yField) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Configure Chart!!</div>;
  }
  data = makesureNumeric(data || []);
  const antPieConfig = antConfig.toAntPieConfig(config);
  return <Pie data={data} {...antPieConfig} />;
};

// Render a scatter plot
const renderScatterPlot = (config: WidgetConfig, data: Record<string, any>[]) => {
  if(!config?.xField || !config?.yField) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Configure Chart!!</div>;
  }
  data = makesureNumeric(data || []);
  const antScatterConfig = antConfig.toAntScatterConfig(config);
  return <Scatter data={data} {...antScatterConfig} />;
};

// Render a dual axis chart
const renderDualAxisChart = (config: WidgetConfig, data: Record<string, any>[]) => {
  if(!config?.xField) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Configure Chart!!</div>;
  }
  data = makesureNumeric(data || []);
  const antDualAxisConfig = antConfig.toAntDualAxisConfig(config);
  return <DualAxes data={data} {...antDualAxisConfig} />;
};

// Render a Histogram chart
const renderHistogramChart = (config: WidgetConfig, data: Record<string, any>[]) => {
  if(!config?.binField) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Configure Chart!!</div>;
  }
  data = makesureNumeric(data || []);
  const antHistogramConfig = antConfig.toAntHistogramConfig(config);
  return <Histogram data={data} {...antHistogramConfig} />;
};

const renderWordCloud = (config: WidgetConfig, data: Record<string, any>[]) => {
  if(!config?.colorField) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Configure Chart!!</div>;
  }
  data = makesureNumeric(data || []);
  const antWordCloudConfig = antConfig.toAntWordCloudConfig(config);
  return <WordCloud data={data} {...antWordCloudConfig} />;
};


export { 
  renderBarChart, 
  renderColumnChart, 
  renderLineChart, 
  renderAreaChart, 
  renderPieChart, 
  renderScatterPlot, 
  renderDualAxisChart, 
  renderHistogramChart, 
  renderWordCloud 
};