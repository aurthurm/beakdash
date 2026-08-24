import { BeakDashSDK, AuthenticationError, NotFoundError } from '../index';
import { Dashboard, Widget } from '@beakdash/shared';
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

  describe('getDashboards', () => {
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
  });

  describe('getDashboard', () => {
    const mockDashboard: Dashboard = {
      id: '1',
      name: 'Test Dashboard',
      widgets: [],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    it('should return a dashboard', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockDashboard }),
      } as Response);

      const result = await sdk.getDashboard('1');
      expect(result).toEqual(mockDashboard);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.test.com/v1/dashboards/1',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });
  });

  describe('createDashboard', () => {
    const mockDashboardData = {
      name: 'New Dashboard',
      widgets: [],
    };

    const mockCreatedDashboard: Dashboard = {
      id: '1',
      ...mockDashboardData,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    };

    it('should create a dashboard', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockCreatedDashboard }),
      } as Response);

      const result = await sdk.createDashboard(mockDashboardData);
      expect(result).toEqual(mockCreatedDashboard);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.test.com/v1/dashboards',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(mockDashboardData),
        })
      );
    });
  });

  describe('getWidgets', () => {
    const mockWidgets: Widget[] = [
      {
        id: '1',
        type: 'chart',
        title: 'Test Widget',
        config: {},
      },
    ];

    it('should return widgets', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockWidgets }),
      } as Response);

      const result = await sdk.getWidgets('1');
      expect(result).toEqual(mockWidgets);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.test.com/v1/dashboards/1/widgets',
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });
  });

  describe('error handling', () => {
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
 