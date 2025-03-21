'use client';
import { useDatasets } from './hooks/useDataset';
import { DatasetDialog } from './components/DatasetDialog';
import { useEffect } from 'react';
import { useDatasetStore } from '@/app/store/datasets';
import { DatasetManager } from './components/DatasetManager';
import { useAuth } from '@clerk/nextjs'

export default function DatasetsPage() {
  const { userId } = useAuth()
  const { datasets, fetchDatasets } = useDatasetStore();
  const {
    isDialogOpen,
    setIsDialogOpen,
    editingDataset,
    form,
    setForm,
    handlers,
  } = useDatasets();

  useEffect(() => {
    if(!userId){
      console.log('No user id found, cant fetch datasets');
      return;
    }
    fetchDatasets(userId);
  }, [fetchDatasets, userId]);

  return (
    <div className="p-6 space-y-6">
     <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Datasets</h1>
          <p className="text-gray-500">Configure and manage your data sources</p>
        </div>
      </div>

      <DatasetDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingDataset={editingDataset}
        onSave={handlers.handleSave}
        form={form}
        setForm={setForm}
      />

      <DatasetManager 
        datasets={datasets}
        onEdit={handlers.handleEdit}
        onDelete={handlers.handleDelete}
        setIsDialogOpen={setIsDialogOpen}
      />
    </div>
  );
}