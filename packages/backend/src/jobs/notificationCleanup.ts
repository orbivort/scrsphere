import cron from 'node-cron';
import { NotificationService } from '../services/notification.service';
import logger from '../utils/logger';
import config from '../config';

const notificationService = new NotificationService();

export const startNotificationCleanup = () => {
  const { retentionDays, cleanupCron } = config.notification;

  // If retention is 0, cleanup is disabled
  if (retentionDays === 0) {
    logger.info('Notification cleanup is disabled (NOTIFICATION_RETENTION_DAYS=0)');
    return;
  }

  // Validate cron expression
  if (!cron.validate(cleanupCron)) {
    logger.error(`Invalid cron expression for notification cleanup: ${cleanupCron}`);
    return;
  }

  cron.schedule(cleanupCron, async () => {
    try {
      logger.info('Starting notification cleanup job', {
        retentionDays,
        cronSchedule: cleanupCron,
      });

      const deletedCount = await notificationService.deleteOldNotifications(retentionDays);

      logger.info('Notification cleanup completed', {
        deletedCount,
        retentionDays,
      });
    } catch (error) {
      logger.error('Notification cleanup job failed:', error);
    }
  });

  logger.info('Notification cleanup job scheduled', {
    cronSchedule: cleanupCron,
    retentionDays,
    nextRun: 'See cron schedule',
  });
};
