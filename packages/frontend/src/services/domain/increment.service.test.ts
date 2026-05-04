import { describe, it, expect, vi, beforeEach } from 'vitest';
import { incrementService } from './increment.service';
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

describe('IncrementService', () => {
  const mockApi = coreApiService.axiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getIncrements', () => {
    it('should get increments for a team', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'increment-1',
              sprintId: 'sprint-1',
              teamId: 'team-1',
              name: 'Increment 1',
              includedPBIs: [],
              dodVerifications: [],
              totalStoryPoints: 10,
              status: 'DRAFT',
              createdAt: '2024-01-15T00:00:00Z',
              createdBy: 'user-1',
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await incrementService.getIncrements('team-1');

      expect(mockApi.get).toHaveBeenCalledWith('/increments', {
        params: { teamId: 'team-1', sprintId: undefined },
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should get increments for a specific sprint', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await incrementService.getIncrements('team-1', 'sprint-1');

      expect(mockApi.get).toHaveBeenCalledWith('/increments', {
        params: { teamId: 'team-1', sprintId: 'sprint-1' },
      });
      expect(result.success).toBe(true);
    });
  });

  describe('getIncrement', () => {
    it('should get a single increment by id', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'increment-1',
            sprintId: 'sprint-1',
            teamId: 'team-1',
            name: 'Increment 1',
            includedPBIs: [],
            dodVerifications: [],
            totalStoryPoints: 10,
            status: 'DRAFT',
            createdAt: '2024-01-15T00:00:00Z',
            createdBy: 'user-1',
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await incrementService.getIncrement('increment-1');

      expect(mockApi.get).toHaveBeenCalledWith('/increments/increment-1');
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('increment-1');
    });
  });

  describe('createIncrement', () => {
    it('should create a new increment', async () => {
      const incrementData = {
        sprintId: 'sprint-1',
        teamId: 'team-1',
        name: 'New Increment',
        includedPBIs: [],
        totalStoryPoints: 5,
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'increment-1',
            ...incrementData,
            dodVerifications: [],
            status: 'DRAFT',
            createdAt: '2024-01-15T00:00:00Z',
            createdBy: 'user-1',
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await incrementService.createIncrement(incrementData);

      expect(mockApi.post).toHaveBeenCalledWith('/increments', incrementData);
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('increment-1');
    });
  });

  describe('updateIncrement', () => {
    it('should update an increment', async () => {
      const updates = { name: 'Updated Increment' };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'increment-1',
            name: 'Updated Increment',
          },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await incrementService.updateIncrement('increment-1', updates);

      expect(mockApi.put).toHaveBeenCalledWith('/increments/increment-1', updates);
      expect(result.success).toBe(true);
      expect(result.data?.name).toBe('Updated Increment');
    });
  });

  describe('deliverIncrement', () => {
    it('should deliver increment via sprint review', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'increment-1',
            status: 'DELIVERED',
            deliveryMethod: 'sprint_review',
            deliveredAt: '2024-01-15T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await incrementService.deliverIncrement('increment-1', 'sprint_review');

      expect(mockApi.post).toHaveBeenCalledWith('/increments/increment-1/deliver', {
        deliveryMethod: 'sprint_review',
        notes: undefined,
      });
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('DELIVERED');
    });

    it('should deliver increment via early release with notes', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'increment-1',
            status: 'DELIVERED',
            deliveryMethod: 'early_release',
            deliveredAt: '2024-01-15T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await incrementService.deliverIncrement(
        'increment-1',
        'early_release',
        'Early delivery requested'
      );

      expect(mockApi.post).toHaveBeenCalledWith('/increments/increment-1/deliver', {
        deliveryMethod: 'early_release',
        notes: 'Early delivery requested',
      });
      expect(result.success).toBe(true);
      expect(result.data?.deliveryMethod).toBe('early_release');
    });
  });

  describe('getIncrementMetrics', () => {
    it('should get increment metrics for a team', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            totalIncrements: 10,
            deliveredIncrements: 8,
            averageDeliveryTime: 12.5,
            averageStoryPoints: 15.2,
            earlyReleases: 2,
            sprintReviewDeliveries: 6,
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await incrementService.getIncrementMetrics('team-1');

      expect(mockApi.get).toHaveBeenCalledWith('/increments/metrics', {
        params: { teamId: 'team-1' },
      });
      expect(result.success).toBe(true);
      expect(result.data?.totalIncrements).toBe(10);
      expect(result.data?.deliveredIncrements).toBe(8);
      expect(result.data?.averageDeliveryTime).toBe(12.5);
      expect(result.data?.averageStoryPoints).toBe(15.2);
      expect(result.data?.earlyReleases).toBe(2);
      expect(result.data?.sprintReviewDeliveries).toBe(6);
    });
  });
});
