import React, { useMemo } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent
} from '@/app/ui/components/Card';
import {
  Table as UITable,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from '@/app/ui/components/Table';
import { DataPoint } from '@/app/types/data';

interface DataExplorerProps {
  data: DataPoint[];
}

const DataExplorer: React.FC<DataExplorerProps> = ({ data }) => {
  const columns = useMemo(() => {
    try {
      if (!Array.isArray(data) || data.length === 0 || !data[0]) return [];
      const firstRow = data[0];
      if (typeof firstRow !== 'object' || firstRow === null) return [];
      return Object.keys(firstRow);
    } catch (error) {
      console.error('Error getting columns:', error);
      return [];
    }
  }, [data]);

  return (
    <Card>
      <CardContent>
        <div className="overflow-x-auto mt-2">
          <UITable>
            <TableHeader>
              <TableRow>
                {columns.map(column => (
                  <TableHead key={column}>
                    <div className="flex items-center space-x-2">
                      <span>{column}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.slice(0, 5).map((row, i) => (
                <TableRow key={i}>
                  {columns.map(column => (
                    <TableCell key={column}>{row[column]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </UITable>
          {data.length > 5 && (
            <div className="text-sm text-gray-500 mt-2">
              Showing 5 of {data.length} rows
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExplorer;