'use client';
import { useConnections } from './hooks/useConnection';
import { ConnectionDialog } from './components/ConnectionDialog';
import { ConnectionsView } from './components/ConnectionView';
import { useState } from 'react';
import { Button } from '@/app/ui/components/button';
import { Settings } from 'lucide-react';

export default function ConnectionsPage() {
  const [activeView, setActiveView] = useState<'browse' | 'manage'>('browse');
  const {
    connections,
    isDialogOpen,
    setIsDialogOpen,
    editingConnection,
    testStatus,
    forms,
    setForms,
    handlers
  } = useConnections();

  return (
    <div className="p-6 space-y-6">
     <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Data Connections</h1>
          <p className="text-gray-500">Configure and manage your data sources</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant={activeView === 'browse' ? 'default' : 'outline'}
            onClick={() => setActiveView('browse')}
          >
            Browse
          </Button>
          <Button 
            variant={activeView === 'manage' ? 'default' : 'outline'}
            onClick={() => setActiveView('manage')}
            className="flex items-center gap-2"
          >
            <Settings size={16} />
            Manage
          </Button>
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
      />

      <ConnectionsView 
        view={activeView}
        connections={connections}
        onEdit={handlers.handleEdit}
        onDelete={handlers.handleDelete}
        setIsDialogOpen={setIsDialogOpen}
      />
    </div>
  );
}