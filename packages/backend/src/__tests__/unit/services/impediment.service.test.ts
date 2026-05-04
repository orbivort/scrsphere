import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock modules with factory functions (hoisted, so no external variables allowed)
vi.mock('../../../utils/prisma', () => ({
  default: {
    impediment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('test-uuid'),
}));

// Now import the service and other dependencies
import { impedimentService } from '../../../services/impediment.service';
import prisma from '../../../utils/prisma';
import { ImpedimentStatus, NotificationType } from '../../../generated/prisma/client';

describe('ImpedimentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getImpedimentsByTeam', () => {
    it('should return all impediments for a team', async () => {
      const teamId = 'team-1';
      const mockImpediments = [
        {
          id: 'imp-1',
          teamId,
          title: 'Blocked API',
          status: ImpedimentStatus.OPEN,
          reportedBy: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
          owner: null,
          sprint: null,
          dailyUpdate: null,
          createdAt: new Date(),
        },
        {
          id: 'imp-2',
          teamId,
          title: 'Server Issue',
          status: ImpedimentStatus.IN_PROGRESS,
          reportedBy: { id: 'user-2', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
          owner: { id: 'user-3', firstName: 'Bob', lastName: 'Smith', email: 'bob@test.com' },
          sprint: { id: 'sprint-1', name: 'Sprint 1' },
          dailyUpdate: null,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.impediment.findMany).mockResolvedValue(mockImpediments as any);

      const result = await impedimentService.getImpedimentsByTeam(teamId);

      expect(result).toHaveLength(2);
      expect(prisma.impediment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { teamId },
          orderBy: { createdAt: 'desc' },
        })
      );
    });
  });

  describe('getImpedimentById', () => {
    it('should return impediment by ID', async () => {
      const impedimentId = 'imp-1';
      const teamId = 'team-1';
      const mockImpediment = {
        id: impedimentId,
        teamId,
        title: 'Blocked API',
        status: ImpedimentStatus.OPEN,
        reportedBy: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        owner: null,
        sprint: null,
        dailyUpdate: null,
      };

      vi.mocked(prisma.impediment.findFirst).mockResolvedValue(mockImpediment as any);

      const result = await impedimentService.getImpedimentById(impedimentId, teamId);

      expect(result).not.toBeNull();
      expect(result!.title).toBe('Blocked API');
    });

    it('should return null for non-existent impediment', async () => {
      vi.mocked(prisma.impediment.findFirst).mockResolvedValue(null as any);

      const result = await impedimentService.getImpedimentById('non-existent', 'team-1');

      expect(result).toBeNull();
    });
  });

  describe('createImpediment', () => {
    it('should create impediment successfully', async () => {
      const mockImpediment = {
        id: 'imp-1',
        teamId: 'team-1',
        title: 'New Impediment',
        description: 'Description of the impediment',
        status: ImpedimentStatus.OPEN,
        reportedById: 'user-1',
        reportedBy: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        owner: null,
        sprint: null,
        dailyUpdate: null,
      };

      vi.mocked(prisma.impediment.create).mockResolvedValue(mockImpediment as any);

      const result = await impedimentService.createImpediment({
        teamId: 'team-1',
        title: 'New Impediment',
        description: 'Description of the impediment',
        reportedById: 'user-1',
      });

      expect(result.title).toBe('New Impediment');
      expect(result.status).toBe(ImpedimentStatus.OPEN);
    });

    it('should create notification when owner is assigned and different from reporter', async () => {
      const mockImpediment = {
        id: 'imp-1',
        teamId: 'team-1',
        title: 'New Impediment',
        description: 'Description',
        status: ImpedimentStatus.OPEN,
        reportedById: 'user-1',
        ownerId: 'user-2',
        reportedBy: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        owner: { id: 'user-2', firstName: 'Jane', lastName: 'Doe', email: 'jane@test.com' },
        sprint: null,
        dailyUpdate: null,
      };
      const mockReporter = { id: 'user-1', firstName: 'John', lastName: 'Doe' };

      vi.mocked(prisma.impediment.create).mockResolvedValue(mockImpediment as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockReporter as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif-1' } as any);

      await impedimentService.createImpediment({
        teamId: 'team-1',
        title: 'New Impediment',
        description: 'Description',
        reportedById: 'user-1',
        ownerId: 'user-2',
      });

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-2',
            type: NotificationType.IMPEDIMENT_ASSIGNMENT,
          }),
        })
      );
    });

    it('should not create notification when owner is the same as reporter', async () => {
      const mockImpediment = {
        id: 'imp-1',
        teamId: 'team-1',
        title: 'New Impediment',
        description: 'Description',
        status: ImpedimentStatus.OPEN,
        reportedById: 'user-1',
        ownerId: 'user-1',
        reportedBy: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        owner: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        sprint: null,
        dailyUpdate: null,
      };

      vi.mocked(prisma.impediment.create).mockResolvedValue(mockImpediment as any);

      await impedimentService.createImpediment({
        teamId: 'team-1',
        title: 'New Impediment',
        description: 'Description',
        reportedById: 'user-1',
        ownerId: 'user-1',
      });

      expect(prisma.notification.create).not.toHaveBeenCalled();
    });
  });

  describe('updateImpediment', () => {
    it('should update impediment successfully', async () => {
      const mockImpediment = {
        id: 'imp-1',
        teamId: 'team-1',
        title: 'Updated Impediment',
        description: 'Updated description',
        status: ImpedimentStatus.IN_PROGRESS,
        reportedBy: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        owner: null,
        sprint: null,
        dailyUpdate: null,
      };

      vi.mocked(prisma.impediment.update).mockResolvedValue(mockImpediment as any);

      const result = await impedimentService.updateImpediment('imp-1', 'team-1', {
        status: ImpedimentStatus.IN_PROGRESS,
      });

      expect(result.status).toBe(ImpedimentStatus.IN_PROGRESS);
    });

    it('should set resolvedAt when status changes to RESOLVED', async () => {
      const mockImpediment = {
        id: 'imp-1',
        teamId: 'team-1',
        title: 'Impediment',
        status: ImpedimentStatus.RESOLVED,
        resolution: 'Fixed the issue',
        resolvedAt: new Date(),
        reportedBy: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        owner: null,
        sprint: null,
        dailyUpdate: null,
      };

      vi.mocked(prisma.impediment.update).mockResolvedValue(mockImpediment as any);

      const result = await impedimentService.updateImpediment('imp-1', 'team-1', {
        status: ImpedimentStatus.RESOLVED,
        resolution: 'Fixed the issue',
      });

      expect(result.status).toBe(ImpedimentStatus.RESOLVED);
      expect(prisma.impediment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ImpedimentStatus.RESOLVED,
            resolution: 'Fixed the issue',
            resolvedAt: expect.any(Date),
          }),
        })
      );
    });

    it('should throw error when resolving without resolution', async () => {
      await expect(
        impedimentService.updateImpediment('imp-1', 'team-1', {
          status: ImpedimentStatus.RESOLVED,
        })
      ).rejects.toThrow('Resolution is required when marking impediment as resolved');
    });

    it('should clear resolvedAt when status changes from RESOLVED', async () => {
      const mockImpediment = {
        id: 'imp-1',
        teamId: 'team-1',
        title: 'Impediment',
        status: ImpedimentStatus.OPEN,
        resolvedAt: null,
        reportedBy: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@test.com' },
        owner: null,
        sprint: null,
        dailyUpdate: null,
      };

      vi.mocked(prisma.impediment.update).mockResolvedValue(mockImpediment as any);

      const result = await impedimentService.updateImpediment('imp-1', 'team-1', {
        status: ImpedimentStatus.OPEN,
      });

      expect(result.status).toBe(ImpedimentStatus.OPEN);
      expect(prisma.impediment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: ImpedimentStatus.OPEN,
            resolvedAt: null,
          }),
        })
      );
    });
  });

  describe('deleteImpediment', () => {
    it('should delete impediment successfully', async () => {
      vi.mocked(prisma.impediment.deleteMany).mockResolvedValue({ count: 1 } as any);

      await impedimentService.deleteImpediment('imp-1', 'team-1');

      expect(prisma.impediment.deleteMany).toHaveBeenCalledWith({
        where: { id: 'imp-1', teamId: 'team-1' },
      });
    });
  });

  describe('getImpedimentStats', () => {
    it('should return impediment statistics', async () => {
      const teamId = 'team-1';
      const mockImpediments = [
        { status: ImpedimentStatus.OPEN },
        { status: ImpedimentStatus.OPEN },
        { status: ImpedimentStatus.IN_PROGRESS },
        { status: ImpedimentStatus.RESOLVED },
        { status: ImpedimentStatus.RESOLVED },
        { status: ImpedimentStatus.CLOSED },
      ];

      vi.mocked(prisma.impediment.findMany).mockResolvedValue(mockImpediments as any);

      const result = await impedimentService.getImpedimentStats(teamId);

      expect(result.open).toBe(2);
      expect(result.inProgress).toBe(1);
      expect(result.resolved).toBe(2);
      expect(result.closed).toBe(1);
    });

    it('should return zero stats when no impediments exist', async () => {
      vi.mocked(prisma.impediment.findMany).mockResolvedValue([]);

      const result = await impedimentService.getImpedimentStats('team-1');

      expect(result.open).toBe(0);
      expect(result.inProgress).toBe(0);
      expect(result.resolved).toBe(0);
      expect(result.closed).toBe(0);
    });
  });
});
