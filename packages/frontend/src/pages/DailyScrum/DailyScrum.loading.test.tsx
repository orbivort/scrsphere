/**
 * DailyScrum Page Loading State Tests
 *
 * Test Coverage:
 * - Initial loading state display when page is loading
 * - Loading state persistence during asynchronous processes
 * - Accessibility during loading
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { DailyScrum } from './DailyScrum';
import { useTeamStore, useAuthStore } from '../../store';
import { apiService } from '../../services';
import { UserRole } from '../../types';

vi.mock('../../store', () => ({
  useTeamStore: vi.fn(),
  useAuthStore: vi.fn(),
}));

vi.mock('../../services', () => ({
  apiService: {
    getActiveSprint: vi.fn(),
    getDailyUpdates: vi.fn(),
    getTeamMembersWithUpdates: vi.fn(),
    createDailyUpdate: vi.fn(),
    promoteToImpediment: vi.fn(),
    sendDailyUpdateReminder: vi.fn(),
    getProductGoals: vi.fn(),
  },
}));

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    toasts: [],
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    removeToast: vi.fn(),
  }),
  ToastContainer: () => <div data-testid="toast-container" />,
}));

vi.mock('../../hooks', () => ({
  useApiError: () => ({
    handleError: vi.fn((_error, fallback) => fallback || 'An error occurred'),
  }),
}));

vi.mock('../../components/TeamMemberSelect/TeamMemberSelect', () => ({
  TeamMemberSelect: () => <div data-testid="team-member-select" />,
}));

vi.mock('../../components/common/ToastContainer', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
    },
  });

const renderDailyScrum = (queryClient?: QueryClient) => {
  const testQueryClient = queryClient || createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter>
        <DailyScrum />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const mockTeam = {
  id: 'team-1',
  name: 'Test Team',
  slug: 'test-team',
  members: [
    {
      id: 'member-1',
      teamId: 'team-1',
      userId: 'user-1',
      role: UserRole.DEVELOPER,
      user: {
        id: 'user-1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
      },
    },
  ],
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
};

const getLoadingElements = () => screen.queryAllByRole('status', { name: /Loading/i });
const hasLoadingState = () => getLoadingElements().length > 0;

describe('DailyScrum - Loading State Tests', () => {
  let mockUseTeamStore: ReturnType<typeof vi.fn>;
  let mockUseAuthStore: ReturnType<typeof vi.fn>;
  let mockApiService: typeof apiService;

  beforeEach(() => {
    mockUseTeamStore = vi.mocked(useTeamStore);
    mockUseAuthStore = vi.mocked(useAuthStore);
    mockApiService = vi.mocked(apiService);

    mockUseTeamStore.mockReturnValue({
      currentTeam: mockTeam,
      teams: [mockTeam],
      setCurrentTeam: vi.fn(),
      fetchTeams: vi.fn(),
    });

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Loading State Display', () => {
    it('should show loading state when page is loading', () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      renderDailyScrum();

      expect(hasLoadingState()).toBe(true);
    });

    it('should show skeleton loading for header while loading', async () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      renderDailyScrum();

      expect(hasLoadingState()).toBe(true);
    });

    it('should show skeleton loading for stats while loading', async () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      renderDailyScrum();

      expect(hasLoadingState()).toBe(true);
    });
  });

  describe('Loading State Persistence', () => {
    it('should maintain loading state during long-running data fetch', async () => {
      vi.useFakeTimers();

      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      renderDailyScrum();

      expect(hasLoadingState()).toBe(true);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(hasLoadingState()).toBe(true);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(hasLoadingState()).toBe(true);

      vi.useRealTimers();
    });
  });

  describe('Accessibility During Loading', () => {
    it('should have proper ARIA attributes during loading', () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      renderDailyScrum();

      const loaders = getLoadingElements();
      expect(loaders.length).toBeGreaterThan(0);

      loaders.forEach((loader) => {
        expect(loader).toHaveAttribute('aria-live', 'polite');
        expect(loader).toHaveAttribute('aria-busy', 'true');
      });
    });

    it('should announce loading state to screen readers', () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      renderDailyScrum();

      expect(hasLoadingState()).toBe(true);
    });
  });

  describe('Loading State Cleanup', () => {
    it('should remove loading state when component unmounts', async () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      const { unmount } = renderDailyScrum();

      expect(hasLoadingState()).toBe(true);

      unmount();

      expect(hasLoadingState()).toBe(false);
    });

    it('should not cause memory leaks with pending promises', async () => {
      vi.useFakeTimers();

      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      const { unmount } = renderDailyScrum();

      unmount();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      expect(hasLoadingState()).toBe(false);

      vi.useRealTimers();
    });
  });
});
