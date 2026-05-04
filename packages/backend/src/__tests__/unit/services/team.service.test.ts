import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock modules with factory functions (hoisted, so no external variables allowed)
vi.mock('../../../utils/prisma', () => ({
  default: {
    team: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    teamMember: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    productGoal: {
      findMany: vi.fn(),
    },
    task: {
      count: vi.fn(),
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

// Mock notification service
vi.mock('../../../services/notification.service', () => ({
  NotificationService: class {
    create = vi.fn().mockResolvedValue({ id: 'notification-id' });
  },
}));

// Mock uuid
vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('test-uuid'),
}));

// Now import the service and other dependencies
import { teamService } from '../../../services/team.service';
import prisma from '../../../utils/prisma';
import { fixtures } from '../../fixtures';
import { NotFoundError, ForbiddenError, ConflictError } from '../../../utils/errors';

describe('TeamService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserTeams', () => {
    it('should return teams for a user with pagination', async () => {
      const userId = 'test-user-id';
      const mockTeam = fixtures.teams.validTeam();
      const mockMember = {
        id: 'member-id',
        teamId: mockTeam.id,
        userId,
        role: 'PRODUCT_OWNER',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      };

      vi.mocked(prisma.team.findMany).mockResolvedValue([
        { ...mockTeam, members: [{ ...mockMember, user: fixtures.users.validUser() }] },
      ] as any);
      vi.mocked(prisma.team.count).mockResolvedValue(1 as any);

      const result = await teamService.getUserTeams(userId, { page: 1, limit: 10 });

      expect(result.teams).toHaveLength(1);
      expect(result.teams[0]!.memberCount).toBe(1);
      expect(result.teams[0]!.userRole).toBe('PRODUCT_OWNER');
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should filter teams by search term', async () => {
      const userId = 'test-user-id';
      const mockTeam = fixtures.teams.validTeam({ name: 'Alpha Team' });
      const mockMember = {
        id: 'member-id',
        teamId: mockTeam.id,
        userId,
        role: 'DEVELOPER',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      };

      vi.mocked(prisma.team.findMany).mockResolvedValue([
        { ...mockTeam, members: [{ ...mockMember, user: fixtures.users.validUser() }] },
      ] as any);
      vi.mocked(prisma.team.count).mockResolvedValue(1 as any);

      const result = await teamService.getUserTeams(userId, { search: 'Alpha' });

      expect(result.teams).toHaveLength(1);
      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { name: { contains: 'Alpha', mode: 'insensitive' } },
              { description: { contains: 'Alpha', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should handle empty team list', async () => {
      const userId = 'test-user-id';

      vi.mocked(prisma.team.findMany).mockResolvedValue([]);
      vi.mocked(prisma.team.count).mockResolvedValue(0 as any);

      const result = await teamService.getUserTeams(userId);

      expect(result.teams).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.totalPages).toBe(0);
    });
  });

  describe('getTeamById', () => {
    it('should return team by ID for a member', async () => {
      const userId = 'test-user-id';
      const mockTeam = fixtures.teams.validTeam();
      const mockMember = {
        id: 'member-id',
        teamId: mockTeam.id,
        userId,
        role: 'SCRUM_MASTER',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      };

      vi.mocked(prisma.team.findUnique).mockResolvedValue({
        ...mockTeam,
        members: [{ ...mockMember, user: fixtures.users.validUser() }],
      } as any);

      const result = await teamService.getTeamById(mockTeam.id, userId);

      expect(result.id).toBe(mockTeam.id);
      expect(result.memberCount).toBe(1);
    });

    it('should throw NotFoundError for non-existent team', async () => {
      const userId = 'test-user-id';

      vi.mocked(prisma.team.findUnique).mockResolvedValue(null as any);

      await expect(teamService.getTeamById('non-existent-id', userId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ForbiddenError for non-member', async () => {
      const userId = 'test-user-id';
      const otherUserId = 'other-user-id';
      const mockTeam = fixtures.teams.validTeam();
      const mockMember = {
        id: 'member-id',
        teamId: mockTeam.id,
        userId: otherUserId,
        role: 'DEVELOPER',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      };

      vi.mocked(prisma.team.findUnique).mockResolvedValue({
        ...mockTeam,
        members: [{ ...mockMember, user: fixtures.users.validUser({ id: otherUserId }) }],
      } as any);

      await expect(teamService.getTeamById(mockTeam.id, userId)).rejects.toThrow(ForbiddenError);
    });
  });

  describe('createTeam', () => {
    it('should create a new team with creator as Product Owner', async () => {
      const userId = 'test-user-id';
      const mockUser = fixtures.users.validUser({ id: userId });
      const mockTeam = fixtures.teams.validTeam();

      vi.mocked(prisma.team.create).mockResolvedValue({
        ...mockTeam,
        members: [
          {
            id: 'member-id',
            teamId: mockTeam.id,
            userId,
            role: 'PRODUCT_OWNER',
            joinedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userId,
            updatedBy: null,
            user: mockUser,
          },
        ],
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notification-id' } as any);

      const result = await teamService.createTeam(userId, {
        name: mockTeam.name,
        description: mockTeam.description,
      });

      expect(result.name).toBe(mockTeam.name);
      expect(result.members[0]!.role).toBe('PRODUCT_OWNER');
    });

    it('should create notification for team creator', async () => {
      const userId = 'test-user-id';
      const mockUser = fixtures.users.validUser({ id: userId });
      const mockTeam = fixtures.teams.validTeam();

      vi.mocked(prisma.team.create).mockResolvedValue({
        ...mockTeam,
        members: [
          {
            id: 'member-id',
            teamId: mockTeam.id,
            userId,
            role: 'PRODUCT_OWNER',
            joinedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: userId,
            updatedBy: null,
            user: mockUser,
          },
        ],
      } as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notification-id' } as any);

      await teamService.createTeam(userId, { name: mockTeam.name });

      expect(prisma.notification.create).toHaveBeenCalled();
    });
  });

  describe('deleteTeam', () => {
    it('should delete team successfully', async () => {
      const userId = 'test-user-id';
      const mockTeam = fixtures.teams.validTeam();

      vi.mocked(prisma.team.findUnique).mockResolvedValue({
        ...mockTeam,
        members: [
          {
            id: 'member-id',
            teamId: mockTeam.id,
            userId,
            role: 'PRODUCT_OWNER',
            joinedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: null,
            updatedBy: null,
          },
        ],
      } as any);
      vi.mocked(prisma.productGoal.findMany).mockResolvedValue([]);
      vi.mocked(prisma.team.delete).mockResolvedValue(mockTeam as any);

      await expect(teamService.deleteTeam(mockTeam.id, userId)).resolves.not.toThrow();
    });

    it('should throw NotFoundError for non-existent team', async () => {
      const userId = 'test-user-id';

      vi.mocked(prisma.team.findUnique).mockResolvedValue(null as any);

      await expect(teamService.deleteTeam('non-existent-id', userId)).rejects.toThrow(
        NotFoundError
      );
    });

    it('should throw ConflictError when team has product goals', async () => {
      const userId = 'test-user-id';
      const mockTeam = fixtures.teams.validTeam();

      vi.mocked(prisma.team.findUnique).mockResolvedValue({
        ...mockTeam,
        productGoals: [{ id: 'goal-id', title: 'Goal 1' }],
        members: [
          {
            id: 'member-id',
            teamId: mockTeam.id,
            userId,
            role: 'PRODUCT_OWNER',
            joinedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: null,
            updatedBy: null,
          },
        ],
      } as any);

      await expect(teamService.deleteTeam(mockTeam.id, userId)).rejects.toThrow(ConflictError);
    });
  });

  describe('removeMember', () => {
    it('should remove member from team successfully', async () => {
      const userId = 'test-user-id';
      const memberId = 'member-to-remove';
      const memberUserId = 'member-user-id';
      const mockTeam = fixtures.teams.validTeam();

      // Mock checkTeamRole - user is SCRUM_MASTER
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValueOnce({
        id: 'requester-member-id',
        teamId: mockTeam.id,
        userId,
        role: 'SCRUM_MASTER',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      } as any);

      // Mock finding member to remove
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValueOnce({
        id: memberId,
        teamId: mockTeam.id,
        userId: memberUserId,
        role: 'DEVELOPER',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      } as any);

      vi.mocked(prisma.task.count).mockResolvedValue(0 as any);
      vi.mocked(prisma.teamMember.delete).mockResolvedValue({} as any);

      await expect(teamService.removeMember(mockTeam.id, userId, memberId)).resolves.not.toThrow();
    });

    it('should throw ForbiddenError when trying to remove self', async () => {
      const userId = 'test-user-id';
      const memberId = 'member-id';
      const mockTeam = fixtures.teams.validTeam();

      // Mock checkTeamRole - user is SCRUM_MASTER
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValueOnce({
        id: memberId,
        teamId: mockTeam.id,
        userId,
        role: 'SCRUM_MASTER',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      } as any);

      // Mock finding member to remove (which is self)
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValueOnce({
        id: memberId,
        teamId: mockTeam.id,
        userId,
        role: 'SCRUM_MASTER',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      } as any);

      await expect(teamService.removeMember(mockTeam.id, userId, memberId)).rejects.toThrow(
        ForbiddenError
      );
    });

    it('should throw ForbiddenError when user does not have required role', async () => {
      const userId = 'test-user-id';
      const memberId = 'member-to-remove';
      const mockTeam = fixtures.teams.validTeam();

      // Mock checkTeamRole - user is DEVELOPER (not allowed)
      vi.mocked(prisma.teamMember.findUnique).mockResolvedValueOnce({
        id: 'requester-member-id',
        teamId: mockTeam.id,
        userId,
        role: 'DEVELOPER',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      } as any);

      await expect(teamService.removeMember(mockTeam.id, userId, memberId)).rejects.toThrow(
        ForbiddenError
      );
    });
  });

  describe('getUserRoleInTeam', () => {
    it('should return user role in team', async () => {
      const userId = 'test-user-id';
      const teamId = 'team-id';

      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
        id: 'member-id',
        teamId,
        userId,
        role: 'DEVELOPER',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      } as any);

      const result = await teamService.getUserRoleInTeam(userId, teamId);

      expect(result).toBe('DEVELOPER');
    });

    it('should return null when user is not a member', async () => {
      const userId = 'test-user-id';
      const teamId = 'team-id';

      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null as any);

      const result = await teamService.getUserRoleInTeam(userId, teamId);

      expect(result).toBeNull();
    });
  });

  describe('validateTeamMembership', () => {
    it('should return true for team member', async () => {
      const userId = 'test-user-id';
      const teamId = 'team-id';

      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue({
        id: 'member-id',
        teamId,
        userId,
        role: 'DEVELOPER',
        joinedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: null,
        updatedBy: null,
      } as any);

      const result = await teamService.validateTeamMembership(userId, teamId);

      expect(result).toBe(true);
    });

    it('should return false for non-member', async () => {
      const userId = 'test-user-id';
      const teamId = 'team-id';

      vi.mocked(prisma.teamMember.findUnique).mockResolvedValue(null as any);

      const result = await teamService.validateTeamMembership(userId, teamId);

      expect(result).toBe(false);
    });
  });
});
