import { describe, it, expect, beforeEach, vi } from 'vitest';
import { reportsService } from '../../../services/reports.service';

// Mock prisma
vi.mock('../../../utils/prisma', () => ({
  default: {
    sprint: {
      findMany: vi.fn(),
    },
    impediment: {
      findMany: vi.fn(),
    },
    sprintRetrospective: {
      findMany: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import prisma from '../../../utils/prisma';

describe('ReportsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    reportsService.invalidateCache();
  });

  describe('getVelocityData', () => {
    it('should return velocity data for a team', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-14'),
          sprintBacklogItems: [
            { pbi: { storyPoints: 13, status: 'DONE' } },
            { pbi: { storyPoints: 8, status: 'DONE' } },
            { pbi: { storyPoints: 5, status: 'TODO' } },
          ],
        },
        {
          id: 'sprint-2',
          name: 'Sprint 2',
          status: 'COMPLETED',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-28'),
          sprintBacklogItems: [
            { pbi: { storyPoints: 21, status: 'DONE' } },
            { pbi: { storyPoints: 13, status: 'DONE' } },
          ],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);

      const result = await reportsService.getVelocityData('team-1');

      expect(result).toBeDefined();
      expect(result.sprints).toHaveLength(2);
      expect(result.sprints[0]).toBe('Sprint 1');
      expect(result.planned[0]).toBe(26);
      expect(result.completed[0]).toBe(21);
    });

    it('should use cache for subsequent calls', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          sprintBacklogItems: [{ pbi: { storyPoints: 13, status: 'DONE' } }],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);

      // First call - fetch from DB
      await reportsService.getVelocityData('team-1');

      // Second call - should use cache
      await reportsService.getVelocityData('team-1');

      expect(prisma.sprint.findMany).toHaveBeenCalledTimes(1);
    });

    it('should return empty arrays when no sprints found', async () => {
      (prisma.sprint.findMany as any).mockResolvedValue([]);

      const result = await reportsService.getVelocityData('team-1');

      expect(result.sprints).toHaveLength(0);
      expect(result.planned).toHaveLength(0);
      expect(result.completed).toHaveLength(0);
    });

    it('should handle sprints without story points', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          sprintBacklogItems: [
            { pbi: { storyPoints: null, status: 'DONE' } },
            { pbi: { storyPoints: 8, status: 'DONE' } },
          ],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);

      const result = await reportsService.getVelocityData('team-1');

      expect(result.planned[0]).toBe(8);
      expect(result.completed[0]).toBe(8);
    });
  });

  describe('getSprintHistory', () => {
    it('should return sprint history', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-14'),
          sprintBacklogItems: [
            { pbi: { storyPoints: 13, status: 'DONE' } },
            { pbi: { storyPoints: 8, status: 'DONE' } },
          ],
          tasks: [{ assigneeId: 'user-1' }, { assigneeId: 'user-2' }, { assigneeId: null }],
          impediments: [{ id: 'imp-1' }, { id: 'imp-2' }],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);

      const result = await reportsService.getSprintHistory('team-1');

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('sprint-1');
      expect(result[0]!.plannedPoints).toBe(21);
      expect(result[0]!.completedPoints).toBe(21);
      expect(result[0]!.teamMembers).toBe(2);
      expect(result[0]!.impediments).toBe(2);
    });

    it('should return empty array when no sprints', async () => {
      (prisma.sprint.findMany as any).mockResolvedValue([]);

      const result = await reportsService.getSprintHistory('team-1');

      expect(result).toHaveLength(0);
    });

    it('should use cache for subsequent calls', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          startDate: new Date(),
          endDate: new Date(),
          sprintBacklogItems: [],
          tasks: [],
          impediments: [],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);

      await reportsService.getSprintHistory('team-1');
      await reportsService.getSprintHistory('team-1');

      expect(prisma.sprint.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getTeamMetrics', () => {
    it('should return team metrics', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          status: 'COMPLETED',
          sprintBacklogItems: [
            { pbi: { storyPoints: 20, status: 'DONE' } },
            { pbi: { storyPoints: 10, status: 'DONE' } },
          ],
        },
        {
          id: 'sprint-2',
          status: 'COMPLETED',
          sprintBacklogItems: [
            { pbi: { storyPoints: 25, status: 'DONE' } },
            { pbi: { storyPoints: 15, status: 'DONE' } },
          ],
        },
      ];

      const mockImpediments = [{ status: 'RESOLVED' }, { status: 'OPEN' }, { status: 'RESOLVED' }];

      const mockRetrospectives = [
        {
          items: [{ votes: 5 }, { votes: 3 }],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);
      (prisma.impediment.findMany as any).mockResolvedValue(mockImpediments);
      (prisma.sprintRetrospective.findMany as any).mockResolvedValue(mockRetrospectives);

      const result = await reportsService.getTeamMetrics('team-1');

      expect(result).toBeDefined();
      expect(result.averageVelocity).toBe(35);
      expect(result.impediments.resolved).toBe(2);
      expect(result.impediments.total).toBe(3);
    });

    it('should calculate velocity trend correctly', async () => {
      // Data in descending order (as returned by query with orderBy: { startDate: 'desc' })
      const mockSprints = [
        {
          id: 'sprint-6',
          status: 'COMPLETED',
          sprintBacklogItems: [{ pbi: { storyPoints: 30, status: 'DONE' } }],
        },
        {
          id: 'sprint-5',
          status: 'COMPLETED',
          sprintBacklogItems: [{ pbi: { storyPoints: 25, status: 'DONE' } }],
        },
        {
          id: 'sprint-4',
          status: 'COMPLETED',
          sprintBacklogItems: [{ pbi: { storyPoints: 20, status: 'DONE' } }],
        },
        {
          id: 'sprint-3',
          status: 'COMPLETED',
          sprintBacklogItems: [{ pbi: { storyPoints: 15, status: 'DONE' } }],
        },
        {
          id: 'sprint-2',
          status: 'COMPLETED',
          sprintBacklogItems: [{ pbi: { storyPoints: 12, status: 'DONE' } }],
        },
        {
          id: 'sprint-1',
          status: 'COMPLETED',
          sprintBacklogItems: [{ pbi: { storyPoints: 10, status: 'DONE' } }],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);
      (prisma.impediment.findMany as any).mockResolvedValue([]);
      (prisma.sprintRetrospective.findMany as any).mockResolvedValue([]);

      const result = await reportsService.getTeamMetrics('team-1');

      // Trend should be positive: recent [30, 25, 20] avg=25 vs older [15, 12, 10] avg=12.33
      expect(result.velocityTrend).toBeGreaterThan(0);
    });

    it('should calculate success rate correctly', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          status: 'COMPLETED',
          sprintBacklogItems: [
            { pbi: { storyPoints: 10, status: 'DONE' } },
            { pbi: { storyPoints: 5, status: 'TODO' } },
          ],
        },
        {
          id: 'sprint-2',
          status: 'COMPLETED',
          sprintBacklogItems: [
            { pbi: { storyPoints: 20, status: 'DONE' } },
            { pbi: { storyPoints: 2, status: 'TODO' } },
          ],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);
      (prisma.impediment.findMany as any).mockResolvedValue([]);
      (prisma.sprintRetrospective.findMany as any).mockResolvedValue([]);

      const result = await reportsService.getTeamMetrics('team-1');

      // Sprint 1: 10/15 = 66.7% (not successful)
      // Sprint 2: 20/22 = 90.9% (successful)
      // Success rate: 50%
      expect(result.successRate).toBe(50);
    });

    it('should return default values when no data', async () => {
      (prisma.sprint.findMany as any).mockResolvedValue([]);
      (prisma.impediment.findMany as any).mockResolvedValue([]);
      (prisma.sprintRetrospective.findMany as any).mockResolvedValue([]);

      const result = await reportsService.getTeamMetrics('team-1');

      expect(result.averageVelocity).toBe(0);
      expect(result.successRate).toBe(0);
      expect(result.teamSatisfaction.rating).toBe(4);
    });

    it('should use cache for subsequent calls', async () => {
      (prisma.sprint.findMany as any).mockResolvedValue([]);
      (prisma.impediment.findMany as any).mockResolvedValue([]);
      (prisma.sprintRetrospective.findMany as any).mockResolvedValue([]);

      await reportsService.getTeamMetrics('team-1');
      await reportsService.getTeamMetrics('team-1');

      expect(prisma.sprint.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getInsights', () => {
    it('should return velocity improvement insight', async () => {
      // Need at least 6 sprints for meaningful trend calculation
      // Data in descending order (as returned by query with orderBy: { startDate: 'desc' })
      // Recent 3: [35, 30, 25] avg=30 vs Older 3: [15, 12, 10] avg=12.33, trend ~143%
      const mockSprints = [
        {
          id: 'sprint-6',
          name: 'Sprint 6',
          status: 'COMPLETED',
          startDate: new Date('2024-03-11'),
          endDate: new Date('2024-03-24'),
          sprintBacklogItems: [{ pbi: { storyPoints: 35, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
        {
          id: 'sprint-5',
          name: 'Sprint 5',
          status: 'COMPLETED',
          startDate: new Date('2024-02-26'),
          endDate: new Date('2024-03-10'),
          sprintBacklogItems: [{ pbi: { storyPoints: 30, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
        {
          id: 'sprint-4',
          name: 'Sprint 4',
          status: 'COMPLETED',
          startDate: new Date('2024-02-12'),
          endDate: new Date('2024-02-25'),
          sprintBacklogItems: [{ pbi: { storyPoints: 25, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
        {
          id: 'sprint-3',
          name: 'Sprint 3',
          status: 'COMPLETED',
          startDate: new Date('2024-01-29'),
          endDate: new Date('2024-02-11'),
          sprintBacklogItems: [{ pbi: { storyPoints: 15, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
        {
          id: 'sprint-2',
          name: 'Sprint 2',
          status: 'COMPLETED',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-28'),
          sprintBacklogItems: [{ pbi: { storyPoints: 12, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-14'),
          sprintBacklogItems: [{ pbi: { storyPoints: 10, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);
      (prisma.impediment.findMany as any).mockResolvedValue([]);
      (prisma.sprintRetrospective.findMany as any).mockResolvedValue([]);

      const result = await reportsService.getInsights('team-1');

      const velocityInsight = result.find((i) => i.id === 'velocity-improvement');
      expect(velocityInsight).toBeDefined();
      expect(velocityInsight?.type).toBe('positive');
    });

    it('should return velocity decline insight', async () => {
      // Need at least 6 sprints for meaningful trend calculation
      // Data in descending order (as returned by query with orderBy: { startDate: 'desc' })
      // Recent 3: [10, 12, 15] avg=12.33 vs Older 3: [30, 25, 20] avg=25, trend ~-51%
      const mockSprints = [
        {
          id: 'sprint-6',
          name: 'Sprint 6',
          status: 'COMPLETED',
          startDate: new Date('2024-03-11'),
          endDate: new Date('2024-03-24'),
          sprintBacklogItems: [{ pbi: { storyPoints: 10, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
        {
          id: 'sprint-5',
          name: 'Sprint 5',
          status: 'COMPLETED',
          startDate: new Date('2024-02-26'),
          endDate: new Date('2024-03-10'),
          sprintBacklogItems: [{ pbi: { storyPoints: 12, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
        {
          id: 'sprint-4',
          name: 'Sprint 4',
          status: 'COMPLETED',
          startDate: new Date('2024-02-12'),
          endDate: new Date('2024-02-25'),
          sprintBacklogItems: [{ pbi: { storyPoints: 15, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
        {
          id: 'sprint-3',
          name: 'Sprint 3',
          status: 'COMPLETED',
          startDate: new Date('2024-01-29'),
          endDate: new Date('2024-02-11'),
          sprintBacklogItems: [{ pbi: { storyPoints: 20, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
        {
          id: 'sprint-2',
          name: 'Sprint 2',
          status: 'COMPLETED',
          startDate: new Date('2024-01-15'),
          endDate: new Date('2024-01-28'),
          sprintBacklogItems: [{ pbi: { storyPoints: 25, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-14'),
          sprintBacklogItems: [{ pbi: { storyPoints: 30, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);
      (prisma.impediment.findMany as any).mockResolvedValue([]);
      (prisma.sprintRetrospective.findMany as any).mockResolvedValue([]);

      const result = await reportsService.getInsights('team-1');

      const velocityInsight = result.find((i) => i.id === 'velocity-decline');
      expect(velocityInsight).toBeDefined();
      expect(velocityInsight?.type).toBe('warning');
    });

    it('should return consistent delivery insight', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          startDate: new Date(),
          endDate: new Date(),
          sprintBacklogItems: [{ pbi: { storyPoints: 10, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
        {
          id: 'sprint-2',
          name: 'Sprint 2',
          status: 'COMPLETED',
          startDate: new Date(),
          endDate: new Date(),
          sprintBacklogItems: [{ pbi: { storyPoints: 15, status: 'DONE' } }],
          tasks: [],
          impediments: [],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);
      (prisma.impediment.findMany as any).mockResolvedValue([]);
      (prisma.sprintRetrospective.findMany as any).mockResolvedValue([]);

      const result = await reportsService.getInsights('team-1');

      const consistentInsight = result.find((i) => i.id === 'consistent-delivery');
      expect(consistentInsight).toBeDefined();
      expect(consistentInsight?.type).toBe('positive');
    });

    it('should return impediment insight', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          startDate: new Date(),
          endDate: new Date(),
          sprintBacklogItems: [],
          tasks: [],
          impediments: [{ id: 'imp-1' }],
        },
      ];

      const mockImpediments = [{ status: 'OPEN' }, { status: 'OPEN' }, { status: 'RESOLVED' }];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);
      (prisma.impediment.findMany as any).mockResolvedValue(mockImpediments);
      (prisma.sprintRetrospective.findMany as any).mockResolvedValue([]);

      const result = await reportsService.getInsights('team-1');

      const impedimentInsight = result.find((i) => i.id === 'impediment-trend');
      expect(impedimentInsight).toBeDefined();
    });

    it('should return high success rate insight', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          startDate: new Date(),
          endDate: new Date(),
          sprintBacklogItems: [
            { pbi: { storyPoints: 10, status: 'DONE' } },
            { pbi: { storyPoints: 0, status: 'TODO' } },
          ],
          tasks: [],
          impediments: [],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);
      (prisma.impediment.findMany as any).mockResolvedValue([]);
      (prisma.sprintRetrospective.findMany as any).mockResolvedValue([]);

      const result = await reportsService.getInsights('team-1');

      const successInsight = result.find((i) => i.id === 'high-success-rate');
      expect(successInsight).toBeDefined();
      expect(successInsight?.type).toBe('positive');
    });

    it('should return getting started insight when no data', async () => {
      (prisma.sprint.findMany as any).mockResolvedValue([]);
      (prisma.impediment.findMany as any).mockResolvedValue([]);
      (prisma.sprintRetrospective.findMany as any).mockResolvedValue([]);

      const result = await reportsService.getInsights('team-1');

      expect(result).toHaveLength(1);
      expect(result[0]!.id).toBe('get-started');
    });

    it('should use cache for subsequent calls', async () => {
      (prisma.sprint.findMany as any).mockResolvedValue([]);
      (prisma.impediment.findMany as any).mockResolvedValue([]);
      (prisma.sprintRetrospective.findMany as any).mockResolvedValue([]);

      await reportsService.getInsights('team-1');
      await reportsService.getInsights('team-1');

      expect(prisma.sprint.findMany).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = reportsService.getCacheStats();

      expect(stats).toBeDefined();
      expect(stats.size).toBe(0);
      expect(stats.maxSize).toBe(1000);
      expect(stats.maxMemoryMB).toBe(50);
    });

    it('should reflect cache size after adding data', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          sprintBacklogItems: [],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);

      await reportsService.getVelocityData('team-1');

      const stats = reportsService.getCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('invalidateCache', () => {
    it('should invalidate cache for specific team', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          sprintBacklogItems: [],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);

      // Populate cache
      await reportsService.getVelocityData('team-1');

      // Invalidate cache
      reportsService.invalidateCache('team-1');

      // Should fetch from DB again
      await reportsService.getVelocityData('team-1');
      expect(prisma.sprint.findMany).toHaveBeenCalledTimes(2);
    });

    it('should invalidate all cache when no team specified', async () => {
      const mockSprints = [
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          sprintBacklogItems: [],
        },
      ];

      (prisma.sprint.findMany as any).mockResolvedValue(mockSprints);

      // Populate cache
      await reportsService.getVelocityData('team-1');

      // Invalidate all cache
      reportsService.invalidateCache();

      // Should fetch from DB again
      await reportsService.getVelocityData('team-1');
      expect(prisma.sprint.findMany).toHaveBeenCalledTimes(2);
    });
  });
});
