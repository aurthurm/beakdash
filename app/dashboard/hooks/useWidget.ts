import { IWidget } from '@/app/lib/drizzle/schemas';
import { useWidgetStore } from '@/app/store/widgetStore';
import { useAuth } from '@clerk/nextjs'
import { useState } from 'react';

export function useWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const { userId } = useAuth()
    const { addWidget, updateWidget, deleteWidget } = useWidgetStore();
    const [isEditingWidget, setIsEditingWidget] = useState(false);
  
    const [form, setForm] = useState<IWidget>({
      title: '',
      subtitle: '',
      datasetId: '',
    } as IWidget);
  
    const handleSave = async (pageId: string) => {
      if(!userId) {
        console.error('User not authenticated - cannot save widget');
        return;
      }
      if(!pageId) {
        console.error('No pageId provided - cannot save widget');
        return;
      }
      const payload = { 
        ...form, 
        userId,
        pageId
      } as IWidget;

      if(isEditingWidget && form.id) {
        await updateWidget(form.id, payload);
      } else {
        await addWidget(payload);
      }
      
      // Reset form
      setForm({
        title: '',
        subtitle: '',
        datasetId: '',
      } as IWidget);
      // close modal
      setIsOpen(false);
    };

    const handleEdit = (widget: IWidget) => { 
      setForm(widget)
      setIsEditingWidget(true);
      setIsOpen(true);
    };

    const handleDelete = async (id: string) => { 
      await deleteWidget(id);
    };

    const handleUpdate = async (id: string, data: IWidget) => {
      await updateWidget(id, data);
    };
  
    return {
      isOpen, 
      setIsOpen,
      isEditingWidget,
      form,
      setForm,
      handlers: { handleSave, handleEdit, handleDelete, handleUpdate },
    };
  }