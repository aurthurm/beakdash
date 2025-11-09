import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, X, Minimize, Maximize, Sparkles, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dataset, chartTypes } from "@/lib/db/schema";
import { AIProcessingStatus } from "@/components/ai/ai-processing-status";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
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
  const [datasetKey, setDatasetKey] = useState<string>(`ai-copilot-${Date.now()}`);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: widgetContext 
        ? `Hello! I'm your AI Copilot. I see you're working with the "${widgetContext.name}" ${widgetContext.type} widget. How can I help you with this visualization today?`
        : "Hello! I'm your AI Copilot. How can I help you with your dashboard today?",
      timestamp: new Date(),
      context: widgetContext ? {
        datasetId: activeDatasetId,
        chartType: widgetContext.type,
      } : undefined
    },
  ]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [interactedMessageIds, setInteractedMessageIds] = useState<Set<string>>(new Set());
  const [interactedSuggestionMessageIds, setInteractedSuggestionMessageIds] = useState<Set<string>>(new Set());
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

  // Send message to AI Copilot
  const aiMutation = useMutation({
    mutationFn: async (message: string) => {
      try {
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
        
        // Type guard to check if we have a proper response object
        if (response && typeof response === 'object' && 'response' in response) {
          return response as { response: string; timestamp: string };
        }
        
        // Fallback if the response is not in the expected format
        return {
          response: "I'm sorry, I couldn't process that request.",
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        console.error("AI Copilot error:", error);
        return {
          response: "I encountered an error while processing your request. Please try again later.",
          timestamp: new Date().toISOString(),
        };
      }
    },
    onSuccess: (data) => {
      // Add AI response to messages
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.response || "I'm sorry, I couldn't process that request.",
        timestamp: new Date(data.timestamp || new Date()),
        context: {
          datasetId: selectedDatasetId,
          chartType: selectedChartType,
        }
      };
      setMessages(prev => [...prev, aiResponse]);
    },
  });

  // Define the expected response types
  interface ChartRecommendation {
    chartType: string;
    explanation: string;
    suggestedConfig: string;
    datasetId: number;
  }

  interface ChartImprovement {
    suggestions: string[];
    explanation: string;
    widgetId: number;
  }

  interface KPISuggestion {
    title: string;
    description: string;
    widgetType: string;
    config: Record<string, any>;
  }

  interface KPISuggestions {
    kpiSuggestions: KPISuggestion[];
    explanation: string;
    datasetId: number;
  }

  // Generate chart improvements
  const chartImprovementsMutation = useMutation({
    mutationFn: async () => {
      if (!widgetContext) {
        throw new Error("Widget context is required for chart improvements");
      }
      
      const response = await apiRequest("POST", "/api/ai/chart-improvements", { 
        widgetContext: {
          id: widgetContext.id,
          name: widgetContext.name,
          type: widgetContext.type,
          config: widgetContext.config
        } 
      });
      
      // Type guard to ensure we have proper chart improvements
      if (response && typeof response === 'object' && 'suggestions' in response) {
        return response as ChartImprovement;
      }
      
      // Fallback if the response is not in the expected format
      throw new Error("Received invalid chart improvements format");
    },
    onSuccess: (data: ChartImprovement) => {
      // Add improvement suggestions to messages
      const suggestionsFormatted = data.suggestions.map(suggestion => `• ${suggestion}`).join('\n');
      const improvementsMessage: Message = {
        id: `improvements-${Date.now()}`,
        role: "assistant",
        content: `I've analyzed your "${widgetContext?.name}" widget and have some suggestions to improve it:\n\n${suggestionsFormatted}\n\n${data.explanation}\n\nWould you like me to help you implement any of these improvements?`,
        timestamp: new Date(),
        context: widgetContext ? {
          chartType: widgetContext.type
        } : undefined
      };
      setMessages(prev => [...prev, improvementsMessage]);
    },
  });

  // Generate KPI suggestions
  const kpiSuggestionsMutation = useMutation({
    mutationFn: async (datasetId: number) => {
      const response = await apiRequest("POST", "/api/ai/kpi-suggestions", { datasetId });
      
      // Type guard to ensure we have proper KPI suggestions
      if (response && typeof response === 'object' && 'kpiSuggestions' in response) {
        return response as KPISuggestions;
      }
      
      // Fallback if the response is not in the expected format
      throw new Error("Received invalid KPI suggestions format");
    },
    onSuccess: (data: KPISuggestions) => {
      // Format the KPI suggestions nicely
      const suggestionsFormatted = data.kpiSuggestions.map(kpi => 
        `• ${kpi.title} (${kpi.widgetType}): ${kpi.description}`
      ).join('\n');
      
      // Add KPI suggestions to messages
      const kpiMessage: Message = {
        id: `kpi-suggestions-${Date.now()}`,
        role: "assistant",
        content: `Based on your dataset, here are some KPI widgets I recommend creating:\n\n${suggestionsFormatted}\n\n${data.explanation}\n\nWould you like me to help you create any of these KPI widgets?`,
        timestamp: new Date(),
        context: {
          datasetId: data.datasetId
        }
      };
      setMessages(prev => [...prev, kpiMessage]);
    },
  });

  // Generate chart recommendation
  const chartRecommendationMutation = useMutation({
    mutationFn: async (datasetId: number) => {
      const response = await apiRequest("POST", "/api/ai/chart-recommendation", { datasetId });
      
      // Type guard to ensure we have a proper chart recommendation
      if (response && typeof response === 'object' && 'chartType' in response) {
        return response as ChartRecommendation;
      }
      
      // Fallback if the response is not in the expected format
      throw new Error("Received invalid chart recommendation format");
    },
    onSuccess: (data: ChartRecommendation) => {
      // Add recommendation to messages
      const recommendationMessage: Message = {
        id: `recommendation-${Date.now()}`,
        role: "assistant",
        content: `I've analyzed your dataset and recommend a ${data.chartType} chart.\n\n${data.explanation}\n\n${data.suggestedConfig}\n\nWould you like me to help you set up this chart?`,
        timestamp: new Date(),
        context: {
          datasetId: selectedDatasetId,
          chartType: data.chartType,
        }
      };
      setMessages(prev => [...prev, recommendationMessage]);
      setSelectedChartType(data.chartType);
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) return;

    // Add user message to chat
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
    
    // Send to AI
    aiMutation.mutate(prompt);
    
    // Clear input
    setPrompt("");
  };

  const handleCreateChartClick = (message: Message) => {
    if (!message.context?.datasetId || !message.context?.chartType) return;

    const { datasetId, chartType } = message.context;

    const userConfirmMessage: Message = {
      id: `user-confirm-${Date.now()}`,
      role: "user",
      content: `Yes, please create the ${chartType} chart for dataset ${datasetId}.`,
      timestamp: new Date(),
      context: { datasetId, chartType }
    };

    const assistantResponseMessage: Message = {
      id: `assistant-response-${Date.now()}`,
      role: "assistant",
      content: `Okay! I'll create a basic ${chartType} chart using dataset ${datasetId}. You can then customize it further using the widget editor. (Widget creation functionality is pending implementation).`,
      timestamp: new Date(),
      context: { datasetId, chartType }
    };

    setMessages(prev => [...prev, userConfirmMessage, assistantResponseMessage]);
    setInteractedMessageIds(prev => new Set(prev).add(message.id));
  };

  const handleNoThanksClick = (message: Message) => {
    const userDeclineMessage: Message = {
      id: `user-decline-${Date.now()}`,
      role: "user",
      content: "No, thanks.",
      timestamp: new Date(),
    };

    const assistantResponseMessage: Message = {
      id: `assistant-acknowledge-${Date.now()}`,
      role: "assistant",
      content: "Alright. Let me know if you need anything else!",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userDeclineMessage, assistantResponseMessage]);
    setInteractedMessageIds(prev => new Set(prev).add(message.id));
  };

  const handleApplySuggestionClick = (message: Message, suggestionText: string) => {
    const userMessage: Message = {
      id: `user-apply-suggestion-${Date.now()}`,
      role: "user",
      content: `Yes, please apply this suggestion: "${suggestionText}"`,
      timestamp: new Date(),
      context: message.context,
    };

    const assistantMessage: Message = {
      id: `assistant-apply-suggestion-${Date.now()}`,
      role: "assistant",
      content: `Okay! I'll apply the suggestion: "${suggestionText}". (Widget update functionality is pending implementation).`,
      timestamp: new Date(),
      context: message.context,
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInteractedSuggestionMessageIds(prev => new Set(prev).add(message.id));
  };

  const handleExplainChart = () => {
    if (!widgetContext) {
      // This case should ideally be prevented by disabling the button
      const errorMessage: Message = {
        id: `error-explain-${Date.now()}`,
        role: "assistant",
        content: "I need a specific widget to analyze before I can explain it. Please open the AI Copilot from a widget's menu.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const { type, name, config } = widgetContext;
    const chartConfigString = JSON.stringify(config, null, 2); // Pretty print JSON
    const constructedPrompt = `Please explain my current chart. It's a ${type} chart named '${name}' with the following configuration: \n\`\`\`json\n${chartConfigString}\n\`\`\`\nWhat does this chart represent and what insights might I gather from it?`;

    const userMessage: Message = {
      id: `user-explain-chart-${Date.now()}`,
      role: "user",
      content: constructedPrompt,
      timestamp: new Date(),
      context: {
        datasetId: activeDatasetId, // or derive from widgetContext.config if available
        chartType: type,
      }
    };
    setMessages(prev => [...prev, userMessage]);
    aiMutation.mutate(constructedPrompt);
  };

  const handleGetChartRecommendation = () => {
    if (!selectedDatasetId) {
      // If no dataset is selected, show the dataset selector
      setShowDatasetSelector(true);
      return;
    }

    const promptMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: `Please analyze dataset ${selectedDatasetId} and recommend the best chart type for visualization.`,
      timestamp: new Date(),
      context: {
        datasetId: selectedDatasetId
      }
    };
    setMessages(prev => [...prev, promptMessage]);
    
    // Generate recommendation
    chartRecommendationMutation.mutate(selectedDatasetId);
  };

  const handleGetChartImprovements = () => {
    if (!widgetContext) {
      // Show a message if there's no widget context
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: "I need a specific widget to analyze before I can offer improvement suggestions. Please open the AI Copilot from a widget's menu to get improvement suggestions.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    const promptMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: `Please analyze my "${widgetContext.name}" widget and suggest improvements.`,
      timestamp: new Date(),
      context: {
        chartType: widgetContext.type
      }
    };
    setMessages(prev => [...prev, promptMessage]);
    
    // Generate improvement suggestions
    chartImprovementsMutation.mutate();
  };

  const handleGetKPISuggestions = () => {
    if (!selectedDatasetId) {
      // If no dataset is selected, show the dataset selector
      setShowDatasetSelector(true);
      return;
    }

    const promptMessage: Message = {
      id: `user-${Date.now()}`,
      role: "user",
      content: `Please suggest KPI widgets I could create from dataset ${selectedDatasetId}.`,
      timestamp: new Date(),
      context: {
        datasetId: selectedDatasetId
      }
    };
    setMessages(prev => [...prev, promptMessage]);
    
    // Generate KPI suggestions
    kpiSuggestionsMutation.mutate(selectedDatasetId);
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (isMinimized) {
    return (
      <Button
        className="fixed bottom-4 right-4 z-40 rounded-full w-12 h-12 p-0 flex items-center justify-center shadow-lg"
        onClick={toggleMinimize}
      >
        <MessageSquare className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-10 z-40 w-102 h-[48rem] flex flex-col shadow-lg border border-border overflow-hidden">
      <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6 bg-primary">
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <h3 className="font-medium text-sm">Dasher Assistant</h3>
        </div>
        <div className="flex items-center space-x-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleMinimize}>
            <Minimize className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 flex-1 overflow-y-auto">
        {/* Processing status for real-time WebSocket updates */}
        <AIProcessingStatus datasetKey={datasetKey} />
        
        {showDatasetSelector ? (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Select a Dataset</h4>
            {datasets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No datasets available. Please create a dataset first.</p>
            ) : (
              <>
                <Select
                  value={selectedDatasetId?.toString() || ""}
                  onValueChange={(value) => setSelectedDatasetId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a dataset" />
                  </SelectTrigger>
                  <SelectContent>
                    {datasets.map((dataset) => (
                      <SelectItem key={dataset.id} value={dataset.id.toString()}>
                        {dataset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDatasetSelector(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => {
                      setShowDatasetSelector(false);
                      if (selectedDatasetId) {
                        handleGetChartRecommendation();
                      }
                    }}
                    disabled={!selectedDatasetId}
                  >
                    Confirm
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn("flex items-start space-x-2", {
                  "justify-end": message.role === "user",
                })}
              >
                {message.role === "assistant" && (
                  <Avatar className="h-6 w-6 bg-primary text-primary-foreground">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                
                <div
                  className={cn("p-2 rounded-lg max-w-[80%]", {
                    "bg-muted": message.role === "assistant",
                    "bg-primary/10": message.role === "user",
                  })}
                >
                  <p className="text-sm break-words">{message.content}</p>
                  {message.context?.datasetId && (
                    <div className="mt-1 text-xs text-muted-foreground">
                      Dataset: {message.context.datasetId}
                      {message.context.chartType && ` | Chart: ${message.context.chartType}`}
                    </div>
                  )}
                  {message.role === "assistant" &&
                    message.content.includes("Would you like me to help you set up this chart?") &&
                    !interactedMessageIds.has(message.id) && (
                      <div className="mt-2 space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCreateChartClick(message)}
                          disabled={!message.context?.datasetId || !message.context?.chartType}
                        >
                          Create this chart
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleNoThanksClick(message)}
                        >
                          No, thanks
                        </Button>
                      </div>
                  )}
                  {message.role === "assistant" &&
                    message.content.includes("Would you like me to help you implement any of these improvements?") &&
                    !interactedSuggestionMessageIds.has(message.id) && (
                      <div className="mt-2 space-y-1">
                        {message.content
                          .split('\n')
                          .filter(line => line.trim().startsWith('• '))
                          .map((suggestion, index) => (
                            <Button
                              key={index}
                              size="sm"
                              variant="outline"
                              className="w-full text-left justify-start h-auto whitespace-normal"
                              onClick={() => handleApplySuggestionClick(message, suggestion.trim().substring(2))}
                            >
                              Apply: "{suggestion.trim().substring(2)}"
                            </Button>
                          ))}
                      </div>
                  )}
                </div>
                
                {message.role === "user" && (
                  <Avatar className="h-6 w-6 bg-secondary text-secondary-foreground">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-3 border-t">
        {!showDatasetSelector && (
          <>
            <div className="flex flex-col space-y-2 w-full">
              {/* AI actions toolbar */}
              <div className="flex items-center justify-start gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  title="Get chart recommendation"
                  onClick={handleGetChartRecommendation}
                  disabled={aiMutation.isPending || chartRecommendationMutation.isPending || 
                           chartImprovementsMutation.isPending || kpiSuggestionsMutation.isPending}
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
                
                {/* Chart improvements button - only enabled when we have widget context */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  title="Get chart improvement suggestions"
                  onClick={handleGetChartImprovements}
                  disabled={!widgetContext || aiMutation.isPending || chartRecommendationMutation.isPending || 
                          chartImprovementsMutation.isPending || kpiSuggestionsMutation.isPending}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M3 12h4l3 8 4-16 3 8h4"></path>
                  </svg>
                </Button>
                
                {/* KPI suggestions button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  title="Get KPI widget suggestions"
                  onClick={handleGetKPISuggestions}
                  disabled={aiMutation.isPending || chartRecommendationMutation.isPending || 
                          chartImprovementsMutation.isPending || kpiSuggestionsMutation.isPending}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M12 20V10"></path>
                    <path d="M18 20V4"></path>
                    <path d="M6 20v-4"></path>
                  </svg>
                </Button>

                {/* Explain this chart button - only enabled when we have widget context */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  title="Explain this Chart"
                  onClick={handleExplainChart}
                  disabled={!widgetContext || aiMutation.isPending || chartRecommendationMutation.isPending || 
                          chartImprovementsMutation.isPending || kpiSuggestionsMutation.isPending}
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Message input form */}
              <form onSubmit={handleSend} className="flex space-x-2 w-full">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask a question..."
                  disabled={aiMutation.isPending || chartRecommendationMutation.isPending || 
                          chartImprovementsMutation.isPending || kpiSuggestionsMutation.isPending}
                  className="flex-1"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={aiMutation.isPending || chartRecommendationMutation.isPending || 
                           chartImprovementsMutation.isPending || kpiSuggestionsMutation.isPending || 
                           !prompt.trim()}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                  </svg>
                </Button>
              </form>
            </div>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
