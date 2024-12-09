import { useState, useEffect } from 'react';
// import { CSVAdapter } from '@/app/lib/adapters/csv';
import { SQLAdapter } from '@/app/lib/adapters/sql';
// import { RESTAdapter } from '@/app/lib/adapters/rest';
// import { WebSocketAdapter } from '@/app/lib/adapters/websocket';
import { IConnection, IDataset, IWidget } from '../drizzle/schemas';
import { useConnectionStore } from '@/app/store/connections';
import { useDatasetStore } from '@/app/store/datasets';
import { SQLConnectionConfig } from '@/app/types/datasource';

export function useDataSet(widget: IWidget) {
  const { datasets } = useDatasetStore();
  const { connections } = useConnectionStore();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let adapter: any;
    let interval: NodeJS.Timeout | null = null;

    const dataset = datasets.find((d: IDataset) => d.id === widget.datasetId);
    const connection = connections.find((c: IConnection) => c.id === dataset?.connectionId);
    const query = widget.query;

    const fetchData = async () => {
      try {
        let result;
        switch (connection?.type) {
          case 'sql':
            result = await adapter.fetchData(query?.toString());
            setData(result);
            break;
          default:
            result = await adapter.fetchData();
            setData(result);
        }
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setLoading(false);
      }
    };

    const initialize = async () => {
      switch (connection?.type) {
        // case 'csv':
        //   adapter = new CSVAdapter(dataset);
        //   break;
        case 'sql':
          adapter = new SQLAdapter(connection?.config as SQLConnectionConfig);
          break;
        // case 'rest':
        //   adapter = new RESTAdapter(dataset);
        //   break;
        // case 'websocket':
        //   adapter = new WebSocketAdapter(dataset);
        //   break;
        default:
          // setData(dataset.data);
          setLoading(false);
          return;
      }

      try {
        await adapter.initialize();

        if (adapter.subscribe) {
          adapter.subscribe(setData);
        } else {
          await fetchData();

          if (dataset?.refreshInterval) {
            interval = setInterval(fetchData, dataset?.refreshInterval);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize'));
        setLoading(false);
      }
    };

    initialize();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (adapter) {
        adapter.unsubscribe?.();
        adapter.cleanup();
      }
    };
  }, [connections, datasets, widget.datasetId, widget.query]);

  return { data, loading, error };
}