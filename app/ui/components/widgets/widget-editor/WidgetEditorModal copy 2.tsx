'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  LineChart, SaveAll, Database, Table, X, Zap,
  Settings, Columns, PieChart, BarChart
} from 'lucide-react';
import { ChartType, VisualType, Widget } from '@/app/types/widget';
import { Editor } from '@monaco-editor/react';
import { format } from 'sql-formatter';
import DataExplorer from '@/app/ui/components/tabels/DataExplorer';
import ChartConfigurator from '@/app/ui/components/widgets/widget-editor/ChartConfigurator';
import { DataPoint, TransformConfig } from '@/app/types/data';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/ui/components/Tabs';

// Left Panel Components
const ConnectionPanel: React.FC = () => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Data Source Type</label>
        <select className="w-full p-2 border rounded">
          <option value="sql">SQL Database</option>
          <option value="api">REST API</option>
          <option value="file">File Upload</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Connection</label>
        <select className="w-full p-2 border rounded">
          <option value="postgres">PostgreSQL Main</option>
          <option value="mysql">MySQL Analytics</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Schema</label>
        <select className="w-full p-2 border rounded">
          <option value="public">public</option>
          <option value="analytics">analytics</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Dataset/Table</label>
        <select className="w-full p-2 border rounded">
          <option value="users">Users</option>
          <option value="orders">Orders</option>
        </select>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Available Columns</h3>
        <div className="border rounded p-2 max-h-60 overflow-y-auto">
          {/* Column list with types */}
          <div className="flex justify-between text-sm py-1">
            <span>id</span>
            <span className="text-gray-500">integer</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span>name</span>
            <span className="text-gray-500">string</span>
          </div>
          {/* Add more columns */}
        </div>
      </div>
    </div>
  );
};

const ChartConfigPanel: React.FC<{
  config: TransformConfig;
  columns: string[];
  onConfigChange: (config: TransformConfig) => void;
}> = ({ config, columns, onConfigChange }) => {
  return (
    <Tabs defaultValue="axes">
      <TabsList className="w-full">
        <TabsTrigger value="axes">
          <Columns className="w-4 h-4 mr-2" />
          Axes
        </TabsTrigger>
        <TabsTrigger value="aggregation">
          <BarChart className="w-4 h-4 mr-2" />
          Aggregation
        </TabsTrigger>
        <TabsTrigger value="formatting">
          <Settings className="w-4 h-4 mr-2" />
          Formatting
        </TabsTrigger>
      </TabsList>

      <TabsContent value="axes" className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">X-Axis</label>
          <select 
            className="w-full p-2 border rounded"
            value={config.series?.[0]?.categoryKey}
            onChange={(e) => {
              const newConfig = { ...config };
              if (!newConfig.series) newConfig.series = [{}];
              newConfig.series[0].categoryKey = e.target.value;
              onConfigChange(newConfig);
            }}
          >
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Y-Axis</label>
          <select 
            className="w-full p-2 border rounded"
            value={config.series?.[0]?.valueKey}
            onChange={(e) => {
              const newConfig = { ...config };
              if (!newConfig.series) newConfig.series = [{}];
              newConfig.series[0].valueKey = e.target.value;
              onConfigChange(newConfig);
            }}
          >
            {columns.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Rotate Labels</label>
          <input 
            type="number" 
            className="w-full p-2 border rounded"
            value={config.rotateLabels || 0}
            onChange={(e) => onConfigChange({
              ...config,
              rotateLabels: parseInt(e.target.value)
            })}
          />
        </div>
      </TabsContent>

      <TabsContent value="aggregation" className="space-y-4">
        <div>
          <label className="flex items-center space-x-2">
            <input 
              type="checkbox"
              checked={config.aggregation?.enabled}
              onChange={(e) => onConfigChange({
                ...config,
                aggregation: {
                  ...config.aggregation,
                  enabled: e.target.checked
                }
              })}
            />
            <span>Enable Aggregation</span>
          </label>
        </div>

        {config.aggregation?.enabled && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1">Method</label>
              <select 
                className="w-full p-2 border rounded"
                value={config.aggregation.method}
                onChange={(e) => onConfigChange({
                  ...config,
                  aggregation: {
                    ...config.aggregation,
                    method: e.target.value as any
                  }
                })}
              >
                <option value="sum">Sum</option>
                <option value="avg">Average</option>
                <option value="max">Maximum</option>
                <option value="min">Minimum</option>
                <option value="count">Count</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Group By</label>
              <select 
                multiple
                className="w-full p-2 border rounded"
                value={config.aggregation.groupBy}
                onChange={(e) => {
                  const selected = Array.from(e.target.selectedOptions).map(opt => opt.value);
                  onConfigChange({
                    ...config,
                    aggregation: {
                      ...config.aggregation,
                      groupBy: selected
                    }
                  });
                }}
              >
                {columns.map(col => (
                  <option key={col} value={col}>{col}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </TabsContent>

      <TabsContent value="formatting" className="space-y-4">
        {/* Add formatting options here */}
      </TabsContent>
    </Tabs>
  );
};

// Main Modal Component
const WidgetEditorModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  widget?: Widget;
  onSave: (widget: Widget) => void;
}> = ({ isOpen, onClose, widget, onSave }) => {
  const [activePanel, setActivePanel] = useState<'connection' | 'chart'>('connection');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [sqlQuery, setSqlQuery] = useState('');
  const [data, setData] = useState<DataPoint[]>([]);
  const [transformConfig, setTransformConfig] = useState<TransformConfig>({});
  const [columns, setColumns] = useState<string[]>([]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[90%] h-[90%] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Edit Widget</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 gap-6">
          {/* Left Panel */}
          <div className="w-1/3 border-r pr-6">
            {activePanel === 'connection' ? (
              <ConnectionPanel />
            ) : (
              <ChartConfigPanel 
                config={transformConfig}
                columns={columns}
                onConfigChange={setTransformConfig}
              />
            )}
          </div>

          {/* Right Panel */}
          <div className="flex-1">
            <div className='flex justify-start items-center mb-2'>
              <label className="block text-md font-medium mb-1 w-24">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-1 border rounded-sm outline-none"
                placeholder="Widget Title"
              />
            </div>

            <div className='flex justify-start items-center'>
              <label className="block text-md font-medium mb-1 w-24">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full p-1 border rounded-sm outline-none"
                placeholder="Widget Subtitle"
              />
            </div>

            <hr className='my-4' />
            {/* SQL Editor Section */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">SQL Query</label>
                <button 
                  onClick={() => {/* Execute query */}}
                  className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  <Zap size={14} className="mr-2" />
                  Execute
                </button>
              </div>
              <Editor
                height="200px"
                defaultLanguage="sql"
                value={sqlQuery}
                onChange={(value) => setSqlQuery(value || '')}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                }}
              />
            </div>

            {/* Data Preview Tabs */}
            <Tabs defaultValue="table">
              <TabsList>
                <TabsTrigger value="table">
                  <Table className="w-4 h-4 mr-2" />
                  Table View
                </TabsTrigger>
                <TabsTrigger value="chart">
                  <LineChart className="w-4 h-4 mr-2" />
                  Chart Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="table">
                <DataExplorer title="" data={data} onUpdateData={{}} />
              </TabsContent>

              <TabsContent value="chart">
                <div className="relative">
                  <button
                    onClick={() => setActivePanel('chart')}
                    className="absolute right-4 top-4 p-2 bg-white shadow rounded-lg flex items-center"
                  >
                    <Settings size={16} className="mr-2" />
                    Configure Chart
                  </button>
                  <p>Chart Preview Here</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {/* Save widget */}}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
          >
            <SaveAll size={20} className="mr-2" />
            Save Widget
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default WidgetEditorModal;