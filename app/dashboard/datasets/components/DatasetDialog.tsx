import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription  } from '@/app/ui/components/dialog';

import { Button } from '@/app/ui/components/button';
import { DatasetForm } from './DatasetForm';
import { Save } from 'lucide-react';
import { IDataset } from '@/app/lib/drizzle/schemas';


interface DatasetDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingDataset: IDataset | null;
    onSave: () => void;
    form: IDataset;
    setForm: (form: IDataset) => void;
  }
  
  export function DatasetDialog({
    isOpen,
    onOpenChange,
    editingDataset,
    onSave,
    form,
    setForm,
  }: DatasetDialogProps) {

    return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>
                {editingDataset ? 'Edit Dataset' : 'Add New Dataset'}
                </DialogTitle>
            </DialogHeader>
            <DialogDescription>
                Manage Datasets
            </DialogDescription>
            
            <DatasetForm form={form} setForm={setForm} />

            <div className="flex justify-end gap-2 mt-4">
                <Button 
                variant="outline" 
                onClick={() => {
                    onOpenChange(false);
                    // setEditingDataset(null);
                    // resetForms();
                }}
                >
                Cancel
                </Button>

                <Button 
                className="flex items-center gap-2"
                onClick={() => onSave()}
                >
                    <Save size={16} />
                    {editingDataset ? 'Update' : 'Save'} Dataset
                </Button>
            </div>
        </DialogContent>
    </Dialog>
    );
  }