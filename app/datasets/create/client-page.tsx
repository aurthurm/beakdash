'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  Database, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Download, 
  Copy, 
  Zap,
  Sparkles,
  Layers
} from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import { extractQueryParameters, QueryParameterDef } from '@/lib/db/query-parameters';

interface Connection {
  id: number;
  name: string;
  type: string;
  config: any;
  user_id: number;
  space_id: number | null;
  created_at: string;
  updated_at: string;
}

interface DatasetFormData {
  name: string;
  description: string;
  refreshFrequency: string;
  connectionId: string;
  queryType: string;
  sqlQuery: string;
}

interface PreviewState {
  data: Record<string, any>[];
  columns: { name: string; type: string }[];
  rowCount: number;
  executionTimeMs: number;
  dialect?: string;
  fromCache?: boolean;
  cachedAt?: string;
}

const SQL_SNIPPETS = [
  { label: 'Basic Select', sql: 'SELECT * FROM users LIMIT 50;' },
  { label: 'Group & Count', sql: 'SELECT category, COUNT(*) AS count, SUM(amount) AS total FROM sales GROUP BY category;' },
  { label: 'Parameterized Date', sql: 'SELECT * FROM orders WHERE created_at >= {{ start_date:date:2025-01-01 }} LIMIT 100;' },
  { label: 'Parameterized Category', sql: 'SELECT * FROM products WHERE price > {{ min_price:number:50 }} LIMIT 50;' },
];

export function CreateDatasetClient() {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<DatasetFormData>({
    name: '',
    description: '',
    refreshFrequency: 'manual',
    connectionId: '',
    queryType: 'sql',
    sqlQuery: 'SELECT * FROM sales WHERE amount >= {{ min_amount:number:100 }} LIMIT 50;',
  });

  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Extract query parameters dynamically (Redash-style)
  const detectedParams: QueryParameterDef[] = useMemo(() => {
    return extractQueryParameters(formData.sqlQuery);
  }, [formData.sqlQuery]);

  // Sync default parameter values
  useEffect(() => {
    const initial: Record<string, any> = { ...paramValues };
    let hasChanges = false;
    detectedParams.forEach((param) => {
      if (initial[param.name] === undefined && param.defaultValue !== undefined) {
        initial[param.name] = param.defaultValue;
        hasChanges = true;
      }
    });
    if (hasChanges) {
      setParamValues(initial);
    }
  }, [detectedParams]);

  // Fetch connections with React Query
  const { data: connections = [], isLoading: connectionsLoading, isError: connectionsError } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    retry: 2,
    refetchOnWindowFocus: false,
  });
  
  const handleInputChange = (field: keyof DatasetFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleParamChange = (name: string, value: any) => {
    setParamValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Run preview query
  const handlePreviewQuery = async (forceRefresh: boolean = false) => {
    if (!formData.connectionId) {
      toast({
        title: 'Connection Required',
        description: 'Please select a data connection before running a preview.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.sqlQuery.trim()) {
      toast({
        title: 'SQL Query Required',
        description: 'Please enter a SQL query to execute.',
        variant: 'destructive',
      });
      return;
    }

    setIsPreviewLoading(true);
    setPreviewError(null);

    try {
      const response = await fetch('/api/datasets/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          connectionId: parseInt(formData.connectionId, 10),
          query: formData.sqlQuery,
          parameters: paramValues,
          maxRows: 50,
          maxAgeSeconds: forceRefresh ? 0 : 300,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to execute query preview');
      }

      setPreview({
        data: result.data || [],
        columns: result.columns || [],
        rowCount: result.rowCount || 0,
        executionTimeMs: result.executionTimeMs || 0,
        dialect: result.dialect,
        fromCache: result.fromCache,
        cachedAt: result.cachedAt,
      });

      toast({
        title: result.fromCache ? 'Served from Cache' : 'Query Executed',
        description: `Retrieved ${result.rowCount} rows in ${result.executionTimeMs}ms.`,
      });
    } catch (err: any) {
      console.error('Preview error:', err);
      setPreviewError(err.message || 'Error executing query preview');
      toast({
        title: 'Query Execution Failed',
        description: err.message || 'Error executing query preview',
        variant: 'destructive',
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    if (!preview || preview.data.length === 0) return;
    const headers = preview.columns.map((c) => c.name).join(',');
    const rows = preview.data.map((row) =>
      preview.columns.map((c) => JSON.stringify(row[c.name] ?? '')).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.name || 'dataset'}-preview.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export to JSON
  const handleExportJson = () => {
    if (!preview || preview.data.length === 0) return;
    const blob = new Blob([JSON.stringify(preview.data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${formData.name || 'dataset'}-preview.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.connectionId) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    
    toast({
      title: 'Creating dataset',
      description: 'Your dataset is being created...',
    });
    
    try {
      const response = await fetch('/api/datasets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          config: {
            parameters: detectedParams,
            defaultParamValues: paramValues,
          },
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create dataset');
      }
      
      toast({
        title: 'Success',
        description: 'Dataset created successfully',
      });
      
      window.location.href = '/datasets';
    } catch (error: any) {
      console.error('Error creating dataset:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create dataset. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="container max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild className="mr-2">
            <Link href="/datasets">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dataset Studio</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Define semantic datasets, parameterized queries, and live explorations</p>
          </div>
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span>Dataset Information</span>
              </CardTitle>
              <CardDescription>
                Basic metadata and target database connection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dataset-name">Dataset Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="dataset-name" 
                    placeholder="e.g. Monthly Revenue by Region" 
                    value={formData.name} 
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="refresh-frequency">Refresh Frequency</Label>
                  <Select 
                    value={formData.refreshFrequency}
                    onValueChange={(value) => handleInputChange('refreshFrequency', value)}
                  >
                    <SelectTrigger id="refresh-frequency">
                      <SelectValue placeholder="Select refresh frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual Refresh</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dataset-description">Description (optional)</Label>
                <Textarea 
                  id="dataset-description" 
                  placeholder="A brief description of what this dataset contains and how widgets should interpret it" 
                  className="min-h-[60px]"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                />
              </div>
              
              <div className="border-t pt-4">
                <Label htmlFor="connection" className="block mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Data Connection <span className="text-red-500">*</span>
                </Label>
                
                {connectionsLoading ? (
                  <p className="text-sm text-muted-foreground">Loading connections...</p>
                ) : connectionsError ? (
                  <p className="text-sm text-red-500">Error loading connections. Please try again later.</p>
                ) : connections.length === 0 ? (
                  <div className="border rounded-md p-4 border-dashed text-center">
                    <p className="text-sm text-muted-foreground mb-2">No connections available</p>
                    <Link href="/connections/create" className="text-sm text-primary hover:underline">
                      + Create a Connection First
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {connections.map(connection => (
                      <div 
                        key={connection.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-all ${formData.connectionId === connection.id.toString() ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-border/80 bg-card'}`}
                        onClick={() => handleInputChange('connectionId', connection.id.toString())}
                      >
                        <div className="flex items-center">
                          <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center mr-2.5 text-primary shrink-0">
                            <Database className="h-3.5 w-3.5" />
                          </div>
                          <div className="truncate">
                            <p className="font-medium text-xs truncate leading-tight">{connection.name}</p>
                            <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                              {connection.type} database
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span>SQL Query & Parameter Studio</span>
                </CardTitle>
                <CardDescription className="mt-1">
                  Write SQL with dynamic Redash-style parameters like <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded">{'{{ param_name:type:default }}'}</code>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1.5"
                  onClick={() => handlePreviewQuery(false)}
                  disabled={isPreviewLoading || !formData.connectionId}
                >
                  {isPreviewLoading ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5 text-primary fill-primary" />
                  )}
                  <span>{isPreviewLoading ? 'Running...' : 'Run Query'}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  title="Bypass Cache & Re-run"
                  onClick={() => handlePreviewQuery(true)}
                  disabled={isPreviewLoading || !formData.connectionId}
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick SQL Snippets */}
              <div className="flex flex-wrap items-center gap-1.5 pb-2">
                <span className="text-[11px] text-muted-foreground mr-1">Snippets:</span>
                {SQL_SNIPPETS.map((snippet, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleInputChange('sqlQuery', snippet.sql)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border bg-muted/40 hover:bg-muted transition-colors"
                  >
                    {snippet.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Parameter Controls (Redash style) */}
              {detectedParams.length > 0 && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Sliders className="h-3.5 w-3.5" />
                    <span>Dynamic Query Parameters ({detectedParams.length})</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {detectedParams.map((param) => (
                      <div key={param.name} className="space-y-1">
                        <Label htmlFor={`param-${param.name}`} className="text-[11px] font-mono text-muted-foreground flex justify-between">
                          <span>{param.title || param.name}</span>
                          <span className="text-[10px] uppercase font-sans">({param.type})</span>
                        </Label>
                        <Input
                          id={`param-${param.name}`}
                          type={param.type === 'number' ? 'number' : param.type === 'date' ? 'date' : 'text'}
                          value={paramValues[param.name] ?? ''}
                          placeholder={String(param.defaultValue || '')}
                          onChange={(e) => handleParamChange(param.name, e.target.value)}
                          className="h-8 text-xs bg-background"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Textarea 
                  id="sql-query" 
                  placeholder="SELECT * FROM table WHERE date >= {{ start_date:date:2025-01-01 }} LIMIT 50;" 
                  className="min-h-[160px] font-mono text-xs leading-relaxed bg-zinc-950 text-zinc-100 dark:bg-zinc-900 border-zinc-800"
                  value={formData.sqlQuery}
                  onChange={(e) => handleInputChange('sqlQuery', e.target.value)}
                />
              </div>
              
              {/* Preview Results Area with Lightdash/Evidence toolbar */}
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Results Output</h3>
                    {preview && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {preview.rowCount} rows ({preview.executionTimeMs}ms)
                      </Badge>
                    )}
                    {preview?.fromCache && (
                      <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30">
                        ⚡ Cached
                      </Badge>
                    )}
                  </div>

                  {preview && preview.data.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Button type="button" variant="outline" size="sm" onClick={handleExportCsv} className="h-7 text-[11px] gap-1 px-2">
                        <Download className="h-3 w-3" />
                        <span>CSV</span>
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={handleExportJson} className="h-7 text-[11px] gap-1 px-2">
                        <Download className="h-3 w-3" />
                        <span>JSON</span>
                      </Button>
                    </div>
                  )}
                </div>

                {previewError && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{previewError}</span>
                  </div>
                )}

                {preview && preview.data.length > 0 ? (
                  <div className="overflow-x-auto max-h-72 border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 text-[11px]">
                          {preview.columns.map((col) => (
                            <TableHead key={col.name} className="font-semibold py-2">
                              {col.name} <span className="text-[10px] text-muted-foreground font-normal">({col.type})</span>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.data.map((row, idx) => (
                          <TableRow key={idx} className="text-xs">
                            {preview.columns.map((col) => (
                              <TableCell key={col.name} className="py-2 font-mono text-[11px]">
                                {row[col.name] !== null && row[col.name] !== undefined 
                                  ? String(row[col.name]) 
                                  : <span className="text-muted-foreground italic">null</span>}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground text-center py-8 border border-dashed rounded-md">
                    {isPreviewLoading ? 'Executing query...' : 'Click "Run Query" above to inspect and explore dataset output.'}
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/datasets">Cancel</Link>
              </Button>
              <Button type="submit">Create Dataset</Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}