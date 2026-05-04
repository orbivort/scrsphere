import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError, ConflictError } from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import { ImpedimentStatus, type DailyUpdate } from '../generated/prisma/client';

export interface CreateDailyUpdateData {
  sprintId: string;
  yesterdayWork?: string;
  todayWork?: string;
  impediment?: string;
}

export interface UpdateDailyUpdateData {
  yesterdayWork?: string;
  todayWork?: string;
  impediment?: string;
}

export interface DailyUpdateWithUser extends DailyUpdate {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  impedimentRecord?: {
    id: string;
    status: ImpedimentStatus;
    title: string;
    reportedBy: {
      id: string;
      firstName: string;
      lastName: string;
    };
    owner?: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  } | null;
}

class DailyUpdateService {
  async getDailyUpdates(sprintId: string, date?: string): Promise<DailyUpdateWithUser[]> {
    const whereClause: { sprintId: string; updateDate?: Date } = {
      sprintId,
    };

    if (date) {
      whereClause.updateDate = this.parseDate(date);
    }

    const updates = await prisma.dailyUpdate.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        impedimentRecord: {
          include: {
            reportedBy: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return updates;
  }

  private parseDate(dateStr: string): Date {
    const parts = dateStr.split('-').map(Number);
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    if (!year || !month || !day) {
      throw new BadRequestError('Invalid date format. Expected YYYY-MM-DD');
    }
    return new Date(year, month - 1, day);
  }

  private getTodayDate(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  async getDailyUpdateById(id: string): Promise<DailyUpdateWithUser | null> {
    const update = await prisma.dailyUpdate.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return update;
  }

  async createDailyUpdate(
    userId: string,
    data: CreateDailyUpdateData
  ): Promise<DailyUpdateWithUser> {
    const sprint = await prisma.sprint.findUnique({
      where: { id: data.sprintId },
    });

    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    const today = this.getTodayDate();

    const existingUpdate = await prisma.dailyUpdate.findUnique({
      where: {
        sprintId_userId_updateDate: {
          sprintId: data.sprintId,
          userId,
          updateDate: today,
        },
      },
    });

    if (existingUpdate) {
      throw new ConflictError(
        'Daily update already exists for today. Please edit your existing update.'
      );
    }

    const update = await prisma.dailyUpdate.create({
      data: {
        id: generateUUIDv7(),
        sprintId: data.sprintId,
        userId,
        updateDate: today,
        yesterdayWork: data.yesterdayWork || null,
        todayWork: data.todayWork || null,
        impediment: data.impediment || null,
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return update;
  }

  async updateDailyUpdate(
    id: string,
    userId: string,
    data: UpdateDailyUpdateData
  ): Promise<DailyUpdateWithUser> {
    const existingUpdate = await prisma.dailyUpdate.findUnique({
      where: { id },
    });

    if (!existingUpdate) {
      throw new NotFoundError('Daily update');
    }

    if (existingUpdate.userId !== userId) {
      throw new BadRequestError('You can only edit your own daily updates');
    }

    const update = await prisma.dailyUpdate.update({
      where: { id },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return update;
  }

  async deleteDailyUpdate(id: string, userId: string): Promise<void> {
    const existingUpdate = await prisma.dailyUpdate.findUnique({
      where: { id },
    });

    if (!existingUpdate) {
      throw new NotFoundError('Daily update');
    }

    if (existingUpdate.userId !== userId) {
      throw new BadRequestError('You can only delete your own daily updates');
    }

    await prisma.dailyUpdate.delete({
      where: { id },
    });
  }

  async getTeamMembersWithUpdates(
    sprintId: string,
    date: string
  ): Promise<{
    submitted: DailyUpdateWithUser[];
    pending: Array<{ userId: string; userName: string }>;
  }> {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    const updateDate = this.parseDate(date);
    const updates = await prisma.dailyUpdate.findMany({
      where: {
        sprintId,
        updateDate,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const submittedUserIds = new Set(updates.map((u) => u.userId));

    const pendingMembers = (sprint.team?.members || [])
      .filter((m) => !submittedUserIds.has(m.userId))
      .map((m) => ({
        userId: m.userId,
        userName: `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim(),
      }));

    return {
      submitted: updates,
      pending: pendingMembers,
    };
  }

  async promoteToImpediment(
    dailyUpdateId: string,
    userId: string,
    data: {
      title: string;
      description: string;
      ownerId?: string;
      teamId: string;
      sprintId?: string;
    }
  ): Promise<{ dailyUpdate: DailyUpdateWithUser; impediment: any }> {
    const dailyUpdate = await prisma.dailyUpdate.findUnique({
      where: { id: dailyUpdateId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        impedimentRecord: true,
      },
    });

    if (!dailyUpdate) {
      throw new NotFoundError('Daily update');
    }

    if (!dailyUpdate.impediment) {
      throw new BadRequestError('No impediment text to promote');
    }

    if (dailyUpdate.impedimentRecord) {
      throw new BadRequestError('Impediment already created from this daily update');
    }

    const result = await prisma.$transaction(async (tx) => {
      const impediment = await tx.impediment.create({
        data: {
          id: crypto.randomUUID(),
          teamId: data.teamId,
          sprintId: data.sprintId || dailyUpdate.sprintId,
          title: data.title,
          description: data.description,
          reportedById: dailyUpdate.userId,
          ownerId: data.ownerId,
          status: ImpedimentStatus.OPEN,
          dailyUpdateId: dailyUpdate.id,
          createdBy: userId,
        },
        include: {
          reportedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          sprint: {
            select: {
              id: true,
              name: true,
            },
          },
          dailyUpdate: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      const updatedDailyUpdate = await prisma.dailyUpdate.findUnique({
        where: { id: dailyUpdateId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          impedimentRecord: {
            include: {
              reportedBy: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
              owner: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      return { impediment, dailyUpdate: updatedDailyUpdate! };
    });

    return result;
  }
}

export const dailyUpdateService = new DailyUpdateService();
export default dailyUpdateService;
