import { IWidget } from "@/app/lib/drizzle/schemas";
import { TransformConfig, SeriesConfig, AggregationMethod } from "@/app/types/data";
import { Card, CardContent } from "@/app/ui/components/card";
import { Separator, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select";
import { Switch } from "@radix-ui/react-switch";
import { TabsContent } from "@radix-ui/react-tabs";
import { DataAxisMapping } from "./DataAxisMapping";
import { DataHeatmapMapping } from "./DataHeatmapMapping";
import { DataPieMapping } from "./DataPieMapping";
import { SecondaryAxisConfig } from "./SecondaryAxisConfig";
import { StackingConfig } from "./StackingConfig";
import { DataHierarchicalMapping } from "./DataHierarchicalMapping";
import { DataRadarMapping } from "./DataRadarMapping";
import { DataScatterMapping } from "./DataScatterMapping";

const AGG_METHODS: Array<{ value: AggregationMethod; label: string }> = [
    { value: 'sum', label: 'Sum' },
    { value: 'avg', label: 'Average' },
    { value: 'count', label: 'Count' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' },
    { value: 'median', label: 'Median' },
    { value: 'distinct', label: 'Distinct Count' }
  ];
  
interface ChartConfigPanelProps {
    form: IWidget;
    columns: {
      all: string[];
      numeric: string[];
      nonNumeric: string[];
    };
    setForm: (update: IWidget) => void;
  }

export const DataTab: React.FC<{
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