import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Card } from "@/components/ui/card";
import Editor from "@monaco-editor/react";
import { MonacoSQLEditor } from "@/components/code/monaco-sql-editor";


import { useToast } from "@/lib/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Dataset, Connection } from "@/lib/db/schema";
import { PlayCircle, FileDown, RefreshCw, ChevronDown, ChevronUp, Code, Table2 } from "lucide-react";

interface DatasetDialogProps {
  dataset?: Dataset | null;
  connections: Connection[];
  onClose: () => void;
}

export default function DatasetDialog({ 
  dataset, 
  connections, 
  onClose 
}: DatasetDialogProps) {
  const [name, setName] = useState(dataset?.name || "");
  const [connectionId, setConnectionId] = useState<number | null>(dataset?.connectionId || null);
  const [query, setQuery] = useState(dataset?.query || "");
  const [refreshInterval, setRefreshInterval] = useState(dataset?.refreshInterval || "manual");
  const [config, setConfig] = useState(dataset?.config || { cacheDuration: "1h" });
  const [previewData, setPreviewData] = useState<Record<string, any>[]>([]);
  const [isRunningQuery, setIsRunningQuery] = useState(false);
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Selected connection
  const selectedConnection = connections.find(conn => conn.id === connectionId);

  // Create new dataset mutation
  const createMutation = useMutation({
    mutationFn: async (newDataset: any) => {
      return apiRequest('POST', '/api/datasets', newDataset);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/datasets'] });
      toast({
        title: "Dataset created",
        description: "New dataset has been successfully created.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create dataset: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update dataset mutation
  const updateMutation = useMutation({
    mutationFn: async (updatedDataset: any) => {
      return apiRequest('PUT', `/api/datasets/${dataset?.id}`, updatedDataset);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/datasets'] });
      toast({
        title: "Dataset updated",
        description: "Dataset has been successfully updated.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update dataset: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Load connection-based sample query when connection changes
  useEffect(() => {
    if (connectionId && !dataset) {
      const connection = connections.find(c => c.id === connectionId);
      if (connection) {
        switch (connection.type) {
          case "csv":
            setQuery("SELECT * FROM data LIMIT 100");
            break;
          case "rest":
            setQuery(""); // REST connections don't typically need a query
            break;
          case "sql":
            // Safely access config properties
            const configAny = connection.config as any;
            if (configAny && configAny.database) {
              setQuery(`SELECT * FROM ${configAny.database}.table_name LIMIT 100`);
            } else {
              setQuery("SELECT * FROM table_name LIMIT 100");
            }
            break;
        }
      }
    }
  }, [connectionId, connections, dataset]);

  // Run query to get preview data
  const runQuery = async () => {
    if (!connectionId) {
      toast({
        title: "Error",
        description: "Please select a connection first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsRunningQuery(true);
    
    try {
      if (!selectedConnection) {
        throw new Error("Connection not found");
      }

      let data: Record<string, any>[] = [];
      
      // Process data based on connection type
      if (selectedConnection.type === "csv") {
        // For CSV connections, we use the data from the connection config
        const connectionConfig = selectedConnection.config as any;
        
        if (!connectionConfig || !connectionConfig.csvData) {
          throw new Error("No CSV data found in connection");
        }
        
        // Parse the CSV data
        const csvData = await parseCSVConnection(connectionConfig);
        
        // Set the preview data
        data = csvData;
      } else {
        // For other connection types, use sample data for now
        data = getSampleData(selectedConnection.type);
      }
      
      setPreviewData(data);
      
      toast({
        title: "Query executed",
        description: "Data preview has been updated.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to execute query: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsRunningQuery(false);
    }
  };
  
  // Function to parse CSV data from a connection
  const parseCSVConnection = async (connectionConfig: any): Promise<Record<string, any>[]> => {
    // Import the parseCSV function from data-adapters.ts
    const { parseCSV } = await import('@/lib/data-adapters');
    
    // Extract CSV options from the connection config
    const {
      csvData,
      delimiter = ',',
      hasHeaders = true, 
      quoteChar = '"',
      trimFields = true
    } = connectionConfig;
    
    if (!csvData) {
      throw new Error("No CSV data found");
    }
    
    // Parse the CSV data
    return parseCSV(csvData, {
      delimiter,
      hasHeaders,
      quoteChar,
      trimFields
    });
  };

  // Handle form submission
  const handleSubmit = () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a dataset name.",
        variant: "destructive",
      });
      return;
    }

    if (!connectionId) {
      toast({
        title: "Error",
        description: "Please select a connection.",
        variant: "destructive",
      });
      return;
    }

    const datasetData = {
      name,
      connectionId,
      query,
      refreshInterval,
      config,
      userId: 1, // For demo purposes, would come from auth context in a real app
    };

    if (dataset) {
      updateMutation.mutate(datasetData);
    } else {
      createMutation.mutate(datasetData);
    }
  };

  // Generate sample data based on connection type
  const getSampleData = (connectionType?: string): Record<string, any>[] => {
    switch (connectionType) {
      case "csv":
        return [
          { month: "Jan", region: "North", sales: 120, revenue: 12450, profit: 4320 },
          { month: "Jan", region: "South", sales: 95, revenue: 9820, profit: 3150 },
          { month: "Feb", region: "North", sales: 145, revenue: 15230, profit: 5450 },
          { month: "Feb", region: "South", sales: 110, revenue: 11500, profit: 3900 },
          { month: "Mar", region: "North", sales: 170, revenue: 17800, profit: 6200 },
        ];
      case "rest":
        return [
          { id: 1, name: "Product A", category: "Electronics", price: 499.99, stock: 120 },
          { id: 2, name: "Product B", category: "Electronics", price: 299.99, stock: 85 },
          { id: 3, name: "Product C", category: "Furniture", price: 199.99, stock: 45 },
          { id: 4, name: "Product D", category: "Clothing", price: 59.99, stock: 200 },
          { id: 5, name: "Product E", category: "Home", price: 149.99, stock: 75 },
        ];
      case "sql":
        return [
          { order_id: 1001, customer_id: 5001, product_id: 101, quantity: 2, total: 999.98, order_date: "2023-01-15" },
          { order_id: 1002, customer_id: 5002, product_id: 102, quantity: 1, total: 299.99, order_date: "2023-01-16" },
          { order_id: 1003, customer_id: 5001, product_id: 103, quantity: 3, total: 599.97, order_date: "2023-01-18" },
          { order_id: 1004, customer_id: 5003, product_id: 101, quantity: 1, total: 499.99, order_date: "2023-01-20" },
          { order_id: 1005, customer_id: 5002, product_id: 104, quantity: 2, total: 119.98, order_date: "2023-01-22" },
        ];
      default:
        return [];
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="w-[800px] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{dataset ? "Edit Dataset" : "Create Dataset"}</DialogTitle>
          <DialogDescription>
            Configure your dataset to extract and transform data from your connections.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dataset-name" className="mb-1 block">Dataset Name</Label>
              <Input
                id="dataset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter a name for this dataset"
              />
            </div>

            <div>
              <Label htmlFor="connection" className="mb-1 block">Connection</Label>
              <Select 
                value={connectionId?.toString() || "0"} 
                onValueChange={(value) => setConnectionId(Number(value))}
              >
                <SelectTrigger id="connection">
                  <SelectValue placeholder="Select a connection" />
                </SelectTrigger>
                <SelectContent>
                  {connections.map((connection) => (
                    <SelectItem key={connection.id} value={connection.id.toString()}>
                      {connection.name} ({connection.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Collapsible Editor and Preview */}
          <div className="space-y-4">
            {/* SQL Query Editor Section */}
            <Collapsible defaultOpen className="w-full">
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="query">Query Editor</Label>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={runQuery}
                    disabled={!connectionId || isRunningQuery}
                  >
                    {isRunningQuery ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <PlayCircle className="h-4 w-4 mr-1" />
                    )}
                    Run Query
                  </Button>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              <CollapsibleContent>
                <div className="mb-4">
                  {/* SQL editor or textarea based on connection type */}
                  {selectedConnection?.type === "sql" ? (
                    <div className="border border-input rounded-md overflow-hidden">
                      <div className="bg-muted px-3 py-2 border-b border-border text-xs text-muted-foreground">
                        {selectedConnection ? (
                          `Connection: ${selectedConnection.name} (${selectedConnection.type})`
                        ) : (
                          "No connection selected"
                        )}
                      </div>
                      <div className="p-0">
                        <Editor
                          height="200px"
                          language="sql"
                          value={query}
                          onChange={(value) => setQuery(value || "")}
                          options={{
                            minimap: { enabled: false },
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            renderLineHighlight: "all",
                            lineNumbers: "on",
                            folding: true,
                            automaticLayout: true,
                            tabCompletion: "on",
                            suggestOnTriggerCharacters: true,
                          }}
                          loading={<div className="h-full w-full flex items-center justify-center">Loading editor...</div>}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="border border-input rounded-md overflow-hidden">
                      <div className="bg-muted px-3 py-2 border-b border-border text-xs text-muted-foreground">
                        {selectedConnection ? (
                          `Connection: ${selectedConnection.name} (${selectedConnection.type})`
                        ) : (
                          "No connection selected"
                        )}
                      </div>
                      <Textarea
                        id="query"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder={
                          selectedConnection?.type === "csv"
                            ? "SELECT * FROM data"
                            : "Enter query or leave blank for default data"
                        }
                        rows={4}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <Label htmlFor="refresh-interval" className="mb-1 block">Refresh Settings</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Select
                        value={refreshInterval}
                        onValueChange={setRefreshInterval}
                      >
                        <SelectTrigger id="refresh-interval">
                          <SelectValue placeholder="Select refresh rate" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Manual</SelectItem>
                          <SelectItem value="5m">Every 5 minutes</SelectItem>
                          <SelectItem value="15m">Every 15 minutes</SelectItem>
                          <SelectItem value="1h">Every hour</SelectItem>
                          <SelectItem value="6h">Every 6 hours</SelectItem>
                          <SelectItem value="1d">Daily</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Select
                        value={(config as any).cacheDuration || "1h"}
                        onValueChange={(value) => setConfig({...config, cacheDuration: value})}
                      >
                        <SelectTrigger id="cache-duration">
                          <SelectValue placeholder="Select cache duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No cache</SelectItem>
                          <SelectItem value="5m">5 minutes</SelectItem>
                          <SelectItem value="15m">15 minutes</SelectItem>
                          <SelectItem value="1h">1 hour</SelectItem>
                          <SelectItem value="6h">6 hours</SelectItem>
                          <SelectItem value="1d">1 day</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Data Preview Section - Always shown */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Data Preview</Label>
                <div className="flex items-center gap-2">
                  {previewData.length > 0 && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        // In a real app, this would download the data as CSV
                        console.log("Download data", previewData);
                      }}
                    >
                      <FileDown className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                  )}
                  {!isRunningQuery && connectionId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={runQuery}
                    >
                      <RefreshCw className={`h-4 w-4 ${isRunningQuery ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>

              {previewData.length > 0 ? (
                <div>
                  <div className="border border-input rounded-md overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(previewData[0]).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {previewData.map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).map((value, j) => (
                              <TableCell key={j}>{String(value)}</TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Showing {previewData.length} rows from preview data
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground border border-dashed rounded-md">
                  <p>No data preview available. Run a query first to see results.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={runQuery}
                    disabled={!connectionId || isRunningQuery}
                  >
                    {isRunningQuery ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <PlayCircle className="h-4 w-4 mr-1" />
                    )}
                    Run Query
                  </Button>
                </div>
              )}
            </div>
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
            disabled={!name || !connectionId || createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending 
              ? "Saving..." 
              : dataset ? "Update Dataset" : "Create Dataset"
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
