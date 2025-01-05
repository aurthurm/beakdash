import { TransformConfig, Filters } from "@/app/types/data";
import { Card, CardContent } from "@/app/ui/components/card";
import { TabsContent } from "@radix-ui/react-tabs";
import { FilterRow } from "./FilterRow";
import { IWidget } from "@/app/lib/drizzle/schemas";

interface ChartConfigPanelProps {
    form: IWidget;
    columns: {
      all: string[];
      numeric: string[];
      nonNumeric: string[];
    };
    setForm: (update: IWidget) => void;
  }

export const FilteringTab: React.FC<{
    config: TransformConfig;
    columns: ChartConfigPanelProps['columns'];
    updateConfig: (config: Partial<TransformConfig>) => void;
  }> = ({ config, columns, updateConfig }) => {
    const addFilter = () => {
      const newConfig = { ...config };
      if (!newConfig.filters) newConfig.filters = [];
      newConfig.filters.push({
        column: '',
        operator: 'equals',
        value: '',
        enabled: true
      });
      updateConfig(newConfig);
    };
  
    const updateFilter = (index: number, updates: Partial<Filters>) => {
      const newConfig = { ...config };
      if (!newConfig.filters) newConfig.filters = [];
      newConfig.filters[index] = { ...newConfig.filters[index], ...updates };
      updateConfig(newConfig);
    };
  
    const removeFilter = (index: number) => {
      const newConfig = { ...config };
      newConfig.filters = newConfig.filters?.filter((_, i) => i !== index);
      updateConfig(newConfig);
    };
  
    return (
      <TabsContent value="filtering" className="space-y-4">
        <Card className="shadow-sm rounded-sm max-h-[650px] overflow-y-scroll">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Filters</h3>
              <button
                onClick={addFilter}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                Add Filter
              </button>
            </div>
  
            {config.filters?.map((filter, index) => (
              <FilterRow
                key={index}
                filter={filter}
                index={index}
                columns={columns}
                updateFilter={updateFilter}
                removeFilter={removeFilter}
              />
            ))}
          </CardContent>
        </Card>
      </TabsContent>
    );
  };