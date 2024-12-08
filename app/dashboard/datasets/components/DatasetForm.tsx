import { useCallback, useEffect, useState } from "react";
import { Input } from "@/app/ui/components/input";
import { Label } from "@/app/ui/components/label";
import { Badge } from "@/app/ui/components/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/ui/components/select";
import { SchemaInfo } from "@/app/types/datasource";
import { useConnectionStore } from "@/app/store/connections";
import { useSession } from "next-auth/react";
import { Button } from "@/app/ui/components/button";
import { Alert, AlertDescription } from "@/app/ui/components/alert";
import { Loader } from "lucide-react";
import { IConnection, IDataset } from "@/app/lib/drizzle/schemas";

interface DatasetFormProps {
  form: IDataset;
  setForm: (form: IDataset) => void;
}

export function DatasetForm({ form, setForm }: DatasetFormProps) {
  const { data: session } = useSession();
  const { connections, fetchConnections } = useConnectionStore();
  const [connection, setConnection] = useState<IConnection | null>(null);
  const [fetchingSchemas, setFetchingSchemas] = useState(false);
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null);

  const fetchSQLConnectionSchemas = useCallback(async (conn?: IConnection) => {
    const theConnection = conn || connection;
    setFetchingSchemas(true);
    if (!theConnection?.config) {
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
  }, [connection]);

  // get user connections
  useEffect(() => {
    if (connections.length === 0 && session?.user?.id) {
      fetchConnections(session.user.id);
    }
  }, [session, connections, fetchConnections]);

  // form data if editing dataset
  useEffect(() => {
    if(form.connectionId){
      const conn = connections.find(c => c.id === form.connectionId);
      if (conn) {
        setConnection(conn);
        Promise.resolve(fetchSQLConnectionSchemas(conn));
      }
    }
  }, [connections, fetchSQLConnectionSchemas, form]);

  const getTableColumns = (table: string) => {
    return schemaInfo?.[form.schema!]?.[table] || [];
  }

  const updateForm = (update: Partial<IDataset>) => {
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

  // Get available schemas from schemaInfo
  const availableSchemas = schemaInfo ? Object.keys(schemaInfo) : [];
  
  // Get available tables from selected schema
  const availableTables = form.schema && schemaInfo 
    ? Object.keys(schemaInfo[form.schema] || {})
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
                value={form.schema}
                onValueChange={(schema) => updateForm({ schema, table: undefined })}>
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
                value={form.table}
                onValueChange={(table) => {
                  updateForm({ table, columns: getTableColumns(table) });
                }}
                disabled={!form.schema}>
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

          {form.table && <div>
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
                    {form?.columns?.map((col, idx) => (
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
        </>
      )}
    </div>
  );
}