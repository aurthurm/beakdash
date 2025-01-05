import { IChart, IWidget } from "@/app/lib/drizzle/schemas";
import { TransformConfig, SeriesConfig } from "@/app/types/data";
import { Card, CardContent } from "@/app/ui/components/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/ui/components/select";
import { Switch } from "@/app/ui/components/switch";
import { TabsContent } from "@/app/ui/components/tabs";

interface ChartConfigPanelProps {
  form: IWidget;
  columns: {
    all: string[];
    numeric: string[];
    nonNumeric: string[];
  };
  setForm: (update: IWidget) => void;
}

export const SeriesTab: React.FC<{
  config: TransformConfig;
  columns: ChartConfigPanelProps['columns'];
  updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
  updateConfig: (config: Partial<TransformConfig>) => void;
  chartType: IChart;
}> = ({ config, columns, updateSeriesConfig, updateConfig, chartType }) => {
  
  const LABEL_POSITIONS = [
    { value: 'inside', label: 'Inside' },
    { value: 'outside', label: 'Outside' },
    { value: 'top', label: 'Top' },
    { value: 'bottom', label: 'Bottom' }
  ];

  const SERIES_TYPES = [
    { value: 'bar', label: 'Bar' },
    { value: 'line', label: 'Line' },
    { value: 'area', label: 'Area' }
  ];

  return (
    <TabsContent value="series" className="space-y-4">
      <Card className="shadow-sm rounded-sm max-h-[650px] overflow-y-scroll">
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
                  {index > 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Chart Type</label>
                      <Select
                        value={series.type || chartType}
                        onValueChange={(value) => updateSeriesConfig(
                          index, 
                          { type: value as IChart, ...(value === 'line' ? { stackKey: undefined } : {})},
                        )}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Chart Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {SERIES_TYPES.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Value Field</label>
                    <Select
                      value={series.valueKey}
                      onValueChange={(value) => updateSeriesConfig(index, { valueKey: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Value Field" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.all.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {index === 0 && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Category Field</label>
                      <Select
                        value={series.categoryKey}
                        onValueChange={(value) => {
                          // Update categoryKey for all series
                          config.series?.forEach((_, i) => {
                            updateSeriesConfig(i, { categoryKey: value });
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Category Field" />
                        </SelectTrigger>
                        <SelectContent>
                          {columns.all.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Series Name</label>
                    <Select
                      value={series.nameKey}
                      onValueChange={(value) => updateSeriesConfig(index, { nameKey: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Series Name" />
                      </SelectTrigger>
                      <SelectContent>
                        {columns.all.map(col => (
                          <SelectItem key={col} value={col}>{col}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor={`series-color-${index}`} className="text-sm font-medium">Color</label>
                    <input
                      id={`series-color-${index}`}
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

                  {['bar', 'line', 'area'].includes(series.type || chartType) && (
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
              const firstSeries = newConfig.series[0];
              newConfig.series.push({
                categoryKey: firstSeries.categoryKey,
                type: 'line',
                visible: true,
                axis: 'primary',
                showLabel: false,
                labelPosition: 'top'
              });
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