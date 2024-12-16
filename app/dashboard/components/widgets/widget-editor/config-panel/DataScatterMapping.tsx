import { IWidget } from "@/app/lib/drizzle/schemas";
import { TransformConfig, SeriesConfig } from "@/app/types/data";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select";

interface ChartConfigPanelProps {
    form: IWidget;
    columns: {
      all: string[];
      numeric: string[];
      nonNumeric: string[];
    };
    setForm: (update: IWidget) => void;
  }

export const DataScatterMapping: React.FC<{
    config: TransformConfig;
    columns: ChartConfigPanelProps['columns'];
    updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
  }> = ({ config, columns, updateSeriesConfig }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">X-Axis Values</label>
        <Select
          value={config.series?.[0]?.nameKey}
          onValueChange={(value) => {
            updateSeriesConfig(0, { nameKey: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select X Values" />
          </SelectTrigger>
          <SelectContent>
            {columns.numeric.map(col => (
              <SelectItem key={col} value={col}>{col}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
  
      <div className="space-y-2">
        <label className="text-sm font-medium">Y-Axis Values</label>
        <Select
          value={config.series?.[0]?.valueKey}
          onValueChange={(value) => {
            updateSeriesConfig(0, { valueKey: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Y Values" />
          </SelectTrigger>
          <SelectContent>
            {columns.numeric.map(col => (
              <SelectItem key={col} value={col}>{col}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );