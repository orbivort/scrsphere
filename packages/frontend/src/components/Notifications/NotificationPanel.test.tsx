import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { NotificationPanel } from './NotificationPanel';
import * as useNotificationsModule from '../../hooks/useNotifications';
import { NotificationType, type Notification } from '../../types/notification.types';

vi.mock('./NotificationPanel.module.css', () => ({
  default: {
    'notification-panel': 'notification-panel',
    'panel-header': 'panel-header',
    'mark-all-read': 'mark-all-read',
    'panel-content': 'panel-content',
    loading: 'loading',
    empty: 'empty',
    'notification-item': 'notification-item',
    unread: 'unread',
    'notification-icon': 'notification-icon',
    'notification-content': 'notification-content',
    'notification-title': 'notification-title',
    'notification-message': 'notification-message',
    'notification-time': 'notification-time',
    'panel-footer': 'panel-footer',
    'view-all': 'view-all',
  },
}));

const createMockNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: 'notif-1',
  userId: 'user-1',
  type: NotificationType.TEAM_INVITATION,
  title: 'Test Notification',
  message: 'Test message',
  isRead: false,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides,
});

const createTestQueryClient = () =>
  new QueryClient({
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

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('NotificationPanel Component', () => {
  const mockOnClose = vi.fn();
  const mockMutateAsync = vi.fn();
  const mockMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
      data: {
        notifications: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
        unreadCount: 0,
      },
      isLoading: false,
      error: null,
    } as any);

    vi.spyOn(useNotificationsModule, 'useMarkAsRead').mockReturnValue({
      mutateAsync: mockMutateAsync,
      mutate: mockMutate,
      isPending: false,
    } as any);

    vi.spyOn(useNotificationsModule, 'useMarkAllAsRead').mockReturnValue({
      mutateAsync: mockMutateAsync,
      mutate: mockMutate,
      isPending: false,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should not render when isOpen is false', () => {
      renderWithProviders(<NotificationPanel isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByText('Notifications')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('should render loading state', () => {
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      expect(screen.getByText('Loading notifications...')).toBeInTheDocument();
    });

    it('should render empty state', () => {
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
          unreadCount: 0,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      expect(screen.getByText('No notifications yet')).toBeInTheDocument();
    });

    it('should render notifications list', () => {
      const notifications = [
        createMockNotification({ id: 'notif-1', title: 'First Notification' }),
        createMockNotification({ id: 'notif-2', title: 'Second Notification' }),
      ];

      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications,
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
          unreadCount: 2,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      expect(screen.getByText('First Notification')).toBeInTheDocument();
      expect(screen.getByText('Second Notification')).toBeInTheDocument();
    });

    it('should render View all notifications button', () => {
      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      expect(screen.getByText('View all notifications')).toBeInTheDocument();
    });
  });

  describe('Notification Icon Tests', () => {
    const iconTestCases = [
      { type: NotificationType.TEAM_INVITATION, expectedIcon: '👥' },
      { type: NotificationType.TEAM_REMOVAL, expectedIcon: '🚫' },
      { type: NotificationType.TASK_ASSIGNMENT, expectedIcon: '✅' },
      { type: NotificationType.IMPEDIMENT_ASSIGNMENT, expectedIcon: '🚧' },
      { type: NotificationType.DAILY_UPDATE_REMINDER, expectedIcon: '☀️' },
      { type: NotificationType.TEAM_CREATED, expectedIcon: '🏢' },
      { type: NotificationType.TEAM_UPDATED, expectedIcon: '✏️' },
      { type: NotificationType.TEAM_DELETED, expectedIcon: '🗑️' },
    ];

    iconTestCases.forEach(({ type, expectedIcon }) => {
      it(`should display ${expectedIcon} icon for ${type} notification`, () => {
        const notification = createMockNotification({ type });
        vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
          data: {
            notifications: [notification],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
            unreadCount: 1,
          },
          isLoading: false,
          error: null,
        } as any);

        renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

        expect(screen.getByText(expectedIcon)).toBeInTheDocument();
      });
    });
  });

  describe('Unread State Tests', () => {
    it('should apply unread class to unread notifications', () => {
      const notification = createMockNotification({ isRead: false });
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [notification],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 1,
        },
        isLoading: false,
        error: null,
      } as any);

      const { container } = renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      const notificationItem = container.querySelector('.notification-item');
      expect(notificationItem).toHaveClass('unread');
    });

    it('should not apply unread class to read notifications', () => {
      const notification = createMockNotification({ isRead: true });
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [notification],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 0,
        },
        isLoading: false,
        error: null,
      } as any);

      const { container } = renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      const notificationItem = container.querySelector('.notification-item');
      expect(notificationItem).not.toHaveClass('unread');
    });

    it('should show Mark all as read button when there are unread notifications', () => {
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [createMockNotification({ isRead: false })],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 1,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      expect(screen.getByText('Mark all as read')).toBeInTheDocument();
    });

    it('should not show Mark all as read button when no unread notifications', () => {
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [createMockNotification({ isRead: true })],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 0,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      expect(screen.queryByText('Mark all as read')).not.toBeInTheDocument();
    });
  });

  describe('User Interaction Tests', () => {
    it('should call onClose when clicking outside panel', () => {
      const notification = createMockNotification();
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [notification],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 1,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      fireEvent.mouseDown(document.body);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when pressing Escape', () => {
      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should mark notification as read when clicked', async () => {
      const notification = createMockNotification({ isRead: false });
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [notification],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 1,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      const notificationItem = screen.getByText('Test Notification').closest('.notification-item');
      if (notificationItem) {
        fireEvent.click(notificationItem);
      }

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith('notif-1');
      });
    });

    it('should call onClose after clicking notification', async () => {
      const notification = createMockNotification();
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [notification],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 1,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      const notificationItem = screen.getByText('Test Notification').closest('.notification-item');
      if (notificationItem) {
        fireEvent.click(notificationItem);
      }

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should call markAllAsRead when Mark all as read is clicked', async () => {
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [createMockNotification({ isRead: false })],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 1,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      const markAllButton = screen.getByText('Mark all as read');
      fireEvent.click(markAllButton);

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalled();
      });
    });

    it('should call onClose when View all notifications is clicked', () => {
      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      const viewAllButton = screen.getByText('View all notifications');
      fireEvent.click(viewAllButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have button role on notification items', () => {
      const notification = createMockNotification();
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [notification],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 1,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      expect(screen.getByRole('button', { name: /Test Notification/ })).toBeInTheDocument();
    });

    it('should have tabIndex on notification items', () => {
      const notification = createMockNotification();
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [notification],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 1,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      const notificationItem = screen.getByRole('button', { name: /Test Notification/ });
      expect(notificationItem).toHaveAttribute('tabIndex', '0');
    });

    it('should handle Enter key on notification item', async () => {
      const notification = createMockNotification({ isRead: false });
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [notification],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 1,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      const notificationItem = screen.getByRole('button', { name: /Test Notification/ });
      fireEvent.keyDown(notificationItem, { key: 'Enter' });

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith('notif-1');
      });
    });

    it('should handle Space key on notification item', async () => {
      const notification = createMockNotification({ isRead: false });
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [notification],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 1,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      const notificationItem = screen.getByRole('button', { name: /Test Notification/ });
      fireEvent.keyDown(notificationItem, { key: ' ' });

      await waitFor(() => {
        expect(mockMutateAsync).toHaveBeenCalledWith('notif-1');
      });
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle notification without message', () => {
      const notification = createMockNotification({ message: undefined });
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [notification],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 1,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      expect(screen.getByText('Test Notification')).toBeInTheDocument();
    });

    it('should handle large number of notifications', () => {
      const notifications = Array.from({ length: 10 }, (_, i) =>
        createMockNotification({ id: `notif-${i}`, title: `Notification ${i}` })
      );
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications,
          pagination: { page: 1, limit: 10, total: 10, totalPages: 1 },
          unreadCount: 10,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      notifications.forEach((n) => {
        expect(screen.getByText(n.title)).toBeInTheDocument();
      });
    });

    it('should not mark read notification as read when clicked', async () => {
      const notification = createMockNotification({ isRead: true });
      vi.spyOn(useNotificationsModule, 'useNotifications').mockReturnValue({
        data: {
          notifications: [notification],
          pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          unreadCount: 0,
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<NotificationPanel isOpen onClose={mockOnClose} />);

      const notificationItem = screen.getByText('Test Notification').closest('.notification-item');
      if (notificationItem) {
        fireEvent.click(notificationItem);
      }

      await waitFor(() => {
        expect(mockMutateAsync).not.toHaveBeenCalled();
      });
    });
  });
});
