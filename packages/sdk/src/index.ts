import { z } from 'zod';
import {
  ApiResponse,
  WidgetSchema,
  ApiResponseSchema,
  EmbedConfig,
  EmbedToken,
  EmbedConfigSchema,
  EmbedTokenSchema,
  BeakDashConfig,
  Dashboard,
  Widget,
  DashboardSchema,
  QueryExecutionResult,
  QueryExecutionSchema
} from '@beakdash/shared';
import {
  BeakDashError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  RateLimitError,
  ServerError
} from './errors';
import {
  DEFAULT_API_URL,
  DEFAULT_APP_URL,
  formatEmbedUrl,
  generateEmbedHtml,
  parseApiError
} from '@beakdash/shared';

export * from './errors';

export class BeakDashSDK {
  private baseUrl: string;
  private headers: HeadersInit;

  constructor(config: BeakDashConfig) {
    this.baseUrl = config.baseUrl || DEFAULT_API_URL;
    this.headers = {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = parseApiError(errorData);
      
      switch (response.status) {
        case 401:
          throw new AuthenticationError(error.message, error.details);
        case 403:
          throw new AuthenticationError('Forbidden', error.details);
        case 404:
          throw new NotFoundError(error.message, error.details);
        case 422:
          throw new ValidationError(error.message, error.details);
        case 429:
          throw new RateLimitError(error.message, error.details);
        case 500:
          case 502:
        case 503:
        case 504:
          throw new ServerError(error.message, error.details);
        default:
          throw new BeakDashError(error.message, 'UNKNOWN_ERROR', error.details);
      }
    }

    const data = await response.json();
    return data;
  }

  // Dashboard methods
  async getDashboards(): Promise<Dashboard[]> {
    const response = await this.request<ApiResponse<Dashboard[]>>('/dashboards');
    return ApiResponseSchema(z.array(DashboardSchema)).parse(response).data;
  }

  async getDashboard(id: string): Promise<Dashboard> {
    const response = await this.request<ApiResponse<Dashboard>>(`/dashboards/${id}`);
    return ApiResponseSchema(DashboardSchema).parse(response).data;
  }

  async createDashboard(data: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    const response = await this.request<ApiResponse<Dashboard>>('/dashboards', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return ApiResponseSchema(DashboardSchema).parse(response).data;
  }

  async updateDashboard(id: string, data: Partial<Dashboard>): Promise<Dashboard> {
    const response = await this.request<ApiResponse<Dashboard>>(`/dashboards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return ApiResponseSchema(DashboardSchema).parse(response).data;
  }

  async deleteDashboard(id: string): Promise<void> {
    await this.request(`/dashboards/${id}`, {
      method: 'DELETE'
    });
  }

  // Widget methods
  async getWidgets(dashboardId: string): Promise<Widget[]> {
    const response = await this.request<ApiResponse<Widget[]>>(`/dashboards/${dashboardId}/widgets`);
    return ApiResponseSchema(z.array(WidgetSchema)).parse(response).data;
  }

  async createWidget(dashboardId: string, data: Omit<Widget, 'id'>): Promise<Widget> {
    const response = await this.request<ApiResponse<Widget>>(`/dashboards/${dashboardId}/widgets`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return ApiResponseSchema(WidgetSchema).parse(response).data;
  }

  async updateWidget(dashboardId: string, widgetId: string, data: Partial<Widget>): Promise<Widget> {
    const response = await this.request<ApiResponse<Widget>>(
      `/dashboards/${dashboardId}/widgets/${widgetId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data)
      }
    );
    return ApiResponseSchema(WidgetSchema).parse(response).data;
  }

  async deleteWidget(dashboardId: string, widgetId: string): Promise<void> {
    await this.request(`/dashboards/${dashboardId}/widgets/${widgetId}`, {
      method: 'DELETE'
    });
  }

  // Query and Data Connection methods
  async executeQuery(connectionId: number, query: string, options?: Record<string, any>): Promise<QueryExecutionResult> {
    const response = await this.request<ApiResponse<QueryExecutionResult>>('/connections/execute', {
      method: 'POST',
      body: JSON.stringify({ connectionId, query, options })
    });
    return ApiResponseSchema(QueryExecutionSchema).parse(response).data;
  }

  async testConnection(type: string, config: Record<string, any>): Promise<{ success: boolean; message?: string; latencyMs?: number }> {
    return await this.request<{ success: boolean; message?: string; latencyMs?: number }>('/connections/test', {
      method: 'POST',
      body: JSON.stringify({ type, ...config })
    });
  }

  // Embed methods
  async createEmbedToken(config: EmbedConfig): Promise<EmbedToken> {
    // Validate embed config
    EmbedConfigSchema.parse(config);

    const response = await this.request<ApiResponse<EmbedToken>>('/embeds/tokens', {
      method: 'POST',
      body: JSON.stringify(config)
    });
    return ApiResponseSchema(EmbedTokenSchema).parse(response).data;
  }

  getEmbedUrl(token: string, config: EmbedConfig): string {
    const baseUrl = this.baseUrl.replace('/v1', '') || DEFAULT_APP_URL;
    const params: Record<string, string | number | boolean> = {};

    if (config.theme) params.theme = config.theme;
    if (config.showHeader !== undefined) params.showHeader = config.showHeader;
    if (config.showControls !== undefined) params.showControls = config.showControls;
    if (config.refreshInterval) params.refreshInterval = config.refreshInterval;
    if (config.customStyles) params.styles = JSON.stringify(config.customStyles);

    return formatEmbedUrl(baseUrl, config.dashboardId, token, params);
  }

  getEmbedHtml(token: string, config: EmbedConfig): string {
    const url = this.getEmbedUrl(token, config);
    return generateEmbedHtml(url, config.height, config.width);
  }
}