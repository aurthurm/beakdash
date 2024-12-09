import React from 'react';
import { BarChart, LineChart, PieChart } from 'lucide-react';
import { IWidget, wtypes } from '@/app/lib/drizzle/schemas';

interface ChartTypeToggleProps {
  currentChart: IWidget['type'];
  onChange: (type: IWidget['type']) => void;
}

const ChartTypeToggle: React.FC<ChartTypeToggleProps> = ({ currentChart, onChange }) => {
  const charts = wtypes.filter((type) => type !== 'count');
  
  const icons = {
    bar: BarChart,
    line: LineChart,
    pie: PieChart,
  };

  if (currentChart == 'count') return null;

  return (
    <div className="flex gap-1">
      {charts.map((chart) => {
        const Icon = icons[chart];
        return (
          <button
            key={chart}
            onClick={() => onChange(chart)}
            className={`p-2 rounded-md transition-colors ${
              currentChart === chart
                ? 'bg-gray-200 text-gray-800'
                : 'text-gray-400 hover:bg-gray-100'
            }`}
            title={`Switch to ${chart} chart`}
          >
            <Icon size={16} />
          </button>
        );
      })}
    </div>
  );
};

export default ChartTypeToggle;