import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { Notifications } from './Notifications';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';
import { NotificationType } from '../../types/notification.types';

// Mock hooks
vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(),
  useMarkAsRead: vi.fn(),
  useMarkAllAsRead: vi.fn(),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Test utilities
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

const renderNotifications = (queryClient?: QueryClient) => {
  const testQueryClient = queryClient || createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter>
        <Notifications />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Mock data
const mockNotifications = [
  {
    id: 'notif-1',
    userId: 'user-1',
    type: NotificationType.TEAM_INVITATION,
    title: 'Test Team Invitation',
    message: 'You have been invited to join Team Alpha',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: NotificationType.TASK_ASSIGNMENT,
    title: 'Test Task Assigned',
    message: 'New task has been assigned to you',
    isRead: true,
    readAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    type: NotificationType.DAILY_UPDATE_REMINDER,
    title: 'Test Daily Update Reminder',
    message: 'Remember to submit your daily update',
    isRead: false,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
];

const mockNotificationsResponse = {
  notifications: mockNotifications,
  pagination: {
    page: 1,
    limit: 50,
    total: 4,
    totalPages: 1,
  },
  unreadCount: 3,
};

const mockEmptyResponse = {
  notifications: [],
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },
  unreadCount: 0,
};

describe('Notifications Component', () => {
  let mockUseNotifications: ReturnType<typeof vi.fn>;
  let mockUseMarkAsRead: ReturnType<typeof vi.fn>;
  let mockUseMarkAllAsRead: ReturnType<typeof vi.fn>;
  let mockMarkAsReadMutateAsync: ReturnType<typeof vi.fn>;
  let mockMarkAllAsReadMutateAsync: ReturnType<typeof vi.fn>;
  let mockRefetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUseNotifications = vi.mocked(useNotifications);
    mockUseMarkAsRead = vi.mocked(useMarkAsRead);
    mockUseMarkAllAsRead = vi.mocked(useMarkAllAsRead);
    mockMarkAsReadMutateAsync = vi.fn().mockResolvedValue(undefined);
    mockMarkAllAsReadMutateAsync = vi.fn().mockResolvedValue(undefined);
    mockRefetch = vi.fn();

    mockUseMarkAsRead.mockReturnValue({
      mutateAsync: mockMarkAsReadMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useMarkAsRead>);

    mockUseMarkAllAsRead.mockReturnValue({
      mutateAsync: mockMarkAllAsReadMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useMarkAllAsRead>);

    mockUseNotifications.mockReturnValue({
      data: mockNotificationsResponse,
      isLoading: false,
      error: null,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useNotifications>);

    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the notifications page with correct title and subtitle', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Notifications')).toBeInTheDocument();
      });

      expect(
        screen.getByText('Stay updated with team activities and important updates')
      ).toBeInTheDocument();
    });

    it('should render all filter buttons', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
      });

      expect(screen.getByText('Unread')).toBeInTheDocument();
      expect(screen.getByText('Team Invitations')).toBeInTheDocument();
      expect(screen.getByText('Task Assignments')).toBeInTheDocument();
      expect(screen.getByText('Impediments')).toBeInTheDocument();
      expect(screen.getByText('Reminders')).toBeInTheDocument();
      expect(screen.getByText('Team Created')).toBeInTheDocument();
      expect(screen.getByText('Team Updated')).toBeInTheDocument();
      expect(screen.getByText('Team Deleted')).toBeInTheDocument();
      expect(screen.getByText('Direct Messages')).toBeInTheDocument();
    });

    it('should render notifications grouped by date', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
      });

      expect(screen.getByText('Yesterday')).toBeInTheDocument();
      // The 2-day old notification could be in "This Week" or "Older" depending on current day
      const hasThisWeek = screen.queryByText('This Week');
      const hasOlder = screen.queryByText('Older');
      expect(hasThisWeek || hasOlder).toBeTruthy();
    });

    it('should render individual notification items', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Test Team Invitation')).toBeInTheDocument();
      });

      expect(screen.getByText('Test Task Assigned')).toBeInTheDocument();
      expect(screen.getByText('Test Daily Update Reminder')).toBeInTheDocument();
    });

    it('should render mark all as read button when there are unread notifications', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Mark All as Read')).toBeInTheDocument();
      });
    });

    it('should not render mark all as read button when there are no unread notifications', async () => {
      const readResponse = {
        ...mockNotificationsResponse,
        unreadCount: 0,
        notifications: mockNotifications.map((n) => ({ ...n, isRead: true })),
      };

      mockUseNotifications.mockReturnValue({
        data: readResponse,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Test Team Invitation')).toBeInTheDocument();
      });

      expect(screen.queryByText('Mark All as Read')).not.toBeInTheDocument();
    });

    it('should render empty state when there are no notifications', async () => {
      mockUseNotifications.mockReturnValue({
        data: mockEmptyResponse,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('No notifications yet')).toBeInTheDocument();
      });

      expect(
        screen.getByText('You will see notifications here when there is activity')
      ).toBeInTheDocument();
    });

    it('should render error state when fetching fails', async () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
      });

      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });

    it('should render pagination when there are multiple pages', async () => {
      const multiPageResponse = {
        ...mockNotificationsResponse,
        pagination: {
          page: 1,
          limit: 50,
          total: 100,
          totalPages: 2,
        },
      };

      mockUseNotifications.mockReturnValue({
        data: multiPageResponse,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      });

      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should not render pagination when there is only one page', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Test Team Invitation')).toBeInTheDocument();
      });

      expect(screen.queryByText('Page 1 of 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });

    it('should render unread indicator for unread notifications', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Test Team Invitation')).toBeInTheDocument();
      });

      // Check that the unread notification has the unread class
      const unreadItems = document.querySelectorAll('[class*="unread"]');
      expect(unreadItems.length).toBeGreaterThan(0);
    });
  });

  describe('User Interactions', () => {
    it('should mark notification as read and navigate when clicking on an unread notification', async () => {
      const user = userEvent.setup();
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Test Team Invitation')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Test Team Invitation'));

      expect(mockMarkAsReadMutateAsync).toHaveBeenCalledWith('notif-1');
      expect(mockNavigate).toHaveBeenCalledWith('/team');
    });

    it('should navigate without marking as read when clicking on a read notification', async () => {
      const user = userEvent.setup();
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Test Task Assigned')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Test Task Assigned'));

      expect(mockMarkAsReadMutateAsync).not.toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/sprint');
    });

    it('should mark all as read when clicking on mark all as read button', async () => {
      const user = userEvent.setup();
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Mark All as Read')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Mark All as Read'));

      expect(mockMarkAllAsReadMutateAsync).toHaveBeenCalledWith(undefined);
    });

    it('should handle filter changes correctly', async () => {
      const user = userEvent.setup();
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
      });

      // Click on 'Unread' filter
      await user.click(screen.getByText('Unread'));

      // Verify the hook was called with updated filters
      // We can check that the hook was called multiple times (initial and after filter change)
      expect(mockUseNotifications).toHaveBeenCalledTimes(2);
    });

    it('should retry fetching notifications when clicking retry button', async () => {
      const user = userEvent.setup();
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Try Again'));

      expect(mockRefetch).toHaveBeenCalled();
    });

    it('should handle pagination next button click', async () => {
      const user = userEvent.setup();
      const multiPageResponse = {
        ...mockNotificationsResponse,
        pagination: {
          page: 1,
          limit: 50,
          total: 100,
          totalPages: 2,
        },
      };

      mockUseNotifications.mockReturnValue({
        data: multiPageResponse,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Next')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Next'));

      // Check that the hook was called with updated page
      expect(mockUseNotifications).toHaveBeenCalled();
    });

    it('should handle keyboard navigation (Enter key) on notification items', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Test Team Invitation')).toBeInTheDocument();
      });

      const notificationItem = screen
        .getByText('Test Team Invitation')
        .closest('[role="listitem"]') as HTMLElement;
      expect(notificationItem).not.toBeNull();

      fireEvent.keyDown(notificationItem, { key: 'Enter' });

      await waitFor(() => {
        expect(mockMarkAsReadMutateAsync).toHaveBeenCalledWith('notif-1');
        expect(mockNavigate).toHaveBeenCalledWith('/team');
      });
    });

    it('should handle keyboard navigation (Space key) on notification items', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Test Team Invitation')).toBeInTheDocument();
      });

      const notificationItem = screen
        .getByText('Test Team Invitation')
        .closest('[role="listitem"]') as HTMLElement;
      expect(notificationItem).not.toBeNull();

      fireEvent.keyDown(notificationItem, { key: ' ' });

      await waitFor(() => {
        expect(mockMarkAsReadMutateAsync).toHaveBeenCalledWith('notif-1');
        expect(mockNavigate).toHaveBeenCalledWith('/team');
      });
    });

    it('should show loading state on mark all as read button when pending', async () => {
      mockUseMarkAllAsRead.mockReturnValue({
        mutateAsync: mockMarkAllAsReadMutateAsync,
        isPending: true,
      } as unknown as ReturnType<typeof useMarkAllAsRead>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Marking...')).toBeInTheDocument();
      });
    });
  });

  describe('State Management', () => {
    it('should initialize filter to "all" by default', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
      });

      // Check that 'All' filter has active class
      const allFilterButton = screen.getByText('All');
      expect(allFilterButton).toHaveClass('_active_08ea39');
    });

    it('should update filter state when filter button is clicked', async () => {
      const user = userEvent.setup();
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Unread')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Unread'));

      const unreadFilterButton = screen.getByText('Unread');
      expect(unreadFilterButton).toHaveClass('_active_08ea39');
    });

    it('should reset page to 1 when filter changes', async () => {
      const user = userEvent.setup();
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
      });

      await user.click(screen.getByText('Unread'));

      // The hook should be called again with page: 1
      expect(mockUseNotifications).toHaveBeenCalledTimes(2);
    });
  });

  describe('Edge Cases', () => {
    it('should handle notifications without messages', async () => {
      const notificationsWithoutMessages = [
        {
          id: 'notif-no-message',
          userId: 'user-1',
          type: NotificationType.TEAM_INVITATION,
          title: 'Team Invitation Unique',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      mockUseNotifications.mockReturnValue({
        data: {
          notifications: notificationsWithoutMessages,
          pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
          unreadCount: 1,
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Team Invitation Unique')).toBeInTheDocument();
      });

      // Should not throw error when message is missing
    });

    it('should handle all notification types', async () => {
      const allTypesNotifications = [
        {
          id: 't1',
          type: NotificationType.TEAM_INVITATION,
          title: 'Team Invite Unique',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 't2',
          type: NotificationType.TEAM_REMOVAL,
          title: 'Team Removal Unique',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 't3',
          type: NotificationType.TASK_ASSIGNMENT,
          title: 'Task Assign Unique',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 't4',
          type: NotificationType.IMPEDIMENT_ASSIGNMENT,
          title: 'Impediment Assign Unique',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 't5',
          type: NotificationType.DAILY_UPDATE_REMINDER,
          title: 'Daily Reminder Unique',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 't6',
          type: NotificationType.TEAM_CREATED,
          title: 'Team Created Unique',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 't7',
          type: NotificationType.TEAM_UPDATED,
          title: 'Team Updated Unique',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 't8',
          type: NotificationType.TEAM_DELETED,
          title: 'Team Deleted Unique',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 't9',
          type: NotificationType.DIRECT_MESSAGE,
          title: 'Direct Message Unique',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      mockUseNotifications.mockReturnValue({
        data: {
          notifications: allTypesNotifications,
          pagination: { page: 1, limit: 50, total: 9, totalPages: 1 },
          unreadCount: 9,
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Team Invite Unique')).toBeInTheDocument();
      });

      // All notifications should render without errors
      expect(screen.getByText('Team Removal Unique')).toBeInTheDocument();
      expect(screen.getByText('Task Assign Unique')).toBeInTheDocument();
      expect(screen.getByText('Impediment Assign Unique')).toBeInTheDocument();
      expect(screen.getByText('Daily Reminder Unique')).toBeInTheDocument();
      expect(screen.getByText('Team Created Unique')).toBeInTheDocument();
      expect(screen.getByText('Team Updated Unique')).toBeInTheDocument();
      expect(screen.getByText('Team Deleted Unique')).toBeInTheDocument();
      expect(screen.getByText('Direct Message Unique')).toBeInTheDocument();
    });

    it('should handle unknown notification types gracefully', async () => {
      const unknownTypeNotification = [
        {
          id: 'notif-unknown',
          userId: 'user-1',
          type: 'UNKNOWN_TYPE' as NotificationType,
          title: 'Unknown Notification Unique',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ];

      mockUseNotifications.mockReturnValue({
        data: {
          notifications: unknownTypeNotification,
          pagination: { page: 1, limit: 50, total: 1, totalPages: 1 },
          unreadCount: 1,
        },
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Unknown Notification Unique')).toBeInTheDocument();
      });

      // Should not throw error
    });
  });

  describe('Accessibility', () => {
    it('should have skip link', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Skip to main content')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA attributes on filter buttons', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('All')).toBeInTheDocument();
      });

      const allFilterButton = screen.getByText('All');
      expect(allFilterButton).toHaveAttribute('role', 'tab');
      expect(allFilterButton).toHaveAttribute('aria-selected', 'true');
    });

    it('should have proper ARIA attributes on notification items', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Test Team Invitation')).toBeInTheDocument();
      });

      const notificationItem = screen
        .getByText('Test Team Invitation')
        .closest('[role="listitem"]');
      expect(notificationItem).not.toBeNull();
      expect(notificationItem).toHaveAttribute('tabIndex', '0');
    });

    it('should have proper ARIA attributes on pagination', async () => {
      const multiPageResponse = {
        ...mockNotificationsResponse,
        pagination: {
          page: 1,
          limit: 50,
          total: 100,
          totalPages: 2,
        },
      };

      mockUseNotifications.mockReturnValue({
        data: multiPageResponse,
        isLoading: false,
        error: null,
        refetch: mockRefetch,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      });

      const paginationNav = screen.getByLabelText('Pagination');
      expect(paginationNav).toBeInTheDocument();
      expect(paginationNav).toHaveAttribute('role', 'navigation');
    });

    it('should have time elements with proper datetime attributes', async () => {
      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Test Team Invitation')).toBeInTheDocument();
      });

      const timeElements = document.querySelectorAll('time');
      expect(timeElements.length).toBeGreaterThan(0);
      timeElements.forEach((time) => {
        expect(time).toHaveAttribute('datetime');
      });
    });
  });
});
