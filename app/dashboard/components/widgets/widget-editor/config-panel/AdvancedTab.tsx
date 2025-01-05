import { IWidget } from "@/app/lib/drizzle/schemas";
import { TransformConfig } from "@/app/types/data";
import { Card, CardContent } from "@/app/ui/components/card";
import { TabsContent } from "@/app/ui/components/tabs";


interface ChartConfigPanelProps {
    form: IWidget;
    columns: {
      all: string[];
      numeric: string[];
      nonNumeric: string[];
    };
    setForm: (update: IWidget) => void;
  }

export const AdvancedTab: React.FC<{
    config: TransformConfig;
    columns: ChartConfigPanelProps['columns'];
    updateConfig: (config: Partial<TransformConfig>) => void;
  }> = () => (
    <TabsContent value="advanced">
      <Card className="shadow-sm rounded-sm max-h-[650px] overflow-y-scroll">
        <CardContent className="pt-6">
          {/* Add advanced options here */}
        </CardContent>
      </Card>
    </TabsContent>
  );
  