import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode } from 'react';

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

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe('useNotifications', () => {
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

    renderHook(() => useNotifications(), { wrapper: createWrapper() });

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

    renderHook(() => useNotifications(filters), { wrapper: createWrapper() });

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

    renderHook(() => useNotificationConfig(), { wrapper: createWrapper() });

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

    renderHook(() => useUnreadCount(), { wrapper: createWrapper() });

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

    const { result } = renderHook(() => useMarkAsRead(), { wrapper: createWrapper() });

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

    const { result } = renderHook(() => useMarkAllAsRead(), { wrapper: createWrapper() });

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

    const { result } = renderHook(() => useMarkAllAsRead(), { wrapper: createWrapper() });

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

    const { result } = renderHook(() => useDeleteNotification(), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate('notification-1');
    });

    await waitFor(() => {
      expect(notificationApi.deleteNotification).toHaveBeenCalledWith('notification-1');
    });
  });
});
