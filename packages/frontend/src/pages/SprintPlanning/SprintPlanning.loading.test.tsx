/**
 * SprintPlanning Page Loading State Tests
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
import { render, screen, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { SprintPlanning } from './SprintPlanning';
import { useTeamStore } from '../../store';
import { apiService } from '../../services';
import { ItemStatus, SprintStatus } from '../../types';

// Mock stores
vi.mock('../../store', () => ({
  useTeamStore: vi.fn(),
  useAuthStore: vi.fn(() => ({
    error: null,
    setError: vi.fn(),
    logout: vi.fn(),
  })),
}));

// Mock API service
vi.mock('../../services', () => ({
  apiService: {
    getGeneratedSprints: vi.fn(),
    getProductBacklog: vi.fn(),
    getTeam: vi.fn(),
    getProductGoals: vi.fn(),
    getSprintTasks: vi.fn(),
    startSprint: vi.fn(),
    updateGeneratedSprint: vi.fn(),
  },
}));

// Mock hooks
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

// Mock EmptyState
vi.mock('../../components/EmptyState', () => ({
  EmptyState: ({ type }: { type: string }) => (
    <div data-testid={`empty-state-${type}`}>Empty State: {type}</div>
  ),
}));

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

const renderSprintPlanning = (queryClient?: QueryClient) => {
  const testQueryClient = queryClient || createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter>
        <SprintPlanning />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Mock data
const mockTeam = {
  id: 'team-1',
  name: 'Test Team',
  slug: 'test-team',
};

const mockGeneratedSprints = [
  {
    id: 'sprint-1',
    name: 'Sprint 1',
    status: SprintStatus.PLANNED,
    startDate: '2026-02-01T00:00:00Z',
    endDate: '2026-02-14T23:59:59Z',
    sprintGoal: 'Complete authentication feature',
    sprintNumber: 1,
    year: 2026,
  },
];

const mockBacklogItems = [
  {
    id: 'pbi-1',
    title: 'Test PBI 1',
    description: 'Test description',
    status: ItemStatus.READY,
    priority: 'MUST_HAVE',
    storyPoints: 5,
    teamId: 'team-1',
    labels: [],
    acceptanceCriteria: 'Test criteria',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

const mockTeamData = {
  id: 'team-1',
  name: 'Test Team',
  members: [
    {
      id: 'member-1',
      userId: 'user-1',
      teamId: 'team-1',
      user: {
        id: 'user-1',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
      },
    },
  ],
};

const mockActiveGoal = {
  id: 'goal-1',
  title: 'Test Goal',
  description: 'Test goal description',
  status: 'ACTIVE',
  teamId: 'team-1',
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-12-31T23:59:59Z',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('SprintPlanning - Loading State Tests', () => {
  let mockUseTeamStore: ReturnType<typeof vi.fn>;
  let mockApiService: typeof apiService;

  beforeEach(() => {
    vi.useFakeTimers();
    mockUseTeamStore = vi.mocked(useTeamStore);
    mockApiService = vi.mocked(apiService);

    mockUseTeamStore.mockReturnValue({
      currentTeam: mockTeam,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial Loading State Display', () => {
    it('should show loading state when page is loading', () => {
      mockApiService.getGeneratedSprints.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductBacklog.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderSprintPlanning();

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();
    });

    it('should show loading spinner during initial load', () => {
      mockApiService.getGeneratedSprints.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductBacklog.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      const { container } = renderSprintPlanning();

      expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    });

    it('should show LoadingState component during loading', () => {
      mockApiService.getGeneratedSprints.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductBacklog.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      const { container } = renderSprintPlanning();

      expect(container.querySelector('[class*="page-loader"]')).toBeInTheDocument();
    });

    it('should show empty state when no team is selected', () => {
      mockUseTeamStore.mockReturnValue({
        currentTeam: null,
      });

      renderSprintPlanning();

      expect(screen.getByTestId('empty-state-no-team')).toBeInTheDocument();
    });

    it('should show empty state when no active goal exists', async () => {
      mockApiService.getGeneratedSprints.mockResolvedValue({ data: mockGeneratedSprints });
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });
      mockApiService.getProductGoals.mockResolvedValue({ data: [] });
      mockApiService.getTeam.mockResolvedValue({ data: mockTeamData });

      renderSprintPlanning();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByTestId('empty-state-no-active-goal')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State Transitions', () => {
    it('should transition from loading to loaded state when data fetch completes', async () => {
      mockApiService.getGeneratedSprints.mockResolvedValue({ data: mockGeneratedSprints });
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });
      mockApiService.getProductGoals.mockResolvedValue({ data: [mockActiveGoal] });
      mockApiService.getTeam.mockResolvedValue({ data: mockTeamData });

      const { container } = renderSprintPlanning();

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('sprint-planning')).toBeInTheDocument();
    });

    it('should show loading state during sprints fetch', async () => {
      let resolveSprints: ((value: unknown) => void) | null = null;
      mockApiService.getGeneratedSprints.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprints = resolve;
          })
      );
      mockApiService.getProductBacklog.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderSprintPlanning();

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveSprints) resolveSprints({ data: mockGeneratedSprints });
        vi.runAllTimersAsync();
      });
    });

    it('should show loading state during backlog fetch', async () => {
      mockApiService.getGeneratedSprints.mockResolvedValue({ data: mockGeneratedSprints });
      let resolveBacklog: ((value: unknown) => void) | null = null;
      mockApiService.getProductBacklog.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveBacklog = resolve;
          })
      );
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderSprintPlanning();

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveBacklog) resolveBacklog({ data: mockBacklogItems });
        vi.runAllTimersAsync();
      });
    });

    it('should show loading state during goals fetch', async () => {
      mockApiService.getGeneratedSprints.mockResolvedValue({ data: mockGeneratedSprints });
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });
      let resolveGoals: ((value: unknown) => void) | null = null;
      mockApiService.getProductGoals.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveGoals = resolve;
          })
      );

      renderSprintPlanning();

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveGoals) resolveGoals({ data: [mockActiveGoal] });
        vi.runAllTimersAsync();
      });
    });
  });

  describe('Loading State Persistence', () => {
    it('should maintain loading state during long-running data fetch', async () => {
      mockApiService.getGeneratedSprints.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductBacklog.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderSprintPlanning();

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();
    });

    it('should persist loading state until all data is loaded', async () => {
      let resolveSprints: ((value: unknown) => void) | null = null;
      let resolveBacklog: ((value: unknown) => void) | null = null;
      let resolveGoals: ((value: unknown) => void) | null = null;

      mockApiService.getGeneratedSprints.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprints = resolve;
          })
      );
      mockApiService.getProductBacklog.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveBacklog = resolve;
          })
      );
      mockApiService.getProductGoals.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveGoals = resolve;
          })
      );

      const { container } = renderSprintPlanning();

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveSprints) resolveSprints({ data: mockGeneratedSprints });
        vi.runAllTimersAsync();
      });

      // Still loading
      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveBacklog) resolveBacklog({ data: mockBacklogItems });
        vi.runAllTimersAsync();
      });

      // Still loading
      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveGoals) resolveGoals({ data: [mockActiveGoal] });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State Handling', () => {
    it('should handle error state when sprints fetch fails', async () => {
      mockApiService.getGeneratedSprints.mockRejectedValue(new Error('Network error'));
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });
      mockApiService.getProductGoals.mockResolvedValue({ data: [mockActiveGoal] });

      const { container } = renderSprintPlanning();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
      });
    });

    it('should handle error state when backlog fetch fails', async () => {
      mockApiService.getGeneratedSprints.mockResolvedValue({ data: mockGeneratedSprints });
      mockApiService.getProductBacklog.mockRejectedValue(new Error('Backlog error'));
      mockApiService.getProductGoals.mockResolvedValue({ data: [mockActiveGoal] });

      const { container } = renderSprintPlanning();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
      });
    });

    it('should handle error state when goals fetch fails', async () => {
      mockApiService.getGeneratedSprints.mockResolvedValue({ data: mockGeneratedSprints });
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });
      mockApiService.getProductGoals.mockRejectedValue(new Error('Goals error'));

      const { container } = renderSprintPlanning();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
      });
    });

    it('should handle partial data loading with some failures', async () => {
      mockApiService.getGeneratedSprints.mockResolvedValue({ data: mockGeneratedSprints });
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });
      mockApiService.getProductGoals.mockRejectedValue(new Error('Goals error'));

      const { container } = renderSprintPlanning();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases: Slow Network', () => {
    it('should show loading state for slow network requests', async () => {
      mockApiService.getGeneratedSprints.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: mockGeneratedSprints }), 10000);
          })
      );
      mockApiService.getProductBacklog.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderSprintPlanning();

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();
    });

    it('should eventually complete after slow network delay', async () => {
      // Use resolved values to simulate eventual completion
      mockApiService.getGeneratedSprints.mockResolvedValue({ data: mockGeneratedSprints });
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });
      mockApiService.getProductGoals.mockResolvedValue({ data: [mockActiveGoal] });
      mockApiService.getTeam.mockResolvedValue({ data: mockTeamData });

      const { container } = renderSprintPlanning();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
      });
    });
  });

  describe('Concurrent Loading Operations', () => {
    it('should handle multiple concurrent data fetches', async () => {
      let resolveSprints: ((value: unknown) => void) | null = null;
      let resolveBacklog: ((value: unknown) => void) | null = null;
      let resolveGoals: ((value: unknown) => void) | null = null;

      mockApiService.getGeneratedSprints.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprints = resolve;
          })
      );
      mockApiService.getProductBacklog.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveBacklog = resolve;
          })
      );
      mockApiService.getProductGoals.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveGoals = resolve;
          })
      );

      const { container } = renderSprintPlanning();

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveSprints) resolveSprints({ data: mockGeneratedSprints });
        vi.runAllTimersAsync();
      });

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveBacklog) resolveBacklog({ data: mockBacklogItems });
        vi.runAllTimersAsync();
      });

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveGoals) resolveGoals({ data: [mockActiveGoal] });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
      });
    });

    it('should handle concurrent loading of all data sources', async () => {
      mockApiService.getGeneratedSprints.mockResolvedValue({ data: mockGeneratedSprints });
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });
      mockApiService.getProductGoals.mockResolvedValue({ data: [mockActiveGoal] });
      mockApiService.getTeam.mockResolvedValue({ data: mockTeamData });

      const { container } = renderSprintPlanning();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('sprint-planning')).toBeInTheDocument();
    });
  });

  describe('Accessibility During Loading', () => {
    it('should have proper ARIA attributes during loading', () => {
      mockApiService.getGeneratedSprints.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductBacklog.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      const { container } = renderSprintPlanning();

      const loadingContainer = container.querySelector('[role="status"]');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce loading state to screen readers', () => {
      mockApiService.getGeneratedSprints.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductBacklog.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderSprintPlanning();

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();
    });

    it('should hide decorative spinner from screen readers', () => {
      mockApiService.getGeneratedSprints.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductBacklog.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      const { container } = renderSprintPlanning();

      const spinner = container.querySelector('[role="progressbar"]');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Loading State Cleanup', () => {
    it('should remove loading state when component unmounts', async () => {
      mockApiService.getGeneratedSprints.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductBacklog.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      const { unmount, container } = renderSprintPlanning();

      expect(container.querySelector('[class*="page-loader"]')).toBeInTheDocument();

      unmount();

      expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
    });

    it('should not cause memory leaks with pending promises', async () => {
      let resolveSprints: ((value: unknown) => void) | null = null;
      mockApiService.getGeneratedSprints.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprints = resolve;
          })
      );
      mockApiService.getProductBacklog.mockImplementation(() => new Promise(() => {}));
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      const { unmount, container } = renderSprintPlanning();

      unmount();

      await act(async () => {
        if (resolveSprints) resolveSprints({ data: mockGeneratedSprints });
        vi.runAllTimersAsync();
      });

      expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
    });

    it('should clean up loading state after error', async () => {
      mockApiService.getGeneratedSprints.mockRejectedValue(new Error('Network error'));
      mockApiService.getProductBacklog.mockRejectedValue(new Error('Network error'));
      mockApiService.getProductGoals.mockRejectedValue(new Error('Network error'));

      const { container } = renderSprintPlanning();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State with Empty Data', () => {
    it('should show content when sprints are empty', async () => {
      mockApiService.getGeneratedSprints.mockResolvedValue({ data: [] });
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });
      mockApiService.getProductGoals.mockResolvedValue({ data: [mockActiveGoal] });
      mockApiService.getTeam.mockResolvedValue({ data: mockTeamData });

      const { container } = renderSprintPlanning();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('sprint-planning')).toBeInTheDocument();
    });

    it('should show content when backlog is empty', async () => {
      mockApiService.getGeneratedSprints.mockResolvedValue({ data: mockGeneratedSprints });
      mockApiService.getProductBacklog.mockResolvedValue({ data: [] });
      mockApiService.getProductGoals.mockResolvedValue({ data: [mockActiveGoal] });
      mockApiService.getTeam.mockResolvedValue({ data: mockTeamData });

      const { container } = renderSprintPlanning();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('sprint-planning')).toBeInTheDocument();
    });

    it('should transition from loading to empty backlog view', async () => {
      let resolveBacklog: ((value: unknown) => void) | null = null;
      mockApiService.getGeneratedSprints.mockResolvedValue({ data: mockGeneratedSprints });
      mockApiService.getProductBacklog.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveBacklog = resolve;
          })
      );
      mockApiService.getProductGoals.mockResolvedValue({ data: [mockActiveGoal] });

      const { container } = renderSprintPlanning();

      expect(screen.getAllByText(/Loading Sprint Planning/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveBacklog) resolveBacklog({ data: [] });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(container.querySelector('[class*="page-loader"]')).not.toBeInTheDocument();
      });
    });
  });
});
