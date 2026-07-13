import { renderHook, waitFor, act, initTestI18n, AllProviders } from '../test-utils';
import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';

import {
  useNotifications,
  useNotificationConfig,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from './useNotifications';
import { notificationApi } from '../services/notificationApi';

vi.mock('../services/notificationApi', () => ({
  notificationApi: {
    getNotifications: vi.fn(),
    getConfig: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    deleteNotification: vi.fn(),
  },
}));

describe('useNotifications', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch notifications', async () => {
    const mockNotifications = [
      { id: '1', title: 'Notification 1', message: 'Message 1', isRead: false },
      { id: '2', title: 'Notification 2', message: 'Message 2', isRead: true },
    ];

    vi.mocked(notificationApi.getNotifications).mockResolvedValue({
      success: true,
      data: mockNotifications,
    });

    renderHook(() => useNotifications(), { wrapper: AllProviders });

    await waitFor(() => {
      expect(notificationApi.getNotifications).toHaveBeenCalled();
    });
  });

  it('should fetch notifications with filters', async () => {
    const mockNotifications = [{ id: '1', title: 'Notification 1', message: 'Message 1' }];

    vi.mocked(notificationApi.getNotifications).mockResolvedValue({
      success: true,
      data: mockNotifications,
    });

    const filters = { isRead: false, type: 'INFO' };

    renderHook(() => useNotifications(filters), { wrapper: AllProviders });

    await waitFor(() => {
      expect(notificationApi.getNotifications).toHaveBeenCalledWith(filters);
    });
  });
});

describe('useNotificationConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch notification config', async () => {
    const mockConfig = { pollingIntervalMs: 30000 };

    vi.mocked(notificationApi.getConfig).mockResolvedValue({
      success: true,
      data: mockConfig,
    });

    renderHook(() => useNotificationConfig(), { wrapper: AllProviders });

    await waitFor(() => {
      expect(notificationApi.getConfig).toHaveBeenCalled();
    });
  });
});

describe('useUnreadCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch unread count', async () => {
    vi.mocked(notificationApi.getConfig).mockResolvedValue({
      success: true,
      data: { pollingIntervalMs: 30000 },
    });

    vi.mocked(notificationApi.getUnreadCount).mockResolvedValue({
      success: true,
      data: { count: 5 },
    });

    renderHook(() => useUnreadCount(), { wrapper: AllProviders });

    await waitFor(() => {
      expect(notificationApi.getUnreadCount).toHaveBeenCalled();
    });
  });
});

describe('useMarkAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark notification as read', async () => {
    vi.mocked(notificationApi.markAsRead).mockResolvedValue({
      success: true,
      data: undefined,
    });

    const { result } = renderHook(() => useMarkAsRead(), { wrapper: AllProviders });

    act(() => {
      result.current.mutate('notification-1');
    });

    await waitFor(() => {
      expect(notificationApi.markAsRead).toHaveBeenCalledWith('notification-1');
    });
  });
});

describe('useMarkAllAsRead', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mark all notifications as read', async () => {
    vi.mocked(notificationApi.markAllAsRead).mockResolvedValue({
      success: true,
      data: undefined,
    });

    const { result } = renderHook(() => useMarkAllAsRead(), { wrapper: AllProviders });

    act(() => {
      result.current.mutate();
    });

    await waitFor(() => {
      expect(notificationApi.markAllAsRead).toHaveBeenCalledWith(undefined);
    });
  });

  it('should mark specific notifications as read', async () => {
    vi.mocked(notificationApi.markAllAsRead).mockResolvedValue({
      success: true,
      data: undefined,
    });

    const { result } = renderHook(() => useMarkAllAsRead(), { wrapper: AllProviders });

    const notificationIds = ['1', '2', '3'];

    act(() => {
      result.current.mutate(notificationIds);
    });

    await waitFor(() => {
      expect(notificationApi.markAllAsRead).toHaveBeenCalledWith(notificationIds);
    });
  });
});

describe('useDeleteNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should delete notification', async () => {
    vi.mocked(notificationApi.deleteNotification).mockResolvedValue({
      success: true,
      data: undefined,
    });

    const { result } = renderHook(() => useDeleteNotification(), { wrapper: AllProviders });

    act(() => {
      result.current.mutate('notification-1');
    });

    await waitFor(() => {
      expect(notificationApi.deleteNotification).toHaveBeenCalledWith('notification-1');
    });
  });
});
