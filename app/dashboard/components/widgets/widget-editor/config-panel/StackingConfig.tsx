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
  
export const StackingConfig: React.FC<{
    config: TransformConfig;
    columns: ChartConfigPanelProps['columns'];
    updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
  }> = ({ config, columns, updateSeriesConfig }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Stack By Field</label>
        <Select
          value={config.series?.[0]?.stackKey}
          onValueChange={(value) => {
            updateSeriesConfig(0, { stackKey: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Stack Field" />
          </SelectTrigger>
          <SelectContent>
            {columns.all.map(col => (
              <SelectItem key={col} value={col}>{col}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );