import { DataAdapter } from '@/app/types/adapter';
import { SQLConnectionConfig } from '@/app/types/datasource';

export class SQLAdapter implements DataAdapter {
  constructor(private config: SQLConnectionConfig) {}

  async initialize(): Promise<void> {
    // No initialization needed for API calls
  }

  async fetchData(query: string): Promise<any[]> {
    console.log("SQLAdapter config", this.config);
    console.log("SQLAdapter query", query);
    const response = await fetch('/api/data-sources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        config: this.config,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data?.details || data?.error || 'Failed to fetch data');
    }

    return response.json();
  }

  async cleanup(): Promise<void> {
    // No cleanup needed
  }
}
