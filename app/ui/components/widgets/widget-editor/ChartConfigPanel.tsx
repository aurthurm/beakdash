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
import { Aggregation, AggregationMethod, TransformConfig } from '@/app/types/data';
import { ChartType, Widget } from '@/app/types/widget';

interface ChartConfigPanelProps {
  widget: Widget;
  columns: {
    all: string[];
    numeric: string[];
    nonNumeric: string[];
  };
  onUpdate: (update: Partial<Widget>) => void;
}

const ChartConfigPanel: React.FC<ChartConfigPanelProps> = ({ widget, columns, onUpdate }) => {
  const [chartType, setChartType] = useState<ChartType>(widget.type.chart || 'bar');
  const [config, setConfig] = useState<TransformConfig>(widget.transformConfig);

  const onChartTypeChange = (ct: ChartType) => {
    setChartType(ct);
    onUpdate({...widget, type: {...widget.type, chart: ct}});
  };

  const onConfigChange = (config: TransformConfig) => {
    setConfig(config);
    onUpdate({...widget, transformConfig: config});
  }

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
            value={chartType === 'pie' ? config.series?.[0]?.nameKey : config.series?.[0]?.categoryKey}
            onValueChange={(val) => {
              const newConfig = { ...widget.transformConfig };
              if (!newConfig.series) newConfig.series = [{}];
              if (chartType === 'pie') {
                newConfig.series[0].nameKey = val;
              } else {
                newConfig.series[0].categoryKey = val;
              }
              onConfigChange(newConfig);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder={`Select ${chartType === 'pie' ? 'Category' : 'X-Axis'}`} />
            </SelectTrigger>
            <SelectContent>
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
            value={config.series?.[0]?.valueKey}
            onValueChange={(val) => {
              const newConfig = { ...widget.transformConfig };
              if (!newConfig.series) newConfig.series = [{}];
              newConfig.series[0].valueKey = val;
              onConfigChange(newConfig);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Value" />
            </SelectTrigger>
            <SelectContent>
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
            value={config.rotateLabels ?? 0}
            onChange={(e) => onConfigChange({
              ...widget.transformConfig,
              rotateLabels: parseInt(e.target.value)
            })}
          />
        </div>
      </TabsContent>

      <TabsContent value="aggregation" className="space-y-4">
        <div>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox"
              checked={config.aggregation?.enabled ?? false}
              onChange={(e) => onConfigChange({
                ...widget.transformConfig,
                aggregation: {
                  ...config.aggregation,
                  enabled: e.target.checked
                } as Aggregation
              })}
            />
            <span>Enable Aggregation</span>
          </label>
        </div>

        {config.aggregation?.enabled && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Method</label>
              <Select 
                value={config.aggregation.method}
                onValueChange={(method: AggregationMethod) => onConfigChange({
                  ...widget.transformConfig,
                  aggregation: {
                    ...config.aggregation,
                    method
                  } as Aggregation
                })}
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
                value={config.aggregation.groupBy}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  onConfigChange({
                    ...widget.transformConfig,
                    aggregation: {
                      ...config.aggregation,
                      groupBy: selected
                    } as Aggregation
                  });
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