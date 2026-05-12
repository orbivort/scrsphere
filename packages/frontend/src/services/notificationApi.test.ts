import { describe, it, expect, vi, beforeEach } from 'vitest';

import { notificationApi } from './notificationApi';
import { apiService } from './api';

vi.mock('./api', () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  setAuthCallbacks: vi.fn(),
}));

describe('notificationApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getConfig', () => {
    it('should fetch notification config', async () => {
      const mockConfig = {
        pollingIntervalMs: 30000,
        maxPageSize: 50,
        retentionDays: 30,
      };

      vi.mocked(apiService.get).mockResolvedValue({
        data: {
          success: true,
          data: mockConfig,
        },
      });

      const result = await notificationApi.getConfig();

      expect(apiService.get).toHaveBeenCalledWith('/config/notifications');
      expect(result).toEqual(mockConfig);
    });
  });

  describe('getNotifications', () => {
    it('should fetch notifications without filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          notifications: [{ id: '1', title: 'Test' }],
          total: 1,
          page: 1,
          limit: 10,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue({
        data: mockResponse,
      });

      const result = await notificationApi.getNotifications();

      expect(apiService.get).toHaveBeenCalled();
      expect(result).toEqual(mockResponse.data);
    });

    it('should fetch notifications with filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          notifications: [{ id: '1', title: 'Test' }],
          total: 1,
          page: 1,
          limit: 10,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue({
        data: mockResponse,
      });

      const filters = {
        page: 1,
        limit: 10,
        type: 'INFO',
        isRead: false,
      };

      await notificationApi.getNotifications(filters);

      expect(apiService.get).toHaveBeenCalled();
      const callUrl = vi.mocked(apiService.get).mock.calls[0][0];
      expect(callUrl).toContain('page=1');
      expect(callUrl).toContain('limit=10');
      expect(callUrl).toContain('type=INFO');
      expect(callUrl).toContain('isRead=false');
    });

    it('should not include undefined filters', async () => {
      const mockResponse = {
        success: true,
        data: {
          notifications: [],
          total: 0,
          page: 1,
          limit: 10,
        },
      };

      vi.mocked(apiService.get).mockResolvedValue({
        data: mockResponse,
      });

      await notificationApi.getNotifications({ page: 1 });

      const callUrl = vi.mocked(apiService.get).mock.calls[0][0];
      expect(callUrl).toContain('page=1');
      expect(callUrl).not.toContain('limit');
      expect(callUrl).not.toContain('type');
    });
  });

  describe('getUnreadCount', () => {
    it('should fetch unread count', async () => {
      vi.mocked(apiService.get).mockResolvedValue({
        data: {
          success: true,
          data: { count: 5 },
        },
      });

      const result = await notificationApi.getUnreadCount();

      expect(apiService.get).toHaveBeenCalledWith('/notifications/unread-count');
      expect(result).toEqual({ count: 5 });
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockNotification = {
        id: '1',
        title: 'Test',
        isRead: true,
      };

      vi.mocked(apiService.patch).mockResolvedValue({
        data: {
          success: true,
          data: { notification: mockNotification },
        },
      });

      const result = await notificationApi.markAsRead('1');

      expect(apiService.patch).toHaveBeenCalledWith('/notifications/1/read');
      expect(result).toEqual(mockNotification);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      vi.mocked(apiService.patch).mockResolvedValue({
        data: {
          success: true,
          data: { updatedCount: 10 },
        },
      });

      const result = await notificationApi.markAllAsRead();

      expect(apiService.patch).toHaveBeenCalledWith('/notifications/mark-all-read', {
        notificationIds: undefined,
      });
      expect(result).toBe(10);
    });

    it('should mark specific notifications as read', async () => {
      vi.mocked(apiService.patch).mockResolvedValue({
        data: {
          success: true,
          data: { updatedCount: 3 },
        },
      });

      const notificationIds = ['1', '2', '3'];
      const result = await notificationApi.markAllAsRead(notificationIds);

      expect(apiService.patch).toHaveBeenCalledWith('/notifications/mark-all-read', {
        notificationIds,
      });
      expect(result).toBe(3);
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      vi.mocked(apiService.delete).mockResolvedValue({ data: {} });

      await notificationApi.deleteNotification('1');

      expect(apiService.delete).toHaveBeenCalledWith('/notifications/1');
    });
  });

  describe('sendDirectMessage', () => {
    it('should send direct message', async () => {
      const mockNotification = {
        id: '1',
        title: 'Direct Message',
        isRead: false,
      };

      vi.mocked(apiService.post).mockResolvedValue({
        data: {
          success: true,
          data: { notification: mockNotification },
        },
      });

      const request = {
        recipientId: 'user-1',
        message: 'Hello!',
      };

      const result = await notificationApi.sendDirectMessage(request);

      expect(apiService.post).toHaveBeenCalledWith('/notifications/send-message', request);
      expect(result).toEqual(mockNotification);
    });
  });
});
