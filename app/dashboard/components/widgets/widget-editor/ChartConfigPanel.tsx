'use client';

import React, { useState, useCallback } from 'react';
import {
  Settings, Columns, BarChart, Magnet,
  LineChart, Filter
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/ui/components/tabs';
import { Switch } from "@/app/ui/components/switch";
import {
  Card,
  CardContent,
} from "@/app/ui/components/card";
import { Separator } from "@/app/ui/components/separator";
import {
  AggregationMethod,
  TransformConfig,
  NumberFormatStyle,
  SortingOrder,
  SeriesConfig,
  FiltersOps,
  Filters
} from '@/app/types/data';
import { IWidget, wtypes } from '@/app/lib/drizzle/schemas';



const AGG_METHODS: Array<{ value: AggregationMethod; label: string }> = [
  { value: 'sum', label: 'Sum' },
  { value: 'avg', label: 'Average' },
  { value: 'count', label: 'Count' },
  { value: 'min', label: 'Minimum' },
  { value: 'max', label: 'Maximum' },
  { value: 'median', label: 'Median' },
  { value: 'distinct', label: 'Distinct Count' }
];

const FILTER_OPERATORS: Array<{ value: FiltersOps; label: string }> = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'notContains', label: 'Not Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'gt', label: 'Greater Than' },
  { value: 'gte', label: 'Greater Than or Equal' },
  { value: 'lt', label: 'Less Than' },
  { value: 'lte', label: 'Less Than or Equal' },
  { value: 'between', label: 'Between' },
  { value: 'in', label: 'In List' },
  { value: 'notIn', label: 'Not In List' },
  { value: 'isNull', label: 'Is Null' },
  { value: 'isNotNull', label: 'Is Not Null' },
  { value: 'regex', label: 'Regex Match' }
];

const NUMBER_FORMAT_STYLES: Array<{ value: NumberFormatStyle; label: string }> = [
  { value: 'decimal', label: 'Decimal' },
  { value: 'currency', label: 'Currency' },
  { value: 'percent', label: 'Percentage' },
  { value: 'unit', label: 'Unit' }
];

const SORT_ORDERS: Array<{ value: SortingOrder; label: string }> = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
  { value: 'none', label: 'None' }
];

const DEFAULT_CONFIG: TransformConfig = {
  series: [{}],
  rotateLabels: 45,
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

  const updateSeriesConfig = useCallback((index: number, updates: Partial<SeriesConfig>) => {
    const newConfig = { ...config };
    if (!newConfig.series) newConfig.series = [{}];
    newConfig.series[index] = { ...newConfig.series[index], ...updates };
    updateConfig(newConfig);
  }, [config, updateConfig]);

  return (
    <Tabs defaultValue="chart">
      <TabsList className="w-full grid grid-cols-6">
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
        <TabsTrigger value="formatting">
          <Settings className="w-4 h-4 mr-2" />
          Format
        </TabsTrigger>
        <TabsTrigger value="advanced">
          <Magnet className="w-4 h-4 mr-2" />
          Advanced
        </TabsTrigger>
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
        updateSeriesConfig={updateSeriesConfig}
        chartType={form.type}
      />

      <SeriesTab
        config={config}
        columns={columns}
        updateSeriesConfig={updateSeriesConfig}
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


// For scatter plots
const DataScatterMapping: React.FC<{
  config: TransformConfig;
  columns: ChartConfigPanelProps['columns'];
  updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
}> = ({ config, columns, updateSeriesConfig }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">X-Axis Values</label>
      <Select
        value={config.series?.[0]?.nameKey}
        onValueChange={(value) => {
          updateSeriesConfig(0, { nameKey: value });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select X Values" />
        </SelectTrigger>
        <SelectContent>
          {columns.numeric.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium">Y-Axis Values</label>
      <Select
        value={config.series?.[0]?.valueKey}
        onValueChange={(value) => {
          updateSeriesConfig(0, { valueKey: value });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Y Values" />
        </SelectTrigger>
        <SelectContent>
          {columns.numeric.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

// For radar charts
const DataRadarMapping: React.FC<{
  config: TransformConfig;
  columns: ChartConfigPanelProps['columns'];
  updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
}> = ({ config, columns, updateSeriesConfig }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">Category Field</label>
      <Select
        value={config.series?.[0]?.nameKey}
        onValueChange={(value) => {
          updateSeriesConfig(0, { nameKey: value });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Category Field" />
        </SelectTrigger>
        <SelectContent>
          {columns.nonNumeric.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium">Metric Fields</label>
      <select
        multiple
        aria-label="Metric Fields"
        className="w-full p-2 border rounded"
        value={config.series?.[0]?.extraKeys || []}
        onChange={(e) => {
          const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
          updateSeriesConfig(0, { extraKeys: selected });
        }}
      >
        {columns.numeric.map(col => (
          <option key={col} value={col}>{col}</option>
        ))}
      </select>
    </div>
  </div>
);

// For hierarchical charts (tree/sunburst)
const DataHierarchicalMapping: React.FC<{
  config: TransformConfig;
  columns: ChartConfigPanelProps['columns'];
  updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
}> = ({ config, columns, updateSeriesConfig }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">ID Field</label>
      <Select
        value={config.series?.[0]?.nameKey}
        onValueChange={(value) => {
          updateSeriesConfig(0, { nameKey: value });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select ID Field" />
        </SelectTrigger>
        <SelectContent>
          {columns.all.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium">Parent ID Field</label>
      <Select
        value={config.series?.[0]?.categoryKey}
        onValueChange={(value) => {
          updateSeriesConfig(0, { categoryKey: value });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Parent ID Field" />
        </SelectTrigger>
        <SelectContent>
          {columns.all.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium">Value Field</label>
      <Select
        value={config.series?.[0]?.valueKey}
        onValueChange={(value) => {
          updateSeriesConfig(0, { valueKey: value });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Value Field" />
        </SelectTrigger>
        <SelectContent>
          {columns.numeric.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

// For stacked charts configuration
const StackingConfig: React.FC<{
  config: TransformConfig;
  columns: ChartConfigPanelProps['columns'];
  updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
}> = ({ config, columns, updateSeriesConfig }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">Stack By Field</label>
      <Select
        value={config.series?.[0]?.stackKey}
        onValueChange={(value) => {
          updateSeriesConfig(0, { stackKey: value });
        }}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Stack Field" />
        </SelectTrigger>
        <SelectContent>
          {columns.all.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

// For secondary axis configuration
const SecondaryAxisConfig: React.FC<{
  config: TransformConfig;
  updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
}> = ({ config, updateSeriesConfig }) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">Use Secondary Axis</label>
      <Switch
        checked={config.series?.[0]?.axis === 'secondary'}
        onCheckedChange={(checked) => {
          updateSeriesConfig(0, { axis: checked ? 'secondary' : 'primary' });
        }}
      />
    </div>
  </div>
);

// For filtering configuration
const FilteringTab: React.FC<{
  config: TransformConfig;
  columns: ChartConfigPanelProps['columns'];
  updateConfig: (config: Partial<TransformConfig>) => void;
}> = ({ config, columns, updateConfig }) => {
  const addFilter = () => {
    const newConfig = { ...config };
    if (!newConfig.filters) newConfig.filters = [];
    newConfig.filters.push({
      column: '',
      operator: 'equals',
      value: '',
      enabled: true
    });
    updateConfig(newConfig);
  };

  const updateFilter = (index: number, updates: Partial<Filters>) => {
    const newConfig = { ...config };
    if (!newConfig.filters) newConfig.filters = [];
    newConfig.filters[index] = { ...newConfig.filters[index], ...updates };
    updateConfig(newConfig);
  };

  const removeFilter = (index: number) => {
    const newConfig = { ...config };
    newConfig.filters = newConfig.filters?.filter((_, i) => i !== index);
    updateConfig(newConfig);
  };

  return (
    <TabsContent value="filtering" className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Filters</h3>
            <button
              onClick={addFilter}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Add Filter
            </button>
          </div>

          {config.filters?.map((filter, index) => (
            <FilterRow
              key={index}
              filter={filter}
              index={index}
              columns={columns}
              updateFilter={updateFilter}
              removeFilter={removeFilter}
            />
          ))}
        </CardContent>
      </Card>
    </TabsContent>
  );
};

// SeriesTab Component
const SeriesTab: React.FC<{
  config: TransformConfig;
  columns: ChartConfigPanelProps['columns'];
  updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
  updateConfig: (config: Partial<TransformConfig>) => void;
  chartType: IWidget['type'];
}> = ({ config, updateSeriesConfig, updateConfig, chartType }) => {
  const LABEL_POSITIONS = [
    { value: 'inside', label: 'Inside' },
    { value: 'outside', label: 'Outside' },
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' }
  ];

  return (
    <TabsContent value="series" className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          {config.series?.map((series, index) => (
            <div key={index} className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Series {index + 1}</label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={series.visible !== false}
                    onCheckedChange={(checked) => {
                      updateSeriesConfig(index, { visible: checked });
                    }}
                  />
                  {index > 0 && (
                    <button
                      onClick={() => {
                        const newConfig = { ...config };
                        newConfig.series = newConfig.series?.filter((_, i) => i !== index);
                        updateConfig(newConfig);
                      }}
                      className="text-destructive hover:text-destructive/90"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {series.visible !== false && (
                <>
                  <div className="space-y-2">
                    <label htmlFor="series-name" className="text-sm font-medium">Series Name</label>
                    <input
                      id="series-name"
                      type="text"
                      className="w-full p-2 border rounded"
                      value={series.nameKey || ''}
                      onChange={(e) => updateSeriesConfig(index, { nameKey: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="series-color"  className="text-sm font-medium">Color</label>
                    <input
                      id="series-color"
                      type="color"
                      value={series.color || '#000000'}
                      onChange={(e) => updateSeriesConfig(index, { color: e.target.value })}
                      className="w-full h-8 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Show Labels</label>
                    <Switch
                      checked={series.showLabel ?? false}
                      onCheckedChange={(checked) => {
                        updateSeriesConfig(index, { showLabel: checked });
                      }}
                    />
                  </div>

                  {series.showLabel && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Label Position</label>
                      <Select
                        value={series.labelPosition || 'top'}
                        onValueChange={(position) => {
                          updateSeriesConfig(index, { labelPosition: position as any });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select position" />
                        </SelectTrigger>
                        <SelectContent>
                          {LABEL_POSITIONS.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {['bar', 'line'].includes(chartType) && (
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Use Secondary Axis</label>
                      <Switch
                        checked={series.axis === 'secondary'}
                        onCheckedChange={(checked) => {
                          updateSeriesConfig(index, { axis: checked ? 'secondary' : 'primary' });
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          <button
            onClick={() => {
              const newConfig = { ...config };
              if (!newConfig.series) newConfig.series = [];
              newConfig.series.push({});
              updateConfig(newConfig);
            }}
            className="w-full p-2 border rounded hover:bg-gray-50"
          >
            Add Series
          </button>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

// Update the DataTab to include all chart types
const DataTab: React.FC<{
  config: TransformConfig;
  columns: ChartConfigPanelProps['columns'];
  updateConfig: (config: Partial<TransformConfig>) => void;
  updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
  chartType: IWidget['type'];
}> = ({ config, columns, updateConfig, updateSeriesConfig, chartType }) => {
  const isAxisChart = ['bar', 'line', 'area'].includes(chartType);
  const isPieChart = ['pie', 'donut'].includes(chartType);
  const isHeatmap = chartType === 'heatmap';
  const isScatter = chartType === 'scatter';
  const isRadar = chartType === 'radar';
  const isHierarchical = ['tree', 'sunburst'].includes(chartType);

  return (
    <TabsContent value="data" className="space-y-4">
      <Card>
        <CardContent className="pt-6 space-y-4">
          {/* Data Mapping Section */}
          {isAxisChart && (
            <>
              <DataAxisMapping
                config={config}
                columns={columns}
                updateSeriesConfig={updateSeriesConfig}
              />
              <Separator />
              <StackingConfig
                config={config}
                columns={columns}
                updateSeriesConfig={updateSeriesConfig}
              />
              <Separator />
              <SecondaryAxisConfig
                config={config}
                updateSeriesConfig={updateSeriesConfig}
              />
              <Separator />
            </>
          )}

          {isPieChart && (
            <>
              <DataPieMapping
                config={config}
                columns={columns}
                updateSeriesConfig={updateSeriesConfig}
              />
              <Separator />
            </>
          )}

          {isHeatmap && (
            <>
              <DataHeatmapMapping
                config={config}
                columns={columns}
                updateSeriesConfig={updateSeriesConfig}
              />
              <Separator />
            </>
          )}

          {isScatter && (
            <>
              <DataScatterMapping
                config={config}
                columns={columns}
                updateSeriesConfig={updateSeriesConfig}
              />
              <Separator />
            </>
          )}

          {isRadar && (
            <>
              <DataRadarMapping
                config={config}
                columns={columns}
                updateSeriesConfig={updateSeriesConfig}
              />
              <Separator />
            </>
          )}

          {isHierarchical && (
            <>
              <DataHierarchicalMapping
                config={config}
                columns={columns}
                updateSeriesConfig={updateSeriesConfig}
              />
              <Separator />
            </>
          )}

          {/* Aggregation Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Aggregation</label>
              <Switch
                checked={config.aggregation?.enabled ?? false}
                onCheckedChange={(checked) => {
                  updateConfig({
                    aggregation: {
                      ...config.aggregation,
                      enabled: checked,
                      method: checked ? config.aggregation?.method || 'sum' : undefined,
                      groupBy: checked ? config.aggregation?.groupBy || [] : []
                    }
                  });
                }}
              />
            </div>

            {config.aggregation?.enabled && (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Aggregation Method</label>
                  <Select
                    value={config.aggregation.method}
                    onValueChange={(method: AggregationMethod) => {
                      updateConfig({
                        aggregation: {
                          ...config.aggregation,
                          enabled: config.aggregation?.enabled ?? false,
                          method
                        }
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      {AGG_METHODS.map(({ value, label }) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor='field-groups' className="text-sm font-medium">Group By Fields</label>
                  <select
                    id='field-groups'
                    multiple
                    className="w-full p-2 border rounded"
                    value={config.aggregation.groupBy || []}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                      updateConfig({
                        aggregation: {
                          ...config.aggregation,
                          enabled: config.aggregation?.enabled ?? false,
                          groupBy: selected
                        }
                      });
                    }}
                  >
                    {columns.all.map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Exclude Null Values</label>
                  <Switch
                    checked={config.aggregation?.excludeNull ?? true}
                    onCheckedChange={(checked) => {
                      updateConfig({
                        aggregation: {
                          ...config.aggregation,
                          enabled: config.aggregation?.enabled ?? false,
                          excludeNull: checked
                        }
                      });
                    }}
                  />
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

const ChartTypeTab: React.FC<{
  form: IWidget;
  setForm: (form: IWidget) => void;
  config: TransformConfig;
  updateConfig: (config: Partial<TransformConfig>) => void;
}> = ({ form, setForm }) => (
  <TabsContent value="chart">
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Chart Type</label>
            <Select
              value={form.type}
              onValueChange={(value) => setForm({ ...form, 'type': value as IWidget['type'] })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select chart type" />
              </SelectTrigger>
              <SelectContent>
                {wtypes.map((value) => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  </TabsContent>
);

const DataAxisMapping: React.FC<{
  config: TransformConfig;
  columns: ChartConfigPanelProps['columns'];
  updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
}> = ({ config, columns, updateSeriesConfig }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">X-Axis Field</label>
      <Select
        value={config.series?.[0]?.nameKey}
        onValueChange={(value) => updateSeriesConfig(0, { nameKey: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select X-Axis field" />
        </SelectTrigger>
        <SelectContent>
          {columns.all.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium">Y-Axis Field</label>
      <Select
        value={config.series?.[0]?.valueKey}
        onValueChange={(value) => updateSeriesConfig(0, { valueKey: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select Y-Axis field" />
        </SelectTrigger>
        <SelectContent>
          {columns.numeric.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

const DataPieMapping: React.FC<{
  config: TransformConfig;
  columns: ChartConfigPanelProps['columns'];
  updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
}> = ({ config, columns, updateSeriesConfig }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">Labels Field</label>
      <Select
        value={config.series?.[0]?.nameKey}
        onValueChange={(value) => updateSeriesConfig(0, { nameKey: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select labels field" />
        </SelectTrigger>
        <SelectContent>
          {columns.all.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium">Values Field</label>
      <Select
        value={config.series?.[0]?.valueKey}
        onValueChange={(value) => updateSeriesConfig(0, { valueKey: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select values field" />
        </SelectTrigger>
        <SelectContent>
          {columns.numeric.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

const DataHeatmapMapping: React.FC<{
  config: TransformConfig;
  columns: ChartConfigPanelProps['columns'];
  updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
}> = ({ config, columns, updateSeriesConfig }) => (
  <div className="space-y-4">
    <div className="space-y-2">
      <label className="text-sm font-medium">Row Field</label>
      <Select
        value={config.series?.[0]?.nameKey}
        onValueChange={(value) => updateSeriesConfig(0, { nameKey: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select row field" />
        </SelectTrigger>
        <SelectContent>
          {columns.all.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium">Column Field</label>
      <Select
        value={config.series?.[0]?.categoryKey}
        onValueChange={(value) => updateSeriesConfig(0, { categoryKey: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select column field" />
        </SelectTrigger>
        <SelectContent>
          {columns.all.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium">Value Field</label>
      <Select
        value={config.series?.[0]?.valueKey}
        onValueChange={(value) => updateSeriesConfig(0, { valueKey: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select value field" />
        </SelectTrigger>
        <SelectContent>
          {columns.numeric.map(col => (
            <SelectItem key={col} value={col}>{col}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
);

const FilterRow: React.FC<{
  filter: Filters;
  index: number;
  columns: ChartConfigPanelProps['columns'];
  updateFilter: (index: number, updates: Partial<Filters>) => void;
  removeFilter: (index: number) => void;
}> = ({ filter, index, columns, updateFilter, removeFilter }) => (
  <div className="flex items-center gap-4">
    <Select
      value={filter.column}
      onValueChange={(value) => updateFilter(index, { column: value })}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select column" />
      </SelectTrigger>
      <SelectContent>
        {columns.all.map(col => (
          <SelectItem key={col} value={col}>{col}</SelectItem>
        ))}
      </SelectContent>
    </Select>

    <Select
      value={filter.operator}
      onValueChange={(value) => updateFilter(index, { operator: value as FiltersOps })}
    >
      <SelectTrigger className="w-[200px]">
        <SelectValue placeholder="Select operator" />
      </SelectTrigger>
      <SelectContent>
        {FILTER_OPERATORS.map(({ value, label }) => (
          <SelectItem key={value} value={value}>{label}</SelectItem>
        ))}
      </SelectContent>
    </Select>

    <input
      type="text"
      value={filter.value}
      onChange={(e) => updateFilter(index, { value: e.target.value })}
      className="flex-1 p-2 border rounded"
      placeholder="Value"
    />

    <button
      onClick={() => removeFilter(index)}
      className="p-2 text-destructive hover:text-destructive/90"
    >
      Remove
    </button>
  </div>
);

const FormattingTab: React.FC<{
  config: TransformConfig;
  updateConfig: (config: Partial<TransformConfig>) => void;
}> = ({ config, updateConfig }) => (
  <TabsContent value="formatting">
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Enable Number Formatting</label>
          <Switch
            checked={config.formatting?.enabled ?? false}
            onCheckedChange={(checked) => {
              updateConfig({
                formatting: {
                  ...config.formatting,
                  enabled: checked,
                  numberFormat: checked ? config.formatting?.numberFormat || {
                    style: 'decimal',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 2,
                    locale: 'en-US'
                  } : undefined
                }
              });
            }}
          />
        </div>

        {config.formatting?.enabled && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Format Style</label>
              <Select
                value={config.formatting.numberFormat?.style}
                onValueChange={(style: NumberFormatStyle) => {
                  updateConfig({
                    formatting: {
                      ...config.formatting,
                      enabled: config.formatting?.enabled ?? false,
                      numberFormat: {
                        ...config?.formatting?.numberFormat,
                        style
                      }
                    }
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format style" />
                </SelectTrigger>
                <SelectContent>
                  {NUMBER_FORMAT_STYLES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sort Order</label>
              <Select
                value={config.sorting?.order}
                onValueChange={(order: SortingOrder) => {
                  updateConfig({
                    sorting: {
                      ...config.sorting!,
                      order
                    }
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sort order" />
                </SelectTrigger>
                <SelectContent>
                  {SORT_ORDERS.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  </TabsContent>
);

const AdvancedTab: React.FC<{
  config: TransformConfig;
  columns: ChartConfigPanelProps['columns'];
  updateConfig: (config: Partial<TransformConfig>) => void;
}> = () => (
  <TabsContent value="advanced">
    <Card>
      <CardContent className="pt-6">
        {/* Add advanced options here */}
      </CardContent>
    </Card>
  </TabsContent>
);
