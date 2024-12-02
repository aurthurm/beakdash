'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/ui/components/select";
import { Widget } from '@/app/types/widget';
import React,  { useState } from 'react';
import { DataSource, DataSourceType } from "@/app/types/datasource";

interface ConnectionPanelProps {
  widget: Widget;
  onUpdate: (update: Partial<Widget>) => void;
}

// Left Panel Components
const ConnectionPanel: React.FC<ConnectionPanelProps> = ({ widget, onUpdate }) => {
  const [dataSourceType, setDataSourceType] = useState<DataSourceType>(widget.dataSource.type || 'sql');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Data Source Type</label>
        <Select 
            value={dataSourceType}
            onValueChange={(type: DataSourceType) => {
              setDataSourceType(type);
              onUpdate({
                ...widget, 
                dataSource: {...widget.dataSource, type} as DataSource
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sql">SQL Database</SelectItem>
              <SelectItem value="rest">REST API</SelectItem>
              <SelectItem value="csv">CSV File</SelectItem>
            </SelectContent>
          </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Connection</label>
        <Select 
            value="postgres"
            onValueChange={(val) => val}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="postgres">PostgreSQL</SelectItem>
              <SelectItem value="mysql">MySQL/MariaDb</SelectItem>
              <SelectItem value="sqlite">SQLite</SelectItem>
            </SelectContent>
          </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Schema</label>
        <Select 
            value="public"
            onValueChange={(val) => val}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">public</SelectItem>
              <SelectItem value="myanalyticssql">analytics</SelectItem>
            </SelectContent>
          </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Dataset/Table</label>
        <Select 
            value="public"
            onValueChange={(val) => val}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Value" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="users">Users</SelectItem>
              <SelectItem value="orders">Orders</SelectItem>
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