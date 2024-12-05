import { useDatasetStore } from '@/app/store/datasets';
import { Dataset } from '@/app/types/datasource';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export function useDatasets() {
    const { data: session } = useSession()
    const { loading, addDataset, updateDataset, deleteDataset } = useDatasetStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingDataset, setEditingDataset] = useState<Dataset | null>(null);
  
    const [datasetForm, setDatasetForm] = useState<Dataset>({} as Dataset);
  
    const handleSave = async () => {
      console.log('Save dataset', datasetForm);
      if(!session?.user?.id) {
        alert('You must be logged in to save a dataset');
        return;
      };
      console.log('Save dataset', {
        ...datasetForm,
        userId: session?.user?.id
      });

      // if (editingDataset) {
      //   await updateDataset(editingDataset.id!, {
      //     ...datasetForm, 
      //     userId: session?.user?.id
      //   });
      // } else {
      //   await addDataset({
      //     ...datasetForm, 
      //     userId: session?.user?.id,
      //   });
      // }
      // setIsDialogOpen(false);
    }

    const handleEdit = (dataset: Dataset) => { 
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