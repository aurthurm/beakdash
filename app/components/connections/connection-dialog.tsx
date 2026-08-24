import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/lib/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Connection, ConnectionType, connectionTypes } from "@/lib/db/schema";
import CSVForm from "./connection-forms/csv-form";
import RESTForm from "./connection-forms/rest-form";
import SQLForm from "./connection-forms/sql-form";
import { FileText, Link2, Database } from "lucide-react";

interface ConnectionDialogProps {
  connection?: Connection | null;
  onClose: () => void;
}

export default function ConnectionDialog({ 
  connection, 
  onClose 
}: ConnectionDialogProps) {
  const [name, setName] = useState(connection?.name || "");
  const [type, setType] = useState<ConnectionType>(connection?.type as ConnectionType || "csv");
  const [config, setConfig] = useState<Record<string, any>>((connection?.config as Record<string, any>) || {});

  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create new connection mutation
  const createMutation = useMutation({
    mutationFn: async (newConnection: any) => {
      return apiRequest('POST', '/api/connections', newConnection);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      toast({
        title: "Connection created",
        description: "New connection has been successfully created.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create connection: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update connection mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedConnection: any) => {
      return apiRequest('PUT', `/api/connections/${connection?.id}`, updatedConnection);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/connections'] });
      toast({
        title: "Connection updated",
        description: "Connection has been successfully updated.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update connection: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle connection config changes
  const handleConfigChange = (newConfig: any) => {
    setConfig({ ...config, ...newConfig });
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a connection name.",
        variant: "destructive",
      });
      return;
    }

    // Validate config based on connection type
    if (type === "csv" && !config.file) {
      toast({
        title: "Error",
        description: "Please select a CSV file or enter CSV data.",
        variant: "destructive",
      });
      return;
    } else if (type === "rest" && !config.url) {
      toast({
        title: "Error",
        description: "Please enter a valid URL for the REST API.",
        variant: "destructive",
      });
      return;
    } else if (type === "sql" && (!config.host || !config.database)) {
      toast({
        title: "Error",
        description: "Please enter all required SQL connection details.",
        variant: "destructive",
      });
      return;
    }

    const connectionData = {
      name,
      type,
      config,
      userId: 1, // For demo purposes, would come from auth context in a real app
    };

    if (connection) {
      updateMutation.mutate(connectionData);
    } else {
      createMutation.mutate(connectionData);
    }
  };

  // Get icon for connection type
  const getConnectionTypeIcon = (connType: ConnectionType) => {
    switch (connType) {
      case "csv":
        return <FileText className="h-8 w-8" />;
      case "rest":
        return <Link2 className="h-8 w-8" />;
      case "sql":
        return <Database className="h-8 w-8" />;
      default:
        return null;
    }
  };

  // Get display name for connection type
  const getConnectionTypeLabel = (connType: ConnectionType): string => {
    const labels: Record<ConnectionType, string> = {
      "csv": "CSV File",
      "rest": "REST API",
      "sql": "SQL Database"
    };
    return labels[connType] || connType;
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[600px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{connection ? "Edit Connection" : "Add Connection"}</DialogTitle>
          <DialogDescription>
            Configure your data connection settings to import data into your dashboard.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="connection-name" className="mb-1 block">Connection Name</Label>
            <Input
              id="connection-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for this connection"
            />
          </div>

          <div>
            <Label className="mb-1 block">Connection Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {connectionTypes.map((connType) => (
                <Button
                  key={connType}
                  type="button"
                  variant={type === connType ? "default" : "outline"}
                  onClick={() => setType(connType)}
                  className="flex flex-col items-center justify-center p-3 h-24"
                >
                  {getConnectionTypeIcon(connType)}
                  <span className="mt-2">{getConnectionTypeLabel(connType)}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="border border-border rounded-md p-4">
            {type === "csv" && (
              <CSVForm config={config} onChange={handleConfigChange} />
            )}
            {type === "rest" && (
              <RESTForm config={config} onChange={handleConfigChange} />
            )}
            {type === "sql" && (
              <SQLForm config={config} onChange={handleConfigChange} />
            )}
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!name || createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending 
              ? "Saving..." 
              : connection ? "Update Connection" : "Create Connection"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
