import { ConnectionBrowser } from './ConnectionBrowser';
import { ConnectionManager } from './ConnectionManager';

interface ConnectionsViewProps {
    view: 'browse' | 'manage';
    connections: any[];
    onEdit: (connection: any) => void;
    onDelete: (id: string) => void;
    setIsDialogOpen: (val: boolean) => void;
  }
  
export function ConnectionsView({ view, connections, onEdit, onDelete, setIsDialogOpen }: ConnectionsViewProps) {
    if (view === 'browse') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connections.map(connection => (
            <ConnectionBrowser 
              key={connection.id}
              connection={connection}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      );
    }
  
    return (
      <ConnectionManager 
        connections={connections}
        onEdit={onEdit}
        onDelete={onDelete}
        setIsDialogOpen={setIsDialogOpen}
      />
    );
  }