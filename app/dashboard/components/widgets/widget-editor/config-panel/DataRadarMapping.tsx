import { IWidget } from "@/app/lib/drizzle/schemas";
import { TransformConfig, SeriesConfig } from "@/app/types/data";
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

export const DataRadarMapping: React.FC<{
    config: TransformConfig;
    columns: ChartConfigPanelProps['columns'];
    updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
  }> = ({ config, columns, updateSeriesConfig }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Category Field</label>
        <Select
          value={config.series?.[0]?.nameKey}
          onValueChange={(value) => {
            updateSeriesConfig(0, { nameKey: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Category Field" />
          </SelectTrigger>
          <SelectContent>
            {columns.nonNumeric.map(col => (
              <SelectItem key={col} value={col}>{col}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
  
      <div className="space-y-2">
        <label className="text-sm font-medium">Metric Fields</label>
        <select
          multiple
          aria-label="Metric Fields"
          className="w-full p-2 border rounded"
          value={config.series?.[0]?.extraKeys || []}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
            updateSeriesConfig(0, { extraKeys: selected });
          }}
        >
          {columns.numeric.map(col => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>
      </div>
    </div>
  );