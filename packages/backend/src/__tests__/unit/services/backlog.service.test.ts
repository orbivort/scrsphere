import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock modules with factory functions (hoisted, so no external variables allowed)
vi.mock('../../../utils/prisma', () => ({
  default: {
    productBacklogItem: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    teamMember: {
      findFirst: vi.fn(),
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

vi.mock('../../../services/workflow.service', () => ({
  workflowService: {
    validateTransition: vi.fn().mockResolvedValue({ isValid: true, allowed: true }),
    executeStatusChange: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('test-pbi-uuid'),
}));

// Now import the service and other dependencies
import { productBacklogService } from '../../../services/backlog.service';
import prisma from '../../../utils/prisma';
import { workflowService } from '../../../services/workflow.service';
import { NotFoundError } from '../../../utils/errors';

describe('ProductBacklogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProductBacklog', () => {
    it('should return paginated backlog items for a team', async () => {
      const teamId = 'test-team-id';
      const mockPBI = {
        id: 'pbi-id',
        teamId,
        title: 'Test PBI',
        description: 'Test description',
        status: 'NEW',
        priority: 'COULD_HAVE',
        storyPoints: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.productBacklogItem.findMany).mockResolvedValue([mockPBI] as any);
      vi.mocked(prisma.productBacklogItem.count).mockResolvedValue(1 as any);

      const result = await productBacklogService.getProductBacklog(teamId, { page: 1, limit: 20 });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter by status', async () => {
      const teamId = 'test-team-id';
      const mockPBI = {
        id: 'pbi-id',
        teamId,
        title: 'Test PBI',
        status: 'DONE',
        priority: 'MUST_HAVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.productBacklogItem.findMany).mockResolvedValue([mockPBI] as any);
      vi.mocked(prisma.productBacklogItem.count).mockResolvedValue(1 as any);

      const result = await productBacklogService.getProductBacklog(teamId, { status: 'DONE' });

      expect(result.data[0]!.status).toBe('DONE');
      expect(prisma.productBacklogItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ teamId, status: 'DONE' }),
        })
      );
    });

    it('should filter by labels', async () => {
      const teamId = 'test-team-id';
      const mockPBI = {
        id: 'pbi-id',
        teamId,
        title: 'Test PBI',
        status: 'NEW',
        labels: ['feature', 'high-priority'],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.productBacklogItem.findMany).mockResolvedValue([mockPBI] as any);
      vi.mocked(prisma.productBacklogItem.count).mockResolvedValue(1 as any);

      await productBacklogService.getProductBacklog(teamId, { labels: 'feature' });

      expect(prisma.productBacklogItem.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            teamId,
            labels: { hasSome: ['feature'] },
          }),
        })
      );
    });

    it('should handle empty backlog', async () => {
      const teamId = 'test-team-id';

      vi.mocked(prisma.productBacklogItem.findMany).mockResolvedValue([]);
      vi.mocked(prisma.productBacklogItem.count).mockResolvedValue(0 as any);

      const result = await productBacklogService.getProductBacklog(teamId);

      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('getPBIById', () => {
    it('should return PBI by ID', async () => {
      const mockPBI = {
        id: 'pbi-id',
        teamId: 'team-id',
        title: 'Test PBI',
        description: 'Test description',
        status: 'NEW',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(mockPBI as any);

      const result = await productBacklogService.getPBIById(mockPBI.id);

      expect(result.id).toBe(mockPBI.id);
      expect(result.title).toBe(mockPBI.title);
    });

    it('should throw NotFoundError for non-existent PBI', async () => {
      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(null as any);

      await expect(productBacklogService.getPBIById('non-existent-id')).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('createPBI', () => {
    it('should create a new PBI successfully', async () => {
      const userId = 'test-user-id';
      const mockPBI = {
        id: 'test-pbi-uuid',
        teamId: 'team-id',
        title: 'New PBI',
        description: 'Description',
        status: 'NEW',
        priority: 'COULD_HAVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.productBacklogItem.create).mockResolvedValue(mockPBI as any);

      const result = await productBacklogService.createPBI(userId, {
        teamId: mockPBI.teamId,
        title: mockPBI.title,
        description: mockPBI.description,
      });

      expect(result.title).toBe(mockPBI.title);
      expect(result.teamId).toBe(mockPBI.teamId);
      expect(workflowService.executeStatusChange).toHaveBeenCalled();
    });

    it('should use default status NEW when not provided', async () => {
      const userId = 'test-user-id';
      const mockPBI = {
        id: 'test-pbi-uuid',
        teamId: 'team-id',
        title: 'New PBI',
        status: 'NEW',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.productBacklogItem.create).mockResolvedValue(mockPBI as any);

      await productBacklogService.createPBI(userId, {
        teamId: mockPBI.teamId,
        title: mockPBI.title,
      });

      expect(prisma.productBacklogItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'NEW' }),
        })
      );
    });

    it('should use provided status when specified', async () => {
      const userId = 'test-user-id';
      const mockPBI = {
        id: 'test-pbi-uuid',
        teamId: 'team-id',
        title: 'New PBI',
        status: 'REFINED',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.productBacklogItem.create).mockResolvedValue(mockPBI as any);

      await productBacklogService.createPBI(userId, {
        teamId: mockPBI.teamId,
        title: mockPBI.title,
        status: 'REFINED',
      });

      expect(prisma.productBacklogItem.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'REFINED' }),
        })
      );
    });
  });

  describe('updatePBI', () => {
    it('should update PBI successfully', async () => {
      const userId = 'test-user-id';
      const pbiId = 'pbi-id';
      const mockPBI = {
        id: pbiId,
        teamId: 'team-id',
        title: 'Original Title',
        status: 'NEW',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedPBI = {
        ...mockPBI,
        title: 'Updated Title',
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(mockPBI as any);
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
        id: 'member-id',
        teamId: mockPBI.teamId,
        userId,
        role: 'PRODUCT_OWNER',
      } as any);
      vi.mocked(prisma.productBacklogItem.update).mockResolvedValue(updatedPBI as any);

      const result = await productBacklogService.updatePBI(pbiId, userId, {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw NotFoundError for non-existent PBI', async () => {
      const userId = 'test-user-id';

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(null as any);

      await expect(
        productBacklogService.updatePBI('non-existent-id', userId, { title: 'New Title' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should update PBI status', async () => {
      const userId = 'test-user-id';
      const pbiId = 'pbi-id';
      const mockPBI = {
        id: pbiId,
        teamId: 'team-id',
        title: 'Test PBI',
        status: 'NEW',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedPBI = {
        ...mockPBI,
        status: 'REFINED',
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(mockPBI as any);
      vi.mocked(prisma.teamMember.findFirst).mockResolvedValue({
        id: 'member-id',
        teamId: mockPBI.teamId,
        userId,
        role: 'PRODUCT_OWNER',
      } as any);
      vi.mocked(prisma.productBacklogItem.update).mockResolvedValue(updatedPBI as any);

      const result = await productBacklogService.updatePBI(pbiId, userId, {
        status: 'REFINED',
      });

      expect(result.status).toBe('REFINED');
    });
  });

  describe('updatePriority', () => {
    it('should update PBI priority', async () => {
      const pbiId = 'pbi-id';
      const mockPBI = {
        id: pbiId,
        teamId: 'team-id',
        title: 'Test PBI',
        priority: 'COULD_HAVE',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedPBI = {
        ...mockPBI,
        priority: 'MUST_HAVE',
      };

      vi.mocked(prisma.productBacklogItem.update).mockResolvedValue(updatedPBI as any);

      const result = await productBacklogService.updatePriority(pbiId, 'MUST_HAVE');

      expect(result.priority).toBe('MUST_HAVE');
    });
  });

  describe('deletePBI', () => {
    it('should delete PBI successfully', async () => {
      const userId = 'test-user-id';
      const pbiId = 'pbi-id';
      const mockPBI = {
        id: pbiId,
        teamId: 'team-id',
        title: 'Test PBI',
        status: 'NEW',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(mockPBI as any);
      vi.mocked(prisma.productBacklogItem.delete).mockResolvedValue(mockPBI as any);

      await expect(productBacklogService.deletePBI(pbiId, userId)).resolves.not.toThrow();
      expect(prisma.productBacklogItem.delete).toHaveBeenCalledWith({
        where: { id: pbiId },
      });
    });

    it('should throw NotFoundError for non-existent PBI', async () => {
      const userId = 'test-user-id';

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(null as any);

      await expect(productBacklogService.deletePBI('non-existent-id', userId)).rejects.toThrow(
        NotFoundError
      );
    });
  });
});
