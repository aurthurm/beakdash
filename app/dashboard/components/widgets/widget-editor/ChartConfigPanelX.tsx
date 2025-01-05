'use client';

import React, { useState } from 'react';
import { 
  Settings, Columns, BarChart,
  Magnet
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/ui/components/tabs';
import { AggregationMethod, TransformConfig } from '@/app/types/data';
import { IChart, IWidget } from '@/app/lib/drizzle/schemas';

interface ChartConfigPanelProps {
  form: IWidget;
  columns: {
    all: string[];
    numeric: string[];
    nonNumeric: string[];
  };
  setForm: (update: IWidget) => void;
}

const ChartConfigPanel: React.FC<ChartConfigPanelProps> = ({ form, columns, setForm }) => {
  const [chartType, setChartType] = useState<IChart>(form.type);
  const [config, setConfig] = useState<TransformConfig>(form?.transformConfig || null);

  // Generic handlers
  const onChartTypeChange = (type: IChart) => {
    setChartType(type);
    
    // Preserve existing configuration while changing type
    const newConfig = { ...config };
    if (!newConfig.series) newConfig.series = [{}];

    // Preserve x-axis/category and y-axis/value when switching between chart types
    if (type === 'pie') {
      // When switching to pie chart
      newConfig.series[0] = {
        ...newConfig.series[0],
        nameKey: newConfig.series[0].categoryKey || newConfig.series[0].nameKey,
        valueKey: newConfig.series[0].valueKey
      };
      delete newConfig.series[0].categoryKey;
    } else {
      // When switching to bar/line chart
      newConfig.series[0] = {
        ...newConfig.series[0],
        categoryKey: newConfig.series[0].nameKey || newConfig.series[0].categoryKey,
        valueKey: newConfig.series[0].valueKey
      };
      delete newConfig.series[0].nameKey;
    }

    // Keep other configurations
    newConfig.rotateLabels = config?.rotateLabels ?? 0;
    newConfig.aggregation = config?.aggregation || {
      enabled: false,
      method: 'none' as AggregationMethod,
      groupBy: []
    };

    setConfig(newConfig);
    setForm({ ...form, type, transformConfig: newConfig });
  };

  // Rest of the code remains the same...
  const onBarLineAxisChange = (axis: 'x' | 'y', value: string) => {
    const newConfig = { ...config };
    if (!newConfig.series) newConfig.series = [{}];
    
    if (axis === 'x') {
      newConfig.series[0].categoryKey = value;
    } else {
      newConfig.series[0].valueKey = value;
    }
    
    updateConfig(newConfig);
  };

  const onPieChartConfigChange = (field: 'category' | 'value', value: string) => {
    const newConfig = { ...config };
    if (!newConfig.series) newConfig.series = [{}];
    
    if (field === 'category') {
      newConfig.series[0].nameKey = value;
      delete newConfig.series[0].categoryKey;
    } else {
      newConfig.series[0].valueKey = value;
    }
    
    updateConfig(newConfig);
  };

  const onAggregationEnableChange = (enabled: boolean) => {
    const newConfig = { ...config };
    if (!newConfig.aggregation) newConfig.aggregation = { enabled: false, method: undefined, groupBy: [] };
    newConfig.aggregation.enabled = enabled;
    updateConfig(newConfig);
  };

  const onAggregationMethodChange = (method: AggregationMethod) => {
    const newConfig = { ...config };
    if (!newConfig.aggregation) newConfig.aggregation = { enabled: true, method: undefined, groupBy: [] };
    newConfig.aggregation.method = method;
    updateConfig(newConfig);
  };

  const onGroupByChange = (selectedGroups: string[]) => {
    const newConfig = { ...config };
    if (!newConfig.aggregation) newConfig.aggregation = { enabled: true, method: undefined, groupBy: [] };
    newConfig.aggregation.groupBy = selectedGroups;
    updateConfig(newConfig);
  };

  const onRotateLabelsChange = (rotation: number) => {
    const newConfig = { ...config };
    newConfig.rotateLabels = rotation;
    updateConfig(newConfig);
  };

  const updateConfig = (newConfig: TransformConfig) => {
    setConfig(newConfig);
    setForm({ ...form, transformConfig: newConfig });
  };

  return (
    <Tabs defaultValue="generic">
      <TabsList className="w-full">
        <TabsTrigger value="generic">
          <Magnet className="w-4 h-4 mr-2" />
          Generic
        </TabsTrigger>
        <TabsTrigger value="axes">
          <Columns className="w-4 h-4 mr-2" />
          Axes
        </TabsTrigger>
        <TabsTrigger value="aggregation">
          <BarChart className="w-4 h-4 mr-2" />
          Aggregation
        </TabsTrigger>
        <TabsTrigger value="formatting">
          <Settings className="w-4 h-4 mr-2" />
          Formatting
        </TabsTrigger>
      </TabsList>

      <TabsContent value="generic" className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Chart Type</label>
          <Select value={chartType} onValueChange={onChartTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </TabsContent>

      <TabsContent value="axes" className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            {chartType === 'pie' ? 'Category' : 'X-Axis'}
          </label>
          <Select 
            value={chartType === 'pie' ? config?.series?.[0]?.nameKey : config?.series?.[0]?.categoryKey}
            onValueChange={(val) => 
              chartType === 'pie' 
                ? onPieChartConfigChange('category', val)
                : onBarLineAxisChange('x', val)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${chartType === 'pie' ? 'Category' : 'X-Axis'}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {columns?.all?.map(col => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            {chartType === 'pie' ? 'Value' : 'Y-Axis'}
          </label>
          <Select 
            value={config?.series?.[0]?.valueKey}
            onValueChange={(val) => 
              chartType === 'pie'
                ? onPieChartConfigChange('value', val)
                : onBarLineAxisChange('y', val)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {columns?.numeric?.map(col => (
                <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rotate Labels</label>
          <input 
            aria-label='Rotate Labels'
            type="number" 
            className="w-full p-2 border rounded"
            min={-90}
            max={90}
            step={5}
            value={config?.rotateLabels ?? 0}
            onChange={(e) => onRotateLabelsChange(parseInt(e.target.value))}
          />
        </div>
      </TabsContent>

      <TabsContent value="aggregation" className="space-y-4">
        <div>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox"
              checked={config?.aggregation?.enabled ?? false}
              onChange={(e) => onAggregationEnableChange(e.target.checked)}
            />
            <span>Enable Aggregation</span>
          </label>
        </div>

        {config?.aggregation?.enabled && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Method</label>
              <Select 
                value={config?.aggregation.method}
                onValueChange={(method: AggregationMethod) => onAggregationMethodChange(method)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select aggregation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="avg">Average</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="min">Minimum</SelectItem>
                  <SelectItem value="max">Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Group By</label>
              <select 
                multiple
                aria-label='Group By'
                className="w-full p-2 border rounded"
                value={config?.aggregation.groupBy}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  onGroupByChange(selected);
                }}
              >
                {columns?.all?.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="formatting" className="space-y-4">
        <p>Chart visual outlooks here</p>
      </TabsContent>
    </Tabs>
  );
};

export default ChartConfigPanel;