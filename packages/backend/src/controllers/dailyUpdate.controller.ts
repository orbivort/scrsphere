import { type Request, type Response } from 'express';
import { dailyUpdateService } from '../services/dailyUpdate.service';
import { asyncHandler, createSuccessResponse, BadRequestError } from '../utils/errors';
import { NotificationType } from '../generated/prisma/client';
import prisma from '../utils/prisma';
import { generateUUIDv7 } from '../utils/uuid';
import { getParamValue } from '../utils/validation';
import { logger } from '../utils/logger';

export const getDailyUpdates = asyncHandler(async (req: Request, res: Response) => {
  const sprintId = getParamValue(req.params.sprintId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  const { date } = req.query;

  const updates = await dailyUpdateService.getDailyUpdates(sprintId, date as string | undefined);
  res.json(createSuccessResponse(updates));
});

export const getDailyUpdateById = asyncHandler(async (req: Request, res: Response) => {
  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Daily update ID is required');
  }
  const update = await dailyUpdateService.getDailyUpdateById(id);

  if (!update) {
    res.json(createSuccessResponse(null));
    return;
  }

  res.json(createSuccessResponse(update));
});

export const createDailyUpdate = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const sprintId = getParamValue(req.params.sprintId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  const { yesterdayWork, todayWork, impediment } = req.body;

  const update = await dailyUpdateService.createDailyUpdate(userId, {
    sprintId,
    yesterdayWork,
    todayWork,
    impediment,
  });

  res.status(201).json(createSuccessResponse(update));
});

export const updateDailyUpdate = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Daily update ID is required');
  }
  const { yesterdayWork, todayWork, impediment } = req.body;

  const update = await dailyUpdateService.updateDailyUpdate(id, userId, {
    yesterdayWork,
    todayWork,
    impediment,
  });

  res.json(createSuccessResponse(update));
});

export const deleteDailyUpdate = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Daily update ID is required');
  }
  await dailyUpdateService.deleteDailyUpdate(id, userId);

  res.json(createSuccessResponse({ message: 'Daily update deleted successfully' }));
});

export const getTeamMembersWithUpdates = asyncHandler(async (req: Request, res: Response) => {
  const sprintId = getParamValue(req.params.sprintId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }
  const { date } = req.query;

  if (!date) {
    res.json(createSuccessResponse({ submitted: [], pending: [] }));
    return;
  }

  const result = await dailyUpdateService.getTeamMembersWithUpdates(sprintId, date as string);
  res.json(createSuccessResponse(result));
});

export const promoteToImpediment = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const id = getParamValue(req.params.id);
  if (!id) {
    throw new BadRequestError('Daily update ID is required');
  }
  const { title, description, ownerId, teamId, sprintId } = req.body;

  const result = await dailyUpdateService.promoteToImpediment(id, userId, {
    title,
    description,
    ownerId,
    teamId,
    sprintId,
  });

  res.status(201).json(createSuccessResponse(result));
});

export const sendReminder = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new BadRequestError('User not authenticated');
  }

  const sprintId = getParamValue(req.params.sprintId);
  if (!sprintId) {
    throw new BadRequestError('Sprint ID is required');
  }

  const sprint = await prisma.sprint.findUnique({
    where: { id: sprintId },
    include: { team: true },
  });

  if (!sprint) {
    throw new BadRequestError('Sprint not found');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const teamMembers = await prisma.teamMember.findMany({
    where: {
      teamId: sprint.teamId,
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

  const submittedUpdates = await prisma.dailyUpdate.findMany({
    where: {
      sprintId,
      createdAt: {
        gte: today,
      },
    },
    select: {
      userId: true,
    },
  });

  const submittedUserIds = new Set(submittedUpdates.map((update) => update.userId));

  const pendingMembers = teamMembers.filter((member) => !submittedUserIds.has(member.userId));

  if (pendingMembers.length === 0) {
    res.json(
      createSuccessResponse({
        sentCount: 0,
        message: 'All team members have submitted their updates',
      })
    );
    return;
  }

  const sender = await prisma.user.findUnique({
    where: { id: userId },
  });

  let successCount = 0;
  const errors: string[] = [];

  for (const member of pendingMembers) {
    try {
      await prisma.notification.create({
        data: {
          id: generateUUIDv7(),
          userId: member.userId,
          type: NotificationType.DAILY_UPDATE_REMINDER,
          title: 'Daily update reminder',
          message: sender
            ? `${sender.firstName} ${sender.lastName} reminded you to submit your daily update`
            : "Don't forget to submit your daily update!",
          data: {
            sprintId,
            sprintName: sprint.name,
            teamId: sprint.teamId,
          } as any,
          createdBy: userId,
        },
      });
      successCount++;
    } catch (error) {
      logger.error('Failed to send reminder', {
        userId: member.userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      errors.push(`Failed to send reminder to ${member.user.firstName} ${member.user.lastName}`);
    }
  }

  res.json(
    createSuccessResponse({
      sentCount: successCount,
      totalPending: pendingMembers.length,
      message:
        successCount > 0
          ? `Reminders sent to ${successCount} team member${successCount > 1 ? 's' : ''}`
          : 'No reminders sent',
      errors: errors.length > 0 ? errors : undefined,
    })
  );
});
