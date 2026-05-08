import prisma from '../utils/prisma';
import { ImpedimentStatus, NotificationType } from '../generated/prisma/client';
import { generateUUIDv7 } from '../utils/uuid';

interface CreateImpedimentInput {
  teamId: string;
  sprintId?: string;
  title: string;
  description: string;
  ownerId?: string;
  reportedById: string;
}

interface UpdateImpedimentInput {
  status?: ImpedimentStatus;
  resolution?: string;
  ownerId?: string;
}

class ImpedimentService {
  async getImpedimentsByTeam(teamId: string) {
    return await prisma.impediment.findMany({
      where: { teamId },
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
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getImpedimentById(id: string, teamId: string) {
    return await prisma.impediment.findFirst({
      where: { id, teamId },
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
              },
            },
          },
        },
      },
    });
  }

  async createImpediment(data: CreateImpedimentInput) {
    const impediment = await prisma.impediment.create({
      data: {
        id: crypto.randomUUID(),
        teamId: data.teamId,
        sprintId: data.sprintId,
        title: data.title,
        description: data.description,
        reportedById: data.reportedById,
        ownerId: data.ownerId,
        status: ImpedimentStatus.OPEN,
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
              },
            },
          },
        },
      },
    });

    // Create notification if owner is assigned and not the reporter
    if (data.ownerId && data.ownerId !== data.reportedById) {
      const reporter = await prisma.user.findUnique({
        where: { id: data.reportedById },
      });
      if (reporter) {
        await prisma.notification.create({
          data: {
            id: generateUUIDv7(),
            userId: data.ownerId,
            type: NotificationType.IMPEDIMENT_ASSIGNMENT,
            title: `New impediment assigned: "${impediment.title}"`,
            message: `Reported by ${reporter.firstName} ${reporter.lastName}`,
            data: {
              impedimentId: impediment.id,
              teamId: impediment.teamId,
            },
            createdBy: data.reportedById,
          },
        });
      }
    }

    return impediment;
  }

  async updateImpediment(id: string, _teamId: string, updates: UpdateImpedimentInput) {
    const updateData: {
      status?: ImpedimentStatus;
      resolution?: string;
      ownerId?: string;
      resolvedAt?: Date | null;
    } = { ...updates };

    if (updates.status === ImpedimentStatus.RESOLVED && !updates.resolution) {
      throw new Error('Resolution is required when marking impediment as resolved');
    }

    if (updates.status === ImpedimentStatus.RESOLVED) {
      updateData.resolvedAt = new Date();
    }

    if (updates.status && updates.status !== ImpedimentStatus.RESOLVED) {
      updateData.resolvedAt = null;
    }

    return await prisma.impediment.update({
      where: { id },
      data: updateData,
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
              },
            },
          },
        },
      },
    });
  }

  async deleteImpediment(id: string, teamId: string) {
    await prisma.impediment.deleteMany({
      where: { id, teamId },
    });
  }

  async getImpedimentStats(teamId: string) {
    const impediments = await prisma.impediment.findMany({
      where: { teamId },
      select: { status: true },
    });

    return {
      open: impediments.filter((i: { status: string }) => i.status === ImpedimentStatus.OPEN)
        .length,
      inProgress: impediments.filter(
        (i: { status: string }) => i.status === ImpedimentStatus.IN_PROGRESS
      ).length,
      resolved: impediments.filter(
        (i: { status: string }) => i.status === ImpedimentStatus.RESOLVED
      ).length,
      closed: impediments.filter((i: { status: string }) => i.status === ImpedimentStatus.CLOSED)
        .length,
    };
  }
}

export const impedimentService = new ImpedimentService();
