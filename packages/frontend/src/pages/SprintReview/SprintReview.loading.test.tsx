/**
 * SprintReview Page Loading State Tests
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
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { SprintReview } from './SprintReview';
import { useTeamStore } from '../../store';
import { apiService } from '../../services';
import { SprintStatus, IncrementStatus, DeliveryMethod, UserRole } from '../../types';

// Mock stores
vi.mock('../../store', () => ({
  useTeamStore: vi.fn(),
}));

// Mock API service
vi.mock('../../services', () => ({
  apiService: {
    getActiveSprint: vi.fn(),
    getSprints: vi.fn(),
    getSprint: vi.fn(),
    getSprintReviews: vi.fn(),
    getIncrements: vi.fn(),
    getSprintBacklogPBIs: vi.fn(),
    createSprintReview: vi.fn(),
    updateSprintReview: vi.fn(),
    addStakeholderFeedback: vi.fn(),
    addAttendee: vi.fn(),
    updateAttendee: vi.fn(),
    deleteAttendee: vi.fn(),
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

vi.mock('../../hooks', () => ({
  useApiError: () => ({
    handleError: vi.fn((_error, fallback) => fallback || 'An error occurred'),
  }),
}));

vi.mock('../../hooks/useMutationErrorHandler', () => ({
  useMutationErrorHandler: () => ({
    handleMutationError: vi.fn((_error, _context) => 'An error occurred'),
  }),
}));

vi.mock('../../hooks/useModalFocus', () => ({
  useModalFocus: () => ({
    modalRef: { current: null },
  }),
}));

// Mock child components
vi.mock('./AttendeeForm', () => ({
  AttendeeForm: () => <div data-testid="attendee-form" />,
}));

vi.mock('./AttendeesSection', () => ({
  AttendeesSection: () => <div data-testid="attendees-section" />,
}));

vi.mock('../../components/ConfirmDialog/ConfirmDialog', () => ({
  ConfirmDialog: () => <div data-testid="confirm-dialog" />,
}));

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

const renderSprintReview = (initialRoute = '/sprint-review', queryClient?: QueryClient) => {
  const testQueryClient = queryClient || createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <Routes>
          <Route path="/sprint-review" element={<SprintReview />} />
          <Route path="/sprint-review/:sprintId" element={<SprintReview />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Mock data
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

const mockSprint = {
  id: 'sprint-1',
  teamId: 'team-1',
  name: 'Sprint 1',
  startDate: '2026-02-01T00:00:00Z',
  endDate: '2026-02-14T23:59:59Z',
  sprintGoal: 'Test goal',
  status: SprintStatus.ACTIVE,
  tasks: [],
  createdAt: '2026-02-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
};

const mockReview = {
  id: 'review-1',
  sprintId: 'sprint-1',
  teamId: 'team-1',
  reviewDate: '2026-02-14T00:00:00Z',
  summary: 'Test review summary',
  status: 'in_progress',
  attendees: [],
  feedback: [],
  backlogAdjustments: [],
  createdAt: '2026-02-14T00:00:00Z',
  updatedAt: '2026-02-14T00:00:00Z',
};

const mockIncrement = {
  id: 'increment-1',
  sprintId: 'sprint-1',
  teamId: 'team-1',
  name: 'Increment 1',
  description: 'Test increment',
  status: IncrementStatus.DELIVERED,
  deliveryMethod: DeliveryMethod.SPRINT_REVIEW,
  totalStoryPoints: 10,
  deliveredAt: '2026-02-14T00:00:00Z',
  pbis: [],
  createdAt: '2026-02-14T00:00:00Z',
  updatedAt: '2026-02-14T00:00:00Z',
};

const mockSprintBacklogItems = {
  data: [
    {
      id: 'pbi-1',
      title: 'Test PBI',
      storyPoints: 5,
      status: 'DONE',
    },
  ],
};

describe('SprintReview - Loading State Tests', () => {
  let mockUseTeamStore: ReturnType<typeof vi.fn>;
  let mockApiService: typeof apiService;

  beforeEach(() => {
    vi.useFakeTimers();
    mockUseTeamStore = vi.mocked(useTeamStore);
    mockApiService = vi.mocked(apiService);

    mockUseTeamStore.mockReturnValue({
      currentTeam: mockTeam,
      teams: [mockTeam],
      setCurrentTeam: vi.fn(),
      fetchTeams: vi.fn(),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial Loading State Display', () => {
    it('should show loading state when page is loading', () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      renderSprintReview();

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show loading state when finding active sprint', async () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      renderSprintReview();

      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveAttribute('aria-label', 'Finding active sprint...');
    });

    it('should show loading state when sprint data is being fetched', async () => {
      mockApiService.getSprint.mockImplementation(() => new Promise(() => {}));
      mockApiService.getSprintReviews.mockImplementation(() => new Promise(() => {}));

      renderSprintReview('/sprint-review/sprint-1');

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading Sprint Review...');
    });

    it('should show empty state when no team is selected', () => {
      mockUseTeamStore.mockReturnValue({
        currentTeam: null,
        teams: [],
        setCurrentTeam: vi.fn(),
        fetchTeams: vi.fn(),
      });

      renderSprintReview();

      expect(screen.getByTestId('empty-state-no-team')).toBeInTheDocument();
    });
  });

  describe('Loading State Transitions', () => {
    it('should transition from loading to loaded state when data fetch completes', async () => {
      mockApiService.getActiveSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprints.mockResolvedValue({ data: [mockSprint] });
      mockApiService.getSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintReviews.mockResolvedValue({ data: [mockReview] });
      mockApiService.getIncrements.mockResolvedValue({ data: [mockIncrement] });
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Sprint Review')).toBeInTheDocument();
    });

    it('should show loading state during sprint fetch', async () => {
      let resolveSprint: (value: unknown) => void;
      mockApiService.getSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprint = resolve;
          })
      );
      mockApiService.getSprintReviews.mockResolvedValue({ data: [mockReview] });
      mockApiService.getIncrements.mockResolvedValue({ data: [mockIncrement] });
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview('/sprint-review/sprint-1');

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        resolveSprint!({ data: mockSprint });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during reviews fetch', async () => {
      let resolveReviews: (value: unknown) => void;
      mockApiService.getSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintReviews.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveReviews = resolve;
          })
      );
      mockApiService.getIncrements.mockResolvedValue({ data: [mockIncrement] });
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview('/sprint-review/sprint-1');

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        resolveReviews!({ data: [mockReview] });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during active sprint fetch', async () => {
      let resolveActiveSprint: (value: unknown) => void;
      mockApiService.getActiveSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveActiveSprint = resolve;
          })
      );
      mockApiService.getSprints.mockResolvedValue({ data: [mockSprint] });
      // Mock other APIs that will be called after activeSprint resolves
      mockApiService.getSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintReviews.mockResolvedValue({ data: [mockReview] });
      mockApiService.getIncrements.mockResolvedValue({ data: [mockIncrement] });
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview();

      // Component shows loading state while fetching active sprint
      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        resolveActiveSprint!({ data: mockSprint });
        vi.runAllTimersAsync();
      });

      // After resolving, component transitions to loaded state
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Should show the sprint review content
      expect(screen.getByText('Sprint Review')).toBeInTheDocument();
    });
  });

  describe('Loading State Persistence', () => {
    it('should maintain loading state during long-running data fetch', async () => {
      let _resolveSprint: (value: unknown) => void;
      mockApiService.getSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            _resolveSprint = resolve;
          })
      );
      mockApiService.getSprintReviews.mockImplementation(() => new Promise(() => {}));

      renderSprintReview('/sprint-review/sprint-1');

      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should persist loading state until all data is loaded', async () => {
      let resolveSprint: (value: unknown) => void;
      let resolveReviews: (value: unknown) => void;

      mockApiService.getSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprint = resolve;
          })
      );
      mockApiService.getSprintReviews.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveReviews = resolve;
          })
      );
      mockApiService.getIncrements.mockResolvedValue({ data: [mockIncrement] });
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview('/sprint-review/sprint-1');

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        resolveSprint!({ data: mockSprint });
        vi.runAllTimersAsync();
      });

      // Still loading because reviews not resolved
      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      await act(async () => {
        resolveReviews!({ data: [mockReview] });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should persist loading state during active sprint resolution', async () => {
      let resolveActiveSprint: (value: unknown) => void;

      mockApiService.getActiveSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveActiveSprint = resolve;
          })
      );
      mockApiService.getSprints.mockResolvedValue({ data: [mockSprint] });
      // Mock other APIs that will be called after activeSprint resolves
      mockApiService.getSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintReviews.mockResolvedValue({ data: [mockReview] });
      mockApiService.getIncrements.mockResolvedValue({ data: [mockIncrement] });
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview();

      // Loading state should be present
      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // Loading state should persist during the fetch
      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        resolveActiveSprint!({ data: mockSprint });
        vi.runAllTimersAsync();
      });

      // After resolving, component transitions to loaded state
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Should show the sprint review content
      expect(screen.getByText('Sprint Review')).toBeInTheDocument();
    });
  });

  describe('Error State Handling', () => {
    it('should handle error state when sprint fetch fails', async () => {
      mockApiService.getSprint.mockRejectedValue(new Error('Network error'));
      mockApiService.getSprintReviews.mockResolvedValue({ data: [mockReview] });
      mockApiService.getIncrements.mockResolvedValue({ data: [mockIncrement] });
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview('/sprint-review/sprint-1');

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should handle error state when reviews fetch fails', async () => {
      mockApiService.getSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintReviews.mockRejectedValue(new Error('Reviews error'));
      mockApiService.getIncrements.mockResolvedValue({ data: [mockIncrement] });
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview('/sprint-review/sprint-1');

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to load Sprint Review')).toBeInTheDocument();
      });
    });

    it('should show error details when reviews fetch fails', async () => {
      mockApiService.getSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintReviews.mockRejectedValue(new Error('Custom error message'));
      mockApiService.getIncrements.mockResolvedValue({ data: [mockIncrement] });
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview('/sprint-review/sprint-1');

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByText('Custom error message')).toBeInTheDocument();
      });
    });

    it('should handle partial data loading with some failures', async () => {
      mockApiService.getSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintReviews.mockResolvedValue({ data: [mockReview] });
      mockApiService.getIncrements.mockRejectedValue(new Error('Increments error'));
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview('/sprint-review/sprint-1');

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases: Slow Network', () => {
    it('should show loading state for slow network requests', async () => {
      mockApiService.getSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: mockSprint }), 10000);
          })
      );
      mockApiService.getSprintReviews.mockImplementation(() => new Promise(() => {}));

      renderSprintReview('/sprint-review/sprint-1');

      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should eventually complete after slow network delay', async () => {
      mockApiService.getSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: mockSprint }), 3000);
          })
      );
      mockApiService.getSprintReviews.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: [mockReview] }), 3500);
          })
      );
      mockApiService.getIncrements.mockResolvedValue({ data: [mockIncrement] });
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview('/sprint-review/sprint-1');

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should show loading state for slow active sprint resolution', async () => {
      mockApiService.getActiveSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: mockSprint }), 8000);
          })
      );
      mockApiService.getSprints.mockResolvedValue({ data: [mockSprint] });

      renderSprintReview();

      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Concurrent Loading Operations', () => {
    it('should handle multiple concurrent data fetches', async () => {
      let resolveSprint: (value: unknown) => void;
      let resolveReviews: (value: unknown) => void;
      let resolveIncrements: (value: unknown) => void;

      mockApiService.getSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprint = resolve;
          })
      );
      mockApiService.getSprintReviews.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveReviews = resolve;
          })
      );
      mockApiService.getIncrements.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveIncrements = resolve;
          })
      );
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview('/sprint-review/sprint-1');

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        resolveSprint!({ data: mockSprint });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });

      await act(async () => {
        resolveReviews!({ data: [mockReview] });
        vi.runAllTimersAsync();
      });

      await act(async () => {
        resolveIncrements!({ data: [mockIncrement] });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should handle concurrent loading of sprint and reviews', async () => {
      let resolveSprint: (value: unknown) => void;
      let resolveReviews: (value: unknown) => void;

      mockApiService.getSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprint = resolve;
          })
      );
      mockApiService.getSprintReviews.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveReviews = resolve;
          })
      );
      mockApiService.getIncrements.mockResolvedValue({ data: [mockIncrement] });
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview('/sprint-review/sprint-1');

      expect(screen.getByRole('status')).toBeInTheDocument();

      // Resolve both concurrently
      await act(async () => {
        resolveSprint!({ data: mockSprint });
        resolveReviews!({ data: [mockReview] });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility During Loading', () => {
    it('should have proper ARIA attributes during loading', () => {
      mockApiService.getSprint.mockImplementation(() => new Promise(() => {}));
      mockApiService.getSprintReviews.mockImplementation(() => new Promise(() => {}));

      renderSprintReview('/sprint-review/sprint-1');

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });

    it('should announce loading state to screen readers', () => {
      mockApiService.getSprint.mockImplementation(() => new Promise(() => {}));
      mockApiService.getSprintReviews.mockImplementation(() => new Promise(() => {}));

      renderSprintReview('/sprint-review/sprint-1');

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-label', 'Loading Sprint Review...');
    });

    it('should have proper ARIA attributes during active sprint loading', () => {
      mockApiService.getActiveSprint.mockImplementation(() => new Promise(() => {}));

      renderSprintReview();

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
      expect(loader).toHaveAttribute('aria-busy', 'true');
      expect(loader).toHaveAttribute('aria-label', 'Finding active sprint...');
    });

    it('should have role="status" for loading indicators', () => {
      mockApiService.getSprint.mockImplementation(() => new Promise(() => {}));
      mockApiService.getSprintReviews.mockImplementation(() => new Promise(() => {}));

      renderSprintReview('/sprint-review/sprint-1');

      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
    });
  });

  describe('Loading State Cleanup', () => {
    it('should remove loading state when component unmounts', async () => {
      mockApiService.getSprint.mockImplementation(() => new Promise(() => {}));
      mockApiService.getSprintReviews.mockImplementation(() => new Promise(() => {}));

      const { unmount } = renderSprintReview('/sprint-review/sprint-1');

      expect(screen.getByRole('status')).toBeInTheDocument();

      unmount();

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should not cause memory leaks with pending promises', async () => {
      let resolveSprint: (value: unknown) => void;
      mockApiService.getSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprint = resolve;
          })
      );
      mockApiService.getSprintReviews.mockImplementation(() => new Promise(() => {}));

      const { unmount } = renderSprintReview('/sprint-review/sprint-1');

      unmount();

      await act(async () => {
        resolveSprint!({ data: mockSprint });
        vi.runAllTimersAsync();
      });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should clean up loading state after error', async () => {
      mockApiService.getSprint.mockRejectedValue(new Error('Network error'));
      mockApiService.getSprintReviews.mockRejectedValue(new Error('Network error'));

      renderSprintReview('/sprint-review/sprint-1');

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State with No Active Sprint', () => {
    it('should show sprint selector when no active sprint exists', async () => {
      mockApiService.getActiveSprint.mockResolvedValue({ data: null });
      mockApiService.getSprints.mockResolvedValue({ data: [mockSprint] });

      renderSprintReview();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByText('No active sprint found for this team.')).toBeInTheDocument();
      });
    });

    it('should show available sprints list when no active sprint', async () => {
      mockApiService.getActiveSprint.mockResolvedValue({ data: null });
      mockApiService.getSprints.mockResolvedValue({ data: [mockSprint] });

      renderSprintReview();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByText('Available Sprints:')).toBeInTheDocument();
      });
    });

    it('should transition from loading to sprint selector', async () => {
      let resolveActiveSprint: (value: unknown) => void;
      mockApiService.getActiveSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveActiveSprint = resolve;
          })
      );
      mockApiService.getSprints.mockResolvedValue({ data: [mockSprint] });

      renderSprintReview();

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        resolveActiveSprint!({ data: null });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByText('Select Sprint for Review')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State with No Review Created', () => {
    it('should show empty state when no review exists', async () => {
      mockApiService.getSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintReviews.mockResolvedValue({ data: [] });
      mockApiService.getIncrements.mockResolvedValue({ data: [mockIncrement] });
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview('/sprint-review/sprint-1');

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByText('No Sprint Review Created')).toBeInTheDocument();
      });
    });

    it('should show create review button when no review exists', async () => {
      mockApiService.getSprint.mockResolvedValue({ data: mockSprint });
      mockApiService.getSprintReviews.mockResolvedValue({ data: [] });
      mockApiService.getIncrements.mockResolvedValue({ data: [mockIncrement] });
      mockApiService.getSprintBacklogPBIs.mockResolvedValue(mockSprintBacklogItems);

      renderSprintReview('/sprint-review/sprint-1');

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByText('Create Sprint Review')).toBeInTheDocument();
      });
    });
  });
});
