'use client';

import React from 'react';
import ReactECharts from 'echarts-for-react';
import { Settings, Grip, Trash2 } from 'lucide-react';
import ChartTypeToggle from '@/app/dashboard/components/widgets/ChartTypeToggle';
import { useDataSet } from '@/app/lib/hooks/useDataSet';
import AICopilotButton from '@/app/dashboard/components/AICopilot/AICopilotButton';
import { WidgetError } from '@/app/dashboard/components/widgets/states/WidgetError';
import { WidgetSkeleton } from '@/app/dashboard/components/widgets/states/WidgetSkeleton';
import { getChartOptions } from '@/app/lib/charts/chart-options';
import { IWidget } from '@/app/lib/drizzle/schemas';

interface WidgetProps {
  widget: IWidget;
  onEdit: (widget: IWidget) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, data: Partial<IWidget>) => void;
}

const WidgetVisual: React.FC<WidgetProps> = ({ widget, onEdit, onDelete, onUpdate }) => {
  const { data, loading, error } = useDataSet(widget); 

  const isChart = widget.type !== 'count';

  if (loading) {
    return <WidgetSkeleton type={widget.type} />;
  }

  const handleEdit = () => {
    onEdit(widget)
  };
  
  if (error) {
    return (<>
      <WidgetError
        message={error.message}
        onRetry={() => window.location.reload()}
        onEdit={() => handleEdit()}
      />
    </>);
  }

  const getEChartOptions = () => getChartOptions(widget, data)

  const handleUpdate = (type: IWidget['type']) => {
    onUpdate(widget.id!, { type });
  };

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
            widgetId={widget.id}
            context={`Widget ID: ${widget.id}\nTitle: ${widget.title}\nType: ${widget.type}\nQuery: ${widget.sql}`}
          />
          {isChart && (
            <ChartTypeToggle
              currentChart={widget.type!}
              onChange={handleUpdate}
            />
          )}
          <button
            onClick={() => handleEdit()}
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
        {isChart ? (
          <ReactECharts
            option={getEChartOptions()}
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