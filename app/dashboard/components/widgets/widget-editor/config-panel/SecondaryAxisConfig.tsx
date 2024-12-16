import { TransformConfig, SeriesConfig } from "@/app/types/data";
import { Switch } from "@radix-ui/react-switch";

export const SecondaryAxisConfig: React.FC<{
    config: TransformConfig;
    updateSeriesConfig: (index: number, updates: Partial<SeriesConfig>) => void;
  }> = ({ config, updateSeriesConfig }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Use Secondary Axis</label>
        <Switch
          checked={config.series?.[0]?.axis === 'secondary'}
          onCheckedChange={(checked) => {
            updateSeriesConfig(0, { axis: checked ? 'secondary' : 'primary' });
          }}
        />
      </div>
    </div>
  );