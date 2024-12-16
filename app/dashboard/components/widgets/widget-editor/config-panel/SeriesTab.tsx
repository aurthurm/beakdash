import { IWidget } from "@/app/lib/drizzle/schemas";
import { TransformConfig, SeriesConfig } from "@/app/types/data";
import { Card, CardContent } from "@/app/ui/components/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select";
import { Switch } from "@radix-ui/react-switch";
import { TabsContent } from "@radix-ui/react-tabs";

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
  