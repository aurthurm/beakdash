import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/lib/hooks/use-toast";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  generatedSql?: string;
  suggestedChartType?: string;
  suggestedConfig?: Record<string, any>;
  insights?: string[];
  isAIGenerated?: boolean;
  timestamp: Date;
}

interface UseCopilotOptions {
  datasetId?: number | null;
  connectionId?: number | null;
  widgetContext?: {
    id?: number | string;
    name?: string;
    type?: string;
    config?: Record<string, any>;
  } | null;
  onMessageReceived?: (message: Message) => void;
}

/**
 * Hook for AI Copilot functionality with full context awareness
 */
export function useAICopilot(options: UseCopilotOptions = {}) {
  const { datasetId, connectionId, widgetContext, onMessageReceived } = options;
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hello! I'm your AI Copilot. Ask me to generate SQL queries, explain your charts, or recommend visualizations.",
      timestamp: new Date(),
    },
  ]);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { toast } = useToast();

  // Send message to AI Copilot
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      // Add user message to chat
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content,
        timestamp: new Date(),
      };
      
      addMessage(userMessage);
      
      // Send to API with full context
      const context = messages.slice(-6).map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const response = await apiRequest("POST", "/api/ai/copilot", {
        prompt: content,
        context,
        datasetId: datasetId || undefined,
        connectionId: connectionId || undefined,
        widgetContext: widgetContext || undefined,
      });

      const json = await response.json();
      return json;
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
        timestamp: data.timestamp ? new Date(data.timestamp) : new Date(),
      };
      
      addMessage(aiResponse);
      
      if (onMessageReceived) {
        onMessageReceived(aiResponse);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Copilot Error",
        description: error.message || "Failed to get AI response.",
        variant: "destructive",
      });
      
      const errorMessage: Message = {
        id: `ai-error-${Date.now()}`,
        role: "assistant",
        content: "I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
      };
      
      addMessage(errorMessage);
    },
  });

  // Generate chart recommendation based on dataset
  const generateChartSuggestion = useMutation({
    mutationFn: async (targetDatasetId: number) => {
      const response = await apiRequest("POST", "/api/ai/chart-recommendation", {
        datasetId: targetDatasetId,
      });
      return await response.json();
    },
    onSuccess: (data) => {
      const primary = data.primary;
      const content = primary
        ? `I recommend a **${primary.chartType}** chart ("${primary.title}"). ${primary.explanation}`
        : "Here is the recommended chart visualization for your data.";

      const message: Message = {
        id: `ai-suggestion-${Date.now()}`,
        role: "assistant",
        content,
        suggestedChartType: primary?.chartType,
        suggestedConfig: primary?.config,
        timestamp: new Date(),
      };
      
      addMessage(message);
      
      toast({
        title: "Chart Recommendation Ready",
        description: `Suggested ${primary?.chartType || 'chart'} visualization.`,
      });
      
      if (onMessageReceived) {
        onMessageReceived(message);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Recommendation Error",
        description: error.message || "Failed to generate chart suggestion.",
        variant: "destructive",
      });
    },
  });

  // Add a message to the chat
  const addMessage = (message: Message) => {
    setMessages(prev => [...prev, message]);
  };

  // Clear all messages
  const clearMessages = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Hello! I'm your AI Copilot. Ask me to generate SQL queries, explain your charts, or recommend visualizations.",
        timestamp: new Date(),
      },
    ]);
  };

  // Toggle open / minimized state
  const toggleOpen = () => {
    setIsOpen(prev => !prev);
    if (isMinimized) {
      setIsMinimized(false);
    }
  };

  const toggleMinimized = () => {
    setIsMinimized(prev => !prev);
  };

  return {
    messages,
    isOpen,
    isMinimized,
    isLoading: sendMessage.isPending || generateChartSuggestion.isPending,
    sendMessage: sendMessage.mutate,
    generateChartSuggestion: generateChartSuggestion.mutate,
    addMessage,
    clearMessages,
    toggleOpen,
    toggleMinimized,
    setOpen: setIsOpen,
    setMinimized: setIsMinimized,
  };
}

export default useAICopilot;
