'use client';

import { IWidget } from "@/app/lib/drizzle/schemas";
import { useDatasetStore } from "@/app/store/datasets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/components/select";
import { useSession } from "next-auth/react";
import React, { useEffect } from 'react';

interface ConnectionPanelProps {
  widget: IWidget;
  onUpdate: (update: Partial<IWidget>) => void;
}

// Left Panel Components
const ConnectionPanel: React.FC<ConnectionPanelProps> = ({ widget, onUpdate }) => {
  const { data: session } = useSession()
  const { datasets, fetchDatasets } = useDatasetStore();

  useEffect(() => {
    if(!session?.user?.id) {
      console.log('You must be logged in to fetch datasets');
      return;
    }
    (async () => {
      await fetchDatasets(session.user?.id);
    })();
  },[session?.user?.id]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Dataset</label>
        <Select 
            value={widget.datasetId}
            onValueChange={(datasetId) => updateForm({ datasetId })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Value" />
            </SelectTrigger>
            <SelectContent>
              {datasets.map(dataset => (
                <SelectItem key={dataset.id} value={dataset.id!} >{dataset.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
      </div>

      <div className="mt-4">
        <h3 className="text-sm font-medium mb-2">Available Columns</h3>
        <div className="border rounded p-2 max-h-60 overflow-y-auto">
          {/* Column list with types */}
          <div className="flex justify-between text-sm py-1">
            <span>id</span>
            <span className="text-gray-500">integer</span>
          </div>
          <div className="flex justify-between text-sm py-1">
            <span>name</span>
            <span className="text-gray-500">string</span>
          </div>
          {/* Add more columns */}
        </div>
      </div>
    </div>
  );
};

export default ConnectionPanel;