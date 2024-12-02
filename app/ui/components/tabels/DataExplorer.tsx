import React, { useMemo } from 'react';
import {
  Card,
  CardContent
} from "@/app/ui/components/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@/app/ui/components/table";

interface DataPoint {
  [key: string]: any;
}

interface DataExplorerProps {
  data: DataPoint[];
}

const DataExplorer = ({ data }: DataExplorerProps) => {
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
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(column => (
                  <TableHead key={column} className="font-medium">
                    <div className="flex items-center gap-2">
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
                    <TableCell key={column}>
                      {String(row[column])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data.length > 5 && (
            <div className="text-sm text-muted-foreground mt-2">
              Showing 5 of {data.length} rows
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DataExplorer;