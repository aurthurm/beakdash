import { create } from 'zustand';
import { AICopilotStore } from '@/app/types/copilot';

export const useAICopilotStore = create<AICopilotStore>((set) => ({
  isOpen: false,
  messages: [],
  context: null,
  toggleChat: () => set((state) => ({ isOpen: !state.isOpen })),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setContext: (context) => set({ context }),
  clearContext: () => set({ context: null }),
}));