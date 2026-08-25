'use client';

import React, { useState } from 'react';
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
import { ChevronLeft, Database, RefreshCw, Play, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';

// Type definition for connections
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

// Dataset form data type
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
}

export function CreateDatasetClient() {
  const { toast } = useToast();
  
  // Initialize form state
  const [formData, setFormData] = useState<DatasetFormData>({
    name: '',
    description: '',
    refreshFrequency: 'manual',
    connectionId: '',
    queryType: 'sql',
    sqlQuery: 'SELECT 1 AS id, \'Sample Record\' AS name',
  });

  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  
  // Fetch connections with React Query
  const { data: connections = [], isLoading: connectionsLoading, isError: connectionsError } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    retry: 2,
    refetchOnWindowFocus: false,
  });
  
  // Handle input changes
  const handleInputChange = (field: keyof DatasetFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Run preview query against connection
  const handlePreviewQuery = async () => {
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
          maxRows: 10,
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
      });

      toast({
        title: 'Query Executed',
        description: `Returned ${result.rowCount} rows in ${result.executionTimeMs}ms.`,
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
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
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
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create dataset');
      }
      
      toast({
        title: 'Success',
        description: 'Dataset created successfully',
      });
      
      // Redirect to datasets page
      window.location.href = '/datasets';
    } catch (error) {
      console.error('Error creating dataset:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create dataset. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  return (
    <div className="container max-w-5xl px-4 py-6">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link href="/datasets">
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Create Dataset</h1>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Dataset Information</CardTitle>
              <CardDescription>
                Basic information and connection configuration for your dataset
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="dataset-name">Dataset Name <span className="text-red-500">*</span></Label>
                <Input 
                  id="dataset-name" 
                  placeholder="e.g. Monthly Revenue Summary" 
                  value={formData.name} 
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dataset-description">Description (optional)</Label>
                <Textarea 
                  id="dataset-description" 
                  placeholder="A brief description of what this dataset contains" 
                  className="min-h-[70px]"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
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
              
              <div className="border-t pt-4">
                <Label htmlFor="connection" className="block mb-2">
                  Select Data Connection <span className="text-red-500">*</span>
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
                        className={`border rounded-lg p-3.5 cursor-pointer transition-all ${formData.connectionId === connection.id.toString() ? 'border-primary bg-primary/5 shadow-sm' : 'hover:border-border/80 bg-card'}`}
                        onClick={() => handleInputChange('connectionId', connection.id.toString())}
                      >
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center mr-3 text-primary">
                            <Database className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm leading-tight">{connection.name}</p>
                            <p className="text-xs text-muted-foreground capitalize mt-0.5">
                              {connection.type} database
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <Link href="/connections/create" className="flex items-center justify-center border rounded-lg p-3.5 border-dashed text-center hover:border-primary transition-colors text-xs text-muted-foreground hover:text-foreground">
                      + Create New Connection
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Query Configuration & Live Execution</CardTitle>
                <CardDescription className="mt-1">
                  Define the SQL query and execute it live to inspect sample data before saving
                </CardDescription>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1.5"
                onClick={handlePreviewQuery}
                disabled={isPreviewLoading || !formData.connectionId}
              >
                {isPreviewLoading ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5 text-primary fill-primary" />
                )}
                <span>{isPreviewLoading ? 'Executing...' : 'Run Query Preview'}</span>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sql-query" className="flex items-center justify-between">
                  <span>SQL Query</span>
                  <span className="text-[11px] text-muted-foreground font-normal">Executed in read-only mode</span>
                </Label>
                <Textarea 
                  id="sql-query" 
                  placeholder="SELECT id, name, created_at FROM users LIMIT 50;" 
                  className="min-h-[140px] font-mono text-xs leading-relaxed bg-zinc-950 text-zinc-100 dark:bg-zinc-900 border-zinc-800"
                  value={formData.sqlQuery}
                  onChange={(e) => handleInputChange('sqlQuery', e.target.value)}
                />
              </div>
              
              {/* Preview Results Area */}
              <div className="rounded-lg border bg-card p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Execution Output</h3>
                    {preview && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {preview.rowCount} rows ({preview.executionTimeMs}ms)
                      </Badge>
                    )}
                  </div>
                  {preview?.dialect && (
                    <span className="text-[11px] text-muted-foreground capitalize">
                      Dialect: {preview.dialect}
                    </span>
                  )}
                </div>

                {previewError && (
                  <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{previewError}</span>
                  </div>
                )}

                {preview && preview.data.length > 0 ? (
                  <div className="overflow-x-auto max-h-64 border rounded-md">
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
                  <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-md">
                    {isPreviewLoading ? 'Executing query against selected connection...' : 'Click "Run Query Preview" above to execute and preview sample data.'}
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