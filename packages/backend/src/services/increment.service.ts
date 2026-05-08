import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import { sprintReviewService } from './sprintReview.service';
import { logger } from '../utils/logger';
import type { IncrementStatus, DeliveryMethod } from '../generated/prisma/client';

interface CreateIncrementData {
  name: string;
  description?: string;
  sprintId: string;
  teamId: string;
  includedPBIs: string[];
  totalStoryPoints: number;
  status?: string;
  createdBy?: string;
}

interface UpdateIncrementData {
  name?: string;
  description?: string;
  includedPBIs?: string[];
  totalStoryPoints?: number;
  status?: string;
}

export const incrementService = {
  async getIncrements(teamId: string, sprintId?: string) {
    const where: { teamId: string; sprintId?: string } = { teamId };
    if (sprintId) {
      where.sprintId = sprintId;
    }

    const increments = await prisma.increment.findMany({
      where,
      include: {
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        pbis: {
          include: {
            pbi: {
              select: {
                id: true,
                title: true,
                storyPoints: true,
                status: true,
                labels: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return increments.map((inc) => ({
      ...inc,
      includedPBIs: inc.pbis.map((p) => p.pbiId),
      pbis: inc.pbis.map((p) => p.pbi),
    }));
  },

  async getIncrementById(id: string) {
    const increment = await prisma.increment.findUnique({
      where: { id },
      include: {
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        pbis: {
          include: {
            pbi: {
              select: {
                id: true,
                title: true,
                description: true,
                storyPoints: true,
                status: true,
                labels: true,
              },
            },
          },
        },
      },
    });

    if (!increment) {
      throw new NotFoundError('Increment');
    }

    const pbiIds = increment.pbis.map((p) => p.pbiId);

    const dodVerifications = await prisma.doDChecklistVerification.findMany({
      where: {
        pbiId: { in: pbiIds },
      },
      include: {
        dodItem: {
          select: {
            id: true,
            description: true,
            category: true,
          },
        },
        verifier: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const dodVerificationsWithDescription = dodVerifications.map((v) => ({
      id: v.id,
      pbiId: v.pbiId,
      dodItemId: v.dodItemId,
      isVerified: v.isVerified,
      verifiedBy: v.verifiedBy,
      verifiedAt: v.verifiedAt.toISOString(),
      notes: v.notes,
      dodItemDescription: v.dodItem.description,
      dodItemCategory: v.dodItem.category,
      verifierName: v.verifier ? `${v.verifier.firstName} ${v.verifier.lastName}` : null,
    }));

    return {
      ...increment,
      includedPBIs: increment.pbis.map((p) => p.pbiId),
      pbis: increment.pbis.map((p) => p.pbi),
      dodVerifications: dodVerificationsWithDescription,
    };
  },

  async createIncrement(userId: string, data: CreateIncrementData) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: data.sprintId },
    });

    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    const incrementId = generateUUIDv7();
    const statusValue = (data.status as IncrementStatus) ?? 'DRAFT';

    await prisma.increment.create({
      data: {
        id: incrementId,
        name: data.name,
        description: data.description,
        sprintId: data.sprintId,
        teamId: data.teamId,
        totalStoryPoints: data.totalStoryPoints,
        status: statusValue,
        createdBy: data.createdBy ?? userId,
      },
    });

    if (data.includedPBIs.length > 0) {
      await prisma.incrementPBI.createMany({
        data: data.includedPBIs.map((pbiId) => ({
          id: generateUUIDv7(),
          incrementId,
          pbiId,
        })),
      });
    }

    return this.getIncrementById(incrementId);
  },

  async updateIncrement(id: string, data: UpdateIncrementData) {
    const existing = await prisma.increment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Increment');
    }

    if (existing.status === 'DELIVERED') {
      throw new BadRequestError('Cannot update a delivered increment');
    }

    const updateData: {
      name?: string;
      description?: string;
      totalStoryPoints?: number;
      status?: IncrementStatus;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.totalStoryPoints !== undefined) updateData.totalStoryPoints = data.totalStoryPoints;
    if (data.status !== undefined) updateData.status = data.status.toUpperCase() as IncrementStatus;

    await prisma.increment.update({
      where: { id },
      data: updateData,
    });

    if (data.includedPBIs !== undefined) {
      await prisma.incrementPBI.deleteMany({
        where: { incrementId: id },
      });

      if (data.includedPBIs.length > 0) {
        await prisma.incrementPBI.createMany({
          data: data.includedPBIs.map((pbiId) => ({
            id: generateUUIDv7(),
            incrementId: id,
            pbiId,
          })),
        });
      }
    }

    return this.getIncrementById(id);
  },

  async deliverIncrement(id: string, deliveryMethod: string, notes?: string, userId?: string) {
    const existing = await prisma.increment.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Increment');
    }

    if (existing.status === 'DELIVERED') {
      throw new BadRequestError('Increment is already delivered');
    }

    await prisma.increment.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        deliveryMethod: deliveryMethod.toUpperCase() as DeliveryMethod,
        notes,
      },
    });

    if (
      deliveryMethod.toLowerCase() === 'sprint_review' &&
      existing.sprintId &&
      existing.teamId &&
      userId
    ) {
      try {
        const existingReview = await prisma.sprintReview.findUnique({
          where: { sprintId: existing.sprintId },
        });

        if (!existingReview) {
          const sprint = await prisma.sprint.findUnique({
            where: { id: existing.sprintId },
            select: { name: true },
          });

          const summary = sprint?.name
            ? `Sprint Review for ${sprint.name}`
            : 'Sprint Review created automatically upon increment delivery.';

          await sprintReviewService.createSprintReview(userId, {
            sprintId: existing.sprintId,
            teamId: existing.teamId,
            incrementId: id,
            reviewDate: new Date(),
            summary,
          });
        }
      } catch (error) {
        // Auto-creation failure should not block increment delivery
        // The review can be created manually if needed
        logger.warn('Failed to auto-create sprint review', { error, incrementId: id });
      }
    }

    return this.getIncrementById(id);
  },

  async getIncrementMetrics(teamId: string) {
    const increments = await prisma.increment.findMany({
      where: { teamId },
      select: {
        status: true,
        totalStoryPoints: true,
        deliveryMethod: true,
        createdAt: true,
        deliveredAt: true,
      },
    });

    const totalIncrements = increments.length;
    const deliveredIncrements = increments.filter((i) => i.status === 'DELIVERED').length;
    const earlyReleases = increments.filter((i) => i.deliveryMethod === 'EARLY_RELEASE').length;
    const sprintReviewDeliveries = increments.filter(
      (i) => i.deliveryMethod === 'SPRINT_REVIEW'
    ).length;

    const deliveredWithDates = increments.filter(
      (i) => i.status === 'DELIVERED' && i.deliveredAt && i.createdAt
    );

    let averageDeliveryTime = 0;
    if (deliveredWithDates.length > 0) {
      const totalDays = deliveredWithDates.reduce((sum, i) => {
        const created = new Date(i.createdAt).getTime();
        const delivered = i.deliveredAt ? new Date(i.deliveredAt).getTime() : created;
        return sum + (delivered - created) / (1000 * 60 * 60 * 24);
      }, 0);
      averageDeliveryTime = Math.round(totalDays / deliveredWithDates.length);
    }

    const totalStoryPoints = increments.reduce((sum, i) => sum + i.totalStoryPoints, 0);
    const averageStoryPoints =
      totalIncrements > 0 ? Math.round(totalStoryPoints / totalIncrements) : 0;

    return {
      totalIncrements,
      deliveredIncrements,
      averageDeliveryTime,
      averageStoryPoints,
      earlyReleases,
      sprintReviewDeliveries,
    };
  },
};
