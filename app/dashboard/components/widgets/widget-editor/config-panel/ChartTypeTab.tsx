import { IWidget, wtypes } from "@/app/lib/drizzle/schemas";
import { TransformConfig } from "@/app/types/data";
import { Card, CardContent } from "@/app/ui/components/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select";
import { TabsContent } from "@radix-ui/react-tabs";

export const ChartTypeTab: React.FC<{
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