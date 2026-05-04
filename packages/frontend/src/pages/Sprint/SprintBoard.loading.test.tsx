/**
 * SprintBoard Page Loading State Tests
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

import { SprintBoard } from './SprintBoard';
import { useTeamStore } from '../../store';
import { apiService } from '../../services';
import { SprintStatus, TaskStatus } from '../../types';

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
    getActiveSprint: vi.fn(),
    getSprintTasks: vi.fn(),
    getTeam: vi.fn(),
    getBurndownData: vi.fn(),
    getDefinitionOfDone: vi.fn(),
    getImpediments: vi.fn(),
    getDoDComplianceReport: vi.fn(),
    createTask: vi.fn(),
    updateTask: vi.fn(),
    deleteTask: vi.fn(),
    completeSprint: vi.fn(),
  },
}));

// Mock hooks
vi.mock('../../hooks', () => ({
  useDebounce: (value: string) => value,
  useToast: () => ({
    toasts: [],
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    removeToast: vi.fn(),
  }),
}));

// Mock EmptyState
vi.mock('../../components/EmptyState', () => ({
  EmptyState: ({ type }: { type: string }) => (
    <div data-testid={`empty-state-${type}`}>Empty State: {type}</div>
  ),
}));

// Mock child components
vi.mock('./components/TaskCard', () => ({
  TaskCard: () => <div data-testid="task-card" />,
}));

vi.mock('./components/SwimlanesBoard', () => ({
  SwimlanesBoard: () => <div data-testid="swimlanes-board" />,
}));

vi.mock('./components/BurndownChart', () => ({
  BurndownChart: () => <div data-testid="burndown-chart" />,
}));

vi.mock('./components/modals', () => ({
  TaskDetailModal: () => <div data-testid="task-detail-modal" />,
  TaskEditModal: () => <div data-testid="task-edit-modal" />,
  TaskCreateModal: () => <div data-testid="task-create-modal" />,
  DeleteConfirmModal: () => <div data-testid="delete-confirm-modal" />,
  CompleteSprintModal: () => <div data-testid="complete-sprint-modal" />,
  KeyboardHelpModal: () => <div data-testid="keyboard-help-modal" />,
}));

vi.mock('./components/DoDVerificationModal', () => ({
  DoDVerificationModal: () => <div data-testid="dod-verification-modal" />,
}));

vi.mock('./SprintBacklogManager', () => ({
  SprintBacklogManager: () => <div data-testid="sprint-backlog-manager" />,
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

const renderSprintBoard = (queryClient?: QueryClient) => {
  const testQueryClient = queryClient || createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter>
        <SprintBoard />
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

const mockSprint = {
  id: 'sprint-1',
  teamId: 'team-1',
  name: 'Sprint 1',
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-01-14T23:59:59Z',
  sprintGoal: 'Complete user authentication',
  status: SprintStatus.ACTIVE,
  tasks: [],
  items: [],
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockTasks = [
  {
    id: 'task-1',
    title: 'Task 1',
    description: 'Test task',
    status: TaskStatus.TODO,
    sprintId: 'sprint-1',
    pbiId: 'pbi-1',
    assigneeId: 'user-1',
    estimatedHours: 8,
    remainingHours: 8,
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

describe('SprintBoard - Loading State Tests', () => {
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
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      renderSprintBoard();

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();
    });

    it('should show loading spinner during initial load', () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      const { container } = renderSprintBoard();

      // Check for LoadingState component using CSS module class pattern
      expect(container.querySelector('[class*="page-loader"]')).toBeInTheDocument();
    });

    it('should show LoadingState component during loading', () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      const { container } = renderSprintBoard();

      expect(container.querySelector('[class*="page-loader"]')).toBeInTheDocument();
    });

    it('should show empty state when no team is selected', () => {
      mockUseTeamStore.mockReturnValue({
        currentTeam: null,
      });

      renderSprintBoard();

      expect(screen.getByTestId('empty-state-no-team')).toBeInTheDocument();
    });

    it('should show empty state when no active sprint exists', async () => {
      mockApiService.getActiveSprint.mockResolvedValue({ data: null });

      renderSprintBoard();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByTestId('empty-state-no-active-sprint')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State Transitions', () => {
    it('should transition from loading to loaded state when data fetch completes', async () => {
      mockApiService.getActiveSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintTasks.mockResolvedValue({ data: mockTasks });
      mockApiService.getTeam.mockResolvedValue({ data: mockTeamData });
      mockApiService.getDefinitionOfDone.mockResolvedValue({ data: { items: [] } });
      mockApiService.getImpediments.mockResolvedValue({ data: [] });

      renderSprintBoard();

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Loading sprint board/i)).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
    });

    it('should show loading state during active sprint fetch', async () => {
      let resolveSprint: (value: unknown) => void;
      mockApiService.getActiveSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprint = resolve;
          })
      );

      renderSprintBoard();

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();

      await act(async () => {
        resolveSprint!({ data: mockSprint });
        vi.runAllTimersAsync();
      });
    });

    it('should show loading state during tasks fetch', async () => {
      mockApiService.getActiveSprint.mockResolvedValue({ data: mockSprint });
      let resolveTasks: ((value: unknown) => void) | null = null;
      mockApiService.getSprintTasks.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveTasks = resolve;
          })
      );

      renderSprintBoard();

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveTasks) resolveTasks({ data: mockTasks });
        vi.runAllTimersAsync();
      });
    });
  });

  describe('Loading State Persistence', () => {
    it('should maintain loading state during long-running data fetch', async () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      renderSprintBoard();

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();
    });

    it('should persist loading state until all data is loaded', async () => {
      let resolveSprint: ((value: unknown) => void) | null = null;
      let resolveTasks: ((value: unknown) => void) | null = null;

      mockApiService.getActiveSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprint = resolve;
          })
      );
      mockApiService.getSprintTasks.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveTasks = resolve;
          })
      );

      renderSprintBoard();

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveSprint) resolveSprint({ data: mockSprint });
        vi.runAllTimersAsync();
      });

      // Still loading because tasks not resolved
      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveTasks) resolveTasks({ data: mockTasks });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Loading sprint board/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State Handling', () => {
    it('should handle error state when sprint fetch fails', async () => {
      mockApiService.getActiveSprint.mockRejectedValue(new Error('Network error'));

      renderSprintBoard();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Loading sprint board/i)).not.toBeInTheDocument();
      });
    });

    it('should handle error state when tasks fetch fails', async () => {
      mockApiService.getActiveSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintTasks.mockRejectedValue(new Error('Tasks error'));

      renderSprintBoard();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Loading sprint board/i)).not.toBeInTheDocument();
      });
    });

    it('should handle partial data loading with some failures', async () => {
      mockApiService.getActiveSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintTasks.mockResolvedValue({ data: mockTasks });
      mockApiService.getTeam.mockRejectedValue(new Error('Team error'));
      mockApiService.getDefinitionOfDone.mockResolvedValue({ data: { items: [] } });
      mockApiService.getImpediments.mockResolvedValue({ data: [] });

      renderSprintBoard();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Loading sprint board/i)).not.toBeInTheDocument();
      });

      // Should still show the board
      expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
    });
  });

  describe('Edge Cases: Slow Network', () => {
    it('should show loading state for slow network requests', async () => {
      mockApiService.getActiveSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: mockSprint }), 10000);
          })
      );

      renderSprintBoard();

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();
    });

    it('should eventually complete after slow network delay', async () => {
      let resolveSprint: ((value: unknown) => void) | null = null;
      let resolveTasks: ((value: unknown) => void) | null = null;

      mockApiService.getActiveSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprint = resolve;
          })
      );
      mockApiService.getSprintTasks.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveTasks = resolve;
          })
      );
      mockApiService.getTeam.mockResolvedValue({ data: mockTeamData });
      mockApiService.getDefinitionOfDone.mockResolvedValue({ data: { items: [] } });
      mockApiService.getImpediments.mockResolvedValue({ data: [] });

      renderSprintBoard();

      // Simulate slow network by resolving after timer advancement
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      await act(async () => {
        if (resolveSprint) resolveSprint({ data: mockSprint });
        vi.runAllTimersAsync();
      });

      act(() => {
        vi.advanceTimersByTime(500);
      });

      await act(async () => {
        if (resolveTasks) resolveTasks({ data: mockTasks });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Loading sprint board/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Concurrent Loading Operations', () => {
    it('should handle multiple concurrent data fetches', async () => {
      let resolveSprint: ((value: unknown) => void) | null = null;
      let resolveTasks: ((value: unknown) => void) | null = null;
      let resolveTeam: ((value: unknown) => void) | null = null;

      mockApiService.getActiveSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprint = resolve;
          })
      );
      mockApiService.getSprintTasks.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveTasks = resolve;
          })
      );
      mockApiService.getTeam.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveTeam = resolve;
          })
      );
      mockApiService.getDefinitionOfDone.mockResolvedValue({ data: { items: [] } });
      mockApiService.getImpediments.mockResolvedValue({ data: [] });

      renderSprintBoard();

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveSprint) resolveSprint({ data: mockSprint });
        vi.runAllTimersAsync();
      });

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();

      await act(async () => {
        if (resolveTasks) resolveTasks({ data: mockTasks });
        vi.runAllTimersAsync();
      });

      await act(async () => {
        if (resolveTeam) resolveTeam({ data: mockTeamData });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Loading sprint board/i)).not.toBeInTheDocument();
      });
    });

    it('should handle concurrent loading of sprint and tasks', async () => {
      mockApiService.getActiveSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintTasks.mockResolvedValue({ data: mockTasks });
      mockApiService.getTeam.mockResolvedValue({ data: mockTeamData });
      mockApiService.getDefinitionOfDone.mockResolvedValue({ data: { items: [] } });
      mockApiService.getImpediments.mockResolvedValue({ data: [] });

      renderSprintBoard();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Loading sprint board/i)).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
    });
  });

  describe('Accessibility During Loading', () => {
    it('should have proper ARIA attributes during loading', () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      const { container } = renderSprintBoard();

      const loadingContainer = container.querySelector('[role="status"]');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
    });

    it('should announce loading state to screen readers', () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      renderSprintBoard();

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();
    });

    it('should have proper ARIA attributes during loading', () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      const { container } = renderSprintBoard();

      const loadingContainer = container.querySelector('[role="status"]');
      expect(loadingContainer).toBeInTheDocument();
      expect(loadingContainer).toHaveAttribute('aria-live', 'polite');
      expect(loadingContainer).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Loading State Cleanup', () => {
    it('should remove loading state when component unmounts', async () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      const { unmount } = renderSprintBoard();

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();

      unmount();

      expect(screen.queryByText(/Loading sprint board/i)).not.toBeInTheDocument();
    });

    it('should not cause memory leaks with pending promises', async () => {
      let resolveSprint: ((value: unknown) => void) | null = null;
      mockApiService.getActiveSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprint = resolve;
          })
      );

      const { unmount } = renderSprintBoard();

      unmount();

      await act(async () => {
        if (resolveSprint) resolveSprint({ data: mockSprint });
        vi.runAllTimersAsync();
      });

      expect(screen.queryByText(/Loading sprint board/i)).not.toBeInTheDocument();
    });

    it('should clean up loading state after error', async () => {
      mockApiService.getActiveSprint.mockRejectedValue(new Error('Network error'));

      renderSprintBoard();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Loading sprint board/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State with Empty Data', () => {
    it('should show board when tasks are empty but sprint exists', async () => {
      mockApiService.getActiveSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintTasks.mockResolvedValue({ data: [] });
      mockApiService.getTeam.mockResolvedValue({ data: mockTeamData });
      mockApiService.getDefinitionOfDone.mockResolvedValue({ data: { items: [] } });
      mockApiService.getImpediments.mockResolvedValue({ data: [] });

      renderSprintBoard();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Loading sprint board/i)).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
    });

    it('should transition from loading to empty tasks view', async () => {
      let resolveSprint: ((value: unknown) => void) | null = null;
      let resolveTasks: ((value: unknown) => void) | null = null;

      mockApiService.getActiveSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprint = resolve;
          })
      );
      mockApiService.getSprintTasks.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveTasks = resolve;
          })
      );
      mockApiService.getTeam.mockResolvedValue({ data: mockTeamData });
      mockApiService.getDefinitionOfDone.mockResolvedValue({ data: { items: [] } });
      mockApiService.getImpediments.mockResolvedValue({ data: [] });

      renderSprintBoard();

      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();

      // Resolve sprint first
      await act(async () => {
        if (resolveSprint) resolveSprint({ data: mockSprint });
        vi.runAllTimersAsync();
      });

      // Still loading because tasks not resolved
      expect(screen.getAllByText(/Loading sprint board/i)[0]).toBeInTheDocument();

      // Now resolve tasks with empty array
      await act(async () => {
        if (resolveTasks) resolveTasks({ data: [] });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByText(/Loading sprint board/i)).not.toBeInTheDocument();
      });

      // Should show the sprint board even with empty tasks
      expect(screen.getByTestId('sprint-board')).toBeInTheDocument();
    });
  });
});
