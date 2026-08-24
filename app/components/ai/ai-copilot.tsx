import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, X, Minimize, Sparkles, HelpCircle, Code, Copy, Check, TrendingUp, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dataset } from "@/lib/db/schema";
import { AIProcessingStatus } from "@/components/ai/ai-processing-status";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  generatedSql?: string;
  suggestedChartType?: string;
  suggestedConfig?: Record<string, any>;
  insights?: string[];
  isAIGenerated?: boolean;
  timestamp: Date;
  context?: {
    datasetId?: number;
    chartType?: string;
  };
}

interface WidgetContextType {
  id: number;
  name: string;
  type: string;
  config: any;
}

interface AICopilotProps {
  onClose: () => void;
  dashboardId?: number;
  activeDatasetId?: number;
  activeChartType?: string;
  widgetContext?: WidgetContextType;
}

export default function AICopilot({ onClose, dashboardId, activeDatasetId, activeChartType, widgetContext }: AICopilotProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedDatasetId, setSelectedDatasetId] = useState<number | undefined>(activeDatasetId);
  const [selectedChartType, setSelectedChartType] = useState<string | undefined>(activeChartType);
  const [showDatasetSelector, setShowDatasetSelector] = useState(false);
  const [copiedSqlId, setCopiedSqlId] = useState<string | null>(null);
  const [datasetKey] = useState<string>(`ai-copilot-${Date.now()}`);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: widgetContext 
        ? `Hello! I'm your AI Copilot. I see you're working with the "${widgetContext.name}" ${widgetContext.type} widget. Ask me to explain it, optimize the queries, or suggest new metrics.`
        : "Hello! I'm your AI Copilot. Ask me to generate SQL queries from natural language, recommend charts, or discover anomalies.",
      timestamp: new Date(),
      context: widgetContext ? {
        datasetId: activeDatasetId,
        chartType: widgetContext.type,
      } : undefined
    },
  ]);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch available datasets
  const { data: datasets = [] } = useQuery<Dataset[]>({
    queryKey: ['/api/datasets'],
    enabled: showDatasetSelector,
  });

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSqlId(id);
    setTimeout(() => setCopiedSqlId(null), 2000);
  };

  // Send message to AI Copilot
  const aiMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/ai/copilot", {
        prompt: message,
        context: messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
        datasetId: selectedDatasetId,
        chartType: selectedChartType,
        widgetContext: widgetContext ? {
          id: widgetContext.id,
          name: widgetContext.name,
          type: widgetContext.type,
          config: widgetContext.config
        } : undefined,
      });

      return await response.json();
    },
    onSuccess: (data) => {
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.message || data.response || "Here are the results for your request.",
        generatedSql: data.generatedSql,
        suggestedChartType: data.suggestedChartType,
        suggestedConfig: data.suggestedConfig,
        insights: data.insights,
        isAIGenerated: data.isAIGenerated,
        timestamp: new Date(data.timestamp || new Date()),
        context: {
          datasetId: selectedDatasetId,
          chartType: selectedChartType,
        }
      };
      setMessages(prev => [...prev, aiResponse]);
    },
  });

  // Chart improvements mutation
  const chartImprovementsMutation = useMutation({
    mutationFn: async () => {
      if (!widgetContext) throw new Error("Widget context required");
      const response = await apiRequest("POST", "/api/ai/chart-improvements", { 
        widgetContext: {
          id: widgetContext.id,
          name: widgetContext.name,
          type: widgetContext.type,
          config: widgetContext.config
        } 
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const suggestionsFormatted = (data.suggestions || []).map((s: string) => `• ${s}`).join('\n');
      const improvementsMessage: Message = {
        id: `improvements-${Date.now()}`,
        role: "assistant",
        content: `I've analyzed your "${widgetContext?.name}" widget and recommend the following visual improvements:\n\n${suggestionsFormatted}\n\n${data.explanation || ''}`,
        insights: data.anomalies?.map((a: any) => a.description),
        isAIGenerated: data.isAIGenerated,
        timestamp: new Date(),
        context: widgetContext ? { chartType: widgetContext.type } : undefined
      };
      setMessages(prev => [...prev, improvementsMessage]);
    },
  });

  // KPI suggestions mutation
  const kpiSuggestionsMutation = useMutation({
    mutationFn: async (datasetId: number) => {
      const response = await apiRequest("POST", "/api/ai/kpi-suggestions", { datasetId });
      return await response.json();
    },
    onSuccess: (data) => {
      const suggestionsFormatted = (data.kpiSuggestions || []).map((kpi: any) => 
        `• **${kpi.title}** (${kpi.widgetType}): ${kpi.description}`
      ).join('\n');
      
      const kpiMessage: Message = {
        id: `kpi-suggestions-${Date.now()}`,
        role: "assistant",
        content: `Here are the suggested high-impact KPI metrics for your dataset:\n\n${suggestionsFormatted}\n\n${data.explanation || ''}`,
        isAIGenerated: data.isAIGenerated,
        timestamp: new Date(),
        context: { datasetId: data.datasetId }
      };
      setMessages(prev => [...prev, kpiMessage]);
    },
  });

  // Chart recommendation mutation
  const chartRecommendationMutation = useMutation({
    mutationFn: async (datasetId: number) => {
      const response = await apiRequest("POST", "/api/ai/chart-recommendation", { datasetId });
      return await response.json();
    },
    onSuccess: (data) => {
      const primary = data.primary;
      const recommendationMessage: Message = {
        id: `recommendation-${Date.now()}`,
        role: "assistant",
        content: primary
          ? `I've analyzed your dataset structure and recommend a **${primary.chartType}** chart ("${primary.title}").\n\n${primary.explanation}`
          : "Recommended visualization ready.",
        suggestedChartType: primary?.chartType,
        suggestedConfig: primary?.config,
        isAIGenerated: data.isAIGenerated,
        timestamp: new Date(),
        context: {
          datasetId: selectedDatasetId,
          chartType: primary?.chartType,
        }
      };
      setMessages(prev => [...prev, recommendationMessage]);
      if (primary?.chartType) {
        setSelectedChartType(primary.chartType);
      }
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
      timestamp: new Date(),
      context: {
        datasetId: selectedDatasetId,
        chartType: selectedChartType,
      }
    };
    setMessages(prev => [...prev, userMessage]);
    aiMutation.mutate(prompt);
    setPrompt("");
  };

  const handleExplainChart = () => {
    if (!widgetContext) return;
    const { type, name, config } = widgetContext;
    const promptText = `Please explain my current ${type} chart named '${name}'. Configuration: ${JSON.stringify(config)}. What insights can we derive from it?`;
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: promptText,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    aiMutation.mutate(promptText);
  };

  const handleGetChartRecommendation = () => {
    if (!selectedDatasetId) {
      setShowDatasetSelector(true);
      return;
    }
    const promptMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: `Analyze dataset #${selectedDatasetId} and recommend the best chart visualization.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, promptMessage]);
    chartRecommendationMutation.mutate(selectedDatasetId);
  };

  const handleGetChartImprovements = () => {
    if (!widgetContext) return;
    const promptMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: `Analyze my "${widgetContext.name}" widget for improvements and anomalies.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, promptMessage]);
    chartImprovementsMutation.mutate();
  };

  const handleGetKPISuggestions = () => {
    if (!selectedDatasetId) {
      setShowDatasetSelector(true);
      return;
    }
    const promptMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: `Suggest executive KPI metrics for dataset #${selectedDatasetId}.`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, promptMessage]);
    kpiSuggestionsMutation.mutate(selectedDatasetId);
  };

  if (isMinimized) {
    return (
      <Button
        className="fixed bottom-4 right-4 z-40 rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-xl bg-primary text-primary-foreground hover:scale-105 transition-all"
        onClick={() => setIsMinimized(false)}
      >
        <Sparkles className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-6 z-40 w-[26rem] sm:w-[30rem] h-[38rem] flex flex-col shadow-2xl border border-border/80 bg-background/95 backdrop-blur-md rounded-xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
      <CardHeader className="p-3.5 border-b flex flex-row items-center justify-between space-y-0 bg-muted/30">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight flex items-center gap-1.5">
              BeakDash Copilot
              <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/30 text-primary font-normal">
                AI Assistant
              </Badge>
            </h3>
            <p className="text-[11px] text-muted-foreground">Natural Language BI & Query Intelligence</p>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => setIsMinimized(true)}>
            <Minimize className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-3.5 flex-1 overflow-y-auto space-y-3.5">
        <AIProcessingStatus datasetKey={datasetKey} />
        
        {showDatasetSelector ? (
          <div className="p-3 rounded-lg border bg-card space-y-3">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">Select Dataset Context</h4>
            {datasets.length === 0 ? (
              <p className="text-xs text-muted-foreground">No datasets available. Please create a dataset first.</p>
            ) : (
              <>
                <Select
                  value={selectedDatasetId?.toString() || ""}
                  onValueChange={(value) => setSelectedDatasetId(Number(value))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select a dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map((dataset) => (
                      <SelectItem key={dataset.id} value={dataset.id.toString()} className="text-xs">
                        {dataset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowDatasetSelector(false)}>
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      setShowDatasetSelector(false);
                      if (selectedDatasetId) handleGetChartRecommendation();
                    }}
                    disabled={!selectedDatasetId}
                  >
                    Confirm & Analyze
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex items-start gap-2.5", {
                  "justify-end": message.role === "user",
                })}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-6 w-6 bg-primary text-primary-foreground border text-[10px] shrink-0">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn("p-3 rounded-xl max-w-[85%] text-xs leading-relaxed space-y-2", {
                    "bg-muted/70 text-foreground border border-border/50": message.role === "assistant",
                    "bg-primary text-primary-foreground": message.role === "user",
                  })}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>

                  {/* Generated SQL Display Block */}
                  {message.generatedSql && (
                    <div className="rounded-lg bg-zinc-950 p-2.5 text-zinc-100 font-mono text-[11px] border border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-zinc-400 border-b border-zinc-800 pb-1">
                        <span className="flex items-center gap-1 font-sans">
                          <Code className="h-3 w-3 text-primary" /> Generated SQL
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5 text-zinc-400 hover:text-white"
                          onClick={() => copyToClipboard(message.generatedSql!, message.id)}
                        >
                          {copiedSqlId === message.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      <pre className="overflow-x-auto py-1">{message.generatedSql}</pre>
                    </div>
                  )}

                  {/* Suggested Chart Badge */}
                  {message.suggestedChartType && (
                    <div className="flex items-center gap-1.5 pt-1">
                      <Badge variant="secondary" className="text-[10px] capitalize">
                        📊 Chart: {message.suggestedChartType}
                      </Badge>
                    </div>
                  )}

                  {/* Insights Section */}
                  {message.insights && message.insights.length > 0 && (
                    <div className="pt-1.5 border-t border-border/40 space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                        <Lightbulb className="h-3 w-3 text-amber-500" /> Key Insights & Anomalies
                      </div>
                      <ul className="space-y-0.5 pl-3 list-disc text-muted-foreground text-[11px]">
                        {message.insights.map((insight, idx) => (
                          <li key={idx}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                
                {message.role === "user" && (
                  <Avatar className="h-6 w-6 bg-secondary text-secondary-foreground border text-[10px] shrink-0">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-3 border-t bg-muted/20 flex flex-col space-y-2">
        {!showDatasetSelector && (
          <>
            {/* Quick Actions Toolbar */}
            <div className="flex items-center justify-start gap-1 w-full overflow-x-auto pb-1">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px] px-2 rounded-md gap-1 shrink-0"
                onClick={handleGetChartRecommendation}
                disabled={aiMutation.isPending || chartRecommendationMutation.isPending}
              >
                <Sparkles className="h-3 w-3 text-primary" /> Recommend Chart
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[11px] px-2 rounded-md gap-1 shrink-0"
                onClick={handleGetKPISuggestions}
                disabled={aiMutation.isPending || kpiSuggestionsMutation.isPending}
              >
                <TrendingUp className="h-3 w-3 text-emerald-500" /> Suggest KPIs
              </Button>

              {widgetContext && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[11px] px-2 rounded-md gap-1 shrink-0"
                    onClick={handleGetChartImprovements}
                    disabled={aiMutation.isPending || chartImprovementsMutation.isPending}
                  >
                    ⚡ Optimize Chart
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[11px] px-2 rounded-md gap-1 shrink-0"
                    onClick={handleExplainChart}
                    disabled={aiMutation.isPending}
                  >
                    <HelpCircle className="h-3 w-3 text-blue-500" /> Explain
                  </Button>
                </>
              )}
            </div>
            
            {/* Message input */}
            <form onSubmit={handleSend} className="flex space-x-1.5 w-full">
              <Input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ask SQL query, chart advice, or metrics..."
                disabled={aiMutation.isPending}
                className="h-8 text-xs flex-1 rounded-md"
              />
              <Button 
                type="submit" 
                size="sm" 
                className="h-8 px-3 text-xs rounded-md"
                disabled={aiMutation.isPending || !prompt.trim()}
              >
                Send
              </Button>
            </form>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
