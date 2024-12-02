import { Button } from '@/app/ui/components/button';
import { Input } from '@/app/ui/components/input';
import { FileSpreadsheet, Database, Globe, Edit2, Trash2, Plus } from 'lucide-react';

interface ConnectionManagerProps {
    connections: any[];
    onEdit: (connection: any) => void;
    onDelete: (id: string) => void;
    setIsDialogOpen: (open: boolean) => void;
  }
  
  export function ConnectionManager({ connections, onEdit, onDelete, setIsDialogOpen }: ConnectionManagerProps) {
    return (<>
      <h2 className="text-lg font-semibold">Manage Connections</h2>
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4">
          <Input
            placeholder="Search connections..."
            className="max-w-sm"
          />
        </div>
        <div className="border-t">
          {connections.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <Database className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-900">No connections</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new connection.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Connection
                </Button>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {connections.map((connection) => (
                  <tr key={connection.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {connection.type === 'csv' && <FileSpreadsheet size={16} className="mr-2" />}
                        {connection.type === 'sql' && <Database size={16} className="mr-2" />}
                        {connection.type === 'rest' && <Globe size={16} className="mr-2" />}
                        {connection.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {connection.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(connection.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(connection)}
                          className="flex items-center gap-1"
                        >
                          <Edit2 size={14} />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(connection.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} />
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
     </>);
  }