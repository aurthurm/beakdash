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
  
// For hierarchical charts (tree/sunburst)
export const DataHierarchicalMapping: React.FC<{
    config: TransformConfig;
    columns: ChartConfigPanelProps['columns'];
    updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
  }> = ({ config, columns, updateSeriesConfig }) => (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">ID Field</label>
        <Select
          value={config.series?.[0]?.nameKey}
          onValueChange={(value) => {
            updateSeriesConfig(0, { nameKey: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select ID Field" />
          </SelectTrigger>
          <SelectContent>
            {columns.all.map(col => (
              <SelectItem key={col} value={col}>{col}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
  
      <div className="space-y-2">
        <label className="text-sm font-medium">Parent ID Field</label>
        <Select
          value={config.series?.[0]?.categoryKey}
          onValueChange={(value) => {
            updateSeriesConfig(0, { categoryKey: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Parent ID Field" />
          </SelectTrigger>
          <SelectContent>
            {columns.all.map(col => (
              <SelectItem key={col} value={col}>{col}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
  
      <div className="space-y-2">
        <label className="text-sm font-medium">Value Field</label>
        <Select
          value={config.series?.[0]?.valueKey}
          onValueChange={(value) => {
            updateSeriesConfig(0, { valueKey: value });
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Value Field" />
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