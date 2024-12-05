import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { IConnection } from '../lib/drizzle/schemas';

const CACHE_TIME = 5 * 60 * 1000; // 5 minutes

interface ConnectionState {
  connections: IConnection[];
  activeConnectionId: string | null;
  loading: boolean;
  error: string | null;
  lastFetch: number;
  fetchConnections: (userId: string) => Promise<void>;
  fetchConnection: (id: string) => Promise<void>;
  addConnection: (connection: Omit<IConnection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateConnection: (id: string, connection: Partial<IConnection>) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  setActiveConnection: (id: string | null) => void;
  clearError: () => void;
}

export const useConnectionStore = create<ConnectionState>()(
  devtools(
    persist(
      (set, get) => ({
        connections: [],
        activeConnectionId: null,
        loading: false,
        error: null,
        lastFetch: 0,
        fetchConnections: async (userId) => {
          const now = Date.now();
          const store = get();
          
          // Check cache freshness
          if (
            store.connections.length > 0 && 
            now - store.lastFetch < CACHE_TIME
          ) {
            return;
          } 
          set({ lastFetch: now });

          set({ loading: true, error: null });
          try {
            const response = await fetch('/api/connections?userId=' + userId);
            if (!response.ok) throw new Error('Failed to fetch connections');
            const data = await response.json();
            set({ connections: data, loading: false });
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            });
          }
        },

        fetchConnection: async (id) => {
          set({ loading: true, error: null });
          try {
            const response = await fetch(`/api/connections/${id}`);
            if (!response.ok) throw new Error('Failed to fetch connection');
            const data = await response.json();
            set(state => ({
              connections: [
                ...state.connections.filter(c => c.id !== id),
                data
              ],
              loading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            });
          }
        },

        addConnection: async (connection) => {
          set({ loading: true, error: null });
          try {
            const response = await fetch('/api/connections', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(connection)
            });
            if (!response.ok) throw new Error('Failed to add connection');
            const data = await response.json();
            set(state => ({
              connections: [...state.connections, data],
              loading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            });
          }
        },

        updateConnection: async (id, connection) => {
          set({ loading: true, error: null });
          try {
            const response = await fetch(`/api/connections/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(connection)
            });
            if (!response.ok) throw new Error('Failed to update connection');
            const data = await response.json();
            set(state => ({
              connections: state.connections.map(c =>
                c.id === id ? data : c
              ),
              loading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            });
          }
        },

        deleteConnection: async (id) => {
          set({ loading: true, error: null });
          try {
            const response = await fetch(`/api/connections/${id}`, {
              method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete connection');
            set(state => ({
              connections: state.connections.filter(c => c.id !== id),
              activeConnectionId: state.activeConnectionId === id ? null : state.activeConnectionId,
              loading: false
            }));
          } catch (error) {
            set({ 
              error: error instanceof Error ? error.message : 'Unknown error',
              loading: false 
            });
          }
        },

        setActiveConnection: (id) => set({ activeConnectionId: id }),
        clearError: () => set({ error: null })
      }),
      {
        name: 'connections-storage'
      }
    )
  )
);
