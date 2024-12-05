import { useEffect, useState } from "react";
import { Input } from "@/app/ui/components/input";
import { Label } from "@/app/ui/components/label";
import { Badge } from "@/app/ui/components/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/ui/components/select";
import { Connection, Dataset, SchemaInfo, ColumnInfo } from "@/app/types/datasource";
import { useConnectionStore } from "@/app/store/connections";
import { useSession } from "next-auth/react";
import { Button } from "@/app/ui/components/button";
import { Alert, AlertDescription } from "@/app/ui/components/alert";
import { Loader } from "lucide-react";

interface DatasetFormProps {
  form: Dataset;
  setForm: (form: Dataset) => void;
}

export function DatasetForm({ form, setForm }: DatasetFormProps) {
  const { data: session } = useSession();
  const { connections, fetchConnections } = useConnectionStore();
  const [connection, setConnection] = useState<Connection | null>(null);
  const [fetchingSchemas, setFetchingSchemas] = useState(false);
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null);
  const [selectedSchema, setSelectedSchema] = useState<string>('');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [columns, setColumns] = useState<ColumnInfo[]>([]);

  useEffect(() => {
    if (connections.length === 0 && session?.user?.id) {
      fetchConnections(session.user.id);
    }
  }, [session, connections, fetchConnections]);

  // Reset selections when schema info changes
  useEffect(() => {
    setSelectedSchema('');
    setSelectedTable('');
    setColumns([]);
  }, [schemaInfo]);

  // Update columns when table selection changes
  useEffect(() => {
    if (schemaInfo && selectedSchema && selectedTable) {
      const tableColumns = schemaInfo[selectedSchema]?.[selectedTable] || [];
      setColumns(tableColumns);
    } else {
      setColumns([]);
    }
  }, [schemaInfo, selectedSchema, selectedTable]);

  const getTableColumns = (schema: string, table: string) => {
    return schemaInfo?.[schema]?.[table] || [];
  }

  const updateForm = (update: Partial<Dataset>) => {
    setForm({ ...form, ...update });
  };

  const onConnectionSelect = async (connectionId: string) => {
    updateForm({ connectionId });
    const conn = connections.find(c => c.id === connectionId);
    if (conn) {
      setConnection(conn);
      setSchemaInfo(null);
      await fetchSQLConnectionSchemas(conn);
    } else {
      setConnection(null);
    }
  };

  const onSetSelectedSchema = (schema: string) => {
    setSelectedSchema(schema);
    updateForm({ schema });
  }

  const onSetSelectedTable = (table: string) => {
    setSelectedTable(table);
    updateForm({ table });
    updateForm({ columns: getTableColumns(selectedSchema, table) });
  }

  const fetchSQLConnectionSchemas = async (conn?: Connection) => {
    const theConnection = conn || connection;
    setFetchingSchemas(true);
    if (!theConnection?.config) {
      console.log('No connection config', theConnection);
      return;
    }
    try {
      const response = await fetch('/api/connections/schemas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(theConnection?.config)
      });
      const results = await response.json();
      setSchemaInfo(results);
    } catch (error) {
      console.error('Error fetching schemas:', error);
      setSchemaInfo(null);
    }
    setFetchingSchemas(false);
  };

  // Get available schemas from schemaInfo
  const availableSchemas = schemaInfo ? Object.keys(schemaInfo) : [];
  
  // Get available tables from selected schema
  const availableTables = selectedSchema && schemaInfo 
    ? Object.keys(schemaInfo[selectedSchema] || {})
    : [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-5 gap-4 place-items-center">
        <div className="col-span-2">
          <Label>Dataset Name</Label>
          <Input 
            value={form.name || ''}
            onChange={(e) => updateForm({ name: e.target.value })}
            placeholder="My Dataset Name"
          />
        </div>

        <div className="col-span-2">
          <Label>Connection</Label>
          <Select 
            value={form.connectionId} 
            onValueChange={onConnectionSelect}>
            <SelectTrigger>
              <SelectValue placeholder="Select dataset connection" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {connections.map(conn => (
                <SelectItem key={conn.id} value={conn.id!}>{conn.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-1">
        {connection?.type === 'sql' &&(<Button 
            variant="outline" 
            className="mt-5 flex items-center gap-2"
            onClick={() => fetchSQLConnectionSchemas()}
          > Fetch <Loader size={16} />
          </Button>)}
        </div>
      </div>

      {connection?.type === 'sql' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            {fetchingSchemas && <p>Fetching schemas...</p>}
            {(!fetchingSchemas && !schemaInfo) && (
              <Alert variant="destructive">
                <AlertDescription>Failed to get schema Information</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Schema</Label>
              <Select 
                value={selectedSchema} 
                onValueChange={onSetSelectedSchema}>
                <SelectTrigger>
                  <SelectValue placeholder="Select schema" />
                </SelectTrigger>
                <SelectContent>
                  {availableSchemas.map(schema => (
                    <SelectItem key={schema} value={schema}>{schema}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Table</Label>
              <Select 
                value={selectedTable} 
                onValueChange={onSetSelectedTable}
                disabled={!selectedSchema}>
                <SelectTrigger>
                  <SelectValue placeholder="Select table" />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map(table => (
                    <SelectItem key={table} value={table}>{table}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {columns.length > 0 && (
            <div>
              <Label>Available Columns</Label>
              <div className="mt-2 border rounded-lg">
                <div className="max-h-[150px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-muted sticky top-0">
                      <tr>
                        <th className="text-left p-2 text-sm font-medium">Column</th>
                        <th className="text-left p-2 text-sm font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {columns.map((col, idx) => (
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
            </div>
          )}
        </>
      )}
    </div>
  );
}