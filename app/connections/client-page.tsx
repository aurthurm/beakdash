'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { del } from '@/lib/api';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Database, 
  Link as LinkIcon, 
  Edit, 
  Trash2, 
  Plus, 
  Layers, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Table2, 
  Key, 
  Search,
  ExternalLink,
  Code2
} from 'lucide-react';
import { useToast } from '@/lib/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

interface ColumnInfo {
  column: string;
  type: string;
  nullable?: boolean;
  isPrimaryKey?: boolean;
}

interface SchemaInfo {
  [schemaName: string]: {
    [tableName: string]: ColumnInfo[];
  };
}

export function ConnectionsClient() {
  const { toast } = useToast();
  const [testingId, setTestingId] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, { success: boolean; latencyMs?: number; message?: string }>>({});
  const [selectedSchemaConn, setSelectedSchemaConn] = useState<Connection | null>(null);
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null);
  const [isSchemaLoading, setIsSchemaLoading] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [connectionToDelete, setConnectionToDelete] = useState<Connection | null>(null);

  // Fetch connections
  const { data: connections = [], isLoading, isError, refetch } = useQuery<Connection[]>({
    queryKey: ['/api/connections'],
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Test live connection directly
  const handleTestConnection = async (conn: Connection) => {
    setTestingId(conn.id);
    try {
      const response = await fetch('/api/connections/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: conn.type,
          ...conn.config,
          host: conn.config.hostname || conn.config.host,
          user: conn.config.username || conn.config.user,
        }),
      });

      const data = await response.json();
      setTestResults((prev) => ({
        ...prev,
        [conn.id]: {
          success: response.ok && data.success,
          latencyMs: data.latencyMs,
          message: data.message || data.error,
        },
      }));

      if (response.ok && data.success) {
        toast({
          title: 'Connection Healthy',
          description: `Connected to ${conn.name} in ${data.latencyMs || 0}ms.`,
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: data.error || data.message || 'Unable to connect to database.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [conn.id]: { success: false, message: err.message },
      }));
      toast({
        title: 'Connection Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setTestingId(null);
    }
  };

  // Open Schema Explorer
  const handleOpenSchemaExplorer = async (conn: Connection) => {
    setSelectedSchemaConn(conn);
    setIsSchemaLoading(true);
    setSchemaInfo(null);
    try {
      const response = await fetch(`/api/connections/${conn.id}/schema-info`);
      const data = await response.json();
      if (response.ok && data.success) {
        setSchemaInfo(data.schemaInfo);
      } else {
        toast({
          title: 'Schema Introspection Failed',
          description: data.error || 'Failed to fetch database schema.',
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSchemaLoading(false);
    }
  };

  const handleDeleteConnection = (conn: Connection) => {
    setConnectionToDelete(conn);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!connectionToDelete) return;
    try {
      await del(`/api/connections/${connectionToDelete.id}`);
      toast({
        title: 'Connection deleted',
        description: 'The connection has been successfully removed.',
      });
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete connection.',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setConnectionToDelete(null);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Connections</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure databases, data warehouses, APIs, and file sources
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5 shadow-sm">
          <Link href="/connections/create">
            <Plus className="h-4 w-4" />
            <span>New Connection</span>
          </Link>
        </Button>
      </div>

      {/* Quick Connect Templates */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Link href="/connections/create?type=postgresql" className="block group">
          <div className="rounded-xl border bg-card p-4 hover:border-primary transition-all hover:shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold text-sm">
                PG
              </div>
              <div>
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">PostgreSQL</h3>
                <p className="text-[11px] text-muted-foreground">Postgres, Supabase, Neon</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/connections/create?type=mysql" className="block group">
          <div className="rounded-xl border bg-card p-4 hover:border-primary transition-all hover:shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-sm">
                MY
              </div>
              <div>
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">MySQL / MariaDB</h3>
                <p className="text-[11px] text-muted-foreground">PlanetScale, RDS, MySQL 8+</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/connections/create?type=rest" className="block group">
          <div className="rounded-xl border bg-card p-4 hover:border-primary transition-all hover:shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <LinkIcon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold group-hover:text-primary transition-colors">REST API & CSV</h3>
                <p className="text-[11px] text-muted-foreground">JSON APIs, Webhooks, CSV</p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Connections List */}
      <div>
        <h2 className="text-base font-semibold mb-4">Active Connections ({connections.length})</h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse h-48 bg-muted/40" />
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
            <p className="text-sm font-medium text-destructive">Failed to load connections.</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-3">
              Retry
            </Button>
          </div>
        ) : connections.length === 0 ? (
          <div className="p-12 text-center border border-dashed rounded-xl bg-card">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold">No connections added yet</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
              Add your PostgreSQL, MySQL, SQLite or REST API datasource to begin.
            </p>
            <Button asChild size="sm">
              <Link href="/connections/create">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Connection
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((conn) => {
              const test = testResults[conn.id];
              const isTesting = testingId === conn.id;

              return (
                <Card key={conn.id} className="hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden border-border/80">
                  <CardHeader className="pb-3 bg-muted/20 border-b">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <Database className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold leading-tight">{conn.name}</h3>
                          <p className="text-[11px] text-muted-foreground capitalize mt-0.5">
                            {conn.type} • {conn.config?.database || 'Database'}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] uppercase font-mono">
                        {conn.type}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="py-3 text-xs space-y-2 flex-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Host:</span>
                      <span className="font-mono text-foreground">{conn.config?.hostname || conn.config?.host || 'localhost'}</span>
                    </div>
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span>Database:</span>
                      <span className="font-mono text-foreground">{conn.config?.database || '—'}</span>
                    </div>
                    {test && (
                      <div className="mt-2 pt-2 border-t flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">Status:</span>
                        {test.success ? (
                          <Badge variant="secondary" className="text-[10px] gap-1 text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                            <CheckCircle2 className="h-3 w-3" />
                            Connected ({test.latencyMs}ms)
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="pt-2 pb-3 border-t bg-muted/10 flex flex-wrap items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] px-2 gap-1"
                        onClick={() => handleTestConnection(conn)}
                        disabled={isTesting}
                      >
                        {isTesting ? (
                          <RefreshCw className="h-3 w-3 animate-spin" />
                        ) : (
                          <Activity className="h-3 w-3 text-emerald-500" />
                        )}
                        <span>{isTesting ? 'Testing...' : 'Test'}</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 text-[11px] px-2 gap-1"
                        onClick={() => handleOpenSchemaExplorer(conn)}
                      >
                        <Table2 className="h-3 w-3 text-blue-500" />
                        <span>Schema</span>
                      </Button>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                        <Link href={`/connections/${conn.id}/edit`}>
                          <Edit className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteConnection(conn)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Interactive Schema Explorer Dialog */}
      <Dialog open={Boolean(selectedSchemaConn)} onOpenChange={(open) => !open && setSelectedSchemaConn(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between pr-6">
              <div>
                <DialogTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4 text-primary" />
                  <span>Schema Explorer: {selectedSchemaConn?.name}</span>
                </DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  Browse tables, views, and column definitions in {selectedSchemaConn?.config?.database || 'database'}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search tables across schemas..."
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {isSchemaLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground text-xs">
                <RefreshCw className="h-5 w-5 animate-spin text-primary" />
                <span>Introspecting database structure...</span>
              </div>
            ) : !schemaInfo || Object.keys(schemaInfo).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground text-xs">
                No schemas or accessible tables found for this connection.
              </div>
            ) : (
              Object.entries(schemaInfo).map(([schemaName, tables]) => {
                const tableNames = Object.keys(tables).filter((t) =>
                  t.toLowerCase().includes(tableSearch.toLowerCase()) ||
                  schemaName.toLowerCase().includes(tableSearch.toLowerCase())
                );

                if (tableNames.length === 0) return null;

                return (
                  <div key={schemaName} className="rounded-lg border bg-card p-3 space-y-2">
                    <div className="flex items-center justify-between pb-1 border-b">
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">
                        Schema: {schemaName}
                      </span>
                      <Badge variant="secondary" className="text-[10px]">
                        {tableNames.length} tables
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                      {tableNames.map((tableName) => {
                        const cols = tables[tableName] || [];
                        return (
                          <div key={tableName} className="border rounded-md p-2.5 bg-muted/20 hover:bg-muted/40 transition-colors space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-medium truncate">{tableName}</span>
                              <Button asChild size="sm" variant="ghost" className="h-6 text-[10px] gap-1 px-1.5">
                                <Link href={`/datasets/create?connectionId=${selectedSchemaConn?.id}&table=${schemaName}.${tableName}`}>
                                  <span>Query</span>
                                  <ExternalLink className="h-2.5 w-2.5" />
                                </Link>
                              </Button>
                            </div>
                            <div className="text-[10px] text-muted-foreground line-clamp-2 font-mono">
                              {cols.slice(0, 5).map((c) => c.column).join(', ')}
                              {cols.length > 5 ? ` +${cols.length - 5} more` : ''}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <DialogFooter className="border-t pt-3">
            <Button variant="outline" size="sm" onClick={() => setSelectedSchemaConn(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Connection</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{connectionToDelete?.name}</span>? Any datasets or queries relying on this connection will be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}