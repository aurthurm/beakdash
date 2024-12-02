import { DataAdapter } from "@/app/types/adapter";
import { WebSocketDataSource } from "@/app/types/datasource";

export class WebSocketAdapter implements DataAdapter {
  private ws: WebSocket | null = null;
  private callback: ((data: any[]) => void) | null = null;

  constructor(private config: WebSocketDataSource) {}

  async initialize(): Promise<void> {
    this.ws = new WebSocket(this.config.url);
  }

  async fetchData(): Promise<any[]> {
    throw new Error('WebSocket adapter requires subscription');
  }

  subscribe(callback: (data: any[]) => void): void {
    this.callback = callback;
    
    if (this.ws) {
      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (this.callback) {
          this.callback(data);
        }
      };
    }
  }

  unsubscribe(): void {
    this.callback = null;
  }

  async cleanup(): Promise<void> {
    this.ws?.close();
  }
}