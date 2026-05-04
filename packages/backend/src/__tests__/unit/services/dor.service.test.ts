import { describe, it, expect, vi, beforeEach } from 'vitest';
import { definitionOfReadyService } from '../../../services/dor.service';
import prisma from '../../../utils/prisma';
import { NotFoundError, BadRequestError } from '../../../utils/errors';

vi.mock('../../../utils/prisma', () => ({
  default: {
    definitionOfReady: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    doRItem: {
      deleteMany: vi.fn(),
    },
    doRChecklistVerification: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    productBacklogItem: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('mock-uuid-v7'),
}));

describe('DefinitionOfReadyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDefinitionOfReady', () => {
    it('should return DoR with items for a team', async () => {
      const mockDoR = {
        id: 'dor-1',
        teamId: 'team-1',
        version: 1,
        items: [
          {
            id: 'item-1',
            description: 'Clear title and description',
            category: 'documentation',
            isActive: true,
            order: 0,
          },
          {
            id: 'item-2',
            description: 'Acceptance criteria defined',
            category: 'documentation',
            isActive: true,
            order: 1,
          },
        ],
      };

      vi.mocked(prisma.definitionOfReady.findUnique).mockResolvedValue(mockDoR as any);

      const result = await definitionOfReadyService.getDefinitionOfReady('team-1');

      expect(prisma.definitionOfReady.findUnique).toHaveBeenCalledWith({
        where: { teamId: 'team-1' },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      });
      expect(result).toEqual(mockDoR);
    });

    it('should return null when DoR does not exist', async () => {
      vi.mocked(prisma.definitionOfReady.findUnique).mockResolvedValue(null as any);

      const result = await definitionOfReadyService.getDefinitionOfReady('team-1');

      expect(result).toBeNull();
    });
  });

  describe('createDefaultDefinitionOfReady', () => {
    it('should create default DoR with predefined items', async () => {
      const mockDoR = {
        id: 'dor-1',
        teamId: 'team-1',
        version: 1,
        createdBy: 'user-1',
        items: [
          {
            id: 'item-1',
            description: 'Clear title and description provided',
            category: 'documentation',
            isActive: true,
            order: 0,
          },
          {
            id: 'item-2',
            description: 'Acceptance criteria defined and agreed',
            category: 'documentation',
            isActive: true,
            order: 1,
          },
          {
            id: 'item-3',
            description: 'Story points estimated by the team',
            category: 'estimation',
            isActive: true,
            order: 2,
          },
          {
            id: 'item-4',
            description: 'Business value assigned',
            category: 'estimation',
            isActive: true,
            order: 3,
          },
          {
            id: 'item-5',
            description: 'Dependencies identified and documented',
            category: 'dependencies',
            isActive: true,
            order: 4,
          },
          {
            id: 'item-6',
            description: 'No blockers or impediments',
            category: 'dependencies',
            isActive: true,
            order: 5,
          },
        ],
      };

      vi.mocked(prisma.definitionOfReady.create).mockResolvedValue(mockDoR as any);

      const result = await definitionOfReadyService.createDefaultDefinitionOfReady(
        'team-1',
        'user-1'
      );

      expect(prisma.definitionOfReady.create).toHaveBeenCalledWith({
        data: {
          id: 'mock-uuid-v7',
          teamId: 'team-1',
          version: 1,
          createdBy: 'user-1',
          items: {
            create: [
              {
                id: 'mock-uuid-v7',
                description: 'Clear title and description provided',
                category: 'documentation',
                isActive: true,
                order: 0,
                createdBy: 'user-1',
              },
              {
                id: 'mock-uuid-v7',
                description: 'Acceptance criteria defined and agreed',
                category: 'documentation',
                isActive: true,
                order: 1,
                createdBy: 'user-1',
              },
              {
                id: 'mock-uuid-v7',
                description: 'Story points estimated by the team',
                category: 'estimation',
                isActive: true,
                order: 2,
                createdBy: 'user-1',
              },
              {
                id: 'mock-uuid-v7',
                description: 'Business value assigned',
                category: 'estimation',
                isActive: true,
                order: 3,
                createdBy: 'user-1',
              },
              {
                id: 'mock-uuid-v7',
                description: 'Dependencies identified and documented',
                category: 'dependencies',
                isActive: true,
                order: 4,
                createdBy: 'user-1',
              },
              {
                id: 'mock-uuid-v7',
                description: 'No blockers or impediments',
                category: 'dependencies',
                isActive: true,
                order: 5,
                createdBy: 'user-1',
              },
            ],
          },
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      });
      expect(result).toEqual(mockDoR);
    });

    it('should create default DoR without userId', async () => {
      const mockDoR = {
        id: 'dor-1',
        teamId: 'team-1',
        version: 1,
        createdBy: null,
        items: [],
      };

      vi.mocked(prisma.definitionOfReady.create).mockResolvedValue(mockDoR as any);

      await definitionOfReadyService.createDefaultDefinitionOfReady('team-1');

      expect(prisma.definitionOfReady.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            teamId: 'team-1',
            createdBy: undefined,
          }),
        })
      );
    });
  });

  describe('updateDefinitionOfReady', () => {
    it('should update existing DoR with new items', async () => {
      const existingDoR = {
        id: 'dor-1',
        teamId: 'team-1',
        version: 1,
      };

      const updatedDoR = {
        id: 'dor-1',
        teamId: 'team-1',
        version: 2,
        updatedBy: 'user-1',
        items: [
          {
            id: 'new-item-1',
            description: 'New item 1',
            category: 'documentation',
            isActive: true,
            order: 0,
          },
        ],
      };

      vi.mocked(prisma.definitionOfReady.findUnique).mockResolvedValue(existingDoR as any);
      vi.mocked(prisma.doRItem.deleteMany).mockResolvedValue({ count: 6 });
      vi.mocked(prisma.definitionOfReady.update).mockResolvedValue(updatedDoR as any);

      const items = [
        { description: 'New item 1', category: 'documentation', isActive: true, order: 0 },
      ];

      const result = await definitionOfReadyService.updateDefinitionOfReady(
        'team-1',
        items,
        'user-1'
      );

      expect(prisma.doRItem.deleteMany).toHaveBeenCalledWith({
        where: { dorId: 'dor-1' },
      });
      expect(prisma.definitionOfReady.update).toHaveBeenCalledWith({
        where: { id: 'dor-1' },
        data: {
          version: { increment: 1 },
          updatedBy: 'user-1',
          items: {
            create: [
              {
                id: 'mock-uuid-v7',
                description: 'New item 1',
                category: 'documentation',
                isActive: true,
                order: 0,
                createdBy: 'user-1',
              },
            ],
          },
        },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      });
      expect(result).toEqual(updatedDoR);
    });

    it('should create default DoR if not exists and then update', async () => {
      const defaultDoR = {
        id: 'dor-1',
        teamId: 'team-1',
        version: 1,
        items: [],
      };

      const updatedDoR = {
        id: 'dor-1',
        teamId: 'team-1',
        version: 2,
        items: [
          {
            id: 'new-item-1',
            description: 'Custom item',
            category: 'documentation',
            isActive: true,
            order: 0,
          },
        ],
      };

      vi.mocked(prisma.definitionOfReady.findUnique)
        .mockResolvedValueOnce(null as any)
        .mockResolvedValueOnce(defaultDoR as any);
      vi.mocked(prisma.definitionOfReady.create).mockResolvedValue(defaultDoR as any);
      vi.mocked(prisma.doRItem.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.definitionOfReady.update).mockResolvedValue(updatedDoR as any);

      const items = [
        { description: 'Custom item', category: 'documentation', isActive: true, order: 0 },
      ];

      const result = await definitionOfReadyService.updateDefinitionOfReady(
        'team-1',
        items,
        'user-1'
      );

      expect(prisma.definitionOfReady.create).toHaveBeenCalled();
      expect(result).toEqual(updatedDoR);
    });
  });

  describe('getDoRItems', () => {
    it('should return items for existing DoR', async () => {
      const mockDoR = {
        id: 'dor-1',
        teamId: 'team-1',
        items: [
          {
            id: 'item-1',
            description: 'Item 1',
            category: 'documentation',
            isActive: true,
            order: 0,
          },
        ],
      };

      vi.mocked(prisma.definitionOfReady.findUnique).mockResolvedValue(mockDoR as any);

      const result = await definitionOfReadyService.getDoRItems('team-1');

      expect(result).toEqual(mockDoR.items);
    });

    it('should return empty array when DoR does not exist', async () => {
      vi.mocked(prisma.definitionOfReady.findUnique).mockResolvedValue(null as any);

      const result = await definitionOfReadyService.getDoRItems('team-1');

      expect(result).toEqual([]);
    });
  });

  describe('verifyDoRForPBI', () => {
    it('should create new verifications for PBI', async () => {
      const mockPBI = {
        id: 'pbi-1',
        teamId: 'team-1',
        team: { id: 'team-1', name: 'Team 1' },
      };

      const mockDoR = {
        id: 'dor-1',
        teamId: 'team-1',
        items: [
          { id: 'item-1', description: 'Clear title', category: 'documentation' },
          { id: 'item-2', description: 'Acceptance criteria', category: 'documentation' },
        ],
      };

      const mockVerification = {
        id: 'ver-1',
        pbiId: 'pbi-1',
        dorItemId: 'item-1',
        isVerified: true,
        verifiedBy: 'user-1',
        notes: 'Ready',
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(mockPBI as any);
      vi.mocked(prisma.definitionOfReady.findUnique).mockResolvedValue(mockDoR as any);
      vi.mocked(prisma.doRChecklistVerification.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.doRChecklistVerification.create).mockResolvedValue(mockVerification as any);

      const verifications = [{ dorItemId: 'item-1', isVerified: true, notes: 'Ready' }];

      const result = await definitionOfReadyService.verifyDoRForPBI(
        'pbi-1',
        'user-1',
        verifications
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockVerification);
    });

    it('should update existing verifications for PBI', async () => {
      const mockPBI = {
        id: 'pbi-1',
        teamId: 'team-1',
        team: { id: 'team-1', name: 'Team 1' },
      };

      const mockDoR = {
        id: 'dor-1',
        teamId: 'team-1',
        items: [{ id: 'item-1', description: 'Clear title', category: 'documentation' }],
      };

      const existingVerification = {
        id: 'ver-1',
        pbiId: 'pbi-1',
        dorItemId: 'item-1',
        isVerified: false,
      };

      const updatedVerification = {
        id: 'ver-1',
        pbiId: 'pbi-1',
        dorItemId: 'item-1',
        isVerified: true,
        verifiedBy: 'user-1',
        notes: 'Now ready',
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(mockPBI as any);
      vi.mocked(prisma.definitionOfReady.findUnique).mockResolvedValue(mockDoR as any);
      vi.mocked(prisma.doRChecklistVerification.findUnique).mockResolvedValue(
        existingVerification as any
      );
      vi.mocked(prisma.doRChecklistVerification.update).mockResolvedValue(
        updatedVerification as any
      );

      const verifications = [{ dorItemId: 'item-1', isVerified: true, notes: 'Now ready' }];

      const result = await definitionOfReadyService.verifyDoRForPBI(
        'pbi-1',
        'user-1',
        verifications
      );

      expect(prisma.doRChecklistVerification.update).toHaveBeenCalledWith({
        where: { id: 'ver-1' },
        data: {
          isVerified: true,
          verifiedBy: 'user-1',
          verifiedAt: expect.any(Date),
          notes: 'Now ready',
          updatedBy: 'user-1',
        },
      });
      expect(result[0]).toEqual(updatedVerification);
    });

    it('should throw NotFoundError when PBI does not exist', async () => {
      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(null as any);

      await expect(definitionOfReadyService.verifyDoRForPBI('pbi-1', 'user-1', [])).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw NotFoundError when DoR does not exist', async () => {
      const mockPBI = {
        id: 'pbi-1',
        teamId: 'team-1',
        team: { id: 'team-1', name: 'Team 1' },
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(mockPBI as any);
      vi.mocked(prisma.definitionOfReady.findUnique).mockResolvedValue(null as any);

      await expect(definitionOfReadyService.verifyDoRForPBI('pbi-1', 'user-1', [])).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw BadRequestError for invalid DoR item IDs', async () => {
      const mockPBI = {
        id: 'pbi-1',
        teamId: 'team-1',
        team: { id: 'team-1', name: 'Team 1' },
      };

      const mockDoR = {
        id: 'dor-1',
        teamId: 'team-1',
        items: [{ id: 'item-1', description: 'Clear title', category: 'documentation' }],
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(mockPBI as any);
      vi.mocked(prisma.definitionOfReady.findUnique).mockResolvedValue(mockDoR as any);

      const verifications = [{ dorItemId: 'invalid-item', isVerified: true }];

      await expect(
        definitionOfReadyService.verifyDoRForPBI('pbi-1', 'user-1', verifications)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getDoRVerificationsForPBI', () => {
    it('should return verifications with item details for PBI', async () => {
      const mockVerifications = [
        {
          id: 'ver-1',
          pbiId: 'pbi-1',
          dorItemId: 'item-1',
          isVerified: true,
          dorItem: {
            id: 'item-1',
            description: 'Clear title',
            category: 'documentation',
          },
        },
      ];

      vi.mocked(prisma.doRChecklistVerification.findMany).mockResolvedValue(
        mockVerifications as any
      );

      const result = await definitionOfReadyService.getDoRVerificationsForPBI('pbi-1');

      expect(prisma.doRChecklistVerification.findMany).toHaveBeenCalledWith({
        where: { pbiId: 'pbi-1' },
        include: {
          dorItem: {
            select: {
              id: true,
              description: true,
              category: true,
            },
          },
        },
      });
      expect(result).toEqual(mockVerifications);
    });

    it('should return empty array when no verifications exist', async () => {
      vi.mocked(prisma.doRChecklistVerification.findMany).mockResolvedValue([]);

      const result = await definitionOfReadyService.getDoRVerificationsForPBI('pbi-1');

      expect(result).toEqual([]);
    });
  });
});
