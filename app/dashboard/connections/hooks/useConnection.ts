import { useState } from 'react';

export function useConnections() {
    const [connections, setConnections] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingConnection, setEditingConnection] = useState(null);
    const [testStatus, setTestStatus] = useState({ status: '', message: '' });
  
    // Form states
    const [csvForm, setCsvForm] = useState({ /* initial state */ });
    const [sqlForm, setSqlForm] = useState({ /* initial state */ });
    const [restForm, setRestForm] = useState({ /* initial state */ });
  
    // All your handlers
    const handleSave = async (type) => { /* ... */ };
    const handleTest = async (type) => { /* ... */ };
    const handleEdit = (connection) => { /* ... */ };
    const handleDelete = async (id) => { /* ... */ };
  
    return {
      connections,
      isDialogOpen,
      setIsDialogOpen,
      editingConnection,
      testStatus,
      forms: { csv: csvForm, sql: sqlForm, rest: restForm },
      setForms: { setCsvForm, setSqlForm, setRestForm },
      handlers: { handleSave, handleTest, handleEdit, handleDelete },
    };
  }