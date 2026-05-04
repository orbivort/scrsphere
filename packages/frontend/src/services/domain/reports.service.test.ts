import { describe, it, expect, vi, beforeEach } from 'vitest';
import { reportsService } from './reports.service';
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

describe('ReportsService', () => {
  const mockApi = coreApiService.axiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getVelocityData', () => {
    it('should get velocity data for a team', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            sprints: ['Sprint 1', 'Sprint 2', 'Sprint 3'],
            planned: [20, 25, 30],
            completed: [18, 24, 28],
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await reportsService.getVelocityData('team-1');

      expect(mockApi.get).toHaveBeenCalledWith('/reports/velocity', {
        params: { teamId: 'team-1' },
      });
      expect(result.success).toBe(true);
      expect(result.data?.sprints).toHaveLength(3);
      expect(result.data?.planned).toEqual([20, 25, 30]);
      expect(result.data?.completed).toEqual([18, 24, 28]);
    });

    it('should handle empty velocity data', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            sprints: [],
            planned: [],
            completed: [],
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await reportsService.getVelocityData('team-1');

      expect(result.success).toBe(true);
      expect(result.data?.sprints).toHaveLength(0);
    });
  });

  describe('getSprintHistory', () => {
    it('should get sprint history for a team', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'sprint-1',
              name: 'Sprint 1',
              startDate: '2024-01-01T00:00:00Z',
              endDate: '2024-01-14T00:00:00Z',
              status: 'completed',
              plannedPoints: 20,
              completedPoints: 18,
              teamMembers: 5,
              impediments: 2,
            },
            {
              id: 'sprint-2',
              name: 'Sprint 2',
              startDate: '2024-01-15T00:00:00Z',
              endDate: '2024-01-28T00:00:00Z',
              status: 'completed',
              plannedPoints: 25,
              completedPoints: 24,
              teamMembers: 5,
              impediments: 0,
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await reportsService.getSprintHistory('team-1');

      expect(mockApi.get).toHaveBeenCalledWith('/reports/sprint-history', {
        params: { teamId: 'team-1' },
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data?.[0].name).toBe('Sprint 1');
      expect(result.data?.[1].completedPoints).toBe(24);
    });
  });

  describe('getTeamMetrics', () => {
    it('should get team metrics', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            averageVelocity: 22.5,
            velocityTrend: 5.2,
            successRate: 85.5,
            successRateTrend: 2.1,
            impediments: {
              resolved: 15,
              total: 18,
            },
            teamSatisfaction: {
              rating: 4.2,
              trend: 0.3,
            },
          },
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await reportsService.getTeamMetrics('team-1');

      expect(mockApi.get).toHaveBeenCalledWith('/reports/metrics', {
        params: { teamId: 'team-1' },
      });
      expect(result.success).toBe(true);
      expect(result.data?.averageVelocity).toBe(22.5);
      expect(result.data?.velocityTrend).toBe(5.2);
      expect(result.data?.successRate).toBe(85.5);
      expect(result.data?.impediments.resolved).toBe(15);
      expect(result.data?.impediments.total).toBe(18);
      expect(result.data?.teamSatisfaction.rating).toBe(4.2);
    });
  });

  describe('getInsights', () => {
    it('should get team insights', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'insight-1',
              type: 'positive',
              icon: 'trending_up',
              title: 'Velocity Improving',
              description: 'Team velocity has increased by 15% over the last 3 sprints.',
            },
            {
              id: 'insight-2',
              type: 'warning',
              icon: 'warning',
              title: 'High Impediment Rate',
              description: 'Impediments are taking longer to resolve than usual.',
            },
            {
              id: 'insight-3',
              type: 'negative',
              icon: 'error',
              title: 'Sprint Goals Not Met',
              description: 'Last 2 sprints did not meet the planned sprint goals.',
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await reportsService.getInsights('team-1');

      expect(mockApi.get).toHaveBeenCalledWith('/reports/insights', {
        params: { teamId: 'team-1' },
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(3);
      expect(result.data?.[0].type).toBe('positive');
      expect(result.data?.[1].type).toBe('warning');
      expect(result.data?.[2].type).toBe('negative');
    });

    it('should return empty insights when no data', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await reportsService.getInsights('team-1');

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getStatusChangeHistory', () => {
    it('should get status change history with default pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'history-1',
              entityType: 'ProductBacklogItem',
              entityId: 'pbi-1',
              workflowId: 'workflow-1',
              fromStateId: 'state-1',
              toStateId: 'state-2',
              changedBy: 'user-1',
              changeReason: 'Work started',
              changeNotes: null,
              transitionId: 'transition-1',
              metadata: {},
              createdAt: '2024-01-15T00:00:00Z',
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await reportsService.getStatusChangeHistory('ProductBacklogItem', 'pbi-1');

      expect(mockApi.get).toHaveBeenCalledWith('/workflows/ProductBacklogItem/pbi-1/history', {
        params: { limit: 50, offset: 0 },
      });
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
    });

    it('should get status change history with custom pagination', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await reportsService.getStatusChangeHistory('Sprint', 'sprint-1', 10, 20);

      expect(mockApi.get).toHaveBeenCalledWith('/workflows/Sprint/sprint-1/history', {
        params: { limit: 10, offset: 20 },
      });
      expect(result.success).toBe(true);
    });

    it('should get status change history for different entity types', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: [
            {
              id: 'history-1',
              entityType: 'Task',
              entityId: 'task-1',
              toStateId: 'state-3',
              changedBy: 'user-1',
              createdAt: '2024-01-15T00:00:00Z',
            },
          ],
        },
      };
      vi.mocked(mockApi.get).mockResolvedValue(mockResponse);

      const result = await reportsService.getStatusChangeHistory('Task', 'task-1');

      expect(mockApi.get).toHaveBeenCalledWith('/workflows/Task/task-1/history', {
        params: { limit: 50, offset: 0 },
      });
      expect(result.success).toBe(true);
      expect(result.data?.[0].entityType).toBe('Task');
    });
  });
});
