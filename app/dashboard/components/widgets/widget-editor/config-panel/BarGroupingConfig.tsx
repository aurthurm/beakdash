import { IWidget } from "@/app/lib/drizzle/schemas";
import { TransformConfig, AntChartOptions } from "@/app/types/data";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/ui/components/select";


interface ChartConfigPanelProps {
    form: IWidget;
    columns: {
      all: string[];
      numeric: string[];
      nonNumeric: string[];
    };
    setForm: (update: IWidget) => void;
  }

export const BarGroupingConfig: React.FC<{
  config: TransformConfig;
  columns: ChartConfigPanelProps['columns'];
  updateAntChartOptions: (updates: Partial<AntChartOptions>) => void;
}> = ({ config, columns, updateAntChartOptions }) => {
  const barMode = config.options?.stack ? "stacked" : 
                 config.options?.group ? "grouped" : "normal";

  return (
      <div className="space-y-4">
          <div className="space-y-2">
              <label className="text-sm font-medium">Bar Mode</label>
              <Select
                  value={barMode}
                  onValueChange={(value) => {
                      if (value === "normal") {
                          // Remove both stackKey and yField for normal bars
                          updateAntChartOptions({ 
                            //   stackKey: undefined,
                              yField: undefined 
                          });
                      } else if (value === "grouped") {
                          // For grouped bars, set yField but ensure stackKey is undefined
                          updateAntChartOptions({
                            //   stackKey: undefined,
                              yField: columns.all[0] // or let user select the grouping field
                          });
                      } else if (value === "stacked") {
                          // For stacked, set stackKey (could use same field as grouping)
                          updateAntChartOptions({ 
                              yField: undefined,
                            //   stackKey: columns.all[0] 
                          });
                      }
                  }}
              >
                  <SelectTrigger>
                      <SelectValue placeholder="Select Bar Mode" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="grouped">Grouped</SelectItem>
                      <SelectItem value="stacked">Stacked</SelectItem>
                  </SelectContent>
              </Select>
          </div>


          {/* Additional field selector for grouped/stacked field */}
          {barMode !== "normal" && (
              <div className="space-y-2">
                  <label className="text-sm font-medium">
                      {barMode === "grouped" ? "Group By Field" : "Stack By Field"}
                  </label>
                  <Select
                    //   value={barMode === "grouped" ? 
                    //       config.options.yField : 
                    //       config.options.stackKey}
                    //   onValueChange={(value) => {
                    //       if (barMode === "grouped") {
                    //           updateAntChartOptions(0, { yField: value });
                    //       } else {
                    //           updateAntChartOptions(0, { stackKey: value });
                    //       }
                    //   }}
                  >
                      <SelectTrigger>
                          <SelectValue placeholder={`Select ${barMode === "grouped" ? "Group" : "Stack"} Field`} />
                      </SelectTrigger>
                      <SelectContent>
                          {columns.all.map(col => (
                              <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
              </div>
          )}
      </div>
  );
};