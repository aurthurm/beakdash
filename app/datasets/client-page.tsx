'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Database, 
  RefreshCw, 
  Trash2, 
  Play, 
  Layers, 
  Clock, 
  Calendar,
  Sparkles,
  Search,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/lib/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Dataset {
  id: number;
  name: string;
  query: string;
  refreshInterval?: string;
  refresh_interval?: string;
  connectionId?: number;
  connection_id?: number;
  connection?: {
    id: number;
    name: string;
    type: string;
  };
  userId?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
}

export function DatasetsClient() {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<Dataset | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch datasets
  const {
    data: datasets = [],
    isLoading: datasetsLoading,
    isError: datasetsError,
    refetch: refetchDatasets,
  } = useQuery<Dataset[]>({
    queryKey: ['/api/datasets'],
    retry: 2,
    refetchOnWindowFocus: false,
  });

  const handleDeleteClick = (dataset: Dataset) => {
    setDatasetToDelete(dataset);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!datasetToDelete) return;

    try {
      const response = await fetch(`/api/datasets/${datasetToDelete.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete dataset');
      }

      toast({
        title: 'Dataset deleted',
        description: `${datasetToDelete.name} has been deleted successfully.`,
      });

      refetchDatasets();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete dataset',
        variant: 'destructive',
      });
    } finally {
      setDeleteDialogOpen(false);
      setDatasetToDelete(null);
    }
  };

  const filteredDatasets = datasets.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.query && d.query.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Datasets</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage semantic queries, data transformations, and model definitions
          </p>
        </div>
        <Button asChild size="sm" className="gap-1.5 shadow-sm">
          <Link href="/datasets/create">
            <Plus className="h-4 w-4" />
            <span>New Dataset</span>
          </Link>
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search datasets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-9 text-xs"
          />
        </div>
        <Badge variant="outline" className="text-xs py-1">
          {filteredDatasets.length} {filteredDatasets.length === 1 ? 'Dataset' : 'Datasets'}
        </Badge>
      </div>

      {/* Datasets Grid */}
      {datasetsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-48 bg-muted/40" />
          ))}
        </div>
      ) : datasetsError ? (
        <div className="p-8 rounded-xl border border-destructive/20 bg-destructive/5 text-center">
          <p className="text-sm font-medium text-destructive">Failed to load datasets.</p>
          <Button variant="outline" size="sm" onClick={() => refetchDatasets()} className="mt-3">
            Retry
          </Button>
        </div>
      ) : filteredDatasets.length === 0 ? (
        <div className="p-12 text-center border border-dashed rounded-xl bg-card">
          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
            <Layers className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold">No datasets found</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
            {searchQuery ? 'No datasets match your search query.' : 'Create your first dataset to start querying and building dashboards.'}
          </p>
          <Button asChild size="sm">
            <Link href="/datasets/create">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Dataset
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDatasets.map((dataset) => {
            const connName = dataset.connection?.name || `Connection #${dataset.connectionId || dataset.connection_id || '?'}`;
            const connType = dataset.connection?.type || 'sql';
            const refresh = dataset.refreshInterval || dataset.refresh_interval || 'manual';

            return (
              <Card key={dataset.id} className="hover:shadow-md transition-shadow flex flex-col justify-between overflow-hidden border-border/80">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Database className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold leading-tight">{dataset.name}</CardTitle>
                        <p className="text-[11px] text-muted-foreground capitalize mt-0.5">{connName} ({connType})</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] uppercase font-mono tracking-wider shrink-0">
                      {refresh}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="py-2 flex-1">
                  {dataset.query ? (
                    <div className="bg-muted/50 rounded-md p-2 text-[11px] font-mono text-muted-foreground line-clamp-3 leading-relaxed border">
                      {dataset.query}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No custom SQL query defined.</p>
                  )}
                </CardContent>

                <CardFooter className="pt-3 pb-3 border-t bg-muted/20 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-muted-foreground">ID: #{dataset.id}</span>
                  <div className="flex items-center gap-1.5">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteClick(dataset)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="sm" asChild className="h-7 text-xs gap-1">
                      <Link href={`/datasets/${dataset.id}`}>
                        <span>Explore</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Dataset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{datasetToDelete?.name}</span>? This action cannot be undone.
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