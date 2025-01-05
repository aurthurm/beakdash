'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ReactECharts, { EChartsOption } from 'echarts-for-react';
import { Settings, Grip, Trash2 } from 'lucide-react';
import { useDataSet } from '@/app/lib/hooks/useDataSet';
import AICopilotButton from '@/app/dashboard/components/AICopilot/AICopilotButton';
import { WidgetError } from '@/app/dashboard/components/widgets/states/WidgetError';
import { WidgetSkeleton } from '@/app/dashboard/components/widgets/states/WidgetSkeleton';
import { getChartOptions } from '@/app/lib/charts/chart-options';
import { useAuth } from '@clerk/nextjs';
import { IVisual, IWidget } from '@/app/lib/drizzle/schemas';

interface WidgetProps {
  widget: IWidget;
  onEdit: (widget: IWidget) => void;
  onDelete: (id: string) => void;
}

const WidgetVisual: React.FC<WidgetProps> = ({ widget, onEdit, onDelete }) => {
  const { userId } = useAuth()
  const { data, loading, error } = useDataSet(widget); 
  const [echartOption, setEchartOption] = useState<EChartsOption>(null);

  const isChart = (widget.type as IVisual) !== 'count';

  const getEChartOption = useCallback(() => {
    const chartOpts = getChartOptions(widget, data);
    setEchartOption(chartOpts);
  },[data, widget])

  
  useEffect(() => {
    getEChartOption();
  }, [getEChartOption, widget.transformConfig]);

  if (loading) {
    return <WidgetSkeleton type={widget.type} />;
  }
  
  if (error) {
    return (<>
      <WidgetError
        message={error.message}
        onRetry={() => window.location.reload()}
        onEdit={() => onEdit(widget)}
      />
    </>);
  }

  return (
    <div id={widget.id} className="h-full">
      <div className="flex justify-between items-start px-4 pt-4 pb-2">
        <div>
          <h3 className="font-semibold">{widget.title}</h3>
          {widget.subtitle && (
            <p className="text-sm text-gray-500">{widget.subtitle}</p>
          )}
        </div>
        <div className="flex gap-2">
          <AICopilotButton 
            variant='icon' 
            widget={widget}
            userId={userId!}
            pageId={widget.pageId}
          />
          <button
            onClick={() => onEdit(widget)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => onDelete(widget.id!)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Trash2 size={20} />
          </button>
          {isChart && (
            <button 
            aria-label='Drag Widget'
            className="p-2 hover:bg-gray-100 rounded-lg drag-handle">
              <Grip size={20} />
            </button>
          )}
        </div>
      </div>
      <hr />
      <div className='p-4 h-full'>
        {isChart && echartOption ? (
          <ReactECharts
            option={echartOption}
            style={{ height: 'calc(100% - 4rem)' }}
          />
        ) : (
          <div className="mt-4">
            <p>number here</p>
            {/* <div className="text-3xl font-bold">{form.data.value}</div>
            {form.data.change && (
              <div className={`flex items-center gap-1 mt-2 ${
                form.data.change > 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {form.data.change > 0 ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )}
                <span>{Math.abs(form.data.change)}%</span>
              </div>
            )} */}
          </div>
        )}
      </div>
    </div>
  );
};

export default WidgetVisual;