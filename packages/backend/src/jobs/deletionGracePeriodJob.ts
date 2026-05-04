import cron from 'node-cron';
import crypto from 'node:crypto';
import prisma from '../utils/prisma';
import logger from '../utils/logger';

const EXPIRY_THRESHOLD_DAYS = 7;
const DELETION_GRACE_PERIOD_CRON = '0 3 * * *';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 100;
const MAX_CONSECUTIVE_FAILURES = 5;

type ReminderType = 'mid-grace' | 'final-day';

interface NotificationData {
  reminderType: ReminderType;
  scheduledDeletionId: string;
  teamId: string;
  [key: string]: string | undefined;
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('connection') ||
      message.includes('timeout') ||
      message.includes('econnrefused') ||
      message.includes('econnreset') ||
      message.includes('etimedout') ||
      message.includes('database') ||
      message.includes('unavailable')
    );
  }
  return false;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  operationName: string,
  context: Record<string, unknown>
): Promise<{ success: boolean; result?: T; error?: Error }> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await operation();
      return { success: true, result };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!isRetryableError(error) || attempt === MAX_RETRIES) {
        logger.error(`${operationName} failed`, {
          ...context,
          attempt,
          maxRetries: MAX_RETRIES,
          error: lastError.message,
          stack: lastError.stack,
        });
        return { success: false, error: lastError };
      }

      const delay = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      logger.warn(`${operationName} failed, retrying`, {
        ...context,
        attempt,
        maxRetries: MAX_RETRIES,
        delayMs: delay,
        error: lastError.message,
      });

      await sleep(delay);
    }
  }

  return { success: false, error: lastError };
}

async function hasReminderBeenSent(
  scheduledDeletionId: string,
  reminderType: ReminderType
): Promise<boolean> {
  const result = await retryWithBackoff(
    () =>
      prisma.notification.findFirst({
        where: {
          type: 'ACCOUNT_DELETION_SCHEDULED',
          AND: [
            {
              data: {
                path: ['scheduledDeletionId'],
                equals: scheduledDeletionId,
              },
            },
            {
              data: {
                path: ['reminderType'],
                equals: reminderType,
              },
            },
          ],
        },
      }),
    'hasReminderBeenSent',
    { scheduledDeletionId, reminderType }
  );

  if (!result.success) {
    throw result.error;
  }

  return !!result.result;
}

async function sendReminderNotifications(
  deletion: {
    id: string;
    userId: string;
    scheduledDeletionAt: Date;
    blockedTeamIds: string[];
  },
  reminderType: ReminderType,
  daysText: string
): Promise<number> {
  if (await hasReminderBeenSent(deletion.id, reminderType)) {
    return 0;
  }

  let notificationsSent = 0;
  let consecutiveFailures = 0;

  for (const teamId of deletion.blockedTeamIds) {
    if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      logger.error('Circuit breaker triggered: too many consecutive failures', {
        deletionId: deletion.id,
        reminderType,
        consecutiveFailures,
        teamId,
      });
      break;
    }

    const membersResult = await retryWithBackoff(
      () =>
        prisma.teamMember.findMany({
          where: { teamId, userId: { not: deletion.userId } },
          select: { userId: true },
        }),
      'fetchTeamMembers',
      { teamId, deletionId: deletion.id }
    );

    if (!membersResult.success) {
      consecutiveFailures++;
      continue;
    }

    const members = membersResult.result!;

    for (const member of members) {
      if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        logger.error('Circuit breaker triggered: too many consecutive failures', {
          deletionId: deletion.id,
          reminderType,
          consecutiveFailures,
          teamId,
          userId: member.userId,
        });
        break;
      }

      const createResult = await retryWithBackoff(
        () =>
          prisma.notification.create({
            data: {
              id: crypto.randomUUID(),
              userId: member.userId,
              type: 'ACCOUNT_DELETION_SCHEDULED',
              title: 'Account deletion reminder',
              message: `A Product Owner in your team will have their account permanently deleted in ${daysText}. Please assign a new Product Owner if needed.`,
              data: {
                reminderType,
                scheduledDeletionId: deletion.id,
                teamId,
              } as NotificationData,
            },
          }),
        'createNotification',
        {
          userId: member.userId,
          deletionId: deletion.id,
          reminderType,
          teamId,
        }
      );

      if (createResult.success) {
        notificationsSent++;
        consecutiveFailures = 0;
      } else {
        consecutiveFailures++;
      }
    }
  }

  return notificationsSent;
}

async function processReminders(): Promise<{ midGrace: number; finalDay: number }> {
  const now = new Date();

  const dayStart = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const dayEnd = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const pendingDeletions = await prisma.scheduledDeletion.findMany({
    where: { status: 'PENDING' },
    select: {
      id: true,
      userId: true,
      scheduledDeletionAt: true,
      blockedTeamIds: true,
      gracePeriodDays: true,
    },
  });

  let midGraceReminders = 0;
  let finalDayReminders = 0;

  for (const deletion of pendingDeletions) {
    const scheduledDate = new Date(deletion.scheduledDeletionAt);
    const midGraceDay = Math.floor(deletion.gracePeriodDays / 2);

    const midGraceReminderDate = new Date(
      scheduledDate.getTime() - midGraceDay * 24 * 60 * 60 * 1000
    );
    const finalDayReminderDate = new Date(scheduledDate.getTime() - 1 * 24 * 60 * 60 * 1000);

    const isMidGraceReminderDay =
      now >= dayStart(midGraceReminderDate) && now <= dayEnd(midGraceReminderDate);
    const isFinalDayReminderDay =
      now >= dayStart(finalDayReminderDate) && now <= dayEnd(finalDayReminderDate);

    if (isMidGraceReminderDay) {
      const sent = await sendReminderNotifications(deletion, 'mid-grace', `${midGraceDay} days`);
      if (sent > 0) {
        midGraceReminders += sent;
        logger.info('Sent mid-grace reminder notifications', {
          deletionId: deletion.id,
          notificationsSent: sent,
          gracePeriodDays: deletion.gracePeriodDays,
          midGraceDay,
        });
      }
    }

    if (isFinalDayReminderDay) {
      const sent = await sendReminderNotifications(deletion, 'final-day', '1 day');
      if (sent > 0) {
        finalDayReminders += sent;
        logger.info('Sent final-day reminder notifications', {
          deletionId: deletion.id,
          notificationsSent: sent,
        });
      }
    }
  }

  return { midGrace: midGraceReminders, finalDay: finalDayReminders };
}

async function processExpiredDeletions(): Promise<number> {
  const now = new Date();
  const expiredThreshold = new Date(now.getTime() - EXPIRY_THRESHOLD_DAYS * 24 * 60 * 60 * 1000);

  const expiredDeletions = await prisma.scheduledDeletion.findMany({
    where: {
      status: 'PENDING',
      scheduledDeletionAt: { lt: expiredThreshold },
    },
  });

  for (const deletion of expiredDeletions) {
    await prisma.scheduledDeletion.update({
      where: { id: deletion.id },
      data: { status: 'EXPIRED' },
    });
    logger.info('Scheduled deletion expired without execution', {
      userId: deletion.userId,
      deletionId: deletion.id,
    });
  }

  return expiredDeletions.length;
}

export const startDeletionGracePeriodJob = () => {
  cron.schedule(DELETION_GRACE_PERIOD_CRON, async () => {
    try {
      logger.info('Starting deletion grace period job');

      const reminders = await processReminders();
      if (reminders.midGrace > 0 || reminders.finalDay > 0) {
        logger.info('Sent reminder notifications', {
          midGraceReminders: reminders.midGrace,
          finalDayReminders: reminders.finalDay,
        });
      }

      const expiredCount = await processExpiredDeletions();
      if (expiredCount > 0) {
        logger.info(`Processed ${expiredCount} expired scheduled deletions`);
      }

      logger.info('Deletion grace period job completed');
    } catch (error) {
      logger.error('Deletion grace period job failed:', error);
    }
  });

  logger.info('Deletion grace period job scheduled', {
    cronSchedule: DELETION_GRACE_PERIOD_CRON,
    expiryThresholdDays: EXPIRY_THRESHOLD_DAYS,
  });
};
