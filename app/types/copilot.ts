export interface AIMessage {
    role: 'user' | 'assistant';
    content: string;
}
  
export interface AIContext {
    type: 'widget' | 'global';
    id?: string;
    context: string;
}

export interface AICopilotStore {
    isOpen: boolean;
    messages: AIMessage[];
    context: AIContext | null;
    toggleChat: () => void;
    addMessage: (message: AIMessage) => void;
    setContext: (context: AIContext) => void;
    clearContext: () => void;
}