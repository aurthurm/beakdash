'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ImenuItem } from '@/app/types/menu';
import IconSelector from '@/app/ui/components/IconSelector';
import { ErrorBoundary } from '@/app/ui/components/ErrorBoundary';

interface AddPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (menuItem: ImenuItem) => void;
}

const AddPageModal: React.FC<AddPageModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [icon, setIcon] = useState('');
  const [label, setLabel] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      icon,
      label
    });

    // Reset form
    setIcon('');
    setLabel('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Add Page</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full p-2 border rounded-lg"
              placeholder="Page Label"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Page Icon</label>
            <ErrorBoundary>
              <IconSelector
                selectedIcon={icon}
                onSelectIcon={setIcon}
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