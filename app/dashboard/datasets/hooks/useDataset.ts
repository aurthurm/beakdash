import { IDataset } from '@/app/lib/drizzle/schemas';
import { useDatasetStore } from '@/app/store/datasets';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export function useDatasets() {
    const { data: session } = useSession()
    const { loading, addDataset, updateDataset, deleteDataset } = useDatasetStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDataset, setEditingDataset] = useState<IDataset | null>(null);
  
    const [datasetForm, setDatasetForm] = useState<IDataset>({} as IDataset);
  
    const handleSave = async () => {
      if(!session?.user?.id) {
        alert('You must be logged in to save a dataset');
        return;
      };
      
      if (editingDataset) {
        await updateDataset(editingDataset.id!, {
          ...datasetForm, 
          userId: session?.user?.id
        });
      } else {
        await addDataset({
          ...datasetForm, 
          userId: session?.user?.id,
        });
      }
      setIsDialogOpen(false);
      // Reset forms
      setDatasetForm({} as IDataset);
      setEditingDataset({} as IDataset);
    }

    const handleEdit = (dataset: IDataset) => { 
      setEditingDataset(dataset);
      setDatasetForm(dataset);
      setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => { 
      await deleteDataset(id);
    };
  
    return {
      isDialogOpen,
      setIsDialogOpen,
      editingDataset,
      loading,
      form: datasetForm,
      setForm: setDatasetForm,
      handlers: { handleSave, handleEdit, handleDelete },
    };
}