import { Dialog, DialogContent, DialogHeader, DialogTitle  } from '@/app/ui/components/dialog';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/ui/components/tabs';
import { Button } from '@/app/ui/components/button';
import { Alert, AlertDescription } from '@/app/ui/components/alert';
import { CSVForm, SQLForm, RESTForm } from './connection-forms';
import { FileSpreadsheet, Database, Globe, TestTube, Save } from 'lucide-react';
import { useState } from 'react';


interface ConnectionDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingConnection: any;
    onSave: (type: string) => void;
    onTest: (type: string) => void;
    forms: {
      csv: any;
      sql: any;
      rest: any;
    };
    setForms: {
      setCsvForm: (form: any) => void;
      setSqlForm: (form: any) => void;
      setRestForm: (form: any) => void;
    };
    testStatus: { status: string; message: string };
  }
  
  export function ConnectionDialog({
    isOpen,
    onOpenChange,
    editingConnection,
    onSave,
    onTest,
    forms,
    setForms,
    testStatus,
  }: ConnectionDialogProps) {
    const [activeTab, setActiveTab] = useState(editingConnection?.type || "csv");

    return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogTitle>
                {editingConnection ? 'Edit Connection' : 'Add New Connection'}
                </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="csv" className="flex items-center gap-2">
                        <FileSpreadsheet size={16} />
                        CSV
                    </TabsTrigger>
                    <TabsTrigger value="sql" className="flex items-center gap-2">
                        <Database size={16} />
                        SQL
                    </TabsTrigger>
                    <TabsTrigger value="rest" className="flex items-center gap-2">
                        <Globe size={16} />
                        REST
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="csv" className="space-y-4">
                    <CSVForm form={forms.csv} setForm={setForms.setCsvForm} />
                </TabsContent>

                <TabsContent value="sql" className="space-y-4">
                    <SQLForm form={forms.sql} setForm={setForms.setSqlForm} />
                </TabsContent>

                <TabsContent value="rest" className="space-y-4">
                    <RESTForm form={forms.rest} setForm={setForms.setRestForm} />
                </TabsContent>
            </Tabs>

            {testStatus.status && (
                <Alert className={`mt-4 ${
                testStatus.status === 'success' ? 'bg-green-50' :
                testStatus.status === 'error' ? 'bg-red-50' : 'bg-blue-50'
                }`}>
                <AlertDescription>{testStatus.message}</AlertDescription>
                </Alert>
            )}

            <div className="flex justify-end gap-2 mt-4">
                <Button 
                variant="outline" 
                onClick={() => {
                    onOpenChange(false);
                    // setEditingConnection(null);
                    // resetForms();
                }}
                >
                Cancel
                </Button>
                <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={() => onTest(editingConnection?.type)}
                >
                <TestTube size={16} />
                Test Connection
                </Button>
                <Button 
                className="flex items-center gap-2"
                onClick={() => onSave(editingConnection?.type)}
                >
                <Save size={16} />
                {editingConnection ? 'Update' : 'Save'} Connection
                </Button>
            </div>
        </DialogContent>
    </Dialog>
    );
  }