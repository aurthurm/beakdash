import { DataAdapter } from '@/app/types/adapter';
import { SQLDataSource } from '@/app/types/datasource';

export class SQLAdapter implements DataAdapter {
  constructor(private config: SQLDataSource) {}

  async initialize(): Promise<void> {
    // No initialization needed for API calls
  }

  async fetchData(): Promise<any[]> {
    console.log("this.config: ", this.config);
    const response = await fetch('/api/data-sources', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: this.config.query,
        connectionString: this.config.connectionString,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    return response.json();
  }

  async cleanup(): Promise<void> {
    // No cleanup needed
  }
}
