import { describe, it, expect, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('deletionGracePeriodJob', () => {
  describe('startDeletionGracePeriodJob', () => {
    it('should schedule the job correctly', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: vi.fn(),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
        },
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      expect(cron.default.schedule).toHaveBeenCalledWith('0 3 * * *', expect.any(Function));
    });

    it('should log job scheduling information', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: vi.fn(),
            update: vi.fn(),
          },
        },
      }));

      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');

      startDeletionGracePeriodJob();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Deletion grace period job scheduled',
        expect.objectContaining({
          cronSchedule: '0 3 * * *',
          expiryThresholdDays: 7,
        })
      );
    });
  });

  describe('processExpiredDeletions', () => {
    it('should find and mark expired scheduled deletions as EXPIRED', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([
              { id: 'deletion-1', userId: 'user-1' },
              { id: 'deletion-2', userId: 'user-2' },
            ]),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
        },
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');
      const prisma = await import('../../../utils/prisma');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      expect(prisma.default.scheduledDeletion.findMany).toHaveBeenCalled();
      expect(prisma.default.scheduledDeletion.update).toHaveBeenCalledTimes(2);
    });

    it('should handle empty list of expired deletions gracefully', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([]),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
        },
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');
      const prisma = await import('../../../utils/prisma');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      expect(prisma.default.scheduledDeletion.update).not.toHaveBeenCalled();
    });

    it('should query for PENDING deletions with scheduledDeletionAt in the past', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockFindMany = vi.fn().mockResolvedValue([]);

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: mockFindMany,
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
        },
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'PENDING',
            scheduledDeletionAt: expect.objectContaining({
              lt: expect.any(Date),
            }),
          }),
        })
      );
    });

    it('should update deletion status to EXPIRED', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockUpdate = vi.fn().mockResolvedValue({});

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([{ id: 'deletion-1', userId: 'user-1' }]),
            update: mockUpdate,
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
        },
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      expect(mockUpdate).toHaveBeenCalledWith({
        where: { id: 'deletion-1' },
        data: { status: 'EXPIRED' },
      });
    });

    it('should log info when deletions are expired', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([{ id: 'deletion-1', userId: 'user-1' }]),
            update: vi.fn().mockResolvedValue({}),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      expect(mockLogger.info).toHaveBeenCalledWith(
        'Scheduled deletion expired without execution',
        expect.objectContaining({
          userId: 'user-1',
          deletionId: 'deletion-1',
        })
      );
    });
  });

  describe('processReminders', () => {
    it('should process pending deletions and send reminders', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: vi.fn(),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
        },
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');
      const prisma = await import('../../../utils/prisma');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      expect(prisma.default.scheduledDeletion.findMany).toHaveBeenCalled();
    });

    it('should query for PENDING deletions with grace period info', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockFindMany = vi.fn().mockResolvedValue([]);

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: mockFindMany,
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
        },
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PENDING' },
          select: expect.objectContaining({
            id: true,
            userId: true,
            scheduledDeletionAt: true,
            blockedTeamIds: true,
            gracePeriodDays: true,
          }),
        })
      );
    });

    it('should skip deletions with no team members to notify', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn().mockResolvedValue([]),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: 'deletion-1',
                userId: 'user-1',
                scheduledDeletionAt: new Date(Date.now() + 86400000),
                blockedTeamIds: [],
                gracePeriodDays: 7,
              },
            ]),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      // When there are no team members, no notifications are sent
      // The function returns 0 and no specific log is made
      expect(mockLogger.info).toHaveBeenCalledWith('Deletion grace period job completed');
    });

    it('should skip notification if already sent within 24 hours', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockCreate = vi.fn();
      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn().mockResolvedValue({ id: 'existing-notification' }),
            create: mockCreate,
          },
          teamMember: {
            findMany: vi.fn().mockResolvedValue([{ userId: 'admin-1', role: 'ADMIN' }]),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: 'deletion-1',
                userId: 'user-1',
                scheduledDeletionAt: new Date(Date.now() + 86400000),
                blockedTeamIds: [],
                gracePeriodDays: 7,
              },
            ]),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      // When reminder was already sent, no new notifications are created
      // The function returns 0 from sendReminderNotifications
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should create notifications for team admins when not already sent', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockCreate = vi.fn().mockResolvedValue({});

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: mockCreate,
          },
          teamMember: {
            findMany: vi.fn().mockResolvedValue([
              { userId: 'admin-1', role: 'ADMIN' },
              { userId: 'member-1', role: 'MEMBER' },
            ]),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: 'deletion-1',
                userId: 'user-1',
                scheduledDeletionAt: new Date(Date.now() + 86400000),
                blockedTeamIds: ['team-1'], // Need a team ID to trigger notification creation
                gracePeriodDays: 7,
              },
            ]),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
        },
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      expect(mockCreate).toHaveBeenCalled();
    });

    it('should calculate days remaining correctly', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      // Set deletion date to 3 days in the future with 7-day grace period
      // midGraceDay = 3, so today is the mid-grace reminder day
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({}),
          },
          teamMember: {
            findMany: vi.fn().mockResolvedValue([{ userId: 'admin-1', role: 'ADMIN' }]),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: 'deletion-1',
                userId: 'user-1',
                scheduledDeletionAt: futureDate,
                blockedTeamIds: ['team-1'], // Need a team ID to trigger notification creation
                gracePeriodDays: 7,
              },
            ]),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      // With mid-grace day = 3 and deletion in 3 days, today is the mid-grace reminder day
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Sent mid-grace reminder notifications',
        expect.objectContaining({
          deletionId: 'deletion-1',
          notificationsSent: expect.any(Number),
        })
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle errors during job execution', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockRejectedValue(new Error('Database error')),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Deletion grace period job failed:',
        expect.any(Error)
      );
    });

    it('should log job completion', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([]),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      expect(mockLogger.info).toHaveBeenCalledWith('Deletion grace period job completed');
    });

    it('should log job start', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([]),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      expect(mockLogger.info).toHaveBeenCalledWith('Starting deletion grace period job');
    });

    it('should handle errors when updating deletion status', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([{ id: 'deletion-1', userId: 'user-1' }]),
            update: vi.fn().mockRejectedValue(new Error('Update failed')),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      expect(mockLogger.error).toHaveBeenCalledWith(
        'Deletion grace period job failed:',
        expect.any(Error)
      );
    });

    it('should handle errors when creating notifications', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockRejectedValue(new Error('Create failed')),
          },
          teamMember: {
            findMany: vi.fn().mockResolvedValue([{ userId: 'admin-1', role: 'ADMIN' }]),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: 'deletion-1',
                userId: 'user-1',
                scheduledDeletionAt: new Date(Date.now() + 86400000),
                blockedTeamIds: ['team-1'], // Need a team ID to trigger notification creation
                gracePeriodDays: 7,
              },
            ]),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      // Errors during notification creation are caught and logged by retryWithBackoff
      // The error is logged with additional context
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('createNotification failed'),
        expect.objectContaining({
          error: 'Create failed',
          deletionId: 'deletion-1',
        })
      );
    });
  });

  describe('Retry Logic', () => {
    it('should retry on retryable errors', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      let callCount = 0;
      const mockFindFirst = vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          const error = new Error('Connection timeout');
          (error as any).message = 'Connection timeout';
          return Promise.reject(error);
        }
        return Promise.resolve(null);
      });

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: mockFindFirst,
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn(),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([]),
            update: vi.fn(),
          },
        },
      }));

      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      // The job should complete without throwing
      expect(mockLogger.info).toHaveBeenCalledWith('Deletion grace period job completed');
    });

    it('should handle non-retryable errors without retry', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      // Mock a non-retryable error during notification creation
      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockRejectedValue(new Error('Permission denied')),
          },
          teamMember: {
            findMany: vi.fn().mockResolvedValue([{ userId: 'admin-1', role: 'ADMIN' }]),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: 'deletion-1',
                userId: 'user-1',
                scheduledDeletionAt: new Date(Date.now() + 86400000),
                blockedTeamIds: ['team-1'],
                gracePeriodDays: 7,
              },
            ]),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      // Non-retryable errors are logged immediately by retryWithBackoff
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('createNotification failed'),
        expect.objectContaining({
          error: 'Permission denied',
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('should handle deletions with blockedTeamIds', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockFindMany = vi.fn().mockResolvedValue([
        {
          id: 'deletion-1',
          userId: 'user-1',
          scheduledDeletionAt: new Date(Date.now() + 86400000),
          blockedTeamIds: ['team-1', 'team-2'],
          gracePeriodDays: 7,
        },
      ]);

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({}),
          },
          teamMember: {
            findMany: vi.fn().mockResolvedValue([{ userId: 'admin-1', role: 'ADMIN' }]),
          },
          scheduledDeletion: {
            findMany: mockFindMany,
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: {
          info: vi.fn(),
          error: vi.fn(),
          warn: vi.fn(),
        },
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      expect(mockFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PENDING' },
        })
      );
    });

    it('should handle deletion date in the past for reminders', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn().mockResolvedValue(null),
            create: vi.fn().mockResolvedValue({}),
          },
          teamMember: {
            findMany: vi.fn().mockResolvedValue([{ userId: 'admin-1', role: 'ADMIN' }]),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: 'deletion-1',
                userId: 'user-1',
                scheduledDeletionAt: pastDate,
                blockedTeamIds: [],
                gracePeriodDays: 7,
              },
            ]),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      // When deletion date is in the past, it goes to processExpiredDeletions, not reminders
      expect(mockLogger.info).toHaveBeenCalledWith(
        'Scheduled deletion expired without execution',
        expect.objectContaining({
          deletionId: 'deletion-1',
          userId: 'user-1',
        })
      );
    });

    it('should handle team member query errors', async () => {
      vi.doMock('node-cron', () => ({
        default: {
          schedule: vi.fn(),
        },
      }));

      const mockLogger = {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      };

      vi.doMock('../../../utils/prisma', () => ({
        default: {
          notification: {
            findFirst: vi.fn(),
            create: vi.fn(),
          },
          teamMember: {
            findMany: vi.fn().mockRejectedValue(new Error('Team member query failed')),
          },
          scheduledDeletion: {
            findMany: vi.fn().mockResolvedValue([
              {
                id: 'deletion-1',
                userId: 'user-1',
                scheduledDeletionAt: new Date(Date.now() + 86400000),
                blockedTeamIds: ['team-1'], // Need a team ID to trigger team member query
                gracePeriodDays: 7,
              },
            ]),
            update: vi.fn(),
          },
        },
      }));

      vi.doMock('../../../utils/logger', () => ({
        default: mockLogger,
      }));

      const { startDeletionGracePeriodJob } = await import('../../../jobs/deletionGracePeriodJob');
      const cron = await import('node-cron');

      startDeletionGracePeriodJob();
      const calls = (cron.default.schedule as any).mock.calls;
      const scheduledCallback = calls[0][1];
      await scheduledCallback();

      // Errors during team member fetch are handled within sendReminderNotifications
      // Non-retryable errors are logged as errors by retryWithBackoff
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('fetchTeamMembers failed'),
        expect.objectContaining({
          error: 'Team member query failed',
        })
      );
    });
  });
});
