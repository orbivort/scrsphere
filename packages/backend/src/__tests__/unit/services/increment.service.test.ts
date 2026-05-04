import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock modules with factory functions (hoisted, so no external variables allowed)
vi.mock('../../../utils/prisma', () => ({
  default: {
    increment: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    incrementPBI: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    sprint: {
      findUnique: vi.fn(),
    },
    sprintReview: {
      findUnique: vi.fn(),
    },
    doDChecklistVerification: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('test-uuid'),
}));

// Now import the service and other dependencies
import { incrementService } from '../../../services/increment.service';
import prisma from '../../../utils/prisma';
import { NotFoundError, BadRequestError } from '../../../utils/errors';

describe('IncrementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getIncrements', () => {
    it('should return increments for a team', async () => {
      const teamId = 'test-team-id';
      const mockIncrements = [
        {
          id: 'increment-1',
          name: 'Increment 1',
          teamId,
          sprintId: 'sprint-1',
          status: 'DRAFT',
          sprint: { id: 'sprint-1', name: 'Sprint 1', status: 'ACTIVE' },
          pbis: [
            {
              pbiId: 'pbi-1',
              pbi: { id: 'pbi-1', title: 'PBI 1', storyPoints: 5, status: 'DONE', labels: [] },
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(prisma.increment.findMany).mockResolvedValue(mockIncrements as any);

      const result = await incrementService.getIncrements(teamId);

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toBe('Increment 1');
      expect(result[0]!.includedPBIs).toEqual(['pbi-1']);
      expect(prisma.increment.findMany).toHaveBeenCalledWith({
        where: { teamId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter by sprintId when provided', async () => {
      const teamId = 'test-team-id';
      const sprintId = 'sprint-1';

      vi.mocked(prisma.increment.findMany).mockResolvedValue([]);

      await incrementService.getIncrements(teamId, sprintId);

      expect(prisma.increment.findMany).toHaveBeenCalledWith({
        where: { teamId, sprintId },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getIncrementById', () => {
    it('should return increment by ID', async () => {
      const incrementId = 'increment-1';
      const mockIncrement = {
        id: incrementId,
        name: 'Increment 1',
        teamId: 'team-id',
        sprintId: 'sprint-1',
        status: 'DRAFT',
        totalStoryPoints: 10,
        sprint: { id: 'sprint-1', name: 'Sprint 1', status: 'ACTIVE' },
        pbis: [
          {
            pbiId: 'pbi-1',
            pbi: { id: 'pbi-1', title: 'PBI 1', storyPoints: 5, status: 'DONE', labels: [] },
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.increment.findUnique).mockResolvedValue(mockIncrement as any);
      vi.mocked(prisma.doDChecklistVerification.findMany).mockResolvedValue([]);

      const result = await incrementService.getIncrementById(incrementId);

      expect(result.id).toBe(incrementId);
      expect(result.includedPBIs).toEqual(['pbi-1']);
      expect(result.dodVerifications).toEqual([]);
    });

    it('should throw NotFoundError when increment does not exist', async () => {
      const incrementId = 'non-existent-id';

      vi.mocked(prisma.increment.findUnique).mockResolvedValue(null as any);

      await expect(incrementService.getIncrementById(incrementId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('createIncrement', () => {
    it('should create a new increment', async () => {
      const userId = 'test-user-id';
      const mockSprint = {
        id: 'sprint-1',
        name: 'Sprint 1',
        status: 'ACTIVE',
      };
      const mockIncrement = {
        id: 'increment-1',
        name: 'New Increment',
        description: 'Description',
        sprintId: 'sprint-1',
        teamId: 'team-id',
        totalStoryPoints: 10,
        status: 'DRAFT',
        sprint: mockSprint,
        pbis: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      vi.mocked(prisma.increment.create).mockResolvedValue({ id: 'test-uuid' } as any);
      vi.mocked(prisma.increment.findUnique).mockResolvedValue(mockIncrement as any);
      vi.mocked(prisma.doDChecklistVerification.findMany).mockResolvedValue([]);

      const result = await incrementService.createIncrement(userId, {
        name: 'New Increment',
        description: 'Description',
        sprintId: 'sprint-1',
        teamId: 'team-id',
        includedPBIs: ['pbi-1', 'pbi-2'],
        totalStoryPoints: 10,
      });

      expect(result.name).toBe('New Increment');
      expect(prisma.increment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id: 'test-uuid',
          name: 'New Increment',
          description: 'Description',
          sprintId: 'sprint-1',
          teamId: 'team-id',
          totalStoryPoints: 10,
          status: 'DRAFT',
          createdBy: userId,
        }),
      });
      expect(prisma.incrementPBI.createMany).toHaveBeenCalledWith({
        data: [
          { id: 'test-uuid', incrementId: 'test-uuid', pbiId: 'pbi-1' },
          { id: 'test-uuid', incrementId: 'test-uuid', pbiId: 'pbi-2' },
        ],
      });
    });

    it('should throw NotFoundError when sprint does not exist', async () => {
      const userId = 'test-user-id';

      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(null as any);

      await expect(
        incrementService.createIncrement(userId, {
          name: 'New Increment',
          sprintId: 'non-existent-sprint',
          teamId: 'team-id',
          includedPBIs: [],
          totalStoryPoints: 10,
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should use provided status when specified', async () => {
      const userId = 'test-user-id';
      const mockSprint = { id: 'sprint-1', name: 'Sprint 1', status: 'ACTIVE' };
      const mockIncrement = {
        id: 'increment-1',
        name: 'New Increment',
        status: 'READY',
        sprint: mockSprint,
        pbis: [],
      };

      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      vi.mocked(prisma.increment.create).mockResolvedValue({ id: 'test-uuid' } as any);
      vi.mocked(prisma.increment.findUnique).mockResolvedValue(mockIncrement as any);
      vi.mocked(prisma.doDChecklistVerification.findMany).mockResolvedValue([]);

      await incrementService.createIncrement(userId, {
        name: 'New Increment',
        sprintId: 'sprint-1',
        teamId: 'team-id',
        includedPBIs: [],
        totalStoryPoints: 10,
        status: 'READY',
      });

      expect(prisma.increment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          status: 'READY',
        }),
      });
    });
  });

  describe('updateIncrement', () => {
    it('should update an increment', async () => {
      const incrementId = 'increment-1';
      const existingIncrement = {
        id: incrementId,
        name: 'Old Name',
        status: 'DRAFT',
      };
      const updatedIncrement = {
        id: incrementId,
        name: 'New Name',
        description: 'New Description',
        status: 'DRAFT',
        sprint: { id: 'sprint-1', name: 'Sprint 1', status: 'ACTIVE' },
        pbis: [],
      };

      vi.mocked(prisma.increment.findUnique).mockResolvedValue(existingIncrement as any);
      vi.mocked(prisma.increment.update).mockResolvedValue({} as any);
      vi.mocked(prisma.incrementPBI.deleteMany).mockResolvedValue({ count: 0 } as any);
      vi.mocked(prisma.incrementPBI.createMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(prisma.doDChecklistVerification.findMany).mockResolvedValue([]);

      // Mock getIncrementById call at the end
      const mockGetById = vi.spyOn(incrementService, 'getIncrementById');
      mockGetById.mockResolvedValue(updatedIncrement as any);

      const result = await incrementService.updateIncrement(incrementId, {
        name: 'New Name',
        description: 'New Description',
        includedPBIs: ['pbi-3'],
        totalStoryPoints: 15,
      });

      expect(result.name).toBe('New Name');
      expect(prisma.increment.update).toHaveBeenCalledWith({
        where: { id: incrementId },
        data: {
          name: 'New Name',
          description: 'New Description',
          totalStoryPoints: 15,
        },
      });

      mockGetById.mockRestore();
    });

    it('should throw NotFoundError when increment does not exist', async () => {
      const incrementId = 'non-existent-id';

      vi.mocked(prisma.increment.findUnique).mockResolvedValue(null as any);

      await expect(
        incrementService.updateIncrement(incrementId, { name: 'New Name' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError when increment is already delivered', async () => {
      const incrementId = 'increment-1';
      const existingIncrement = {
        id: incrementId,
        name: 'Increment 1',
        status: 'DELIVERED',
      };

      vi.mocked(prisma.increment.findUnique).mockResolvedValue(existingIncrement as any);

      await expect(
        incrementService.updateIncrement(incrementId, { name: 'New Name' })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deliverIncrement', () => {
    it('should deliver an increment', async () => {
      const incrementId = 'increment-1';
      const userId = 'user-123';
      const existingIncrement = {
        id: incrementId,
        name: 'Increment 1',
        status: 'READY',
        sprintId: 'sprint-1',
        teamId: 'team-1',
      };
      const deliveredIncrement = {
        id: incrementId,
        name: 'Increment 1',
        status: 'DELIVERED',
        deliveredAt: new Date(),
        deliveryMethod: 'SPRINT_REVIEW',
        sprint: { id: 'sprint-1', name: 'Sprint 1', status: 'ACTIVE' },
        pbis: [],
      };

      vi.mocked(prisma.increment.findUnique).mockResolvedValue(existingIncrement as any);
      vi.mocked(prisma.increment.update).mockResolvedValue({} as any);
      vi.mocked(prisma.sprintReview.findUnique).mockResolvedValue(null as any);

      const mockGetById = vi.spyOn(incrementService, 'getIncrementById');
      mockGetById.mockResolvedValue(deliveredIncrement as any);

      const result = await incrementService.deliverIncrement(
        incrementId,
        'sprint_review',
        'Delivery notes',
        userId
      );

      expect(result.status).toBe('DELIVERED');
      expect(prisma.increment.update).toHaveBeenCalledWith({
        where: { id: incrementId },
        data: {
          status: 'DELIVERED',
          deliveredAt: expect.any(Date),
          deliveryMethod: 'SPRINT_REVIEW',
          notes: 'Delivery notes',
        },
      });

      mockGetById.mockRestore();
    });

    it('should auto-create sprint review when delivering via sprint_review', async () => {
      const incrementId = 'increment-1';
      const userId = 'user-123';
      const existingIncrement = {
        id: incrementId,
        name: 'Increment 1',
        status: 'READY',
        sprintId: 'sprint-1',
        teamId: 'team-1',
      };
      const deliveredIncrement = {
        id: incrementId,
        name: 'Increment 1',
        status: 'DELIVERED',
        deliveredAt: new Date(),
        deliveryMethod: 'SPRINT_REVIEW',
        sprint: { id: 'sprint-1', name: 'Sprint 1', status: 'ACTIVE' },
        pbis: [],
      };

      vi.mocked(prisma.increment.findUnique).mockResolvedValue(existingIncrement as any);
      vi.mocked(prisma.increment.update).mockResolvedValue({} as any);
      vi.mocked(prisma.sprintReview.findUnique).mockResolvedValue(null as any);

      const mockGetById = vi.spyOn(incrementService, 'getIncrementById');
      mockGetById.mockResolvedValue(deliveredIncrement as any);

      await incrementService.deliverIncrement(incrementId, 'sprint_review', undefined, userId);

      expect(prisma.sprintReview.findUnique).toHaveBeenCalledWith({
        where: { sprintId: 'sprint-1' },
      });

      mockGetById.mockRestore();
    });

    it('should not auto-create sprint review for early_release delivery', async () => {
      const incrementId = 'increment-1';
      const userId = 'user-123';
      const existingIncrement = {
        id: incrementId,
        name: 'Increment 1',
        status: 'READY',
        sprintId: 'sprint-1',
        teamId: 'team-1',
      };
      const deliveredIncrement = {
        id: incrementId,
        name: 'Increment 1',
        status: 'DELIVERED',
        deliveredAt: new Date(),
        deliveryMethod: 'EARLY_RELEASE',
        sprint: { id: 'sprint-1', name: 'Sprint 1', status: 'ACTIVE' },
        pbis: [],
      };

      vi.mocked(prisma.increment.findUnique).mockResolvedValue(existingIncrement as any);
      vi.mocked(prisma.increment.update).mockResolvedValue({} as any);

      const mockGetById = vi.spyOn(incrementService, 'getIncrementById');
      mockGetById.mockResolvedValue(deliveredIncrement as any);

      await incrementService.deliverIncrement(incrementId, 'early_release', undefined, userId);

      expect(prisma.sprintReview.findUnique).not.toHaveBeenCalled();

      mockGetById.mockRestore();
    });

    it('should throw NotFoundError when increment does not exist', async () => {
      const incrementId = 'non-existent-id';

      vi.mocked(prisma.increment.findUnique).mockResolvedValue(null as any);

      await expect(incrementService.deliverIncrement(incrementId, 'sprint_review')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw BadRequestError when increment is already delivered', async () => {
      const incrementId = 'increment-1';
      const existingIncrement = {
        id: incrementId,
        name: 'Increment 1',
        status: 'DELIVERED',
      };

      vi.mocked(prisma.increment.findUnique).mockResolvedValue(existingIncrement as any);

      await expect(incrementService.deliverIncrement(incrementId, 'sprint_review')).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe('getIncrementMetrics', () => {
    it('should return metrics for team increments', async () => {
      const teamId = 'test-team-id';
      const mockIncrements = [
        {
          status: 'DELIVERED',
          totalStoryPoints: 10,
          deliveryMethod: 'EARLY_RELEASE',
          createdAt: new Date('2024-01-01'),
          deliveredAt: new Date('2024-01-05'),
        },
        {
          status: 'DELIVERED',
          totalStoryPoints: 20,
          deliveryMethod: 'SPRINT_REVIEW',
          createdAt: new Date('2024-01-10'),
          deliveredAt: new Date('2024-01-15'),
        },
        {
          status: 'DRAFT',
          totalStoryPoints: 15,
          deliveryMethod: null,
          createdAt: new Date(),
          deliveredAt: null,
        },
      ];

      vi.mocked(prisma.increment.findMany).mockResolvedValue(mockIncrements as any);

      const result = await incrementService.getIncrementMetrics(teamId);

      expect(result.totalIncrements).toBe(3);
      expect(result.deliveredIncrements).toBe(2);
      expect(result.earlyReleases).toBe(1);
      expect(result.sprintReviewDeliveries).toBe(1);
      expect(result.averageStoryPoints).toBe(15); // (10+20+15)/3
      expect(result.averageDeliveryTime).toBeGreaterThan(0);
    });

    it('should return zero metrics when no increments exist', async () => {
      const teamId = 'test-team-id';

      vi.mocked(prisma.increment.findMany).mockResolvedValue([]);

      const result = await incrementService.getIncrementMetrics(teamId);

      expect(result.totalIncrements).toBe(0);
      expect(result.deliveredIncrements).toBe(0);
      expect(result.averageStoryPoints).toBe(0);
      expect(result.averageDeliveryTime).toBe(0);
    });
  });
});
