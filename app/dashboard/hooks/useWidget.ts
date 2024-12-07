import { IWidget } from '@/app/lib/drizzle/schemas';
import { useWidgetStore } from '@/app/store/widgetStore';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export function useWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const { data: session } = useSession()
    const { addWidget, updateWidget, deleteWidget } = useWidgetStore();
    const [isEditingWidget, setIsEditingWidget] = useState(false);
  
    const [form, setForm] = useState<IWidget>({
      title: '',
      subtitle: '',
      datasetId: '',
    } as IWidget);
  
    const handleSave = async (pageId: string) => {
      if(!session?.user?.id) {
        console.error('User not authenticated - cannot save widget');
        return;
      }
      if(!pageId) {
        console.error('No pageId provided - cannot save widget');
        return;
      }
      const payload = { 
        ...form, 
        userId: session.user.id,
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
      setIsOpen(false);
    };

    const handleEdit = (widget: IWidget) => { 
      setIsEditingWidget(true);
      setForm(widget)
    };

    const handleDelete = async (id: string) => { 
      await deleteWidget(id);
    };

    const handleUpdate = async (id: string, data: Partial<IWidget>) => {
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