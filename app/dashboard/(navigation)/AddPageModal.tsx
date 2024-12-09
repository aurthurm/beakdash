'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import IconSelector from '@/app/ui/components/icons/IconSelector';
import { ErrorBoundary } from '@/app/ui/components/ErrorBoundary';
import { IPage } from '@/app/lib/drizzle/schemas';
import { useAuth } from '@clerk/nextjs'

interface AddPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (menuItem: IPage) => void;
}

const AddPageModal: React.FC<AddPageModalProps> = ({ isOpen, onClose, onAdd }) => {
  const { userId } = useAuth()
  const [form, setForm] = useState<IPage>({
    icon: '', label: '', route: '', active: false, userId: ''
  } as IPage);
  
  const updateForm = (update: Partial<IPage>) => {
    setForm(({...form, ...update} as IPage));
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!userId) {
      console.log('You must be logged in to add a Page');
      return;
    };
    onAdd({...form, userId: userId} as IPage);
    // Reset form
    setForm({icon: '', label: '', route: '', active: false, userId: ''});
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add Page</h2>
          <button aria-label="close add page modal" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Label</label>
            <input
              type="text"
              value={form.label}
              onChange={(e) => updateForm({ label: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Page Label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Route</label>
            <input
              type="text"
              value={form.route}
              onChange={(e) => updateForm({ route: e.target.value })}
              className="w-full p-2 border rounded-lg"
              placeholder="Page Route"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Page Icon</label>
            <ErrorBoundary>
              <IconSelector
                selectedIcon={form.icon}
                onSelectIcon={(icon) => updateForm({ icon })}
              />
            </ErrorBoundary>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Page
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPageModal;