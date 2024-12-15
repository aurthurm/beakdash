// store/aiCopilotStore.ts
import { create } from 'zustand';
import { AICopilotStore, ChartAssistantPayload, ChartAssistantResponse } from '@/app/types/copilot';
import { useWidgetStore } from './widgetStore';

export const useAICopilotStore = create<AICopilotStore>((set, get) => ({
  isOpen: false,
  messages: [],
  context: null,
  isLoading: false,
  
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  
  setContext: (context) => set({ context }),
  
  clearAll: () => set({ context: null, messages: [], isLoading: false }),
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  invokeCopilot: async () => {
    const { context } = get();
    if (!context?.dataset) throw new Error('No dataset provided');
    if(context?.type == 'widget') {
      if (!context.widget) throw new Error('No widget provided');
    };

    // set loading
    set({ isLoading: true });

    const messages = get().messages;
    const payload: ChartAssistantPayload = {
      pageId: context.pageId,
      userId: context.userId,
      mode: context.type == 'widget' ? 'edit' : 'create',
      prompt: messages[messages.length - 1].content,
      dataset: context.dataset,
      widget: context.widget,
    }

    const response = await fetch('/api/copilot/generator', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error('Failed to generate charts');
    const results: ChartAssistantResponse = await response.json();

    // update widget store with these widgets
    results.widgets.forEach((widget) => {
      if(context.type == 'widget') {
        useWidgetStore.getState().updatedWidget(widget);
      } else {
        useWidgetStore.getState().createdWidget(widget);
      }
    });

    set((state) => ({ isLoading: false, messages: [...state.messages, {
      role: 'assistant',
      content: `${results.message}${results.suggestions ? `\nSuggestions: \n${results.suggestions}` : ''}`,
    }] }))
  },
}));