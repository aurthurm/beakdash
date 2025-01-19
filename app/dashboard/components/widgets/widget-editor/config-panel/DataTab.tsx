import { IChart, IWidget } from "@/app/lib/drizzle/schemas";
import { TransformConfig, AggregationMethod, AntChartOptions } from "@/app/types/data";
import { Card, CardContent } from "@/app/ui/components/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/ui/components/select";
import { Switch } from "@/app/ui/components/switch";
import { TabsContent } from "@/app/ui/components/tabs";
import { DataAxisMapping } from "./DataAxisMapping";
import { DataPieMapping } from "./DataPieMapping";
import { Separator } from "@/app/ui/components/separator";
import { DataDualAxisMapping } from "./DataDualMapping";

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
    updateAntChartOptions: (updates: Partial<AntChartOptions>) => void;
    chartType: IChart;
  }> = ({ config, columns, updateConfig, updateAntChartOptions, chartType }) => {
    const isAxisChart = ['column', 'bar', 'line', 'scatter'].includes(chartType);
    const isPieChart = ['pie', 'donut'].includes(chartType);
  
    return (
      <TabsContent value="data" className="space-y-4">
        <Card className="shadow-sm rounded-sm max-h-[650px] overflow-y-scroll">
          <CardContent className="pt-6 space-y-4">
            {/* Data Mapping Section */}
            {isAxisChart && (
              <>
                <DataAxisMapping
                  chartType={chartType}
                  config={config}
                  columns={columns}
                  updateAntChartOptions={updateAntChartOptions}
                />
                <Separator />
              </>
            )}
  
            {isPieChart && (
              <>
                <DataPieMapping
                  config={config}
                  columns={columns}
                  updateAntChartOptions={updateAntChartOptions}
                />
                <Separator />
              </>
            )}

            {chartType === 'dual-axes' && (
              <>
                <DataDualAxisMapping
                  config={config}
                  columns={columns}
                  updateAntChartOptions={updateAntChartOptions}
                />
                <Separator />
              </>
            )}
            
            {/* Aggregation Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Enable Aggregation</label>
                <span className="text-sx italic text-slate-400">For non SQL datasets</span>
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