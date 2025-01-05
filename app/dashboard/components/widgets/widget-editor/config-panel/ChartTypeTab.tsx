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
  }> = ({ form, setForm }) => (
    <TabsContent value="chart">
      <Card className="shadow-sm rounded-sm max-h-[650px] overflow-y-scroll">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chart Type</label>
              <Select
                value={form.type}
                onValueChange={(value) => setForm({ ...form, 'type': value as IChart })}
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