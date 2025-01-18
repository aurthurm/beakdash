import { IChart, IWidget } from "@/app/lib/drizzle/schemas";
import { TransformConfig, AntChartOptions } from "@/app/types/data";
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
  updateAntChartOptions: (updates: Partial<AntChartOptions>) => void;
  updateConfig: (config: Partial<TransformConfig>) => void;
  chartType: IChart;
}> = ({ config, columns, updateAntChartOptions, updateConfig, chartType }) => {
  
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
    <TabsContent value="options" className="space-y-4">
      <Card className="shadow-sm rounded-sm max-h-[650px] overflow-y-scroll">
        <CardContent className="pt-6 space-y-4">
          {/* {config.options?.map((options, index) => (
            
          ))} */}

          <button
            onClick={() => {
              const newConfig = { ...config };
              // if (!newConfig.options) newConfig.options = [];
              // const firstSeries = newConfig.options[0];
              // newConfig.options.push({
              //   categoryKey: firstSeries.categoryKey,
              //   type: 'line',
              //   visible: true,
              //   axis: 'primary',
              //   showLabel: false,
              //   labelPosition: 'top'
              // });
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