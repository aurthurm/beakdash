import { NumberFormatStyle, SortingOrder, TransformConfig } from "@/app/types/data";
import { Card, CardContent } from "@/app/ui/components/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/ui/components/select";
import { Switch } from "@/app/ui/components/switch";
import { TabsContent } from "@/app/ui/components/tabs";

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

export const FormattingTab: React.FC<{
    config: TransformConfig;
    columns: string[];
    updateConfig: (config: Partial<TransformConfig>) => void;
  }> = ({ config, updateConfig, columns }) => (
    <TabsContent value="formatting">
      <Card className="shadow-sm rounded-sm max-h-[650px] overflow-y-scroll">
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
            </>
          )}

        </CardContent>
      </Card>

      <Card className="shadow-sm rounded-sm mt-4 max-h-[650px] overflow-y-scroll">
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enable Sorting</label>
              <Switch
                checked={config.sorting?.enabled ?? false}
                onCheckedChange={(checked) => {
                  updateConfig({
                    sorting: {
                      ...config.sorting,
                      enabled: checked,
                      key: 'none',
                      order: 'none'
                    }
                  });
                }}
              />
          </div>
  
          {config.sorting?.enabled && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort Key</label>
                <Select
                  value={config.sorting?.key}
                  onValueChange={(key: string) => {
                    updateConfig({
                      sorting: {
                        ...(config.sorting ?? { enabled: false, order: 'none' }),
                        key
                      }
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select sort key" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((col, idx) => (
                      <SelectItem key={idx} value={col}>{col}</SelectItem>
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
                        ...(config.sorting || { enabled: false, key: 'none' }),
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
  