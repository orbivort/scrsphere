import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../../utils/prisma', () => ({
  default: {
    sprint: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    sprintConfiguration: {
      findUnique: vi.fn(),
    },
    impediment: {
      findMany: vi.fn(),
    },
    sprintBacklogItem: {
      findMany: vi.fn(),
    },
    doDChecklistVerification: {
      findMany: vi.fn(),
    },
    productBacklogItem: {
      count: vi.fn(),
    },
    retroActionItem: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../../services/teamHealthCheck.service', () => ({
  teamHealthCheckService: {
    getLatestForTeam: vi.fn().mockResolvedValue(null),
  },
}));

import { smDashboardService } from '../../../services/smDashboard.service';
import prisma from '../../../utils/prisma';

describe('SMDashboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getImpedimentMetrics', () => {
    it('should aggregate impediment status counts and aging', async () => {
      const now = Date.now();
      const oldImpediment = {
        id: 'imp-1',
        title: 'Old Impediment',
        status: 'OPEN',
        createdAt: new Date(now - 20 * 24 * 60 * 60 * 1000),
        resolvedAt: null,
        sprint: { name: 'Sprint 1' },
      };
      const resolvedImpediment = {
        id: 'imp-2',
        title: 'Resolved',
        status: 'RESOLVED',
        createdAt: new Date(now - 10 * 24 * 60 * 60 * 1000),
        resolvedAt: new Date(now - 5 * 24 * 60 * 60 * 1000),
        sprint: { name: 'Sprint 1' },
      };

      vi.mocked(prisma.impediment.findMany).mockResolvedValue([
        oldImpediment,
        resolvedImpediment,
      ] as any);

      const result = await smDashboardService.getImpedimentMetrics('team-1');

      expect(result.total).toBe(2);
      expect(result.open).toBe(1);
      expect(result.resolved).toBe(1);
      expect(result.averageResolutionDays).toBe(5);
      expect(result.aging).toHaveLength(1);
      expect(result.aging[0]!.atRisk).toBe(true);
    });
  });

  describe('getEventCompliance', () => {
    it('should map sprint completion status', async () => {
      vi.mocked(prisma.sprint.findMany).mockResolvedValue([
        {
          id: 'sprint-1',
          name: 'Sprint 1',
          status: 'COMPLETED',
          startDate: new Date(),
          endDate: new Date(),
          sprintReview: { id: 'rev-1' },
          retrospective: { id: 'retro-1' },
          dailyUpdates: [{ id: 'd1' }, { id: 'd2' }],
          generatedSprint: null,
        },
      ] as any);
      vi.mocked(prisma.sprintConfiguration.findUnique).mockResolvedValue(null as any);

      const result = await smDashboardService.getEventCompliance('team-1', 1);

      expect(result).toHaveLength(1);
      expect(result[0]!.sprintPlanningCompleted).toBe(true);
      expect(result[0]!.sprintReviewCompleted).toBe(true);
      expect(result[0]!.retrospectiveCompleted).toBe(true);
    });
  });

  describe('getActionItemCompletion', () => {
    it('should compute completion rate', async () => {
      vi.mocked(prisma.retroActionItem.findMany).mockResolvedValue([
        { id: 'a1', title: 'A1', status: 'COMPLETED', dueDate: null, owner: null },
        { id: 'a2', title: 'A2', status: 'PENDING', dueDate: null, owner: null },
        { id: 'a3', title: 'A3', status: 'PENDING', dueDate: null, owner: null },
      ] as any);

      const result = await smDashboardService.getActionItemCompletion('team-1');

      expect(result.total).toBe(3);
      expect(result.completed).toBe(1);
      expect(result.completionRate).toBe(33);
      expect(result.pendingItems).toHaveLength(2);
    });
  });
});
