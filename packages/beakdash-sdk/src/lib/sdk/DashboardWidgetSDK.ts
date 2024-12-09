// src/lib/DashboardWidgetSDK.ts
export interface WidgetConfig {
    containerId: string;
    apiKey: string;
    widgetId: string;
    theme?: 'light' | 'dark';
    refreshInterval?: number;
    onLoad?: () => void;
    onError?: (error: Error) => void;
  }
  
  export class DashboardWidgetSDK {
    private static instance: DashboardWidgetSDK;
    private serverUrl: string;
    private widgets: Map<string, any> = new Map();
  
    private constructor(serverUrl: string) {
      this.serverUrl = serverUrl;
    }
  
    static initialize(serverUrl: string): DashboardWidgetSDK {
      if (!DashboardWidgetSDK.instance) {
        DashboardWidgetSDK.instance = new DashboardWidgetSDK(serverUrl);
      }
      return DashboardWidgetSDK.instance;
    }
  
    async loadWidget(config: WidgetConfig): Promise<void> {
      try {
        // Validate container exists
        const container = document.getElementById(config.containerId);
        if (!container) {
          throw new Error(`Container with id "${config.containerId}" not found`);
        }
  
        // Load widget data
        const widget = await this.fetchWidget(config.widgetId, config.apiKey);
        
        // Create shadow DOM for isolation
        const shadow = container.attachShadow({ mode: 'open' });
        
        // Add styles
        const styles = document.createElement('style');
        styles.textContent = this.getStyles(config.theme);
        shadow.appendChild(styles);
  
        // Create widget container
        const widgetElement = this.createWidgetElement(widget);
        shadow.appendChild(widgetElement);
  
        // Store widget reference
        this.widgets.set(config.widgetId, {
          element: widgetElement,
          config,
          interval: null
        });
  
        // Setup refresh interval if specified
        if (config.refreshInterval) {
          const interval = setInterval(() => {
            this.refreshWidget(config.widgetId);
          }, config.refreshInterval);
          this.widgets.get(config.widgetId).interval = interval;
        }
  
        config.onLoad?.();
      } catch (error) {
        config.onError?.(error instanceof Error ? error : new Error(error?.toString()));
        throw error;
      }
    }
  
    async refreshWidget(widgetId: string): Promise<void> {
      const widget = this.widgets.get(widgetId);
      if (!widget) return;
  
      try {
        const updatedData = await this.fetchWidget(widgetId, widget.config.apiKey);
        this.updateWidgetData(widget.element, updatedData);
      } catch (error) {
        widget.config.onError?.(error);
      }
    }
  
    private async fetchWidget(widgetId: string, apiKey: string): Promise<any> {
      const response = await fetch(`${this.serverUrl}/api/widgets/${widgetId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`Failed to load widget: ${response.statusText}`);
      }
  
      return response.json();
    }
  
    private createWidgetElement(widget: any): HTMLElement {
      console.log('widget', widget);
      const element = document.createElement('div');
      element.className = 'dashboard-widget';
      // Add widget content based on type
      // This is where you'd render charts, tables, etc.
      return element;
    }
  
    private updateWidgetData(element: HTMLElement, data: any): void {
      console.log('data', data);
      console.log('element', element);
      // Update widget content with new data
    }
  
    private getStyles(theme: 'light' | 'dark' = 'light'): string {
      return `
        .dashboard-widget {
          font-family: system-ui, -apple-system, sans-serif;
          background: ${theme === 'light' ? '#ffffff' : '#1a1a1a'};
          color: ${theme === 'light' ? '#000000' : '#ffffff'};
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.12);
        }
      `;
    }
  
    destroy(widgetId: string): void {
      const widget = this.widgets.get(widgetId);
      if (widget) {
        if (widget.interval) {
          clearInterval(widget.interval);
        }
        widget.element.remove();
        this.widgets.delete(widgetId);
      }
    }
  
    destroyAll(): void {
      this.widgets.forEach((widget, id) => {
        this.destroy(id);
      });
    }
  }