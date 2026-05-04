import { describe, it, expect, vi, beforeEach } from 'vitest';
import { productGoalsService } from './productGoals.service';
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

describe('ProductGoalsService', () => {
  const mockApi = coreApiService.axiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProductGoals', () => {
    it('should get product goals for a team', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'goal-1',
              teamId: 'team-1',
              title: 'Increase user engagement',
              description: 'Improve user retention by 20%',
              status: 'ACTIVE',
              targetDate: '2024-12-31T00:00:00Z',
              successMetrics: 'DAU/MAU ratio > 0.4',
              strategicAlignment: 'Company growth strategy',
              createdAt: '2024-01-15T00:00:00Z',
              updatedAt: '2024-01-15T00:00:00Z',
            },
            {
              id: 'goal-2',
              teamId: 'team-1',
              title: 'Reduce technical debt',
              description: 'Refactor legacy modules',
              status: 'NEW',
              createdAt: '2024-01-15T00:00:00Z',
              updatedAt: '2024-01-15T00:00:00Z',
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await productGoalsService.getProductGoals('team-1');

      expect(mockApi.get).toHaveBeenCalledWith('/product-goals', {
        params: { teamId: 'team-1' },
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].title).toBe('Increase user engagement');
    });

    it('should return empty array when no goals exist', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await productGoalsService.getProductGoals('team-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('createProductGoal', () => {
    it('should create a new product goal', async () => {
      const goalData = {
        teamId: 'team-1',
        title: 'Improve performance',
        description: 'Reduce load time by 50%',
        status: 'NEW' as const,
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'goal-3',
            ...goalData,
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await productGoalsService.createProductGoal(goalData);

      expect(mockApi.post).toHaveBeenCalledWith('/product-goals', goalData);
      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('goal-3');
      expect(result.data?.title).toBe('Improve performance');
    });

    it('should create a goal with all fields', async () => {
      const goalData = {
        teamId: 'team-1',
        title: 'Complete feature set',
        description: 'Launch all planned features',
        status: 'ACTIVE' as const,
        targetDate: '2024-06-30T00:00:00Z',
        successMetrics: '100% feature completion',
        strategicAlignment: 'Product roadmap',
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'goal-4',
            ...goalData,
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-15T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.post).mockResolvedValue(mockResponse);

      const result = await productGoalsService.createProductGoal(goalData);

      expect(result.success).toBe(true);
      expect(result.data?.targetDate).toBe('2024-06-30T00:00:00Z');
      expect(result.data?.successMetrics).toBe('100% feature completion');
    });
  });

  describe('updateProductGoal', () => {
    it('should update a product goal', async () => {
      const updates = {
        title: 'Updated Goal Title',
        status: 'COMPLETED' as const,
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'goal-1',
            teamId: 'team-1',
            title: 'Updated Goal Title',
            status: 'COMPLETED',
            createdAt: '2024-01-15T00:00:00Z',
            updatedAt: '2024-01-16T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await productGoalsService.updateProductGoal('goal-1', updates);

      expect(mockApi.put).toHaveBeenCalledWith('/product-goals/goal-1', updates);
      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Updated Goal Title');
      expect(result.data?.status).toBe('COMPLETED');
    });

    it('should update goal target date', async () => {
      const updates = {
        targetDate: '2024-09-30T00:00:00Z',
      };
      const mockResponse = {
        data: {
          success: true,
          data: {
            id: 'goal-1',
            targetDate: '2024-09-30T00:00:00Z',
            updatedAt: '2024-01-16T00:00:00Z',
          },
        },
      };
      vi.mocked(mockApi.put).mockResolvedValue(mockResponse);

      const result = await productGoalsService.updateProductGoal('goal-1', updates);

      expect(result.success).toBe(true);
      expect(result.data?.targetDate).toBe('2024-09-30T00:00:00Z');
    });
  });

  describe('deleteProductGoal', () => {
    it('should delete a product goal', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: undefined,
        },
      };
      vi.mocked(mockApi.delete).mockResolvedValue(mockResponse);

      const result = await productGoalsService.deleteProductGoal('goal-1');

      expect(mockApi.delete).toHaveBeenCalledWith('/product-goals/goal-1');
      expect(result.success).toBe(true);
    });

    it('should handle delete errors', async () => {
      vi.mocked(mockApi.delete).mockRejectedValue(new Error('Goal not found'));

      await expect(productGoalsService.deleteProductGoal('invalid-id')).rejects.toThrow(
        'Goal not found'
      );
    });
  });

  describe('getProductGoalStatusHistory', () => {
    it('should get status history for a goal', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'history-1',
              entityType: 'ProductGoal',
              entityId: 'goal-1',
              workflowId: 'workflow-1',
              fromStateId: null,
              toStateId: 'state-1',
              changedBy: 'user-1',
              changeReason: null,
              changeNotes: null,
              transitionId: null,
              metadata: {},
              createdAt: '2024-01-15T00:00:00Z',
            },
            {
              id: 'history-2',
              entityType: 'ProductGoal',
              entityId: 'goal-1',
              workflowId: 'workflow-1',
              fromStateId: 'state-1',
              toStateId: 'state-2',
              changedBy: 'user-1',
              changeReason: 'Goal activated',
              changeNotes: 'Ready to start',
              transitionId: 'transition-1',
              metadata: {},
              createdAt: '2024-01-16T00:00:00Z',
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await productGoalsService.getProductGoalStatusHistory('goal-1');

      expect(mockApi.get).toHaveBeenCalledWith('/product-goals/goal-1/status-history');
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].entityType).toBe('ProductGoal');
    });

    it('should return empty history for new goal', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await productGoalsService.getProductGoalStatusHistory('goal-2');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });
});
