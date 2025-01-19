import { IChart } from "@/app/lib/drizzle/schemas";
import { TransformConfig, AntChartOptions } from "@/app/types/data";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/ui/components/select";

interface IColumns {
  all: string[];
  numeric: string[];
  nonNumeric: string[];
}

export const DataAxisMapping: React.FC<{
    chartType: IChart;
    config: TransformConfig;
    columns: IColumns;
    updateAntChartOptions: (updates: Partial<AntChartOptions>) => void;
  }> = ({ config, columns, updateAntChartOptions, chartType }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">X-Axis Field</label>
        <Select
          value={config.options?.xField}
          onValueChange={(value) => updateAntChartOptions({ xField: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select X-Axis field" />
          </SelectTrigger>
          <SelectContent>
            {(chartType === 'scatter' ? columns.numeric : columns.all).map(col => (
              <SelectItem key={col} value={col}>{col}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
  
      <div className="space-y-2">
        <label className="text-sm font-medium">Y-Axis Field</label>
        <Select
          value={config.options?.yField}
          onValueChange={(value) => updateAntChartOptions({ yField: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Y-Axis field" />
          </SelectTrigger>
          <SelectContent>
            {columns.numeric.map(col => (
              <SelectItem key={col} value={col}>{col}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
          <label className="text-sm font-medium">Color Field</label>
          <Select
          value={config.options?.colorField}
          onValueChange={(value) => updateAntChartOptions({ colorField: value })}
          >
          <SelectTrigger>
              <SelectValue placeholder="Select color field" />
          </SelectTrigger>
          <SelectContent>
              {columns.all.map(col => (
              <SelectItem key={col} value={col}>{col}</SelectItem>
              ))}
          </SelectContent>
          </Select>
      </div>

      {chartType === 'scatter' && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Shape Field</label>
          <Select
            value={config.options?.shapeField}
            onValueChange={(value) => {
              updateAntChartOptions({ shapeField: value });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select field" />
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