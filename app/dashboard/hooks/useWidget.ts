import { IConnection } from '@/app/lib/drizzle/schemas';
import { useConnectionStore } from '@/app/store/connections';
import { SQLConnection, ConnectionType, SQLConnectionConfig } from '@/app/types/datasource';
import { useSession } from 'next-auth/react';
import { useState } from 'react';

export function useWidget() {
    const { data: session } = useSession()
    const { loading, addConnection, updateConnection, deleteConnection } = useConnectionStore();
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingConnection, setEditingConnection] = useState<IConnection | null>(null);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState({ success: false, message: '' });
  
    // Form states
    const [csvForm, setCsvForm] = useState<SQLConnectionConfig>({ driver: 'postgresql' });
    const [sqlForm, setSqlForm] = useState<SQLConnection>({config: {}} as SQLConnection);
    const [restForm, setRestForm] = useState({});
  
    // All your handlers
    const handleSave = async (connectionType: ConnectionType) => {
      if(!session?.user?.id) {
        alert('You must be logged in to save a connection');
        return;
      };
      switch (connectionType) {
        case 'sql':
          if (editingConnection) {
            await updateConnection(editingConnection.id!, {
              ...sqlForm, 
              type: connectionType,
              userId: session?.user?.id
            } as IConnection);
          } else {
            await addConnection({
              ...sqlForm, 
              type: connectionType,
              userId: session?.user?.id,
            });
          }
          break;
        default:
          break;
      }
      setIsDialogOpen(false);
    };

    const handleTest = async (connectionType: ConnectionType) => { 
      setIsTesting(true)
      switch (connectionType) {
        case 'sql':
          const response = await fetch("/api/connections/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sqlForm.config),
          })
          const result = await response.json();
          setTestStatus(result);
          break;
        default:
          break;
      }
      setIsTesting(false);
    };

    const handleEdit = (connection: IConnection) => { 
      setEditingConnection(connection);
      switch (connection.type) {
        case 'sql':
          setSqlForm(connection as SQLConnection);
          break;
        default:
          break;
      }
      setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => { 
      await deleteConnection(id);
    };
  
    return {
      isDialogOpen,
      setIsDialogOpen,
      editingConnection,
      testStatus,
      isTesting,
      loading,
      forms: { csv: csvForm, sql: sqlForm, rest: restForm },
      setForms: { setCsvForm, setSqlForm, setRestForm },
      handlers: { handleSave, handleTest, handleEdit, handleDelete },
    };
  }