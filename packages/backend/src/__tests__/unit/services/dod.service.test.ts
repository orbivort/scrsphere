import { describe, it, expect, vi, beforeEach } from 'vitest';
import { definitionOfDoneService } from '../../../services/dod.service';
import prisma from '../../../utils/prisma';
import { NotFoundError, BadRequestError, InternalServerError } from '../../../utils/errors';

vi.mock('../../../utils/prisma', () => ({
  default: {
    definitionOfDone: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    doDItem: {
      deleteMany: vi.fn(),
    },
    doDChecklistVerification: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    productBacklogItem: {
      findUnique: vi.fn(),
    },
    sprint: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('mock-uuid-v7'),
}));

describe('DefinitionOfDoneService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDefinitionOfDone', () => {
    it('should return DoD with items for a team', async () => {
      const mockDoD = {
        id: 'dod-1',
        teamId: 'team-1',
        version: 1,
        items: [
          {
            id: 'item-1',
            description: 'Code reviewed',
            category: 'review',
            isActive: true,
            order: 0,
          },
          {
            id: 'item-2',
            description: 'Tests passing',
            category: 'testing',
            isActive: true,
            order: 1,
          },
        ],
      };

      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(mockDoD as any);

      const result = await definitionOfDoneService.getDefinitionOfDone('team-1');

      expect(prisma.definitionOfDone.findUnique).toHaveBeenCalledWith({
        where: { teamId: 'team-1' },
        include: {
          items: {
            orderBy: { order: 'asc' },
          },
        },
      });
      expect(result).toEqual(mockDoD);
    });

    it('should return null when DoD does not exist', async () => {
      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(null as any);

      const result = await definitionOfDoneService.getDefinitionOfDone('team-1');

      expect(result).toBeNull();
    });
  });

  describe('createDefaultDefinitionOfDone', () => {
    it('should create default DoD with predefined items', async () => {
      const mockDoD = {
        id: 'dod-1',
        teamId: 'team-1',
        version: 1,
        createdBy: 'user-1',
        items: [
          {
            id: 'item-1',
            description: 'Code is peer-reviewed and approved',
            category: 'review',
            isActive: true,
            order: 0,
          },
          {
            id: 'item-2',
            description: 'Unit tests written and passing (minimum 80% coverage)',
            category: 'testing',
            isActive: true,
            order: 1,
          },
          {
            id: 'item-3',
            description: 'Integration tests passing',
            category: 'testing',
            isActive: true,
            order: 2,
          },
          {
            id: 'item-4',
            description: 'Code is properly documented',
            category: 'documentation',
            isActive: true,
            order: 3,
          },
          {
            id: 'item-5',
            description: 'No critical or high-severity bugs',
            category: 'quality',
            isActive: true,
            order: 4,
          },
        ],
      };

      vi.mocked(prisma.definitionOfDone.create).mockResolvedValue(mockDoD as any);

      const result = await definitionOfDoneService.createDefaultDefinitionOfDone(
        'team-1',
        'user-1'
      );

      expect(prisma.definitionOfDone.create).toHaveBeenCalledWith({
        data: {
          id: 'mock-uuid-v7',
          teamId: 'team-1',
          version: 1,
          createdBy: 'user-1',
          items: {
            create: [
              {
                id: 'mock-uuid-v7',
                description: 'Code is peer-reviewed and approved',
                category: 'review',
                isActive: true,
                order: 0,
                createdBy: 'user-1',
              },
              {
                id: 'mock-uuid-v7',
                description: 'Unit tests written and passing (minimum 80% coverage)',
                category: 'testing',
                isActive: true,
                order: 1,
                createdBy: 'user-1',
              },
              {
                id: 'mock-uuid-v7',
                description: 'Integration tests passing',
                category: 'testing',
                isActive: true,
                order: 2,
                createdBy: 'user-1',
              },
              {
                id: 'mock-uuid-v7',
                description: 'Code is properly documented',
                category: 'documentation',
                isActive: true,
                order: 3,
                createdBy: 'user-1',
              },
              {
                id: 'mock-uuid-v7',
                description: 'No critical or high-severity bugs',
                category: 'quality',
                isActive: true,
                order: 4,
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
      expect(result).toEqual(mockDoD);
    });

    it('should create default DoD without userId', async () => {
      const mockDoD = {
        id: 'dod-1',
        teamId: 'team-1',
        version: 1,
        createdBy: null,
        items: [],
      };

      vi.mocked(prisma.definitionOfDone.create).mockResolvedValue(mockDoD as any);

      await definitionOfDoneService.createDefaultDefinitionOfDone('team-1');

      expect(prisma.definitionOfDone.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            teamId: 'team-1',
            createdBy: undefined,
          }),
        })
      );
    });
  });

  describe('updateDefinitionOfDone', () => {
    it('should update existing DoD with new items', async () => {
      const existingDoD = {
        id: 'dod-1',
        teamId: 'team-1',
        version: 1,
      };

      const updatedDoD = {
        id: 'dod-1',
        teamId: 'team-1',
        version: 2,
        updatedBy: 'user-1',
        items: [
          {
            id: 'new-item-1',
            description: 'New item 1',
            category: 'quality',
            isActive: true,
            order: 0,
          },
        ],
      };

      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(existingDoD as any);
      vi.mocked(prisma.doDItem.deleteMany).mockResolvedValue({ count: 5 });
      vi.mocked(prisma.definitionOfDone.update).mockResolvedValue(updatedDoD as any);

      const items = [{ description: 'New item 1', category: 'quality', isActive: true, order: 0 }];

      const result = await definitionOfDoneService.updateDefinitionOfDone(
        'team-1',
        items,
        'user-1'
      );

      expect(prisma.doDItem.deleteMany).toHaveBeenCalledWith({
        where: { dodId: 'dod-1' },
      });
      expect(prisma.definitionOfDone.update).toHaveBeenCalledWith({
        where: { id: 'dod-1' },
        data: {
          version: { increment: 1 },
          updatedBy: 'user-1',
          items: {
            create: [
              {
                id: 'mock-uuid-v7',
                description: 'New item 1',
                category: 'quality',
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
      expect(result).toEqual(updatedDoD);
    });

    it('should create default DoD if not exists and then update', async () => {
      const defaultDoD = {
        id: 'dod-1',
        teamId: 'team-1',
        version: 1,
        items: [],
      };

      const updatedDoD = {
        id: 'dod-1',
        teamId: 'team-1',
        version: 2,
        items: [
          {
            id: 'new-item-1',
            description: 'Custom item',
            category: 'quality',
            isActive: true,
            order: 0,
          },
        ],
      };

      vi.mocked(prisma.definitionOfDone.findUnique)
        .mockResolvedValueOnce(null as any)
        .mockResolvedValueOnce(defaultDoD as any);
      vi.mocked(prisma.definitionOfDone.create).mockResolvedValue(defaultDoD as any);
      vi.mocked(prisma.doDItem.deleteMany).mockResolvedValue({ count: 0 });
      vi.mocked(prisma.definitionOfDone.update).mockResolvedValue(updatedDoD as any);

      const items = [{ description: 'Custom item', category: 'quality', isActive: true, order: 0 }];

      const result = await definitionOfDoneService.updateDefinitionOfDone(
        'team-1',
        items,
        'user-1'
      );

      expect(prisma.definitionOfDone.create).toHaveBeenCalled();
      expect(result).toEqual(updatedDoD);
    });

    it('should use default category when item has no category', async () => {
      const existingDoD = {
        id: 'dod-1',
        teamId: 'team-1',
        version: 1,
      };

      const updatedDoD = {
        id: 'dod-1',
        teamId: 'team-1',
        version: 2,
        updatedBy: 'user-1',
        items: [
          {
            id: 'new-item-1',
            description: 'Item without category',
            category: 'quality',
            isActive: true,
            order: 0,
          },
        ],
      };

      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(existingDoD as any);
      vi.mocked(prisma.doDItem.deleteMany).mockResolvedValue({ count: 5 });
      vi.mocked(prisma.definitionOfDone.update).mockResolvedValue(updatedDoD as any);

      const items = [{ description: 'Item without category', isActive: true, order: 0 }];

      await definitionOfDoneService.updateDefinitionOfDone('team-1', items, 'user-1');

      expect(prisma.definitionOfDone.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({
                  description: 'Item without category',
                  category: 'quality',
                }),
              ]),
            }),
          }),
        })
      );
    });
  });

  describe('getDoDItems', () => {
    it('should return items for existing DoD', async () => {
      const mockDoD = {
        id: 'dod-1',
        teamId: 'team-1',
        items: [
          { id: 'item-1', description: 'Item 1', category: 'review', isActive: true, order: 0 },
        ],
      };

      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(mockDoD as any);

      const result = await definitionOfDoneService.getDoDItems('team-1');

      expect(result).toEqual(mockDoD.items);
    });

    it('should return empty array when DoD does not exist', async () => {
      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(null as any);

      const result = await definitionOfDoneService.getDoDItems('team-1');

      expect(result).toEqual([]);
    });
  });

  describe('verifyDoDForPBI', () => {
    it('should create new verifications for PBI', async () => {
      const mockPBI = {
        id: 'pbi-1',
        teamId: 'team-1',
        team: { id: 'team-1', name: 'Team 1' },
      };

      const mockDoD = {
        id: 'dod-1',
        teamId: 'team-1',
        items: [
          { id: 'item-1', description: 'Code reviewed', category: 'review' },
          { id: 'item-2', description: 'Tests passing', category: 'testing' },
        ],
      };

      const mockVerification = {
        id: 'ver-1',
        pbiId: 'pbi-1',
        dodItemId: 'item-1',
        isVerified: true,
        verifiedBy: 'user-1',
        notes: 'Looks good',
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(mockPBI as any);
      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(mockDoD as any);
      vi.mocked(prisma.doDChecklistVerification.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.doDChecklistVerification.create).mockResolvedValue(mockVerification as any);

      const verifications = [{ dodItemId: 'item-1', isVerified: true, notes: 'Looks good' }];

      const result = await definitionOfDoneService.verifyDoDForPBI(
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

      const mockDoD = {
        id: 'dod-1',
        teamId: 'team-1',
        items: [{ id: 'item-1', description: 'Code reviewed', category: 'review' }],
      };

      const existingVerification = {
        id: 'ver-1',
        pbiId: 'pbi-1',
        dodItemId: 'item-1',
        isVerified: false,
      };

      const updatedVerification = {
        id: 'ver-1',
        pbiId: 'pbi-1',
        dodItemId: 'item-1',
        isVerified: true,
        verifiedBy: 'user-1',
        notes: 'Now verified',
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(mockPBI as any);
      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(mockDoD as any);
      vi.mocked(prisma.doDChecklistVerification.findUnique).mockResolvedValue(
        existingVerification as any
      );
      vi.mocked(prisma.doDChecklistVerification.update).mockResolvedValue(
        updatedVerification as any
      );

      const verifications = [{ dodItemId: 'item-1', isVerified: true, notes: 'Now verified' }];

      const result = await definitionOfDoneService.verifyDoDForPBI(
        'pbi-1',
        'user-1',
        verifications
      );

      expect(prisma.doDChecklistVerification.update).toHaveBeenCalledWith({
        where: { id: 'ver-1' },
        data: {
          isVerified: true,
          verifiedBy: 'user-1',
          verifiedAt: expect.any(Date),
          notes: 'Now verified',
          updatedBy: 'user-1',
        },
      });
      expect(result[0]).toEqual(updatedVerification);
    });

    it('should throw NotFoundError when PBI does not exist', async () => {
      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(null as any);

      await expect(definitionOfDoneService.verifyDoDForPBI('pbi-1', 'user-1', [])).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw NotFoundError when DoD does not exist', async () => {
      const mockPBI = {
        id: 'pbi-1',
        teamId: 'team-1',
        team: { id: 'team-1', name: 'Team 1' },
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(mockPBI as any);
      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(null as any);

      await expect(definitionOfDoneService.verifyDoDForPBI('pbi-1', 'user-1', [])).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw BadRequestError for invalid DoD item IDs', async () => {
      const mockPBI = {
        id: 'pbi-1',
        teamId: 'team-1',
        team: { id: 'team-1', name: 'Team 1' },
      };

      const mockDoD = {
        id: 'dod-1',
        teamId: 'team-1',
        items: [{ id: 'item-1', description: 'Code reviewed', category: 'review' }],
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(mockPBI as any);
      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(mockDoD as any);

      const verifications = [{ dodItemId: 'invalid-item', isVerified: true }];

      await expect(
        definitionOfDoneService.verifyDoDForPBI('pbi-1', 'user-1', verifications)
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('getDoDVerificationsForPBI', () => {
    it('should return verifications with item details for PBI', async () => {
      const mockVerifications = [
        {
          id: 'ver-1',
          pbiId: 'pbi-1',
          dodItemId: 'item-1',
          isVerified: true,
          dodItem: {
            id: 'item-1',
            description: 'Code reviewed',
            category: 'review',
          },
        },
      ];

      vi.mocked(prisma.doDChecklistVerification.findMany).mockResolvedValue(
        mockVerifications as any
      );

      const result = await definitionOfDoneService.getDoDVerificationsForPBI('pbi-1');

      expect(prisma.doDChecklistVerification.findMany).toHaveBeenCalledWith({
        where: { pbiId: 'pbi-1' },
        include: {
          dodItem: {
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
      vi.mocked(prisma.doDChecklistVerification.findMany).mockResolvedValue([]);

      const result = await definitionOfDoneService.getDoDVerificationsForPBI('pbi-1');

      expect(result).toEqual([]);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle getDefinitionOfDone with database error', async () => {
      vi.mocked(prisma.definitionOfDone.findUnique).mockRejectedValue(
        new Error('Connection failed')
      );

      await expect(definitionOfDoneService.getDefinitionOfDone('team-123')).rejects.toThrow(
        'Connection failed'
      );
    });

    it('should handle createDefaultDefinitionOfDone with empty userId', async () => {
      const mockDoD = {
        id: 'dod-123',
        teamId: 'team-123',
        version: 1,
        createdBy: null,
        items: [],
      };

      vi.mocked(prisma.definitionOfDone.create).mockResolvedValue(mockDoD as any);

      const result = await definitionOfDoneService.createDefaultDefinitionOfDone('team-123');

      expect(result.createdBy).toBeNull();
    });

    it('should handle updateDefinitionOfDone with empty items array', async () => {
      const existingDod = {
        id: 'dod-123',
        teamId: 'team-123',
        version: 1,
      };

      const updatedDod = {
        id: 'dod-123',
        teamId: 'team-123',
        version: 2,
        items: [],
      };

      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(existingDod as any);
      vi.mocked(prisma.doDItem.deleteMany).mockResolvedValue({ count: 0 } as any);
      vi.mocked(prisma.definitionOfDone.update).mockResolvedValue(updatedDod as any);

      const result = await definitionOfDoneService.updateDefinitionOfDone('team-123', [], 'user-1');

      expect(result.items).toEqual([]);
    });

    it('should handle getDoDItems when DoD does not exist', async () => {
      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(null);

      const result = await definitionOfDoneService.getDoDItems('team-123');

      expect(result).toEqual([]);
    });

    it('should handle verifyDoDForPBI with empty verifications array', async () => {
      const pbi = {
        id: 'pbi-1',
        teamId: 'team-123',
        team: { id: 'team-123' },
      };

      const dod = {
        id: 'dod-123',
        teamId: 'team-123',
        items: [],
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(pbi as any);
      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(dod as any);

      const result = await definitionOfDoneService.verifyDoDForPBI('pbi-1', 'user-1', []);

      expect(result).toEqual([]);
    });

    it('should handle getDoDVerificationsForPBI with database error', async () => {
      vi.mocked(prisma.doDChecklistVerification.findMany).mockRejectedValue(
        new Error('Database error')
      );

      await expect(definitionOfDoneService.getDoDVerificationsForPBI('pbi-1')).rejects.toThrow(
        'Database error'
      );
    });

    it('should handle getDoDComplianceReport with no PBIs in sprint', async () => {
      const sprint = {
        id: 'sprint-1',
        teamId: 'team-123',
        sprintBacklogItems: [],
      };

      const dod = {
        id: 'dod-123',
        teamId: 'team-123',
        items: [],
      };

      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(sprint as any);
      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(dod as any);

      const result = await definitionOfDoneService.getDoDComplianceReport('sprint-1');

      expect(result.totalPBIs).toBe(0);
      expect(result.complianceRate).toBe(0);
      expect(result.pbiDetails).toEqual([]);
    });

    it('should handle getDoDComplianceReport with no DoD defined', async () => {
      const sprint = {
        id: 'sprint-1',
        teamId: 'team-123',
        sprintBacklogItems: [
          {
            pbi: {
              id: 'pbi-1',
              title: 'Test PBI',
              status: 'IN_PROGRESS',
            },
          },
        ],
      };

      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(sprint as any);
      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.doDChecklistVerification.findMany).mockResolvedValue([]);

      const result = await definitionOfDoneService.getDoDComplianceReport('sprint-1');

      expect(result.totalPBIs).toBe(1);
      expect(result.dodCompliantPBIs).toBe(0);
    });

    it('should throw NotFoundError for non-existent sprint in compliance report', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(null);

      await expect(
        definitionOfDoneService.getDoDComplianceReport('non-existent-sprint')
      ).rejects.toThrow(NotFoundError);
    });

    it('should handle updateDefinitionOfDone when DoD does not exist', async () => {
      const newDoD = {
        id: 'dod-123',
        teamId: 'team-123',
        version: 1,
        items: [],
      };

      const updatedDod = {
        id: 'dod-123',
        teamId: 'team-123',
        version: 2,
        items: [
          {
            id: 'item-1',
            description: 'Test item',
            category: 'quality',
            isActive: true,
            order: 0,
          },
        ],
      };

      vi.mocked(prisma.definitionOfDone.findUnique)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(newDoD as any);
      vi.mocked(prisma.definitionOfDone.create).mockResolvedValue(newDoD as any);
      vi.mocked(prisma.doDItem.deleteMany).mockResolvedValue({ count: 0 } as any);
      vi.mocked(prisma.definitionOfDone.update).mockResolvedValue(updatedDod as any);

      const items = [
        {
          description: 'Test item',
          category: 'quality',
          isActive: true,
          order: 0,
        },
      ];

      const result = await definitionOfDoneService.updateDefinitionOfDone(
        'team-123',
        items,
        'user-1'
      );

      expect(result.items).toHaveLength(1);
    });

    it('should handle verifyDoDForPBI with notes', async () => {
      const pbi = {
        id: 'pbi-1',
        teamId: 'team-123',
        team: { id: 'team-123' },
      };

      const dod = {
        id: 'dod-123',
        teamId: 'team-123',
        items: [
          {
            id: 'item-1',
            description: 'Code reviewed',
          },
        ],
      };

      const verification = {
        id: 'ver-1',
        pbiId: 'pbi-1',
        dodItemId: 'item-1',
        isVerified: true,
        verifiedBy: 'user-1',
        verifiedAt: new Date(),
        notes: 'Reviewed by senior dev',
      };

      vi.mocked(prisma.productBacklogItem.findUnique).mockResolvedValue(pbi as any);
      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(dod as any);
      vi.mocked(prisma.doDChecklistVerification.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.doDChecklistVerification.create).mockResolvedValue(verification as any);

      const result = await definitionOfDoneService.verifyDoDForPBI('pbi-1', 'user-1', [
        {
          dodItemId: 'item-1',
          isVerified: true,
          notes: 'Reviewed by senior dev',
        },
      ]);

      expect(result[0]!.notes).toBe('Reviewed by senior dev');
    });

    it('should handle InternalServerError in getDoDComplianceReport', async () => {
      vi.mocked(prisma.sprint.findUnique).mockRejectedValue(new Error('Unexpected error'));

      await expect(definitionOfDoneService.getDoDComplianceReport('sprint-1')).rejects.toThrow(
        InternalServerError
      );
    });

    it('should handle verifications referencing DoD items not in current definition', async () => {
      const sprint = {
        id: 'sprint-1',
        teamId: 'team-123',
        sprintBacklogItems: [
          {
            pbi: {
              id: 'pbi-1',
              title: 'Feature A',
              status: 'DONE',
            },
          },
        ],
      };

      const dod = {
        id: 'dod-123',
        teamId: 'team-123',
        items: [
          {
            id: 'current-item-1',
            description: 'Current item',
            category: 'quality',
            isActive: true,
          },
        ],
      };

      const verifications = [
        {
          id: 'ver-1',
          pbiId: 'pbi-1',
          dodItemId: 'old-item-1',
          isVerified: true,
          verifiedBy: 'user-1',
          verifiedAt: new Date(),
          notes: null,
          createdAt: new Date(),
          createdBy: 'user-1',
          updatedAt: new Date(),
          updatedBy: null,
        },
      ];

      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(sprint as any);
      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(dod as any);
      vi.mocked(prisma.doDChecklistVerification.findMany).mockResolvedValue(verifications as any);

      const result = await definitionOfDoneService.getDoDComplianceReport('sprint-1');

      expect(result.totalPBIs).toBe(1);
      expect(result.pbiDetails[0]!.verifications[0]!.dodItem.description).toBe('');
      expect(result.pbiDetails[0]!.verifications[0]!.dodItem.category).toBe('quality');
    });

    it('should calculate compliance percentage correctly when DoD items exist', async () => {
      const sprint = {
        id: 'sprint-1',
        teamId: 'team-123',
        sprintBacklogItems: [
          {
            pbi: {
              id: 'pbi-1',
              title: 'Feature A',
              status: 'DONE',
            },
          },
          {
            pbi: {
              id: 'pbi-2',
              title: 'Feature B',
              status: 'IN_PROGRESS',
            },
          },
        ],
      };

      const dod = {
        id: 'dod-123',
        teamId: 'team-123',
        items: [
          { id: 'item-1', description: 'Code reviewed', category: 'review', isActive: true },
          { id: 'item-2', description: 'Tests passing', category: 'testing', isActive: true },
        ],
      };

      const verificationsPBI1 = [
        {
          id: 'ver-1',
          pbiId: 'pbi-1',
          dodItemId: 'item-1',
          isVerified: true,
          verifiedBy: 'user-1',
          verifiedAt: new Date(),
          notes: null,
          createdAt: new Date(),
          createdBy: 'user-1',
          updatedAt: new Date(),
          updatedBy: null,
        },
        {
          id: 'ver-2',
          pbiId: 'pbi-1',
          dodItemId: 'item-2',
          isVerified: true,
          verifiedBy: 'user-1',
          verifiedAt: new Date(),
          notes: null,
          createdAt: new Date(),
          createdBy: 'user-1',
          updatedAt: new Date(),
          updatedBy: null,
        },
      ];

      const verificationsPBI2 = [
        {
          id: 'ver-3',
          pbiId: 'pbi-2',
          dodItemId: 'item-1',
          isVerified: true,
          verifiedBy: 'user-1',
          verifiedAt: new Date(),
          notes: 'Some notes',
          createdAt: new Date(),
          createdBy: 'user-1',
          updatedAt: new Date(),
          updatedBy: null,
        },
        {
          id: 'ver-4',
          pbiId: 'pbi-2',
          dodItemId: 'item-2',
          isVerified: false,
          verifiedBy: 'user-1',
          verifiedAt: new Date(),
          notes: null,
          createdAt: new Date(),
          createdBy: 'user-1',
          updatedAt: new Date(),
          updatedBy: null,
        },
      ];

      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(sprint as any);
      vi.mocked(prisma.definitionOfDone.findUnique).mockResolvedValue(dod as any);
      vi.mocked(prisma.doDChecklistVerification.findMany)
        .mockResolvedValueOnce(verificationsPBI1 as any)
        .mockResolvedValueOnce(verificationsPBI2 as any);

      const result = await definitionOfDoneService.getDoDComplianceReport('sprint-1');

      expect(result.totalPBIs).toBe(2);
      expect(result.dodCompliantPBIs).toBe(1);
      expect(result.pbiDetails[0]!.compliancePercentage).toBe(100);
      expect(result.pbiDetails[1]!.compliancePercentage).toBe(50);
      expect(result.complianceRate).toBe(50);
    });
  });
});
