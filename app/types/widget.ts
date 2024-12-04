import { Dataset } from "./datasource";
import { TransformConfig } from "./data";

export interface WidgetLayout {
    i?: string;
    x: number;
    y: number;
    w: number;
    h: number;
  }
  
export type VisualType = 'number' | 'chart';
  
export type ChartType = 'line' | 'pie' | 'bar' | 'scatter' | 'radar' | 'heatmap' | 'tree' | 'sunburst'
  
export interface WidgetType {
    visual: VisualType;
    chart?: ChartType;
}
  
export interface Widget {
    id: string;
    pageId: string;
    subPageid?: string;
    type: WidgetType;
    title: string;
    subtitle?: string;
    layout: WidgetLayout;
    datasetId: string,
    dataset: Dataset;
    transformConfig: TransformConfig;
}

export interface WidgetState {
    widgets: Widget[];
    addWidget: (item : Widget) => void;
    updateWidget: (id: string, updates: Partial<Widget>) => void;
    removeWidget: (id: string) => void;
  }
  

