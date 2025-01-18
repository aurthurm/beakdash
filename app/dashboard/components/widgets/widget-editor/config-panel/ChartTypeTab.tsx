import { IChart, IWidget, chartTypes } from "@/app/lib/drizzle/schemas";
import { TransformConfig } from "@/app/types/data";
import { Card, CardContent } from "@/app/ui/components/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/ui/components/select";
import { TabsContent } from "@/app/ui/components/tabs";

export const ChartTypeTab: React.FC<{
    form: IWidget;
    setForm: (form: IWidget) => void;
    config: TransformConfig;
    updateConfig: (config: Partial<TransformConfig>) => void;
  }> = ({ form, setForm }) => {

    const onChangeChartType = (value: string) => {
      const transformConfig = {
        ...form.transformConfig,
        options: {
          ...form.transformConfig?.options
        }
      };
    
      // Converting from any type to pie
      if (value === 'pie') {
        transformConfig.options = {
          ...transformConfig.options,
          // Preserve existing pie fields if they exist
          colorField: transformConfig.options?.colorField || transformConfig.options?.xField,
          angleField: transformConfig.options?.angleField || transformConfig.options?.yField,
        }
        // Clean up non-pie fields
        delete transformConfig.options?.xField;
        delete transformConfig.options?.yField;
      }
      // Converting from pie to other charts (line, bar, column)
      else if (['line', 'bar', 'column', 'scatter'].includes(value)) {
        transformConfig.options = {
          ...transformConfig.options,
          // Check if we're converting from pie chart
          xField: form.type === 'pie' ? transformConfig.options?.colorField : transformConfig.options?.xField,
          yField: form.type === 'pie' ? transformConfig.options?.angleField : transformConfig.options?.yField,
        }
        // Clean up pie fields
        delete transformConfig.options?.angleField;
      }
    
      setForm({
        ...form,
        type: value as IChart,
        transformConfig
      });
    };

    return (
    <TabsContent value="chart">
      <Card className="shadow-sm rounded-sm max-h-[650px] overflow-y-scroll">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chart Type</label>
              <Select
                value={form.type}
                onValueChange={(value) => onChangeChartType(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select chart type" />
                </SelectTrigger>
                <SelectContent>
                  {chartTypes.map((value) => (
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
 };