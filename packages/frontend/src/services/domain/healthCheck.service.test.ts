import { describe, it, expect, vi, beforeEach } from 'vitest';
import { healthCheckService } from './healthCheck.service';
import { coreApiService } from '../core/api.core';
import { ScrumValue, HealthCheckStatus } from '@scrumooth/shared';

vi.mock('../core/api.core', () => ({
  coreApiService: {
    axiosInstance: {
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

describe('HealthCheckService', () => {
  const mockApi = coreApiService.axiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createHealthCheck', () => {
    it('should create a health check with a sprintId', async () => {
      const mockResponse = {
        data: { success: true as const },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await healthCheckService.createHealthCheck('team-1', 'sprint-1');

      expect(mockApi.post).toHaveBeenCalledWith('/teams/team-1/health-checks', {
        sprintId: 'sprint-1',
      });
      expect(result.success).toBe(true);
    });

    it('should create a health check without a sprintId', async () => {
      const mockResponse = {
        data: { success: true as const },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await healthCheckService.createHealthCheck('team-1');

      expect(mockApi.post).toHaveBeenCalledWith('/teams/team-1/health-checks', {
        sprintId: undefined,
      });
      expect(result.success).toBe(true);
    });

    it('should handle creation errors', async () => {
      vi.mocked(mockApi.post).mockRejectedValue(new Error('Network error'));

      await expect(healthCheckService.createHealthCheck('team-1')).rejects.toThrow('Network error');
    });
  });

  describe('submitResponses', () => {
    const responses = [
      { scrumValue: ScrumValue.COMMITMENT, score: 4, anonymous: false },
      { scrumValue: ScrumValue.FOCUS, score: 5, anonymous: true },
    ];

    it('should submit responses for a health check', async () => {
      const mockResponse = {
        data: {
          success: true as const,
          data: {
            healthCheckId: 'hc-1',
            saved: [
              { scrumValue: ScrumValue.COMMITMENT, score: 4 },
              { scrumValue: ScrumValue.FOCUS, score: 5 },
            ],
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await healthCheckService.submitResponses('hc-1', responses);

      expect(mockApi.post).toHaveBeenCalledWith('/health-checks/hc-1/responses', {
        responses,
      });
      expect(result.success).toBe(true);
      expect(result.data?.healthCheckId).toBe('hc-1');
      expect(result.data?.saved).toHaveLength(2);
    });

    it('should return an empty saved array when no responses persisted', async () => {
      const mockResponse = {
        data: {
          success: true as const,
          data: {
            healthCheckId: 'hc-1',
            saved: [],
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await healthCheckService.submitResponses('hc-1', []);

      expect(result.success).toBe(true);
      expect(result.data?.saved).toHaveLength(0);
    });

    it('should handle submit errors', async () => {
      vi.mocked(mockApi.post).mockRejectedValue(new Error('Server error'));

      await expect(healthCheckService.submitResponses('hc-1', responses)).rejects.toThrow(
        'Server error'
      );
    });
  });

  describe('getResults', () => {
    it('should return aggregated health check results', async () => {
      const mockResponse = {
        data: {
          success: true as const,
          data: {
            healthCheckId: 'hc-1',
            status: HealthCheckStatus.CLOSED,
            createdAt: '2024-01-15T00:00:00Z',
            results: [
              { scrumValue: ScrumValue.COMMITMENT, averageScore: 4.2, responseCount: 5 },
              { scrumValue: ScrumValue.FOCUS, averageScore: 3.8, responseCount: 5 },
            ],
            overallAverage: 4.0,
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await healthCheckService.getResults('hc-1');

      expect(mockApi.get).toHaveBeenCalledWith('/health-checks/hc-1/results');
      expect(result.success).toBe(true);
      expect(result.data?.healthCheckId).toBe('hc-1');
      expect(result.data?.status).toBe(HealthCheckStatus.CLOSED);
      expect(result.data?.results).toHaveLength(2);
      expect(result.data?.overallAverage).toBe(4.0);
    });

    it('should return an empty results array for a fresh health check', async () => {
      const mockResponse = {
        data: {
          success: true as const,
          data: {
            healthCheckId: 'hc-1',
            status: HealthCheckStatus.OPEN,
            createdAt: '2024-01-15T00:00:00Z',
            results: [],
            overallAverage: 0,
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await healthCheckService.getResults('hc-1');

      expect(result.success).toBe(true);
      expect(result.data?.results).toHaveLength(0);
      expect(result.data?.overallAverage).toBe(0);
    });

    it('should handle results fetch errors', async () => {
      vi.mocked(mockApi.get).mockRejectedValue(new Error('Not found'));

      await expect(healthCheckService.getResults('hc-1')).rejects.toThrow('Not found');
    });
  });

  describe('getTrend', () => {
    it('should return the health check trend for a team', async () => {
      const mockResponse = {
        data: {
          success: true as const,
          data: [
            {
              healthCheckId: 'hc-1',
              createdAt: '2024-01-15T00:00:00Z',
              overallAverage: 3.5,
              values: [{ scrumValue: ScrumValue.COMMITMENT, averageScore: 3.5 }],
            },
            {
              healthCheckId: 'hc-2',
              createdAt: '2024-02-15T00:00:00Z',
              overallAverage: 4.1,
              values: [{ scrumValue: ScrumValue.FOCUS, averageScore: 4.1 }],
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await healthCheckService.getTrend('team-1');

      expect(mockApi.get).toHaveBeenCalledWith('/teams/team-1/health-check-trend');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].healthCheckId).toBe('hc-1');
      expect(result.data?.[1].overallAverage).toBe(4.1);
    });

    it('should return an empty trend when no health checks exist', async () => {
      const mockResponse = {
        data: {
          success: true as const,
          data: [],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await healthCheckService.getTrend('team-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should handle trend fetch errors', async () => {
      vi.mocked(mockApi.get).mockRejectedValue(new Error('Unauthorized'));

      await expect(healthCheckService.getTrend('team-1')).rejects.toThrow('Unauthorized');
    });
  });
});
