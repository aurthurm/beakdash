import { TransformConfig, AntChartOptions, IDualSeries } from "@/app/types/data";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/ui/components/select";

interface ICoumns {
    all: string[];
    numeric: string[];
    nonNumeric: string[];
}

export const DataDualAxisMapping: React.FC<{
    config: TransformConfig;
    columns: ICoumns;
    updateAntChartOptions: (updates: Partial<AntChartOptions>) => void;
  }> = ({ config, columns, updateAntChartOptions }) => {
 
  const onUpdateChild = (index: number, updates: Partial<IDualSeries>) => {
    const children = [...config.options?.children || []];
    children[index] = { ...children[index], ...updates };
    updateAntChartOptions({ children });
  }

  return (
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
            {columns.all.map(col => (
              <SelectItem key={col} value={col}>{col}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {config.options?.children?.map((child, index) => (
        <div key={index}>
          <pre>{child.yField}</pre>
          <div className="space-y-2">
            <label className="text-sm font-medium">{index == 0 ? 'Primary' : 'Secondary'} Axis</label>
            <Select
              value={child.yField}
              onValueChange={(value) => onUpdateChild(index, { yField: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Y-Axis field" />
              </SelectTrigger>
              <SelectContent>
                {columns.all.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}

    </div>
  )
};