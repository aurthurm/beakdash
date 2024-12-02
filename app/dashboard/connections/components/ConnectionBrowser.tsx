import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/ui/components/card';
import { Button } from '@/app/ui/components/button';
import { FileSpreadsheet, Database, Globe, Edit2, Trash2 } from 'lucide-react';


interface ConnectionBrowserProps {
    connection: any;
    onEdit: (connection: any) => void;
    onDelete: (id: string) => void;
  }
  
  export function ConnectionBrowser({ connection, onEdit, onDelete }: ConnectionBrowserProps) {
    return (
        <Card key={connection.id}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {connection.type === 'csv' && <FileSpreadsheet size={20} />}
            {connection.type === 'sql' && <Database size={20} />}
            {connection.type === 'rest' && <Globe size={20} />}
            {connection.name}
          </CardTitle>
          <CardDescription>{connection.type.toUpperCase()} Connection</CardDescription>
        </CardHeader>
        <CardContent>
           {connection.type === 'csv' && (
             <div className="text-sm space-y-1">
               <p>File ID: {connection.fileId}</p>
               <p>X-Axis: {connection.columnMapping.xAxis}</p>
               <p>Y-Axis: {connection.columnMapping.yAxis}</p>
             </div>
           )}
           {connection.type === 'sql' && (
             <div className="text-sm space-y-1">
               <p className="truncate">Connection: {connection.connectionString}</p>
               <p className="truncate">Query: {connection.query}</p>
             </div>
           )}
           {connection.type === 'rest' && (
             <div className="text-sm space-y-1">
               <p className="truncate">Endpoint: {connection.endpoint}</p>
               <p>Method: {connection.method}</p>
               <p className="truncate">Data Path: {connection.dataPath}</p>
             </div>
           )}
         </CardContent>
         <CardFooter className="flex justify-between">
           <p className="text-sm text-gray-500">
             Refresh: {connection.refreshInterval}ms
           </p>
           <div className="flex gap-2">
             <Button 
               variant="outline" 
               size="sm"
               onClick={() => onEdit(connection)}
             >
               <Edit2 size={16} />
             </Button>
             <Button 
               variant="outline" 
               size="sm" 
               className="text-red-600"
               onClick={() => onDelete(connection.id)}
             >
               <Trash2 size={16} />
             </Button>
           </div>
         </CardFooter>
      </Card>
    );
  }