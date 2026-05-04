import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock modules with factory functions (hoisted, so no external variables allowed)
vi.mock('../../../utils/prisma', () => ({
  default: {
    dailyUpdate: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    sprint: {
      findUnique: vi.fn(),
    },
    impediment: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback) =>
      callback({
        impediment: {
          create: vi.fn(),
        },
      })
    ),
  },
}));

vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('test-uuid'),
}));

// Now import the service and other dependencies
import { dailyUpdateService } from '../../../services/dailyUpdate.service';
import prisma from '../../../utils/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../../../utils/errors';
import { ImpedimentStatus } from '../../../generated/prisma/client';

describe('DailyUpdateService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDailyUpdates', () => {
    it('should return daily updates for sprint', async () => {
      const sprintId = 'sprint-1';
      const mockUpdates = [
        {
          id: 'update-1',
          sprintId,
          userId: 'user-1',
          yesterdayWork: 'Worked on feature A',
          todayWork: 'Will work on feature B',
          impediment: null,
          user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
          impedimentRecord: null,
        },
        {
          id: 'update-2',
          sprintId,
          userId: 'user-2',
          yesterdayWork: 'Fixed bug C',
          todayWork: 'Code review',
          impediment: 'Waiting for API access',
          user: { id: 'user-2', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
          impedimentRecord: {
            id: 'imp-1',
            status: ImpedimentStatus.OPEN,
            title: 'API Access',
            reportedBy: { id: 'user-2', firstName: 'Jane', lastName: 'Doe' },
            owner: null,
          },
        },
      ];

      vi.mocked(prisma.dailyUpdate.findMany).mockResolvedValue(mockUpdates as any);

      const result = await dailyUpdateService.getDailyUpdates(sprintId);

      expect(result).toHaveLength(2);
      expect(prisma.dailyUpdate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { sprintId },
          orderBy: { createdAt: 'desc' },
        })
      );
    });

    it('should filter by date when provided', async () => {
      const sprintId = 'sprint-1';
      const date = '2024-01-15';

      vi.mocked(prisma.dailyUpdate.findMany).mockResolvedValue([]);

      await dailyUpdateService.getDailyUpdates(sprintId, date);

      expect(prisma.dailyUpdate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            sprintId,
            updateDate: expect.any(Date),
          }),
        })
      );
    });

    it('should throw BadRequestError for invalid date format', async () => {
      await expect(dailyUpdateService.getDailyUpdates('sprint-1', 'invalid-date')).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe('getDailyUpdateById', () => {
    it('should return daily update by ID', async () => {
      const updateId = 'update-1';
      const mockUpdate = {
        id: updateId,
        sprintId: 'sprint-1',
        userId: 'user-1',
        yesterdayWork: 'Worked on feature A',
        todayWork: 'Will work on feature B',
        user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
      };

      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(mockUpdate as any);

      const result = await dailyUpdateService.getDailyUpdateById(updateId);

      expect(result).not.toBeNull();
      expect(result!.id).toBe(updateId);
    });

    it('should return null for non-existent update', async () => {
      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(null as any);

      const result = await dailyUpdateService.getDailyUpdateById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('createDailyUpdate', () => {
    it('should create daily update successfully', async () => {
      const userId = 'user-1';
      const mockSprint = { id: 'sprint-1' };
      const mockUpdate = {
        id: 'test-uuid',
        sprintId: 'sprint-1',
        userId,
        yesterdayWork: 'Worked on feature A',
        todayWork: 'Will work on feature B',
        impediment: null,
        updateDate: new Date(),
        user: { id: userId, firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
      };

      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(null as any);
      vi.mocked(prisma.dailyUpdate.create).mockResolvedValue(mockUpdate as any);

      const result = await dailyUpdateService.createDailyUpdate(userId, {
        sprintId: 'sprint-1',
        yesterdayWork: 'Worked on feature A',
        todayWork: 'Will work on feature B',
      });

      expect(result.sprintId).toBe('sprint-1');
      expect(result.yesterdayWork).toBe('Worked on feature A');
    });

    it('should throw NotFoundError if sprint does not exist', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(null as any);

      await expect(
        dailyUpdateService.createDailyUpdate('user-1', {
          sprintId: 'non-existent',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ConflictError if update already exists for today', async () => {
      const mockSprint = { id: 'sprint-1' };
      const existingUpdate = { id: 'existing-update' };

      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(existingUpdate as any);

      await expect(
        dailyUpdateService.createDailyUpdate('user-1', {
          sprintId: 'sprint-1',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('updateDailyUpdate', () => {
    it('should update daily update successfully', async () => {
      const userId = 'user-1';
      const updateId = 'update-1';
      const mockUpdate = {
        id: updateId,
        sprintId: 'sprint-1',
        userId,
        yesterdayWork: 'Updated yesterday work',
        todayWork: 'Updated today work',
        user: { id: userId, firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
      };

      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(mockUpdate as any);
      vi.mocked(prisma.dailyUpdate.update).mockResolvedValue(mockUpdate as any);

      const result = await dailyUpdateService.updateDailyUpdate(updateId, userId, {
        yesterdayWork: 'Updated yesterday work',
        todayWork: 'Updated today work',
      });

      expect(result.yesterdayWork).toBe('Updated yesterday work');
    });

    it('should throw NotFoundError for non-existent update', async () => {
      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(null as any);

      await expect(
        dailyUpdateService.updateDailyUpdate('non-existent', 'user-1', {
          todayWork: 'Test',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError if user tries to update another user update', async () => {
      const mockUpdate = {
        id: 'update-1',
        sprintId: 'sprint-1',
        userId: 'user-1',
      };

      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(mockUpdate as any);

      await expect(
        dailyUpdateService.updateDailyUpdate('update-1', 'user-2', {
          todayWork: 'Test',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('deleteDailyUpdate', () => {
    it('should delete daily update successfully', async () => {
      const userId = 'user-1';
      const mockUpdate = {
        id: 'update-1',
        sprintId: 'sprint-1',
        userId,
      };

      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(mockUpdate as any);
      vi.mocked(prisma.dailyUpdate.delete).mockResolvedValue(mockUpdate as any);

      await expect(dailyUpdateService.deleteDailyUpdate('update-1', userId)).resolves.not.toThrow();
    });

    it('should throw NotFoundError for non-existent update', async () => {
      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(null as any);

      await expect(dailyUpdateService.deleteDailyUpdate('non-existent', 'user-1')).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw BadRequestError if user tries to delete another user update', async () => {
      const mockUpdate = {
        id: 'update-1',
        sprintId: 'sprint-1',
        userId: 'user-1',
      };

      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(mockUpdate as any);

      await expect(dailyUpdateService.deleteDailyUpdate('update-1', 'user-2')).rejects.toThrow(
        BadRequestError
      );
    });
  });

  describe('getTeamMembersWithUpdates', () => {
    it('should return submitted and pending members', async () => {
      const sprintId = 'sprint-1';
      const date = '2024-01-15';
      const mockSprint = {
        id: sprintId,
        team: {
          members: [
            { userId: 'user-1', user: { id: 'user-1', firstName: 'John', lastName: 'Doe' } },
            { userId: 'user-2', user: { id: 'user-2', firstName: 'Jane', lastName: 'Doe' } },
            { userId: 'user-3', user: { id: 'user-3', firstName: 'Bob', lastName: 'Smith' } },
          ],
        },
      };
      const mockUpdates = [
        {
          id: 'update-1',
          sprintId,
          userId: 'user-1',
          user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        },
        {
          id: 'update-2',
          sprintId,
          userId: 'user-2',
          user: { id: 'user-2', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
        },
      ];

      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(mockSprint as any);
      vi.mocked(prisma.dailyUpdate.findMany).mockResolvedValue(mockUpdates as any);

      const result = await dailyUpdateService.getTeamMembersWithUpdates(sprintId, date);

      expect(result.submitted).toHaveLength(2);
      expect(result.pending).toHaveLength(1);
      expect(result.pending[0]!.userId).toBe('user-3');
    });

    it('should throw NotFoundError if sprint does not exist', async () => {
      vi.mocked(prisma.sprint.findUnique).mockResolvedValue(null as any);

      await expect(
        dailyUpdateService.getTeamMembersWithUpdates('non-existent', '2024-01-15')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('promoteToImpediment', () => {
    it('should promote daily update impediment to full impediment', async () => {
      const dailyUpdateId = 'update-1';
      const userId = 'user-1';
      const mockDailyUpdate = {
        id: dailyUpdateId,
        sprintId: 'sprint-1',
        userId: 'user-2',
        impediment: 'API access blocked',
        impedimentRecord: null,
        user: { id: 'user-2', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
      };
      const mockImpediment = {
        id: 'imp-1',
        teamId: 'team-1',
        sprintId: 'sprint-1',
        title: 'API Access Issue',
        description: 'API access blocked',
        reportedById: 'user-2',
        status: ImpedimentStatus.OPEN,
        dailyUpdateId,
        reportedBy: { id: 'user-2', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
        owner: null,
        sprint: { id: 'sprint-1', name: 'Sprint 1' },
        dailyUpdate: {
          ...mockDailyUpdate,
          impedimentRecord: { id: 'imp-1' },
        },
      };

      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(mockDailyUpdate as any);
      vi.mocked(prisma.$transaction).mockImplementation(async (callback: any) => {
        return callback({
          impediment: {
            create: vi.fn().mockResolvedValue(mockImpediment as any),
          },
        });
      });

      const result = await dailyUpdateService.promoteToImpediment(dailyUpdateId, userId, {
        title: 'API Access Issue',
        description: 'API access blocked',
        teamId: 'team-1',
      });

      expect(result.impediment.title).toBe('API Access Issue');
      expect(result.dailyUpdate).toBeDefined();
    });

    it('should throw NotFoundError if daily update does not exist', async () => {
      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(null as any);

      await expect(
        dailyUpdateService.promoteToImpediment('non-existent', 'user-1', {
          title: 'Test',
          description: 'Test',
          teamId: 'team-1',
        })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError if no impediment text exists', async () => {
      const mockDailyUpdate = {
        id: 'update-1',
        impediment: null,
        impedimentRecord: null,
        user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
      };

      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(mockDailyUpdate as any);

      await expect(
        dailyUpdateService.promoteToImpediment('update-1', 'user-1', {
          title: 'Test',
          description: 'Test',
          teamId: 'team-1',
        })
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw BadRequestError if impediment already created', async () => {
      const mockDailyUpdate = {
        id: 'update-1',
        impediment: 'API blocked',
        impedimentRecord: { id: 'imp-1' },
        user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
      };

      vi.mocked(prisma.dailyUpdate.findUnique).mockResolvedValue(mockDailyUpdate as any);

      await expect(
        dailyUpdateService.promoteToImpediment('update-1', 'user-1', {
          title: 'Test',
          description: 'Test',
          teamId: 'team-1',
        })
      ).rejects.toThrow(BadRequestError);
    });
  });
});
