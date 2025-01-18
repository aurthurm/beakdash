'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  LineChart, SaveAll, Table, X, Zap,
  Settings, ArrowLeft,
  RemoveFormatting
} from 'lucide-react';
import { Editor } from '@monaco-editor/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/ui/components/tabs';
import { format, FormatOptionsWithLanguage } from 'sql-formatter';
import DataExplorer from '@/app/dashboard/components/DataExplorer';
import { AntChartOptions, DataPoint } from '@/app/types/data';
import ChartConfigPanel from '@/app/dashboard/components/widgets/widget-editor/config-panel/ChartConfigPanel';
import DatasetPanel from '@/app/dashboard/components/widgets/widget-editor/DatasetPanel';
import { getChartOptions } from '@/app/lib/charts/options';
import { SQLAdapter } from '@/app/lib/adapters/sql';
import { IConnection, IDataset, IPage, IWidget } from '@/app/lib/drizzle/schemas';
import { Alert, AlertDescription } from '@/app/ui/components/alert';
import { useDatasetStore } from '@/app/store/datasets';
import { useAuth } from '@clerk/nextjs'
import { useConnectionStore } from '@/app/store/connections';
import { SQLConnectionConfig } from '@/app/types/datasource';
import ChartWrapper from '../ChartWrapper';

const SQL_FORMAT_OPTIONS = {
  language: 'postgresql', // or 'mysql', 'sqlite', etc.
  keywordCase: "upper",
  linesBetweenQueries: 2,
  indentStyle: 'standard',
} as FormatOptionsWithLanguage;

interface WidgetModalProps {
  page: IPage;
  initData?: DataPoint[];
  isOpen: boolean;
  setIsOpen: (val: boolean) => void;
  isEditingWidget: boolean;
  form: IWidget;
  setForm: (widget: IWidget) => void;
  handlers: any;
}

const WidgetEditorModal: React.FC<WidgetModalProps> = ({
  page,
  isOpen,
  setIsOpen,
  isEditingWidget,
  form,
  setForm,
  handlers
}) => {
  const { userId } = useAuth()
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<DataPoint[]>([]);
  const [activePanel, setActivePanel] = useState<'connection' | 'chart'>('connection');
  const [activeDataView, setActiveDataView] = useState<'query' | 'table' | 'chart'>('query');
  const { datasets, fetchDatasets } = useDatasetStore();
  const [ dataset, setDataset] = useState<IDataset | null>(null);
  const { connections, fetchConnections } = useConnectionStore();
  const [ connection, setConnection] = useState<IConnection | null>(null);
  const [executionStatus, setExecutionStatus] = useState<{ success: boolean, message: string }>({ success: true, message: '' });
  const [isExecuting, setIsExecuting] = useState(false);

  const executeQuery = useCallback(async () => {
    setIsExecuting(true);
    try {
      const adapter = new SQLAdapter(connection?.config as SQLConnectionConfig);
      const fetchedData = await adapter.fetchData(form.query!);
      setData(fetchedData);
      setExecutionStatus({ success: true, message: '' });
      setActiveDataView('table');
    } catch (error) {
      setExecutionStatus({ 
        success: false, 
        message: error instanceof Error ? error.message : 'An unexpected error occurred' 
      });
    }
    setIsExecuting(false);
  }, [connection?.config, form.query]);

  
  useEffect(() => {
    // Early return if no user ID
    if (!userId) {
      console.log('You must be logged in to fetch datasets');
      return;
    }
    // Track mounted state
    let isMounted = true;

    const fetchData = async () => {
      try {
        // Fetch datasets and connections in parallel
        const [datasets, connections] = await Promise.all([
          fetchDatasets(userId),
          fetchConnections(userId)
        ]);

        // Only update state if component is still mounted
        if (!isMounted) return;

        // Find and set matching dataset
        if (datasets.length > 0) {
          const matchingDataset = datasets.find(d => d.id === form.datasetId);
          if (matchingDataset) setDataset(matchingDataset);
        }

        // Find and set matching connection
        if (connections.length > 0 && dataset?.connectionId) {
          const matchingConnection = connections.find(c => c.id === dataset.connectionId);
          if (matchingConnection) setConnection(matchingConnection);
        }

        // Execute query if editing widget
        if (isEditingWidget && connection) {
          await executeQuery();
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, [userId, form.datasetId, dataset?.connectionId, isEditingWidget, setDataset, setConnection, executeQuery, fetchDatasets, fetchConnections, connection]);

  const onUpdateDataset = (datasetId: string) => {
    setForm({ ...form, datasetId });
    const dataset = datasets.find(d => d.id === datasetId);
    setDataset(dataset || null);
    const connection = connections.find(c => c.id === dataset?.connectionId)
    setConnection(connection || null);
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const updateForm = (updates: Partial<IWidget>) => {
    setForm({...form, ...updates})
  }

  if (!isOpen || !mounted) return null;

  const getColumns = () => {
    if (!data || data.length === 0) return { all: [], numeric: [], nonNumeric: [] };
    const allColumns = data ? Object.keys(data[0]) : [];
    const numericCols = allColumns.filter(col => {
      // Get first non-null value
      const sampleValue = (data ?? []).find(row => row[col] != null)?.[col];
      // Check if it's a number or can be converted to a number
      if(sampleValue === null) return false;
      if(typeof sampleValue === 'number') return true;
      return typeof sampleValue === 'number' || 
             (!isNaN(sampleValue as any) && !isNaN(parseFloat(sampleValue as any)));
    });
    
    const nonNumericCols = allColumns.filter(col => {
      // Get first non-null value
      const sampleValue = (data ?? []).find(row => row[col] != null)?.[col];
      // Check if it's NOT a number and can't be converted to a number
      return typeof sampleValue !== 'number' && 
             (isNaN(sampleValue as any) || isNaN(parseFloat(sampleValue as any)));
    });
  
    return {
      all: allColumns,
      numeric: numericCols,
      nonNumeric: nonNumericCols
    }
  };

  const getEChartOptions = () => getChartOptions(form, data ?? [])

  const handleFormat = () => {
    try {
      updateForm({ query: format(form.query ?? '', SQL_FORMAT_OPTIONS) });
    } catch (error) {
      console.error('SQL formatting error:', error);
    }
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-[90%] h-[90%] flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold capitalize">
            {isEditingWidget ? 'Edit Widget' : 'Create New Widget'}
          </h2>
          <button 
          aria-label='Close Modal'
          onClick={() => setIsOpen(false)} 
          className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 gap-6">
          {/* Left Panel */}
          <div className="w-1/3 border-r pr-6">
            {activePanel === 'connection' ? (
              <DatasetPanel 
              form={form} 
              datasets={datasets} 
              dataset={dataset} 
              onUpdateDataset={onUpdateDataset}
              />
            ) : (<>
              <button
                onClick={() => setActivePanel('connection')}
                className="mb-4 flex items-center text-sm text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft size={16} className="mr-1" />
                Back to Connection Settings
              </button>
              <ChartConfigPanel 
                form={form}
                columns={getColumns()}
                setForm={setForm}
               />
            </>)}
          </div>

          {/* Right Panel */}
          <div className="flex-1">
            <div className='flex justify-start items-center mb-2'>
              <label className="block text-md font-medium mb-1 w-24">Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value})}
                className="w-full p-1 border rounded-sm outline-none"
                placeholder="Widget Title"
              />
            </div>

            <div className='flex justify-start items-center'>
              <label className="block text-md font-medium mb-1 w-24">Subtitle</label>
              <input
                type="text"
                value={form.subtitle}
                onChange={(e) => updateForm({ subtitle: e.target.value})}
                className="w-full p-1 border rounded-sm outline-none"
                placeholder="Widget Subtitle"
              />
            </div>

            <hr className='my-4' />

            <Tabs defaultValue={activeDataView}>
              <TabsList>
                <TabsTrigger value="query">
                  <Table className="w-4 h-4 mr-2" />
                  Query View
                </TabsTrigger>
                <TabsTrigger value="table">
                  <Table className="w-4 h-4 mr-2" />
                  Table View
                </TabsTrigger>
                <TabsTrigger value="chart">
                  <LineChart className="w-4 h-4 mr-2" />
                  Chart Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="query" className='min-h-[300px]'>
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
                    value={form.query}
                    onChange={(value) => updateForm({ query: value ?? '' })}
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
                    loading={isExecuting}
                  />
                  {!executionStatus?.success && <Alert variant="destructive">
                    <AlertDescription>{executionStatus.message}</AlertDescription>
                  </Alert>}
                </div>
              </TabsContent>

            <TabsContent value="table" className='min-h-[300px]'>
              <DataExplorer data={data ?? []}  />
            </TabsContent>

              <ChartTabContent setActivePanel={setActivePanel} eChartOptions={getEChartOptions()} form={form} />
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => handlers.handleSave(page.id)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
          >
            <SaveAll size={20} className="mr-2" />
            {isEditingWidget ? 'Update Widget' : 'Save Widget'}
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
  eChartOptions: AntChartOptions;
  form: IWidget;
}
const ChartTabContent: React.FC<ChartTabContentProps> = ({ setActivePanel, eChartOptions, form }) => {
  const [isReady, setIsReady] = useState(false);
  const [options, setOptions] = useState<AntChartOptions>({});

  useEffect(() => {
    // Wait for next tick to ensure DOM is ready
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setOptions(eChartOptions);
  }, [eChartOptions]);

  return (
    <TabsContent value="chart" className="min-h-[300px]">
      <div className="relative h-full w-full">
        <button
          onClick={() => setActivePanel('chart')}
          className="absolute right-4 top-4 z-10 p-2 bg-white shadow rounded-lg flex items-center"
        >
          <Settings size={16} className="mr-2" />
          Configure Chart
        </button>
        {isReady && form?.type && (
          <ChartWrapper
            type={form.type}
            config={options}
            style={{
              minHeight: '300px',
              width: '70%'
            }}
          />
        )}
      </div>
    </TabsContent>
  );
};