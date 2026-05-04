import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock modules with factory functions (hoisted, so no external variables allowed)
vi.mock('../../../utils/prisma', () => ({
  default: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock('../../../config', () => ({
  default: {
    notification: {
      maxPageSize: 100,
    },
  },
}));

vi.mock('../../../utils/uuid', () => ({
  generateUUIDv7: vi.fn().mockReturnValue('test-notification-uuid'),
}));

// Now import the service and other dependencies
import { NotificationService } from '../../../services/notification.service';
import prisma from '../../../utils/prisma';
import { NotFoundError } from '../../../utils/errors';

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    vi.clearAllMocks();
    notificationService = new NotificationService();
  });

  describe('create', () => {
    it('should create a notification successfully', async () => {
      const userId = 'test-user-id';
      const mockNotification = {
        id: 'test-notification-uuid',
        userId,
        type: 'TASK_ASSIGNMENT',
        title: 'New Task Assigned',
        message: 'You have been assigned a new task',
        data: { taskId: 'task-1' },
        createdBy: userId,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.notification.create).mockResolvedValue(mockNotification as any);

      const result = await notificationService.create({
        userId,
        type: 'TASK_ASSIGNMENT' as any,
        title: 'New Task Assigned',
        message: 'You have been assigned a new task',
        data: { taskId: 'task-1' },
      });

      expect(result.title).toBe('New Task Assigned');
      expect(result.userId).toBe(userId);
      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId,
            type: 'TASK_ASSIGNMENT',
            title: 'New Task Assigned',
          }),
        })
      );
    });

    it('should use createdBy from input when provided', async () => {
      const userId = 'recipient-user-id';
      const createdBy = 'creator-user-id';
      const mockNotification = {
        id: 'test-notification-uuid',
        userId,
        type: 'TASK_ASSIGNMENT',
        title: 'New Task',
        createdBy,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.notification.create).mockResolvedValue(mockNotification as any);

      await notificationService.create({
        userId,
        type: 'TASK_ASSIGNMENT' as any,
        title: 'New Task',
        createdBy,
      });

      expect(prisma.notification.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            createdBy,
          }),
        })
      );
    });
  });

  describe('findByUserId', () => {
    it('should return notifications with pagination', async () => {
      const userId = 'test-user-id';
      const mockNotifications = [
        {
          id: 'notif-1',
          userId,
          type: 'TASK_ASSIGNMENT',
          title: 'Task 1',
          isRead: false,
          createdAt: new Date(),
        },
        {
          id: 'notif-2',
          userId,
          type: 'SPRINT_START',
          title: 'Sprint Started',
          isRead: true,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.notification.findMany).mockResolvedValue(mockNotifications as any);
      vi.mocked(prisma.notification.count).mockResolvedValue(2 as any);

      const result = await notificationService.findByUserId(userId, { page: 1, limit: 10 });

      expect(result.notifications).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.unreadCount).toBeDefined();
    });

    it('should filter by type when specified', async () => {
      const userId = 'test-user-id';
      const mockNotifications = [
        {
          id: 'notif-1',
          userId,
          type: 'TASK_ASSIGNMENT',
          title: 'Task 1',
          isRead: false,
          createdAt: new Date(),
        },
      ];

      vi.mocked(prisma.notification.findMany).mockResolvedValue(mockNotifications as any);
      vi.mocked(prisma.notification.count).mockResolvedValue(1 as any);

      await notificationService.findByUserId(userId, { type: 'TASK_ASSIGNMENT' as any });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            type: 'TASK_ASSIGNMENT',
          }),
        })
      );
    });

    it('should filter by read status when specified', async () => {
      const userId = 'test-user-id';

      vi.mocked(prisma.notification.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notification.count).mockResolvedValue(0 as any);

      await notificationService.findByUserId(userId, { isRead: false });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId,
            isRead: false,
          }),
        })
      );
    });

    it('should respect max page size limit', async () => {
      const userId = 'test-user-id';

      vi.mocked(prisma.notification.findMany).mockResolvedValue([]);
      vi.mocked(prisma.notification.count).mockResolvedValue(0 as any);

      await notificationService.findByUserId(userId, { limit: 200 });

      expect(prisma.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100, // Should be capped at maxPageSize
        })
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      const userId = 'test-user-id';

      vi.mocked(prisma.notification.count).mockResolvedValue(5 as any);

      const result = await notificationService.getUnreadCount(userId);

      expect(result).toBe(5);
      expect(prisma.notification.count).toHaveBeenCalledWith({
        where: { userId, isRead: false },
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notificationId = 'notif-1';
      const userId = 'test-user-id';
      const mockNotification = {
        id: notificationId,
        userId,
        type: 'TASK_ASSIGNMENT',
        title: 'Task 1',
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.notification.findFirst).mockResolvedValue(mockNotification as any);
      vi.mocked(prisma.notification.update).mockResolvedValue({
        ...mockNotification,
        isRead: true,
        readAt: new Date(),
      } as any);

      const result = await notificationService.markAsRead(notificationId, userId);

      expect(result.isRead).toBe(true);
      expect(prisma.notification.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: notificationId },
          data: expect.objectContaining({
            isRead: true,
            readAt: expect.any(Date),
          }),
        })
      );
    });

    it('should throw NotFoundError for non-existent notification', async () => {
      const notificationId = 'non-existent-id';
      const userId = 'test-user-id';

      vi.mocked(prisma.notification.findFirst).mockResolvedValue(null as any);

      await expect(notificationService.markAsRead(notificationId, userId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read for user', async () => {
      const userId = 'test-user-id';

      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 5 } as any);

      const result = await notificationService.markAllAsRead(userId);

      expect(result).toBe(5);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId, isRead: false },
          data: expect.objectContaining({
            isRead: true,
            readAt: expect.any(Date),
          }),
        })
      );
    });

    it('should mark specific notifications as read when IDs provided', async () => {
      const userId = 'test-user-id';
      const notificationIds = ['notif-1', 'notif-2'];

      vi.mocked(prisma.notification.updateMany).mockResolvedValue({ count: 2 } as any);

      const result = await notificationService.markAllAsRead(userId, notificationIds);

      expect(result).toBe(2);
      expect(prisma.notification.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId,
            isRead: false,
            id: { in: notificationIds },
          },
        })
      );
    });
  });

  describe('deleteOldNotifications', () => {
    it('should delete notifications older than specified days', async () => {
      vi.mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 10 } as any);

      const result = await notificationService.deleteOldNotifications(30);

      expect(result).toBe(10);
      expect(prisma.notification.deleteMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: { lt: expect.any(Date) },
          },
        })
      );
    });

    it('should use default of 30 days when not specified', async () => {
      vi.mocked(prisma.notification.deleteMany).mockResolvedValue({ count: 5 } as any);

      const result = await notificationService.deleteOldNotifications();

      expect(result).toBe(5);
    });
  });
});
