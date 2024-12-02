'use client';

import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { Settings, Grip, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import WidgetEditorModal from '@/app/ui/components/widgets/widget-editor/WidgetEditorModal';
import { useWidgetStore } from '@/app/store/widgets';
import { Widget as WidgetType, ChartType } from '@/app/types/widget';
import ChartTypeToggle from '@/app/ui/components/widgets/ChartTypeToggle';
import { useDataSource } from '@/app/lib/hooks/useDataSource';
import AICopilotButton from '@/app/ui/components/AICopilot/AICopilotButton';
import { WidgetError } from '@/app/ui/components/widgets/states/WidgetError';
import { WidgetSkeleton } from '@/app/ui/components/widgets/states/WidgetSkeleton';
import { getChartOptions } from '@/app/lib/charts/chart-options';
import { DataPoint } from '@/app/types/data';

interface WidgetProps {
  widget: WidgetType;
}

const overrides = {
  // type: {
  //   visual: 'chart',
  //   chart: 'bar'
  // },
  // transformConfig: {
  //   series: [{
  //     categoryKey: 'test_name',
  //     valueKey: 'sum',
  //   }],
  // },
  dataSource: {
    type: 'sql',
    //query: "SELECT sample_type, test_name, SUM(total) FROM dashboard.rejection_rate_aggregate GROUP BY sample_type, test_name ORDER BY sample_type LIMIT 10",
    connectionString: "postgres://nmrl:password@localhost:5432/central_repository",
    refreshInterval: 5000000
  }
} as WidgetType;

const WidgetVisual: React.FC<WidgetProps> = ({ widget }) => {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { updateWidget, removeWidget } = useWidgetStore();
  const [editorData, setEditorData] = useState<DataPoint[]>([]);
  const { data, loading, error } = useDataSource(widget.dataSource); // widget?.dataSource ?? 

  const isChart = widget.type.visual === 'chart';

  if (loading) {
    return <WidgetSkeleton type={widget.type.visual === 'chart' ? 'chart' : 'number'} />;
  }

  const handleOpenEditor = () => {
    setEditorData(data);
    setIsEditOpen(true);
  };
  
  const handleCloseEditor = () => {
    setIsEditOpen(false);
    setEditorData(null);
  };

  if (error) {
    return (<>
      <WidgetEditorModal
        isOpen={isEditOpen}
        mode="edit"
        onClose={() => setIsEditOpen(false)}
        widget={{
          ...widget,
          ...overrides
        }}
        initData={editorData}
      />
      <WidgetError
        message={error.message}
        onRetry={() => window.location.reload()}
        onEdit={() => setIsEditOpen(true)}
      />
    </>);
  }

  // console.log("data !!!!!!!!!!!!!!!!!!!!!!!!!: ", data);

  const getEChartOptions = () => getChartOptions({
    ...widget,
    ...overrides
  }, data)

  const handleChartTypeChange = (chart: ChartType) => {
    updateWidget(widget.id, { type: { visual: 'chart', chart } });
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
              currentChart={widget.type.chart!}
              onChange={handleChartTypeChange}
            />
          )}
          <button
            onClick={() => handleOpenEditor()}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Settings size={20} />
          </button>
          <button
            onClick={() => removeWidget(widget.id)}
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
            <div className="text-3xl font-bold">{widget.data.value}</div>
            {widget.data.change && (
              <div className={`flex items-center gap-1 mt-2 ${
                widget.data.change > 0 ? 'text-green-500' : 'text-red-500'
              }`}>
                {widget.data.change > 0 ? (
                  <TrendingUp size={16} />
                ) : (
                  <TrendingDown size={16} />
                )}
                <span>{Math.abs(widget.data.change)}%</span>
              </div>
            )}
          </div>
        )}

        <WidgetEditorModal
          isOpen={isEditOpen}
          mode="edit"
          initData={editorData}
          onClose={() => handleCloseEditor()}
          widget={{
            ...widget,
            dataSource: {
              ...widget.dataSource,
              ...overrides.dataSource
            }
          }}
        />
      </div>
    </div>
  );
};

export default WidgetVisual;