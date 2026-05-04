import prisma from '../utils/prisma';
import { NotFoundError, BadRequestError } from '../utils/errors';
import { generateUUIDv7 } from '../utils/uuid';
import { logger } from '../utils/logger';
import { NotificationService } from './notification.service';
import { NotificationType, type FeedbackCategory } from '../generated/prisma/client';

interface CreateReviewData {
  sprintId: string;
  teamId: string;
  incrementId?: string;
  reviewDate: Date;
  summary?: string;
}

interface UpdateReviewData {
  summary?: string;
  reviewDate?: Date;
  status?: string;
  attendees?: Array<{
    name: string;
    email?: string;
    role: string;
    attended: boolean;
  }>;
  feedback?: Array<{
    id?: string;
    authorName: string;
    content: string;
    category: string;
    relatedPbiId?: string;
    actionRequired?: boolean;
    actionTaken?: boolean;
    ownerId?: string;
  }>;
  backlogAdjustments?: Array<{
    id?: string;
    action: string;
    description: string;
    reason: string;
    pbiId?: string;
    implemented?: boolean;
    ownerId?: string;
  }>;
}

interface AddFeedbackData {
  authorName: string;
  content: string;
  category: string;
  relatedPbiId?: string;
  actionRequired?: boolean;
  ownerId?: string;
}

const categoryMap: Record<string, FeedbackCategory> = {
  positive: 'POSITIVE',
  negative: 'NEGATIVE',
  suggestion: 'SUGGESTION',
  question: 'QUESTION',
};

export const sprintReviewService = {
  async getSprintReviews(teamId: string, sprintId?: string) {
    const where: { teamId: string; sprintId?: string } = { teamId };
    if (sprintId) {
      where.sprintId = sprintId;
    }

    const reviews = await prisma.sprintReview.findMany({
      where,
      include: {
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
            goal: true,
          },
        },
        attendees: true,
        feedback: {
          include: {
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
        backlogAdjustments: {
          include: {
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
      orderBy: {
        reviewDate: 'desc',
      },
    });

    return reviews.map((review) => ({
      ...review,
      attendees: review.attendees.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        role: a.role,
        attended: a.attended,
      })),
      feedback: review.feedback.map((f) => ({
        ...f,
        category: f.category.toLowerCase(),
      })),
    }));
  },

  async getSprintReviewById(id: string) {
    const review = await prisma.sprintReview.findUnique({
      where: { id },
      include: {
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
            goal: true,
          },
        },
        attendees: true,
        feedback: {
          include: {
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
        backlogAdjustments: {
          include: {
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

    if (!review) {
      throw new NotFoundError('Sprint Review');
    }

    const increment = review.incrementId
      ? await prisma.increment.findUnique({
          where: { id: review.incrementId },
          include: {
            pbis: {
              include: {
                pbi: {
                  select: {
                    id: true,
                    title: true,
                    storyPoints: true,
                    status: true,
                  },
                },
              },
            },
          },
        })
      : null;

    return {
      ...review,
      attendees: review.attendees.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        role: a.role,
        attended: a.attended,
      })),
      feedback: review.feedback.map((f) => ({
        ...f,
        category: f.category.toLowerCase(),
      })),
      increment: increment
        ? {
            ...increment,
            pbis: increment.pbis.map((p) => p.pbi),
          }
        : null,
    };
  },

  async createSprintReview(userId: string, data: CreateReviewData) {
    const sprint = await prisma.sprint.findUnique({
      where: { id: data.sprintId },
    });

    if (!sprint) {
      throw new NotFoundError('Sprint');
    }

    const existingReview = await prisma.sprintReview.findUnique({
      where: { sprintId: data.sprintId },
    });

    if (existingReview) {
      throw new BadRequestError('A sprint review already exists for this sprint');
    }

    let incrementId = data.incrementId;
    if (!incrementId) {
      const increment = await prisma.increment.findFirst({
        where: {
          sprintId: data.sprintId,
          status: { in: ['DELIVERED', 'VERIFIED'] },
        },
      });
      if (increment) {
        incrementId = increment.id;
      }
    }

    if (!incrementId) {
      throw new BadRequestError('No delivered increment found for this sprint');
    }

    const reviewId = generateUUIDv7();

    const review = await prisma.sprintReview.create({
      data: {
        id: reviewId,
        sprintId: data.sprintId,
        teamId: data.teamId,
        incrementId,
        reviewDate: data.reviewDate,
        summary: data.summary,
        createdBy: userId,
      },
      include: {
        sprint: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        attendees: true,
        feedback: true,
        backlogAdjustments: true,
      },
    });

    return {
      ...review,
      attendees: [],
      feedback: [],
      backlogAdjustments: [],
    };
  },

  async updateSprintReview(id: string, userId: string | undefined, data: UpdateReviewData) {
    logger.debug('Updating sprint review', { id, userId });

    const existing = await prisma.sprintReview.findUnique({
      where: { id },
      include: {
        attendees: true,
        feedback: true,
        backlogAdjustments: true,
      },
    });

    if (!existing) {
      logger.warn('Sprint Review not found', { id });
      throw new NotFoundError('Sprint Review');
    }

    const updateData: {
      summary?: string;
      reviewDate?: Date;
      status?: string;
      updatedBy?: string;
    } = {};

    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.reviewDate !== undefined) updateData.reviewDate = data.reviewDate;
    if (data.status !== undefined) updateData.status = data.status;
    if (userId) updateData.updatedBy = userId;

    logger.debug('Applying review update', {
      id,
      fields: Object.keys(updateData),
    });

    await prisma.sprintReview.update({
      where: { id },
      data: updateData,
    });

    if (data.attendees !== undefined) {
      await prisma.reviewAttendee.deleteMany({
        where: { reviewId: id },
      });

      if (data.attendees.length > 0) {
        await prisma.reviewAttendee.createMany({
          data: data.attendees.map((attendee) => ({
            id: generateUUIDv7(),
            reviewId: id,
            name: attendee.name,
            email: attendee.email,
            role: attendee.role,
            attended: attendee.attended,
            createdBy: userId,
          })),
        });
      }
    }

    if (data.feedback !== undefined) {
      await prisma.stakeholderFeedback.deleteMany({
        where: { reviewId: id },
      });

      if (data.feedback.length > 0) {
        await prisma.stakeholderFeedback.createMany({
          data: data.feedback.map((f) => ({
            id: generateUUIDv7(),
            reviewId: id,
            authorName: f.authorName,
            content: f.content,
            category: categoryMap[f.category] ?? 'POSITIVE',
            relatedPbiId: f.relatedPbiId,
            actionRequired: f.actionRequired ?? false,
            actionTaken: f.actionTaken ?? false,
            ownerId: f.ownerId,
            createdBy: userId,
          })),
        });
      }
    }

    if (data.backlogAdjustments !== undefined) {
      await prisma.backlogAdjustment.deleteMany({
        where: { reviewId: id },
      });

      if (data.backlogAdjustments.length > 0) {
        const notificationService = new NotificationService();

        for (const adj of data.backlogAdjustments) {
          const adjustment = await prisma.backlogAdjustment.create({
            data: {
              id: generateUUIDv7(),
              reviewId: id,
              action: adj.action,
              description: adj.description,
              reason: adj.reason,
              pbiId: adj.pbiId,
              implemented: adj.implemented ?? false,
              ownerId: adj.ownerId,
              createdBy: userId,
            },
          });

          // Send notification to owner if assigned
          if (adj.ownerId && !adj.implemented) {
            try {
              await notificationService.create({
                userId: adj.ownerId,
                type: NotificationType.TASK_ASSIGNMENT,
                title: 'New Backlog Adjustment Requires Your Action',
                message: `You have been assigned as the owner of a backlog adjustment: ${adj.action.toUpperCase()} - "${adj.description.substring(0, 100)}${adj.description.length > 100 ? '...' : ''}"`,
                data: {
                  adjustmentId: adjustment.id,
                  reviewId: id,
                  action: adj.action,
                },
                createdBy: userId,
              });
              logger.debug('Notification sent to adjustment owner', {
                ownerId: adj.ownerId,
                adjustmentId: adjustment.id,
              });
            } catch (error) {
              logger.error('Failed to send notification to adjustment owner', {
                error,
                ownerId: adj.ownerId,
              });
            }
          }
        }
      }
    }

    const result = await this.getSprintReviewById(id);
    logger.debug('Sprint review updated successfully', { id });
    return result;
  },

  async addStakeholderFeedback(id: string, userId: string | undefined, data: AddFeedbackData) {
    const existing = await prisma.sprintReview.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Sprint Review');
    }

    const feedback = await prisma.stakeholderFeedback.create({
      data: {
        id: generateUUIDv7(),
        reviewId: id,
        authorName: data.authorName,
        content: data.content,
        category: categoryMap[data.category] ?? 'POSITIVE',
        relatedPbiId: data.relatedPbiId,
        actionRequired: data.actionRequired ?? false,
        actionTaken: false,
        ownerId: data.ownerId,
        createdBy: userId,
      },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    // Send notification to owner if assigned
    if (data.ownerId && data.actionRequired) {
      try {
        const notificationService = new NotificationService();
        await notificationService.create({
          userId: data.ownerId,
          type: NotificationType.TASK_ASSIGNMENT,
          title: 'New Feedback Requires Your Action',
          message: `You have been assigned as the owner of feedback from ${data.authorName}: "${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}"`,
          data: {
            feedbackId: feedback.id,
            reviewId: id,
            category: data.category,
          },
          createdBy: userId,
        });
        logger.debug('Notification sent to feedback owner', {
          ownerId: data.ownerId,
          feedbackId: feedback.id,
        });
      } catch (error) {
        logger.error('Failed to send notification to feedback owner', {
          error,
          ownerId: data.ownerId,
        });
      }
    }

    return {
      ...feedback,
      category: feedback.category.toLowerCase(),
    };
  },

  async deleteSprintReview(id: string) {
    const existing = await prisma.sprintReview.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Sprint Review');
    }

    await prisma.sprintReview.delete({
      where: { id },
    });
  },

  async getPendingAdjustments(teamId: string) {
    const reviews = await prisma.sprintReview.findMany({
      where: {
        teamId,
        status: 'completed',
      },
      include: {
        sprint: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        backlogAdjustments: {
          where: {
            implemented: false,
          },
        },
      },
      orderBy: {
        reviewDate: 'desc',
      },
    });

    const pendingAdjustments = reviews.flatMap((review) =>
      review.backlogAdjustments.map((adjustment) => ({
        ...adjustment,
        reviewId: review.id,
        reviewDate: review.reviewDate,
        sprint: review.sprint,
      }))
    );

    return pendingAdjustments;
  },

  async markAdjustmentImplemented(adjustmentId: string, userId: string | undefined) {
    const adjustment = await prisma.backlogAdjustment.findUnique({
      where: { id: adjustmentId },
    });

    if (!adjustment) {
      throw new NotFoundError('Backlog Adjustment');
    }

    const updated = await prisma.backlogAdjustment.update({
      where: { id: adjustmentId },
      data: {
        implemented: true,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    return updated;
  },

  async getPendingFeedback(teamId: string) {
    const reviews = await prisma.sprintReview.findMany({
      where: {
        teamId,
        status: 'completed',
      },
      include: {
        sprint: {
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
          },
        },
        feedback: {
          where: {
            actionRequired: true,
            actionTaken: false,
          },
        },
      },
      orderBy: {
        reviewDate: 'desc',
      },
    });

    const pendingFeedback = reviews.flatMap((review) =>
      review.feedback.map((feedback) => ({
        ...feedback,
        reviewId: review.id,
        reviewDate: review.reviewDate,
        sprint: review.sprint,
        category: feedback.category.toLowerCase(),
      }))
    );

    return pendingFeedback;
  },

  async markFeedbackAddressed(feedbackId: string, userId: string | undefined) {
    const feedback = await prisma.stakeholderFeedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      throw new NotFoundError('Stakeholder Feedback');
    }

    const updated = await prisma.stakeholderFeedback.update({
      where: { id: feedbackId },
      data: {
        actionTaken: true,
        updatedAt: new Date(),
        updatedBy: userId,
      },
    });

    return {
      ...updated,
      category: updated.category.toLowerCase(),
    };
  },

  async addAttendee(
    reviewId: string,
    userId: string | undefined,
    data: { name: string; email?: string; role: string; attended: boolean }
  ) {
    const review = await prisma.sprintReview.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundError('Sprint Review');
    }

    const attendee = await prisma.reviewAttendee.create({
      data: {
        id: generateUUIDv7(),
        reviewId,
        name: data.name,
        email: data.email,
        role: data.role,
        attended: data.attended ?? true,
        createdBy: userId,
      },
    });

    return {
      id: attendee.id,
      name: attendee.name,
      email: attendee.email,
      role: attendee.role,
      attended: attendee.attended,
    };
  },

  async updateAttendee(
    attendeeId: string,
    userId: string | undefined,
    data: { name?: string; email?: string; role?: string; attended?: boolean }
  ) {
    const attendee = await prisma.reviewAttendee.findUnique({
      where: { id: attendeeId },
    });

    if (!attendee) {
      throw new NotFoundError('Review Attendee');
    }

    const updated = await prisma.reviewAttendee.update({
      where: { id: attendeeId },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        attended: data.attended,
        updatedBy: userId,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      attended: updated.attended,
    };
  },

  async deleteAttendee(attendeeId: string) {
    const attendee = await prisma.reviewAttendee.findUnique({
      where: { id: attendeeId },
    });

    if (!attendee) {
      throw new NotFoundError('Review Attendee');
    }

    await prisma.reviewAttendee.delete({
      where: { id: attendeeId },
    });

    return { success: true };
  },
};
