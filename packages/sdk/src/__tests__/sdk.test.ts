import { BeakDashSDK, AuthenticationError, NotFoundError } from '../index';
import { Dashboard, Widget, QueryExecutionResult } from '@beakdash/shared';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('BeakDashSDK', () => {
  let sdk: BeakDashSDK;
  const mockConfig = {
    apiKey: 'test-api-key',
    baseUrl: 'https://api.test.com/v1',
  };

  beforeEach(() => {
    sdk = new BeakDashSDK(mockConfig);
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Dashboards API', () => {
    const mockDashboards: Dashboard[] = [
      {
        id: '1',
        name: 'Test Dashboard',
        widgets: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    it('should return dashboards', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDashboards }),
      } as Response);

      const result = await sdk.getDashboards();
      expect(result).toEqual(mockDashboards);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.test.com/v1/dashboards',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should return a single dashboard by ID', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDashboards[0] }),
      } as Response);

      const result = await sdk.getDashboard('1');
      expect(result).toEqual(mockDashboards[0]);
    });

    it('should create a dashboard', async () => {
      const mockCreated: Dashboard = {
        id: '2',
        name: 'New Sales',
        widgets: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCreated }),
      } as Response);

      const result = await sdk.createDashboard({ name: 'New Sales', widgets: [] });
      expect(result).toEqual(mockCreated);
    });

    it('should update a dashboard', async () => {
      const mockUpdated: Dashboard = {
        id: '1',
        name: 'Renamed Sales',
        widgets: [],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-02',
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockUpdated }),
      } as Response);

      const result = await sdk.updateDashboard('1', { name: 'Renamed Sales' });
      expect(result).toEqual(mockUpdated);
    });

    it('should delete a dashboard', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await sdk.deleteDashboard('1');
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.test.com/v1/dashboards/1',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('Widgets API', () => {
    const mockWidgets: Widget[] = [
      {
        id: '1',
        type: 'chart',
        title: 'Test Widget',
        config: {},
      },
    ];

    it('should return widgets for dashboard', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockWidgets }),
      } as Response);

      const result = await sdk.getWidgets('1');
      expect(result).toEqual(mockWidgets);
    });

    it('should create a widget', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockWidgets[0] }),
      } as Response);

      const result = await sdk.createWidget('1', { type: 'chart', title: 'Test Widget', config: {} });
      expect(result).toEqual(mockWidgets[0]);
    });
  });

  describe('Connections & Query API', () => {
    it('should execute query successfully', async () => {
      const mockQueryResult: QueryExecutionResult = {
        data: [{ id: 1, revenue: 5000 }],
        columns: [
          { name: 'id', type: 'number' },
          { name: 'revenue', type: 'number' },
        ],
        rowCount: 1,
        truncated: false,
        executionTimeMs: 14,
        dialect: 'postgresql',
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockQueryResult }),
      } as Response);

      const result = await sdk.executeQuery(1, 'SELECT id, revenue FROM sales');
      expect(result).toEqual(mockQueryResult);
    });

    it('should test connection successfully', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: 'Connection successful', latencyMs: 25 }),
      } as Response);

      const result = await sdk.testConnection('postgresql', { host: 'localhost', database: 'analytics' });
      expect(result.success).toBe(true);
      expect(result.latencyMs).toBe(25);
    });
  });

  describe('Datasets API', () => {
    it('should fetch datasets', async () => {
      const mockDatasets = [{ id: 1, name: 'Sales Data', connectionId: 2 }];
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockDatasets,
      } as Response);

      const result = await sdk.getDatasets();
      expect(result).toEqual(mockDatasets);
    });

    it('should preview dataset transformations', async () => {
      const mockPreview = {
        data: [{ category: 'Electronics', total: 12000 }],
        columns: [{ name: 'category', type: 'string' }, { name: 'total', type: 'number' }],
        rowCount: 1,
        totalCount: 1,
        executionTimeMs: 8,
        dialect: 'postgresql',
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreview,
      } as Response);

      const result = await sdk.previewDataset({ connectionId: 1, query: 'SELECT * FROM sales' });
      expect(result).toEqual(mockPreview);
    });
  });

  describe('DB-QA API', () => {
    it('should run DB-QA query', async () => {
      const mockRunResult = {
        queryId: 1,
        queryName: 'Check Null Emails',
        status: 'success' as const,
        executionDurationMs: 12,
        rowCount: 0,
        data: [],
        columns: [],
      };

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockRunResult,
      } as Response);

      const result = await sdk.runDbQaQuery(1);
      expect(result).toEqual(mockRunResult);
    });

    it('should toggle DB-QA alert', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, enabled: false }),
      } as Response);

      const result = await sdk.toggleDbQaAlert(10);
      expect(result.enabled).toBe(false);
    });
  });

  describe('Embeds API', () => {
    it('should create an embed token', async () => {
      const mockToken = { token: 'mock.signed.token', expiresAt: '2026-08-30T00:00:00Z' };
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockToken }),
      } as Response);

      const result = await sdk.createEmbedToken({ dashboardId: '1', theme: 'dark' });
      expect(result).toEqual(mockToken);
    });

    it('should generate embed URL and HTML properly', () => {
      const embedConfig = { dashboardId: '42', theme: 'dark' as const, refreshInterval: 60 };
      const url = sdk.getEmbedUrl('signed-token-123', embedConfig);
      expect(url).toContain('/embed/42');
      expect(url).toContain('token=signed-token-123');
      expect(url).toContain('theme=dark');
      expect(url).toContain('refreshInterval=60');

      const html = sdk.getEmbedHtml('signed-token-123', embedConfig);
      expect(html).toContain('<iframe');
      expect(html).toContain(url);
    });
  });

  describe('Error handling', () => {
    it('should handle authentication error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: {
            code: 'AUTH_ERROR',
            message: 'Invalid API key',
          },
        }),
      } as Response);

      await expect(sdk.getDashboards()).rejects.toThrow(AuthenticationError);
    });

    it('should handle not found error', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: {
            code: 'NOT_FOUND',
            message: 'Dashboard not found',
          },
        }),
      } as Response);

      await expect(sdk.getDashboard('999')).rejects.toThrow(NotFoundError);
    });
  });
});