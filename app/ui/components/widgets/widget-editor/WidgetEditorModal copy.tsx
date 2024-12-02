'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ChartType, VisualType, Widget } from '@/app/types/widget';
import { Editor } from '@monaco-editor/react';
import { format } from 'sql-formatter';
import DataExplorer from '@/app/ui/components/tabels/DataExplorer';
import ChartConfigurator from '@/app/ui/components/widgets/widget-editor/ChartConfigurator';
import { DataPoint } from '@/app/types/data';

interface WidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  widget?: Widget;  // Optional for add mode
  data?: DataPoint[];
  onSubmit: (widget: Widget | Partial<Widget>) => void;
}

const WidgetEditorModal: React.FC<WidgetModalProps> = ({
  isOpen,
  onClose,
  mode,
  widget,
  data,
  onSubmit,
}) => {
  const [mounted, setMounted] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [sql, setSql] = useState('');
  const [visualType, setVisualType] = useState<VisualType>('chart');
  const [chartType, setChartType] = useState<ChartType>('line');

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mode === 'edit' && widget) {
      setTitle(widget.title);
      setSubtitle(widget.subtitle || '');
      setSql(widget.sql || '');
      setVisualType(widget.type.visual);
      setChartType(widget.type.chart || 'line');
    }
  }, [mode, widget]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (mode === 'edit' && widget) {
      onSubmit({
        title,
        subtitle,
        sql: format(sql),
        type: {
          visual: visualType,
          chart: visualType === 'chart' ? chartType : undefined
        },
      });
    } else {
      // Add mode
      onSubmit({
        id: Date.now().toString(),
        title,
        subtitle,
        sql,
        type: {
          visual: visualType,
          chart: visualType === 'chart' ? chartType : undefined
        },
        dataSource: {
          type: 'sql',
          query: "SELECT * FROM table",
          connectionString: "postgres://nmrl:password@localhost:5432/central_repository",
          refreshInterval: 300
        } //
      } as Widget);
    }
    
    onClose();
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">{mode} Widget</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* <ChartConfigurator widget={widget!} data={data ?? []} /> */}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Widget Type</label>
            <select
              value={visualType}
              onChange={(e) => setVisualType(e.target.value as VisualType)}
              className="w-full p-2 border rounded-lg"
            >
              <option value="chart">Chart</option>
              <option value="number">Number</option>
            </select>
          </div>

          {visualType === 'chart' && (
            <div>
              <label className="block text-sm font-medium mb-1">Chart Type</label>
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as ChartType)}
                className="w-full p-2 border rounded-lg"
              >
                <option value="line">Line</option>
                <option value="bar">Bar</option>
                <option value="pie">Pie</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Widget Title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Subtitle</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Widget Subtitle"
            />
          </div>
     
          <div>
            <label className="block text-sm font-medium mb-1">SQL Query</label>
            <div className="h-64 border rounded">
              <Editor
                height="100%"
                defaultLanguage="sql"
                value={sql}
                onChange={(value) => setSql(value || '')}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Widget
            </button>
          </div>
        </form>

        <div>
          <DataExplorer
          title={widget?.title}
          data={data}
          onUpdateData={(newData) => onSubmit({data: newData})} />
        </div>

      </div>
    </div>,
    document.body
  );
};

export default WidgetEditorModal;