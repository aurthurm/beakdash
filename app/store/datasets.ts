import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Dataset } from '../types/datasource';

interface DatasetState {
  datasets: Dataset[];
  activeDatasetId: string | null;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  
  fetchDatasets: (connectionId?: string) => Promise<void>;
  fetchDataset: (id: string) => Promise<void>;
  fetchDatasetData: (id: string) => Promise<void>;
  addDataset: (dataset: Omit<Dataset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDataset: (id: string, dataset: Partial<Dataset>) => Promise<void>;
  deleteDataset: (id: string) => Promise<void>;
  setActiveDataset: (id: string | null) => void;
  clearError: (key: string) => void;
}

export const useDatasetStore = create<DatasetState>()(
  devtools(
    persist(
      (set, get) => ({
        datasets: [],
        activeDatasetId: null,
        loading: {},
        error: {},
        
        fetchDatasets: async (connectionId?: string) => {
          const key = connectionId || 'all';
          set(state => ({
            loading: { ...state.loading, [key]: true },
            error: { ...state.error, [key]: null }
          }));

          try {
            const url = connectionId 
              ? `/api/datasets?connectionId=${connectionId}`
              : '/api/datasets';
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch datasets');
            const data = await response.json();
            
            set(state => ({
              datasets: connectionId
                ? [...state.datasets.filter(ds => ds.connection.id !== connectionId), ...data]
                : data,
              loading: { ...state.loading, [key]: false }
            }));
          } catch (error) {
            set(state => ({
              loading: { ...state.loading, [key]: false },
              error: { 
                ...state.error, 
                [key]: error instanceof Error ? error.message : 'Unknown error'
              }
            }));
          }
        },

        fetchDataset: async (id) => {
          set(state => ({
            loading: { ...state.loading, [id]: true },
            error: { ...state.error, [id]: null }
          }));

          try {
            const response = await fetch(`/api/datasets/${id}`);
            if (!response.ok) throw new Error('Failed to fetch dataset');
            const data = await response.json();
            
            set(state => ({
              datasets: [
                ...state.datasets.filter(ds => ds.id !== id),
                data
              ],
              loading: { ...state.loading, [id]: false }
            }));
          } catch (error) {
            set(state => ({
              loading: { ...state.loading, [id]: false },
              error: { 
                ...state.error, 
                [id]: error instanceof Error ? error.message : 'Unknown error'
              }
            }));
          }
        },

        fetchDatasetData: async (id) => {
          const key = `data-${id}`;
          set(state => ({
            loading: { ...state.loading, [key]: true },
            error: { ...state.error, [key]: null }
          }));

          try {
            const response = await fetch(`/api/datasets/${id}/data`);
            if (!response.ok) throw new Error('Failed to fetch dataset data');
            const data = await response.json();
            
            set(state => ({
              datasets: state.datasets.map(ds =>
                ds.id === id ? { ...ds, data } : ds
              ),
              loading: { ...state.loading, [key]: false }
            }));
          } catch (error) {
            set(state => ({
              loading: { ...state.loading, [key]: false },
              error: { 
                ...state.error, 
                [key]: error instanceof Error ? error.message : 'Unknown error'
              }
            }));
          }
        },

        addDataset: async (dataset) => {
          const key = 'add';
          set(state => ({
            loading: { ...state.loading, [key]: true },
            error: { ...state.error, [key]: null }
          }));

          try {
            const response = await fetch('/api/datasets', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dataset)
            });
            
            if (!response.ok) throw new Error('Failed to add dataset');
            const data = await response.json();
            
            set(state => ({
              datasets: [...state.datasets, data],
              loading: { ...state.loading, [key]: false }
            }));
          } catch (error) {
            set(state => ({
              loading: { ...state.loading, [key]: false },
              error: { 
                ...state.error, 
                [key]: error instanceof Error ? error.message : 'Unknown error'
              }
            }));
          }
        },

        updateDataset: async (id, dataset) => {
          set(state => ({
            loading: { ...state.loading, [id]: true },
            error: { ...state.error, [id]: null }
          }));

          try {
            const response = await fetch(`/api/datasets/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(dataset)
            });
            
            if (!response.ok) throw new Error('Failed to update dataset');
            const data = await response.json();
            
            set(state => ({
              datasets: state.datasets.map(ds =>
                ds.id === id ? data : ds
              ),
              loading: { ...state.loading, [id]: false }
            }));
          } catch (error) {
            set(state => ({
              loading: { ...state.loading, [id]: false },
              error: { 
                ...state.error, 
                [id]: error instanceof Error ? error.message : 'Unknown error'
              }
            }));
          }
        },

        deleteDataset: async (id) => {
          set(state => ({
            loading: { ...state.loading, [id]: true },
            error: { ...state.error, [id]: null }
          }));

          try {
            const response = await fetch(`/api/datasets/${id}`, {
              method: 'DELETE'
            });
            
            if (!response.ok) throw new Error('Failed to delete dataset');
            
            set(state => ({
              datasets: state.datasets.filter(ds => ds.id !== id),
              activeDatasetId: state.activeDatasetId === id ? null : state.activeDatasetId,
              loading: { ...state.loading, [id]: false }
            }));
          } catch (error) {
            set(state => ({
              loading: { ...state.loading, [id]: false },
              error: { 
                ...state.error, 
                [id]: error instanceof Error ? error.message : 'Unknown error'
              }
            }));
          }
        },

        setActiveDataset: (id) => set({ activeDatasetId: id }),
        clearError: (key) => set(state => ({
          error: { ...state.error, [key]: null }
        }))
      }),
      {
        name: 'datasets-storage'
      }
    )
  )
);

// Selector hooks
export const useDatasets = (connectionId?: string) => {
  const key = connectionId || 'all';
  return {
    datasets: useDatasetStore(state => 
      connectionId 
        ? state.datasets.filter(ds => ds.connection.id === connectionId)
        : state.datasets
    ),
    loading: useDatasetStore(state => state.loading[key] || false),
    error: useDatasetStore(state => state.error[key]),
    fetchDatasets: useDatasetStore(state => state.fetchDatasets)
  };
};

export const useDataset = (id: string) => ({
  dataset: useDatasetStore(state => state.datasets.find(ds => ds.id === id)),
  loading: useDatasetStore(state => state.loading[id] || false),
  error: useDatasetStore(state => state.error[id]),
  fetchDataset: useDatasetStore(state => () => state.fetchDataset(id)),
  updateDataset: useDatasetStore(state => state.updateDataset),
  deleteDataset: useDatasetStore(state => state.deleteDataset)
});

