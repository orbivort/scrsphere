import { describe, it, expect, vi, beforeEach } from 'vitest';
import { systemParamsService } from './systemParams.service';
import { coreApiService } from '../core/api.core';

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

describe('SystemParamsService', () => {
  const mockApi = coreApiService.axiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSystemParameters', () => {
    it('should get all system parameters', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'param-1',
              key: 'max_team_members',
              value: '50',
              description: 'Maximum number of team members allowed',
              updatedBy: 'admin-1',
              updatedAt: '2024-01-15T00:00:00Z',
            },
            {
              id: 'param-2',
              key: 'session_timeout',
              value: '3600',
              description: 'Session timeout in seconds',
              updatedBy: 'admin-1',
              updatedAt: '2024-01-15T00:00:00Z',
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await systemParamsService.getSystemParameters();

      expect(mockApi.get).toHaveBeenCalledWith('/system-parameters');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].key).toBe('max_team_members');
      expect(result.data?.[1].key).toBe('session_timeout');
    });

    it('should return empty array when no parameters exist', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await systemParamsService.getSystemParameters();

      expect(mockApi.get).toHaveBeenCalledWith('/system-parameters');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should handle API errors', async () => {
      vi.mocked(mockApi.get).mockRejectedValue(new Error('Network error'));

      await expect(systemParamsService.getSystemParameters()).rejects.toThrow('Network error');
    });
  });

  describe('updateSystemParameter', () => {
    it('should update a system parameter value', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'param-1',
            key: 'max_team_members',
            value: '100',
            description: 'Maximum number of team members allowed',
            updatedBy: 'admin-1',
            updatedAt: '2024-01-16T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await systemParamsService.updateSystemParameter('max_team_members', '100');

      expect(mockApi.put).toHaveBeenCalledWith('/system-parameters/max_team_members', {
        value: '100',
      });
      expect(result.success).toBe(true);
      expect(result.data?.value).toBe('100');
      expect(result.data?.key).toBe('max_team_members');
    });

    it('should update session timeout parameter', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'param-2',
            key: 'session_timeout',
            value: '7200',
            description: 'Session timeout in seconds',
            updatedBy: 'admin-1',
            updatedAt: '2024-01-16T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await systemParamsService.updateSystemParameter('session_timeout', '7200');

      expect(mockApi.put).toHaveBeenCalledWith('/system-parameters/session_timeout', {
        value: '7200',
      });
      expect(result.success).toBe(true);
      expect(result.data?.value).toBe('7200');
    });

    it('should handle update errors', async () => {
      vi.mocked(mockApi.put).mockRejectedValue(new Error('Invalid parameter'));

      await expect(
        systemParamsService.updateSystemParameter('invalid_key', 'value')
      ).rejects.toThrow('Invalid parameter');
    });

    it('should handle unauthorized errors', async () => {
      vi.mocked(mockApi.put).mockRejectedValue(new Error('Unauthorized'));

      await expect(
        systemParamsService.updateSystemParameter('max_team_members', '100')
      ).rejects.toThrow('Unauthorized');
    });
  });
});
