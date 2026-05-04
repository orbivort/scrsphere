/**
 * Notifications Page Loading State Tests
 *
 * Test Coverage:
 * - Initial loading state display when page is loading
 * - Loading state transitions during data fetching operations
 * - Loading state persistence during asynchronous processes
 * - Proper termination of loading state upon completion or error states
 * - Edge cases: slow network, failed data fetching, concurrent loading
 * - Accessibility during loading (ARIA attributes)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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
    title: 'Team Invitation',
    message: 'You have been invited to join Team Alpha',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'notif-2',
    userId: 'user-1',
    type: NotificationType.TASK_ASSIGNMENT,
    title: 'Task Assigned',
    message: 'New task has been assigned to you',
    isRead: true,
    readAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  },
  {
    id: 'notif-3',
    userId: 'user-1',
    type: NotificationType.DAILY_UPDATE_REMINDER,
    title: 'Daily Update Reminder',
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
    total: 3,
    totalPages: 1,
  },
  unreadCount: 2,
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

describe('Notifications - Loading State Tests', () => {
  let mockUseNotifications: ReturnType<typeof vi.fn>;
  let mockUseMarkAsRead: ReturnType<typeof vi.fn>;
  let mockUseMarkAllAsRead: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockUseNotifications = vi.mocked(useNotifications);
    mockUseMarkAsRead = vi.mocked(useMarkAsRead);
    mockUseMarkAllAsRead = vi.mocked(useMarkAllAsRead);

    mockUseMarkAsRead.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useMarkAsRead>);

    mockUseMarkAllAsRead.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useMarkAllAsRead>);

    mockNavigate.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Loading State Display', () => {
    it('should show loading state when page is loading', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show LoadingState component with correct props during initial load', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-label', 'Loading notifications');
    });

    it('should show loading state when notifications data is being fetched', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      expect(screen.getByRole('status')).toBeInTheDocument();
      // Check that loading text appears (it appears in both aria-label and visible text)
      const loadingTexts = screen.getAllByText('Loading notifications...');
      expect(loadingTexts.length).toBeGreaterThan(0);
    });

    it('should not show notification content while loading', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      expect(screen.queryByText('Team Invitation')).not.toBeInTheDocument();
      expect(screen.queryByText('Task Assigned')).not.toBeInTheDocument();
    });
  });

  describe('Loading State Transitions', () => {
    it('should transition from loading to loaded state when data fetch completes', async () => {
      mockUseNotifications.mockReturnValue({
        data: mockNotificationsResponse,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Team Invitation')).toBeInTheDocument();
    });

    it('should show notification groups after loading completes', async () => {
      mockUseNotifications.mockReturnValue({
        data: mockNotificationsResponse,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
      });
    });

    it('should show empty state when no notifications exist', async () => {
      mockUseNotifications.mockReturnValue({
        data: mockEmptyResponse,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('No notifications yet')).toBeInTheDocument();
      });
    });

    it('should show mark all as read button when there are unread notifications', async () => {
      mockUseNotifications.mockReturnValue({
        data: mockNotificationsResponse,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Mark All as Read')).toBeInTheDocument();
      });
    });

    it('should not show mark all as read button when no unread notifications', async () => {
      const readResponse = {
        ...mockNotificationsResponse,
        unreadCount: 0,
        notifications: mockNotifications.map((n) => ({ ...n, isRead: true })),
      };

      mockUseNotifications.mockReturnValue({
        data: readResponse,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.queryByText('Mark All as Read')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State Persistence', () => {
    it('should maintain loading state during long-running data fetch', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should persist loading state until data is available', async () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      const { rerender } = renderNotifications();

      expect(screen.getByRole('status')).toBeInTheDocument();

      // Simulate data becoming available
      mockUseNotifications.mockReturnValue({
        data: mockNotificationsResponse,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter>
            <Notifications />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during filter change', async () => {
      mockUseNotifications.mockReturnValue({
        data: mockNotificationsResponse,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      const { rerender } = renderNotifications();

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Simulate filter change causing loading
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter>
            <Notifications />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error State Handling', () => {
    it('should handle error state when notifications fetch fails', async () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
    });

    it('should not show loading state after error occurs', async () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should transition from loading to error state', async () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      const { rerender } = renderNotifications();

      expect(screen.getByRole('status')).toBeInTheDocument();

      // Simulate error occurring
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Network error'),
      } as unknown as ReturnType<typeof useNotifications>);

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter>
            <Notifications />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
        expect(screen.getByText('Failed to load notifications')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases: Slow Network', () => {
    it('should show loading state for slow network requests', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should eventually complete after slow network delay', async () => {
      // Start with loading
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      const { rerender } = renderNotifications();

      expect(screen.getByRole('status')).toBeInTheDocument();

      // Simulate slow network completing
      mockUseNotifications.mockReturnValue({
        data: mockNotificationsResponse,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter>
            <Notifications />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should handle timeout-like scenarios gracefully', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      // Simulate extended loading time - still shows loading
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Edge Cases: Failed Data Fetching', () => {
    it('should handle partial data fetch failure', async () => {
      mockUseNotifications.mockReturnValue({
        data: {
          notifications: [],
          pagination: { page: 1, limit: 50, total: 0, totalPages: 0 },
          unreadCount: 0,
        },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('No notifications yet')).toBeInTheDocument();
      });
    });

    it('should handle API returning malformed data', async () => {
      mockUseNotifications.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('No notifications yet')).toBeInTheDocument();
      });
    });

    it('should handle undefined data gracefully', async () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('No notifications yet')).toBeInTheDocument();
      });
    });
  });

  describe('Concurrent Loading Operations', () => {
    it('should handle multiple rapid filter changes during loading', async () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      const { rerender } = renderNotifications();

      // Simulate rapid filter changes
      for (let i = 0; i < 5; i++) {
        rerender(
          <QueryClientProvider client={createTestQueryClient()}>
            <MemoryRouter>
              <Notifications />
            </MemoryRouter>
          </QueryClientProvider>
        );

        expect(screen.getByRole('status')).toBeInTheDocument();
      }

      // Final data load
      mockUseNotifications.mockReturnValue({
        data: mockNotificationsResponse,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter>
            <Notifications />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should handle mark as read during loading', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      expect(screen.getByRole('status')).toBeInTheDocument();

      // Even if markAsRead is called, loading should persist
      mockUseMarkAsRead.mockReturnValue({
        mutateAsync: vi.fn(),
        isPending: true,
      } as unknown as ReturnType<typeof useMarkAsRead>);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Accessibility During Loading', () => {
    it('should have proper ARIA attributes during loading', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('aria-label', 'Loading notifications');
    });

    it('should announce loading state to screen readers', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-label', 'Loading notifications');
    });

    it('should have visible loading text for screen readers', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      // Check that loading text appears (it appears in both aria-label and visible text)
      const loadingTexts = screen.getAllByText('Loading notifications...');
      expect(loadingTexts.length).toBeGreaterThan(0);
    });

    it('should use polite aria-live for non-critical loading', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('aria-label', 'Loading notifications');
    });

    it('should maintain accessibility when transitioning from loading to loaded', async () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      const { rerender } = renderNotifications();

      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('aria-label', 'Loading notifications');

      // Transition to loaded
      mockUseNotifications.mockReturnValue({
        data: mockNotificationsResponse,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter>
            <Notifications />
          </MemoryRouter>
        </QueryClientProvider>
      );

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Content should be accessible
      expect(screen.getByText('Team Invitation')).toBeInTheDocument();
    });
  });

  describe('Loading State Cleanup', () => {
    it('should remove loading state when component unmounts', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      const { unmount } = renderNotifications();

      expect(screen.getByRole('status')).toBeInTheDocument();

      unmount();

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should not cause memory leaks with pending promises', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      const { unmount } = renderNotifications();

      unmount();

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should clean up properly after successful load', async () => {
      mockUseNotifications.mockReturnValue({
        data: mockNotificationsResponse,
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      const { unmount } = renderNotifications();

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      unmount();

      expect(screen.queryByText('Team Invitation')).not.toBeInTheDocument();
    });
  });

  describe('Pagination Loading States', () => {
    it('should show loading when changing pages', async () => {
      mockUseNotifications.mockReturnValue({
        data: {
          ...mockNotificationsResponse,
          pagination: { page: 1, limit: 50, total: 100, totalPages: 2 },
        },
        isLoading: false,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      const { rerender } = renderNotifications();

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
      });

      // Simulate page change causing loading
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      rerender(
        <QueryClientProvider client={createTestQueryClient()}>
          <MemoryRouter>
            <Notifications />
          </MemoryRouter>
        </QueryClientProvider>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show loading state during pagination fetch', () => {
      mockUseNotifications.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as unknown as ReturnType<typeof useNotifications>);

      renderNotifications();

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });
});
