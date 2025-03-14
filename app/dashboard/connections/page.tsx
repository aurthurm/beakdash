'use client';
import { useConnections } from './hooks/useConnection';
import { ConnectionDialog } from './components/ConnectionDialog';
import { useEffect } from 'react';
import { useConnectionStore } from '@/app/store/connections';
import { ConnectionManager } from './components/ConnectionManager';
import { useAuth } from '@clerk/nextjs'

export default function ConnectionsPage() {
  const { userId } = useAuth()
  const { connections, fetchConnections } = useConnectionStore();
  const {
    isDialogOpen,
    setIsDialogOpen,
    editingConnection,
    testStatus,
    isTesting,
    forms,
    setForms,
    handlers,
    loading
  } = useConnections();

  useEffect(() => {
    if(!userId){
      console.log('No user id found, cant fetch connections');
      return;
    }
    fetchConnections(userId);
  }, [fetchConnections, userId]);

  return (
    <div className="p-6 space-y-6">
     <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Connections</h1>
          <p className="text-gray-500">Configure and manage your data sources</p>
        </div>
      </div>

      <ConnectionDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingConnection={editingConnection}
        onSave={handlers.handleSave}
        onTest={handlers.handleTest}
        forms={forms}
        setForms={setForms}
        testStatus={testStatus}
        isTesting={isTesting}
        loading={loading}
      />

      <ConnectionManager 
        connections={connections}
        onEdit={handlers.handleEdit}
        onDelete={handlers.handleDelete}
        setIsDialogOpen={setIsDialogOpen}
      />
    </div>
  );
}