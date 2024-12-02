import { useState, useEffect } from 'react';
import { DataSource } from '@/app/types/datasource';
import { CSVAdapter } from '@/app/lib/adapters/csv';
import { SQLAdapter } from '@/app/lib/adapters/sql';
import { RESTAdapter } from '@/app/lib/adapters/rest';
import { WebSocketAdapter } from '@/app/lib/adapters/websocket';

export function useDataSource(dataSource: DataSource) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let adapter: any;
    let interval: NodeJS.Timeout | null = null;

    const fetchData = async () => {
      try {
        const result = await adapter.fetchData();
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch data'));
      } finally {
        setLoading(false);
      }
    };

    const initialize = async () => {
      switch (dataSource?.type) {
        case 'csv':
          adapter = new CSVAdapter(dataSource);
          break;
        case 'sql':
          adapter = new SQLAdapter(dataSource);
          break;
        case 'rest':
          adapter = new RESTAdapter(dataSource);
          break;
        case 'websocket':
          adapter = new WebSocketAdapter(dataSource);
          break;
        case 'static':
          setData(dataSource.data);
          setLoading(false);
          return;
      }

      try {
        await adapter.initialize();

        if (adapter.subscribe) {
          adapter.subscribe(setData);
        } else {
          await fetchData();

          if (dataSource.refreshInterval) {
            interval = setInterval(fetchData, dataSource.refreshInterval);
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
  }, [dataSource]);

  return { data, loading, error };
}