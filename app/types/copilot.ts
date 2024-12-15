import { IDataset, IWidget } from "../lib/drizzle/schemas";
import { TransformConf } from "./data";

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChartContext {
    type: 'widget' | 'new';
    widget?: IWidget;
    dataset?: any;
    currentConfig?: TransformConf;
    userId: string;
    pageId: string;
  }
  
  export interface AICopilotStore {
    isOpen: boolean;
    messages: Message[];
    context: ChartContext | null;
    isLoading: boolean;
    toggleChat: () => void;
    addMessage: (message: Message) => void;
    setContext: (context: ChartContext) => void;
    clearAll: () => void;
    setLoading: (loading: boolean) => void;
    invokeCopilot: () => Promise<void>;
  }


  export interface ChartAssistantPayload {
    mode: 'create' | 'edit';
    prompt: string;
    dataset: IDataset;
    widget?: IWidget;
    pageId?: string, 
    userId: string
  }
  
  export interface ChartAssistantResponse {
    message: string;
    widgets: IWidget[];
    suggestions?: string;
  }
  
  export interface ColumnAnalysis {
    name: string;
    type: 'number' | 'string' | 'date' | 'boolean';
    uniqueValues: number;
    hasNulls: boolean;
    sample: any[];
  }
  
  export interface DatasetAnalysis {
    rowCount: number;
    columns: ColumnAnalysis[];
    correlations?: Record<string, Record<string, number>>; // For numeric columns
    recommendations: string[];
  }


  