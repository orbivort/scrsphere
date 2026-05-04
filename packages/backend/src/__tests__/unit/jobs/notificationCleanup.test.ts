import { describe, it, expect, beforeEach, vi } from 'vitest';

// Top-level mocks must be defined before any imports
const mockSchedule = vi.fn();
const mockValidate = vi.fn();
const mockDeleteOldNotifications = vi.fn();
const mockInfo = vi.fn();
const mockError = vi.fn();

vi.mock('node-cron', () => ({
  default: {
    schedule: (...args: unknown[]) => mockSchedule(...args),
    validate: (cron: string) => mockValidate(cron),
  },
}));

vi.mock('../../../services/notification.service', () => ({
  NotificationService: class MockNotificationService {
    deleteOldNotifications = mockDeleteOldNotifications;
  },
}));

vi.mock('../../../utils/logger', () => ({
  default: {
    info: (...args: unknown[]) => mockInfo(...args),
    error: (...args: unknown[]) => mockError(...args),
  },
}));

vi.mock('../../../config', () => ({
  default: {
    notification: {
      retentionDays: 30,
      cleanupCron: '0 4 * * *',
    },
  },
}));

describe('notificationCleanupJob', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('startNotificationCleanup', () => {
    it('should schedule the notification cleanup job', async () => {
      mockValidate.mockReturnValue(true);

      // Import after mocks are set up
      const { startNotificationCleanup } = await import('../../../jobs/notificationCleanup');

      startNotificationCleanup();
      expect(mockSchedule).toHaveBeenCalledWith('0 4 * * *', expect.any(Function));
    });

    it('should not schedule the job if cron expression is invalid', async () => {
      mockValidate.mockReturnValue(false);

      const { startNotificationCleanup } = await import('../../../jobs/notificationCleanup');

      startNotificationCleanup();
      expect(mockSchedule).not.toHaveBeenCalled();
      expect(mockError).toHaveBeenCalledWith(
        'Invalid cron expression for notification cleanup: 0 4 * * *'
      );
    });

    it('should call deleteOldNotifications when the scheduled job runs', async () => {
      mockValidate.mockReturnValue(true);
      mockDeleteOldNotifications.mockResolvedValue(10);

      const { startNotificationCleanup } = await import('../../../jobs/notificationCleanup');

      startNotificationCleanup();

      expect(mockSchedule).toHaveBeenCalled();
      const calls = mockSchedule.mock.calls;
      expect(calls.length).toBeGreaterThan(0);

      const scheduledCallback = calls[0]?.[1] as () => Promise<void>;
      await scheduledCallback();

      expect(mockDeleteOldNotifications).toHaveBeenCalledWith(30);
    });

    it('should log error when deleteOldNotifications fails', async () => {
      mockValidate.mockReturnValue(true);
      const testError = new Error('Database error');
      mockDeleteOldNotifications.mockRejectedValue(testError);

      const { startNotificationCleanup } = await import('../../../jobs/notificationCleanup');

      startNotificationCleanup();

      const scheduledCallback = mockSchedule.mock.calls[0]?.[1] as () => Promise<void>;
      await scheduledCallback();

      expect(mockError).toHaveBeenCalledWith('Notification cleanup job failed:', testError);
    });

    it('should not schedule when retentionDays is 0', async () => {
      // Need to re-mock config with retentionDays = 0
      vi.doMock('../../../config', () => ({
        default: {
          notification: {
            retentionDays: 0,
            cleanupCron: '0 4 * * *',
          },
        },
      }));

      // Re-import to get the new config
      vi.resetModules();
      const { startNotificationCleanup } = await import('../../../jobs/notificationCleanup');

      startNotificationCleanup();

      expect(mockSchedule).not.toHaveBeenCalled();
      expect(mockInfo).toHaveBeenCalledWith(
        'Notification cleanup is disabled (NOTIFICATION_RETENTION_DAYS=0)'
      );

      // Reset the mock back to default
      vi.doUnmock('../../../config');
    });
  });
});
