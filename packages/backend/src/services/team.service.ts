// Team Service
import prisma from '../utils/prisma';
import { NotFoundError, ForbiddenError, ConflictError } from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import { NotificationService } from './notification.service';
import {
  NotificationType,
  type Team,
  type TeamMember,
  type User,
  type UserRole,
  type Prisma,
} from '../generated/prisma/client';
import { logger } from '../utils/logger';

const notificationService = new NotificationService();

const ALLOWED_SORT_FIELDS = ['createdAt', 'updatedAt', 'name', 'description'] as const;
type SortField = (typeof ALLOWED_SORT_FIELDS)[number];

// Team with members
export type TeamWithMembers = Team & {
  members: (Omit<TeamMember, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'> & {
    user: Omit<
      User,
      | 'password'
      | 'createdAt'
      | 'createdBy'
      | 'updatedAt'
      | 'updatedBy'
      | 'marketingOptIn'
      | 'marketingOptInAt'
      | 'termsAcceptedAt'
    >;
  })[];
  memberCount: number;
  userRole?: UserRole;
};

// Create team data
export interface CreateTeamData {
  name: string;
  description?: string;
}

// Get teams params
export interface GetTeamsParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Add member data
export interface AddMemberData {
  email: string;
  role: UserRole;
}

class TeamService {
  /**
   * Get all teams for a user with pagination, search, and sorting
   */
  async getUserTeams(
    userId: string,
    params?: GetTeamsParams
  ): Promise<{
    teams: TeamWithMembers[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = (page - 1) * limit;
    const search = params?.search;
    const sortBy: SortField = ALLOWED_SORT_FIELDS.includes(params?.sortBy as SortField)
      ? (params?.sortBy as SortField)
      : 'createdAt';
    const sortOrder = params?.sortOrder ?? 'desc';

    const where = {
      members: {
        some: { userId },
      },
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [teams, total] = await Promise.all([
      prisma.team.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          createdAt: true,
          createdBy: true,
          updatedAt: true,
          updatedBy: true,
          members: {
            select: {
              id: true,
              teamId: true,
              userId: true,
              role: true,
              joinedAt: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true,
                },
              },
            },
          },
          creator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      prisma.team.count({ where }),
    ]);

    const teamsWithMemberCountAndRole = teams.map((team) => {
      const userMember = team.members.find((m) => m.userId === userId);
      return {
        ...team,
        memberCount: team.members.length,
        userRole: userMember?.role,
      };
    });

    return {
      teams: teamsWithMemberCountAndRole,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get team by ID
   */
  async getTeamById(teamId: string, userId: string): Promise<TeamWithMembers> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        members: {
          select: {
            id: true,
            teamId: true,
            userId: true,
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundError('Team');
    }

    const teamWithMemberCount = {
      ...team,
      memberCount: team.members.length,
    };

    // Check if user is a member
    const isMember = team.members.some((m) => m.userId === userId);
    if (!isMember) {
      throw new ForbiddenError('You are not a member of this team');
    }

    return teamWithMemberCount;
  }

  /**
   * Create a new team
   */
  async createTeam(userId: string, data: CreateTeamData): Promise<TeamWithMembers> {
    const teamId = generateUUIDv7();
    const memberId = generateUUIDv7();

    const team = await prisma.team.create({
      data: {
        id: teamId,
        name: data.name,
        description: data.description,
        createdBy: userId,
        members: {
          create: {
            id: memberId,
            userId,
            role: 'PRODUCT_OWNER',
            createdBy: userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        members: {
          select: {
            id: true,
            teamId: true,
            userId: true,
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    // Create notification for the team creator
    const creator = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    if (creator) {
      try {
        await prisma.notification.create({
          data: {
            id: generateUUIDv7(),
            userId,
            type: NotificationType.TEAM_CREATED,
            title: `Team created: "${team.name}"`,
            message: `You have successfully created the team`,
            data: {
              teamId: team.id,
              teamName: team.name,
            } as Prisma.InputJsonValue,
            createdBy: userId,
          },
        });
      } catch (error) {
        logger.error('Failed to create team creation notification', { error });
      }
    }

    const teamWithMemberCount = {
      ...team,
      memberCount: team.members.length,
    };

    return teamWithMemberCount as TeamWithMembers;
  }

  /**
   * Update team
   */
  async updateTeam(
    teamId: string,
    userId: string,
    data: Partial<CreateTeamData>
  ): Promise<TeamWithMembers> {
    const team = await prisma.team.update({
      where: { id: teamId },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        createdBy: true,
        updatedAt: true,
        updatedBy: true,
        members: {
          select: {
            id: true,
            teamId: true,
            userId: true,
            role: true,
            joinedAt: true,
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    const updater = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (updater && team.members.length > 0) {
      const membersToNotify = team.members.filter((member) => member.userId !== userId);

      if (membersToNotify.length > 0) {
        const notificationData = membersToNotify.map((member) => ({
          id: generateUUIDv7(),
          userId: member.userId,
          type: NotificationType.TEAM_UPDATED,
          title: `Team updated: "${team.name}"`,
          message: `Updated by ${updater.firstName} ${updater.lastName}`,
          data: {
            teamId: team.id,
            teamName: team.name,
          } as Prisma.InputJsonValue,
          createdBy: userId,
        }));

        try {
          await prisma.notification.createMany({ data: notificationData });
        } catch (error) {
          logger.error('Failed to create team update notifications', { error });
        }
      }
    }

    const teamWithMemberCount = {
      ...team,
      memberCount: team.members.length,
    };

    return teamWithMemberCount;
  }

  /**
   * Delete team
   */
  async deleteTeam(teamId: string, userId: string): Promise<void> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        productGoals: true,
        members: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundError('Team');
    }

    if ((team.productGoals ?? []).length > 0) {
      throw new ConflictError(
        'Cannot delete team with existing product goals. Please delete all product goals associated with this team first.'
      );
    }

    const deleter = await prisma.user.findUnique({ where: { id: userId } });

    if (deleter && team.members.length > 0) {
      const membersToNotify = team.members.filter((member: TeamMember) => member.userId !== userId);

      if (membersToNotify.length > 0) {
        const notificationData = membersToNotify.map((member: TeamMember) => ({
          id: generateUUIDv7(),
          userId: member.userId,
          type: NotificationType.TEAM_DELETED,
          title: `Team deleted: "${team.name}"`,
          message: `Deleted by ${deleter.firstName} ${deleter.lastName}`,
          data: {
            teamId: team.id,
            teamName: team.name,
          } as Prisma.InputJsonValue,
          createdBy: userId,
        }));

        try {
          await prisma.notification.createMany({ data: notificationData });
        } catch (error) {
          logger.error('Failed to create team deletion notifications', { error });
        }
      }
    }

    await prisma.team.delete({
      where: { id: teamId },
    });
  }

  /**
   * Add member to team
   */
  async addMember(
    teamId: string,
    userId: string,
    data: AddMemberData
  ): Promise<TeamMember & { user: User }> {
    // Check if user is Product Owner or Scrum Master
    await this.checkTeamRole(teamId, userId, ['PRODUCT_OWNER', 'SCRUM_MASTER']);

    // Find user by email
    const userToAdd = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!userToAdd) {
      throw new NotFoundError('User with this email');
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: userToAdd.id,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError('User is already a team member');
    }

    const memberId = generateUUIDv7();

    const member = await prisma.teamMember.create({
      data: {
        id: memberId,
        teamId,
        userId: userToAdd.id,
        role: data.role,
        createdBy: userId,
      },
      include: {
        user: true,
        team: true,
      },
    });

    // Create notification for the invited user
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    const inviter = await prisma.user.findUnique({ where: { id: userId } });

    if (team && inviter) {
      await notificationService.create({
        userId: userToAdd.id,
        type: NotificationType.TEAM_INVITATION,
        title: `You've been invited to join team "${team.name}"`,
        message: `Invited by ${inviter.firstName} ${inviter.lastName}`,
        data: { teamId: team.id, teamName: team.name },
        createdBy: userId,
      });
    }

    return member;
  }

  /**
   * Remove member from team
   */
  async removeMember(teamId: string, userId: string, memberId: string): Promise<void> {
    await this.checkTeamRole(teamId, userId, ['PRODUCT_OWNER', 'SCRUM_MASTER']);

    const memberToRemove = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });

    if (!memberToRemove) {
      throw new NotFoundError('Team member');
    }

    if (memberToRemove.userId === userId) {
      throw new ForbiddenError(
        'You cannot remove yourself from the team. Please contact another Scrum Master or Administrator.'
      );
    }

    const assignedTasks = await prisma.task.count({
      where: {
        assigneeId: memberToRemove.userId,
        sprint: { teamId },
      },
    });

    if (assignedTasks > 0) {
      throw new ConflictError(
        `Cannot remove team member. This user has ${assignedTasks} task${assignedTasks > 1 ? 's' : ''} assigned. Please reassign or complete these tasks before removing the member.`
      );
    }

    // Get team and remover info before deletion
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    const remover = await prisma.user.findUnique({ where: { id: userId } });
    const removedUserId = memberToRemove.userId;

    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    // Create notification for the removed user
    if (team && remover) {
      await notificationService.create({
        userId: removedUserId,
        type: NotificationType.TEAM_REMOVAL,
        title: `You've been removed from team "${team.name}"`,
        message: `Removed by ${remover.firstName} ${remover.lastName}`,
        data: { teamId: team.id, teamName: team.name },
        createdBy: userId,
      });
    }
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    teamId: string,
    userId: string,
    memberId: string,
    role: UserRole
  ): Promise<TeamMember> {
    // Check if user is Scrum Master
    await this.checkTeamRole(teamId, userId, ['SCRUM_MASTER']);

    const member = await prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
    });

    return member;
  }

  /**
   * Check if user has required role in team
   */
  private async checkTeamRole(
    teamId: string,
    userId: string,
    roles: UserRole[]
  ): Promise<TeamMember> {
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!member || !roles.includes(member.role)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    return member;
  }

  /**
   * Check if user has required global role
   */
  /**
   * Get user's role in a specific team
   */
  async getUserRoleInTeam(userId: string, teamId: string): Promise<UserRole | null> {
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    return member?.role ?? null;
  }

  /**
   * Validate user is a member of team
   */
  async validateTeamMembership(userId: string, teamId: string): Promise<boolean> {
    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    return !!member;
  }

  /**
   * Get user's teams with their roles
   */
  async getUserTeamsWithRoles(userId: string): Promise<
    (Team & {
      userRole: UserRole;
      memberCount: number;
      members: (TeamMember & { user: User })[];
    })[]
  > {
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return teams
      .filter((team) => team.members.length > 0)
      .map((team) => {
        const userMember = team.members.find((m) => m.userId === userId);
        if (!userMember) {
          throw new NotFoundError('User is not a member of the team');
        }
        return {
          ...team,
          userRole: userMember.role,
          memberCount: team.members.length,
        };
      });
  }
}

export const teamService = new TeamService();
export default teamService;
