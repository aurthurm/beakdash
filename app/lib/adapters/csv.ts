import { DataAdapter } from "@/app/types/adapter";
import Papa from 'papaparse';
import { CSVDataSource } from '@/app/types/datasource';

export class CSVAdapter implements DataAdapter {
    constructor(private config: CSVDataSource) {}
  
    async initialize(): Promise<void> {
      // No initialization needed for CSV
    }
  
    async fetchData(): Promise<any[]> {
      const response = await fetch(`/api/files/${this.config.fileId}`);
      const csvText = await response.text();
      
      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          complete: (results) => resolve(results.data),
          error: (error) => reject(error)
        });
      });
    }
  
    async cleanup(): Promise<void> {
      // No cleanup needed for CSV
    }
  }


  // Example usage in dashboard
const widgetConfig = {
  id: '1',
  title: 'Sales Data',
  chartType: 'line',
  dataSource: {
    type: 'csv',
    fileId: 'sales-data',
    columnMapping: {
      xAxis: 'date',
      yAxis: 'amount'
    }
  }
};