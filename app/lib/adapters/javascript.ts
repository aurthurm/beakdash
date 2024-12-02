import { DataAdapter } from "@/app/types/adapter";
import { JavaScriptDataSource } from "@/app/types/datasource";

export class JavaScriptAdapter implements DataAdapter {
    private sandbox: any;
  
    constructor(private config: JavaScriptDataSource) {
      this.sandbox = {
        fetch: window.fetch.bind(window),
        console: {
          log: (...args) => console.log('Widget code:', ...args),
          error: (...args) => console.error('Widget code:', ...args),
        },
        Date,
        Math,
        JSON,
        Array,
        Object,
        String,
        Number,
        RegExp,
        Map,
        Set,
        Promise,
      };
    }
  
    async initialize(): Promise<void> {
      // No initialization needed
    }
  
    async fetchData(): Promise<any[]> {
      try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const userFunction = new AsyncFunction(
          ...Object.keys(this.sandbox),
          this.config.code
        );
  
        const data = await userFunction.apply(null, Object.values(this.sandbox));
  
        if (!Array.isArray(data)) {
          throw new Error('Code must return an array of data points');
        }
  
        return data;
      } catch (error) {
        throw new Error(`Code execution failed: ${error.message}`);
      }
    }
  
    async cleanup(): Promise<void> {
      // No cleanup needed
    }
  }


  // Create a widget with JavaScript data source
const widget = {
    id: 'js-widget-1',
    title: 'Custom Data Widget',
    type: 'line',
    dataSource: {
      type: 'javascript',
      code: `
        async function getData() {
          // Fetch cryptocurrency prices
          const response = await fetch('https://api.example.com/crypto/BTC');
          const data = await response.json();
          
          // Calculate moving average
          const window = 7;
          return data.prices.map((price, index, array) => {
            const start = Math.max(0, index - window + 1);
            const windowPrices = array.slice(start, index + 1);
            const average = windowPrices.reduce((sum, p) => sum + p.value, 0) / windowPrices.length;
            
            return {
              x: new Date(price.date).toLocaleDateString(),
              y: average
            };
          });
        }
        
        return await getData();
      `,
      refreshInterval: 60000 // Refresh every minute
    }
  };