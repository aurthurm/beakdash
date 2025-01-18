'use client';

import React, { useState, useCallback } from 'react';
import {
  Columns, BarChart,
  LineChart, Filter
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/app/ui/components/tabs';
import {
  TransformConfig,
  AntChartOptions,
} from '@/app/types/data';
import { IWidget } from '@/app/lib/drizzle/schemas';
import { AdvancedTab } from './AdvancedTab';
import { ChartTypeTab } from './ChartTypeTab';
import { DataTab } from './DataTab';
import { FilteringTab } from './FilteringTab';
import { FormattingTab } from './FormattingTab';
import { SeriesTab } from './SeriesTab';


const DEFAULT_CONFIG: TransformConfig = {
  options: {},
  aggregation: {
    enabled: false,
    method: undefined,
    groupBy: [],
    excludeNull: true
  },
  sorting: {
    enabled: false,
    key: '',
    order: 'asc'
  },
  formatting: {
    enabled: false,
    numberFormat: {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      locale: 'en-US'
    }
  },
  filters: []
};

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
  const [config, setConfig] = useState<TransformConfig>(form?.transformConfig || DEFAULT_CONFIG);

  const updateConfig = useCallback((newConfig: Partial<TransformConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    setForm({ ...form, transformConfig: updatedConfig });
  }, [config, form, setForm]);

  const updateAntChartOptions = useCallback((updates: Partial<AntChartOptions>) => {
    const newConfig = { ...config };
    if (!newConfig.options) newConfig.options = {};
    newConfig.options = { ...newConfig.options, ...updates };
    updateConfig(newConfig);
  }, [config, updateConfig]);

  return (
    <Tabs defaultValue="chart">
      <TabsList className="w-full grid grid-cols-6 mb-1">
        <TabsTrigger value="chart">
          <BarChart className="w-4 h-4 mr-2" />
          Chart
        </TabsTrigger>
        <TabsTrigger value="data">
          <Columns className="w-4 h-4 mr-2" />
          Data
        </TabsTrigger>
        <TabsTrigger value="series">
          <LineChart className="w-4 h-4 mr-2" />
          Series
        </TabsTrigger>
        <TabsTrigger value="filtering">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </TabsTrigger>
        {/* <TabsTrigger value="formatting">
          <Settings className="w-4 h-4 mr-2" />
          Format
        </TabsTrigger>
        <TabsTrigger value="advanced">
          <Magnet className="w-4 h-4 mr-2" />
          Advanced
        </TabsTrigger> */}
      </TabsList>

      <ChartTypeTab
        form={form}
        setForm={setForm}
        config={config}
        updateConfig={updateConfig}
      />

      <DataTab
        config={config}
        columns={columns}
        updateConfig={updateConfig}
        updateAntChartOptions={updateAntChartOptions}
        chartType={form.type}
      />

      <SeriesTab
        config={config}
        columns={columns}
        updateAntChartOptions={updateAntChartOptions}
        updateConfig={updateConfig}
        chartType={form.type}
      />

      <FilteringTab
        config={config}
        columns={columns}
        updateConfig={updateConfig}
      />

      <FormattingTab
        config={config}
        columns={columns.all}
        updateConfig={updateConfig}
      />

      <AdvancedTab
        config={config}
        columns={columns}
        updateConfig={updateConfig}
      />
    </Tabs>
  );
};

export default ChartConfigPanel;
