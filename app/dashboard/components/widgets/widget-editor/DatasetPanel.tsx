'use client';

import { IDataset, IWidget } from "@/app/lib/drizzle/schemas";
import { Badge } from "@/app/ui/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/components/select";
import React from 'react';

interface DataPanelProps {
  form: IWidget;
  datasets: IDataset[];
  dataset: IDataset | null; 
  onUpdateDataset: (datasetId: string) => void;
}

// Left Panel Components
const DatasetPanel: React.FC<DataPanelProps> = ({ form, onUpdateDataset, dataset, datasets }) => {

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Dataset</label>
        <Select 
            value={form.datasetId}
            onValueChange={onUpdateDataset}
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

      {dataset && <div className="mt-4">
        <p className="my-4 leasing">Table Name: {dataset.table}</p>
        <h3 className="text-sm font-medium mb-2">Available Columns</h3>
        <div className="mt-2 border rounded-lg">
          <div className="max-h-[250px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2 text-sm font-medium">Column</th>
                  <th className="text-left p-2 text-sm font-medium">Type</th>
                </tr>
              </thead>
              <tbody>
                {dataset?.columns?.map((col, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="p-2 text-sm">{col.column}</td>
                    <td className="p-2">
                      <Badge variant="secondary" className="text-xs font-mono">
                        {col.type}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>}

    </div>
  );
};

export default DatasetPanel;