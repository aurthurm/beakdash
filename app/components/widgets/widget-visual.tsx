'use client';

import React from 'react';
import { AppstoreOutlined } from '@ant-design/icons';
import { Widget } from '@/lib/db/schema';
import ChartWidget from '@/components/widgets/chart/chart';
import { WidgetHeader } from "@/components/widgets/widget-header";
import TableWidget from '@/components/widgets/chart/table-widget';

interface WidgetVisualProps {
  widget: Widget;
  dimensions?: {
    width: number;
    height: number;
  };
  isResizing?: boolean;
}

export const WidgetVisual = ({ 
  widget, 
  dimensions = { width: 0, height: 0 },
  isResizing = false
}: WidgetVisualProps) => {
  const { type, data, config } = widget;

  // Subtract header height (~44px) so chart receives exact inner body height
  const chartHeight = dimensions.height > 60 
    ? Math.max(dimensions.height - 48, 220) 
    : 260;

  const chartDimensions = {
    width: dimensions.width > 0 ? dimensions.width - 32 : undefined,
    height: chartHeight,
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-card">
      <div className="px-4 py-2.5 border-b shrink-0 bg-muted/10">
        <WidgetHeader name={widget.name} description={widget.description || undefined} />
      </div>
      <div className="px-3 py-2 flex-1 min-h-[200px] w-full overflow-hidden flex flex-col justify-center">
        {type === 'text' ? (
          <div className="text-sm font-medium leading-relaxed overflow-auto h-full p-2">
            {config?.textContent?.split('\n').map((line: string, i: number) => (
              <p key={i} className="break-words mb-1">{line || <br />}</p>
            )) || (
              <p className="text-muted-foreground">No content available</p>
            )}
          </div>
        ) : type === 'chart' ? (
          <div className="h-full w-full overflow-hidden flex items-center justify-center">
            <ChartWidget widget={widget} dimensions={chartDimensions as any} />
          </div>
        ) : type === 'table' ? (
          <div className="h-full w-full overflow-auto">
            <TableWidget data={data || []} config={{}} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
            <AppstoreOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
            <p className="text-xs">Unsupported widget type: {type}</p>
          </div>
        )}
      </div>
    </div>
  );
};