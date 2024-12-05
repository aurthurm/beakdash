'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactECharts from 'echarts-for-react';
import {
  LineChart, SaveAll, Table, X, Zap,
  Settings, ArrowLeft,
  RemoveFormatting
} from 'lucide-react';
import { Editor } from '@monaco-editor/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/ui/components/tabs';
import { format, FormatOptionsWithLanguage } from 'sql-formatter';
import DataExplorer from '@/app/dashboard/components/DataExplorer';
import { DataPoint } from '@/app/types/data';
import ChartConfigPanel from '@/app/dashboard/components/widgets/widget-editor/ChartConfigPanel';
import ChartConnectionPanel from '@/app/dashboard/components/widgets/widget-editor/ChartConnectionPanel';
import { getChartOptions } from '@/app/lib/charts/chart-options';
import { useWidgetStore } from '@/app/store/widgetStore';
import { SQLAdapter } from '@/app/lib/adapters/sql';
import { IWidget } from '@/app/lib/drizzle/schemas';

const SQL_FORMAT_OPTIONS = {
  language: 'postgresql', // or 'mysql', 'sqlite', etc.
  keywordCase: "upper",
  linesBetweenQueries: 2,
  indentStyle: 'standard',
} as FormatOptionsWithLanguage;


interface WidgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'add' | 'edit';
  widget: IWidget;
  initData?: DataPoint[];
}

const WidgetEditorModal: React.FC<WidgetModalProps> = ({
  isOpen,
  onClose,
  mode,
  widget,
  initData
}) => {
  const [mounted, setMounted] = useState(false);
  const { addWidget, updateWidget } = useWidgetStore();
  const [data, setData] = useState<DataPoint[]>(initData ?? []);
  const [specifics, setSpecifics] = useState<IWidget>(widget); // manage update/new locally
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [activePanel, setActivePanel] = useState<'connection' | 'chart'>('connection');
  const [sqlQuery, setSqlQuery] = useState('');
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mode === 'edit' && widget) {
      setTitle(widget.title);
      setSubtitle(widget.subtitle || '');
      // if(widget.data?.type === 'sql') {
      //   setSqlQuery((widget.dataSource as SQLDataSource).query ?? '');
      // }
    }
  }, [mode, widget]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;


  const getColumns = () => {
    const allColumns = data ? Object.keys(data[0]) : [];
    const numericCols = allColumns.filter(col => {
      // Get first non-null value
      const sampleValue = (data ?? []).find(row => row[col] != null)?.[col];
      // Check if it's a number or can be converted to a number
      return typeof sampleValue === 'number' || 
             (!isNaN(sampleValue) && !isNaN(parseFloat(sampleValue)));
    });
    
    const nonNumericCols = allColumns.filter(col => {
      // Get first non-null value
      const sampleValue = (data ?? []).find(row => row[col] != null)?.[col];
      // Check if it's NOT a number and can't be converted to a number
      return typeof sampleValue !== 'number' && 
             (isNaN(sampleValue) || isNaN(parseFloat(sampleValue)));
    });
  
    return {
      all: allColumns,
      numeric: numericCols,
      nonNumeric: nonNumericCols
    }
  };

  const getEChartOptions = () => getChartOptions(specifics, data ?? [])

  const handleFormat = () => {
    try {
      setSqlQuery(format(sqlQuery, SQL_FORMAT_OPTIONS));
    } catch (error) {
      console.error('SQL formatting error:', error);
    }
  };

  const executeQuery = async () => {
    const adapter = new SQLAdapter({
      ...specifics.dataSource,
      query: sqlQuery
    } as SQLDataSource);
    const fetchedData = await adapter.fetchData();
    console.log("fetchedData: ", fetchedData);
    setData(fetchedData);
  }

  const handleUpdates = (updates: Partial<Widget>) => {
    setSpecifics({
      ...specifics,
      ...updates
    });
  };

  const handleSaveWidget = () => {
    const payload = {
      ...specifics,
      title,
      subtitle,
      dataSource: {
        ...widget.dataSource,
        query: sqlQuery,
      }
    } as Widget;
    if (mode === 'add') {
      addWidget(payload)
     } else {
      updateWidget(widget.id, payload)
     }
     // close modal after saving
     onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[90%] h-[90%] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold capitalize">{mode} Widget</h2>
          <button 
          aria-label='Close Modal'
          onClick={onClose} 
          className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 gap-6">
          {/* Left Panel */}
          <div className="w-1/3 border-r pr-6">
            {activePanel === 'connection' ? (
              <ChartConnectionPanel widget={specifics} onUpdate={handleUpdates} />
            ) : (<>
              <button
                onClick={() => setActivePanel('connection')}
                className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Connection Settings
              </button>
              <ChartConfigPanel 
              widget={specifics}
              columns={getColumns()}
              onUpdate={handleUpdates} />
            </>)}
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

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium">SQL Query</label>
                <div className="flex justify-start items-center gap-x-2">
                  <button 
                    onClick={executeQuery}
                    className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    <Zap size={14} className="mr-2" />
                    Execute
                  </button>
                  <button
                    className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => handleFormat()}
                  >
                    <RemoveFormatting size={14} className="mr-2" />
                    Format
                  </button>
                </div>
              </div>
              <Editor
                theme="vs-dark"
                height="200px"
                defaultLanguage="sql"
                value={sqlQuery}
                onChange={(value) => setSqlQuery(value ?? '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  folding: true,
                  formatOnPaste: true,
                  formatOnType: true,
                  suggestOnTriggerCharacters: true,
                  tabSize: 2,
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

              <TabsContent value="table" className='h-[300px]'>
                <DataExplorer data={data ?? []}  />
              </TabsContent>

              <ChartTabContent setActivePanel={setActivePanel} eChartOptions={getEChartOptions()} />
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
            onClick={() => handleSaveWidget()}
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


interface ChartTabContentProps {
  setActivePanel: (panel: 'connection' | 'chart') => void;
  eChartOptions: any;
}
const ChartTabContent: React.FC<ChartTabContentProps> = ({ setActivePanel, eChartOptions }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait for next tick to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  return (
    <TabsContent value="chart" className="h-[300px]">
      <div className="relative h-full w-full">
        <button
          onClick={() => setActivePanel('chart')}
          className="absolute right-4 top-4 z-10 p-2 bg-white shadow rounded-lg flex items-center"
        >
          <Settings size={16} className="mr-2" />
          Configure Chart
        </button>
        {isReady && (
          <ReactECharts
            option={eChartOptions}
            opts={{ renderer: 'svg' }}
            style={{
              height: '300px',
              width: '70%'
            }}
            notMerge={true}
            lazyUpdate={true}
          />
        )}
      </div>
    </TabsContent>
  );
};