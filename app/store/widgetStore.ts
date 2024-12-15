import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {} from '@redux-devtools/extension';
import { IWidget } from '../lib/drizzle/schemas';
import { newWidgetPosition } from '../lib/utils';

const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

interface WidgetState {
  widgets: IWidget[];
  loading: boolean;
  error: string | null;
  lastFetch: number;
  fetchWidgets: (pageId: string) => Promise<void>;
  fetchWidget: (id: string) => Promise<IWidget>;
  addWidget: (widget: Omit<IWidget, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateWidget: (id: string, updates: Partial<IWidget>) => Promise<void>;
  createdWidget: (widget: IWidget) => Promise<void>;
  updatedWidget: (widget: IWidget) => Promise<void>;
  deleteWidget: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useWidgetStore = create<WidgetState>()(
  devtools(
    persist(
      (set, get) => ({
        widgets: [],
        loading: false,
        error: null,
        lastFetch: 0,

        fetchWidgets: async (pageId: string) => {
          const now = Date.now();
          const store = get();
          
          // Check cache freshness
          if (store.widgets.length > 0 && now - store.lastFetch < CACHE_TIME) {
            return;
          }
          set({ lastFetch: now });

          set({ loading: true, error: null });
          try {
            const response = await fetch(`/api/widgets?pageId=${pageId}`);
            if (!response.ok) throw new Error('Failed to fetch widgets');
            const data = await response.json();
            set({ widgets: data, loading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            });
          }
        },

        fetchWidget: async (id: string) => {
          // First check if widget is already in store
          const store = get();
          const widget = store.widgets.find(w => w.id === id);
          if (widget) {
            return widget;
          }

          set({ loading: true, error: null });
          try {
            const response = await fetch(`/api/widgets/${id}`);
            if (!response.ok) throw new Error('Failed to fetch widget');
            const data = await response.json();
            set(state => ({
              widgets: [...state.widgets.filter(w => w.id !== id), data],
              loading: false
            }));
            return data;
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            });
            throw error;
          }
        },

        addWidget: async (widget) => {
          set({ loading: true, error: null });
          try {
            const response = await fetch('/api/widgets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...widget,
                layout: newWidgetPosition(get().widgets, widget.type)
              })
            });
            if (!response.ok) throw new Error('Failed to add widget');
            const data = await response.json();
            set(state => ({
              widgets: [...state.widgets, data],
              loading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            });
            throw error;
          }
        },

        createdWidget: async (widget: IWidget) => {
          set(state => ({
            widgets: [...state.widgets, widget],
          }));
        },

        updateWidget: async (id: string, updates: Partial<IWidget>) => {
          set({ loading: true, error: null });
          try {
            const response = await fetch(`/api/widgets/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            });
            if (!response.ok) throw new Error('Failed to update widget');
            const data = await response.json();
            set(state => ({
              widgets: state.widgets.map(w => w.id === id ? data : w),
              loading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            });
            throw error;
          }
        },

        updatedWidget: async (widget: IWidget) => {
          set(state => ({
            widgets: state.widgets.map(w => w.id === widget.id ? widget : w),
            loading: false
          }));
        },

        deleteWidget: async (id: string) => {
          set({ loading: true, error: null });
          try {
            const response = await fetch(`/api/widgets/${id}`, {
              method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete widget');
            set(state => ({
              widgets: state.widgets.filter(w => w.id !== id),
              loading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            });
            throw error;
          }
        },

        clearError: () => set({ error: null })
      }),
      {
        name: 'widget-storage'
      }
    )
  )
);