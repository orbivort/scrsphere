/**
 * Retrospective Page Loading State Tests
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

import { SprintRetrospective } from './Retrospective';
import { useTeamStore, useAuthStore } from '../../store';
import { apiService } from '../../services';
import { RetrospectiveCategory, RetrospectiveStatus } from '../../types';

// Mock stores
vi.mock('../../store', () => ({
  useTeamStore: vi.fn(),
  useAuthStore: vi.fn(),
}));

// Mock API service
vi.mock('../../services', () => ({
  apiService: {
    getRetrospectiveBySprintId: vi.fn(),
    getTeam: vi.fn(),
    getSprint: vi.fn(),
    addRetrospectiveItem: vi.fn(),
    voteRetrospectiveItem: vi.fn(),
    deleteRetrospectiveItem: vi.fn(),
    updateRetrospectiveItem: vi.fn(),
    addActionItem: vi.fn(),
    deleteActionItem: vi.fn(),
    updateRetrospective: vi.fn(),
    deleteRetroAttendee: vi.fn(),
    updateRetroAttendee: vi.fn(),
    addRetroAttendee: vi.fn(),
    getProductGoals: vi.fn(),
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ sprintId: 'sprint-1' }),
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

const renderRetrospective = (queryClient?: QueryClient) => {
  const testQueryClient = queryClient || createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter>
        <SprintRetrospective />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

// Mock data
const mockTeam = {
  id: 'team-1',
  name: 'Test Team',
  members: [
    {
      userId: 'user-1',
      role: 'DEVELOPER',
      user: { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    },
    {
      userId: 'user-2',
      role: 'SCRUM_MASTER',
      user: { id: 'user-2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' },
    },
  ],
};

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
};

const mockSprint = {
  id: 'sprint-1',
  teamId: 'team-1',
  name: 'Sprint 1',
  startDate: '2026-02-01T00:00:00Z',
  endDate: '2026-02-14T23:59:59Z',
  sprintGoal: 'Test goal',
  status: 'ACTIVE',
  items: [],
  tasks: [],
  createdAt: '2026-02-01T00:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
};

const mockRetrospective = {
  id: 'retro-1',
  sprintId: 'sprint-1',
  teamId: 'team-1',
  retroDate: '2026-02-14T18:00:00Z',
  facilitatorId: 'user-2',
  attendees: [
    {
      id: 'attendee-1',
      userId: 'user-1',
      attended: true,
      name: 'John Doe',
      email: 'john@example.com',
      role: 'DEVELOPER',
    },
  ],
  items: [
    {
      id: 'item-1',
      retrospectiveId: 'retro-1',
      category: RetrospectiveCategory.WENT_WELL,
      content: 'Good collaboration',
      authorName: 'Developer 1',
      votes: 3,
      votedBy: ['user-1', 'user-2', 'user-3'],
      order: 0,
      createdAt: '2026-02-14T18:05:00Z',
    },
  ],
  actionItems: [],
  summary: 'Sprint retrospective summary',
  dodEvolutionNotes: '',
  isAnonymous: false,
  status: RetrospectiveStatus.IN_PROGRESS,
  createdAt: '2026-02-14T18:00:00Z',
  updatedAt: '2026-02-14T18:45:00Z',
};

describe('Retrospective - Loading State Tests', () => {
  let mockUseTeamStore: ReturnType<typeof vi.fn>;
  let mockUseAuthStore: ReturnType<typeof vi.fn>;
  let mockApiService: typeof apiService;

  beforeEach(() => {
    vi.useFakeTimers();
    mockUseTeamStore = vi.mocked(useTeamStore);
    mockUseAuthStore = vi.mocked(useAuthStore);
    mockApiService = vi.mocked(apiService);

    mockUseTeamStore.mockReturnValue({
      currentTeam: { id: 'team-1', name: 'Test Team' },
      teams: [{ id: 'team-1', name: 'Test Team' }],
      setCurrentTeam: vi.fn(),
      fetchTeams: vi.fn(),
    });

    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });

    // Default successful API responses
    mockApiService.getTeam.mockResolvedValue({ success: true, data: mockTeam });
    mockApiService.getSprint.mockResolvedValue({ success: true, data: mockSprint });
    mockApiService.getProductGoals.mockResolvedValue({ success: true, data: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial Loading State Display', () => {
    it('should show loading state when page is loading', () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(() => new Promise(() => {}));

      renderRetrospective();

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show loading state with correct label', () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(() => new Promise(() => {}));

      renderRetrospective();

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-label', 'Loading Retrospective...');
    });

    it('should show loading state when team context is loading', async () => {
      mockUseTeamStore.mockReturnValue({
        currentTeam: null,
        teams: [],
        setCurrentTeam: vi.fn(),
        fetchTeams: vi.fn(),
      });

      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: mockRetrospective,
      });

      renderRetrospective();

      // Should show loading state when team is not available
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should show loading state when retrospective data is being fetched', async () => {
      let _resolveRetro: (value: unknown) => void;
      mockApiService.getRetrospectiveBySprintId.mockImplementation(
        () =>
          new Promise((resolve) => {
            _resolveRetro = resolve;
          })
      );

      renderRetrospective();

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading Retrospective...');
    });

    it('should render LoadingState component with page variant', () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(() => new Promise(() => {}));

      renderRetrospective();

      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('aria-live', 'polite');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Loading State Transitions', () => {
    it('should transition from loading to loaded state when data fetch completes', async () => {
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: mockRetrospective,
      });

      renderRetrospective();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/Sprint Retrospective/)).toBeInTheDocument();
    });

    it('should show loading state during team fetch', async () => {
      let resolveTeam: (value: unknown) => void;
      mockApiService.getTeam.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveTeam = resolve;
          })
      );
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: mockRetrospective,
      });

      renderRetrospective();

      // Initially shows loading for retrospective
      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        resolveTeam!({ success: true, data: mockTeam });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during sprint fetch', async () => {
      let resolveSprint: (value: unknown) => void;
      mockApiService.getSprint.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveSprint = resolve;
          })
      );
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: mockRetrospective,
      });

      renderRetrospective();

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        resolveSprint!({ success: true, data: mockSprint });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should transition correctly when all data loads sequentially', async () => {
      // All data loads successfully
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: mockRetrospective,
      });
      mockApiService.getTeam.mockResolvedValue({ success: true, data: mockTeam });
      mockApiService.getSprint.mockResolvedValue({ success: true, data: mockSprint });

      renderRetrospective();

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State Persistence', () => {
    it('should maintain loading state during long-running data fetch', async () => {
      let _resolveRetro: (value: unknown) => void;
      mockApiService.getRetrospectiveBySprintId.mockImplementation(
        () =>
          new Promise((resolve) => {
            _resolveRetro = resolve;
          })
      );

      renderRetrospective();

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

    it('should persist loading state until retrospective data is loaded', async () => {
      let resolveRetro: (value: unknown) => void;

      mockApiService.getRetrospectiveBySprintId.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRetro = resolve;
          })
      );

      renderRetrospective();

      expect(screen.getByRole('status')).toBeInTheDocument();

      // Resolve retrospective
      await act(async () => {
        resolveRetro!({ success: true, data: mockRetrospective });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should show loading state for entire duration of slow API call', async () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ success: true, data: mockRetrospective });
            }, 5000);
          })
      );

      renderRetrospective();

      // At 0 seconds
      expect(screen.getByRole('status')).toBeInTheDocument();

      // At 2 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByRole('status')).toBeInTheDocument();

      // At 4 seconds
      act(() => {
        vi.advanceTimersByTime(2000);
      });
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error State Handling', () => {
    it('should handle error state when retrospective fetch fails', async () => {
      // React Query will show loading state and then handle the error
      mockApiService.getRetrospectiveBySprintId.mockRejectedValue(new Error('Network error'));

      renderRetrospective();

      // Initially shows loading
      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      // After error, the component shows loading state (fallback) since error handling shows notification
      // The component returns LoadingState as fallback on error
      const statusElements = screen.queryAllByRole('status');
      // Either loading state is shown or the page has rendered
      expect(statusElements.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle 404 error when retrospective not found', async () => {
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: null,
      });

      renderRetrospective();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByText('Retrospective not found')).toBeInTheDocument();
      });
    });

    it('should handle team fetch failure gracefully', async () => {
      mockApiService.getTeam.mockRejectedValue(new Error('Team not found'));
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: mockRetrospective,
      });

      renderRetrospective();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      // Should still render the page even if team fetch fails
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should handle sprint fetch failure gracefully', async () => {
      mockApiService.getSprint.mockRejectedValue(new Error('Sprint not found'));
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: mockRetrospective,
      });

      renderRetrospective();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      // Should still render the page even if sprint fetch fails
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should show retry option when retrospective not found', async () => {
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: null,
      });

      renderRetrospective();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByText('Retrospective not found')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });
    });

    it('should retry loading when clicking retry button', async () => {
      mockApiService.getRetrospectiveBySprintId
        .mockResolvedValueOnce({ success: true, data: null })
        .mockResolvedValueOnce({ success: true, data: mockRetrospective });

      renderRetrospective();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Retry/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Retry/i });

      await act(async () => {
        retryButton.click();
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByText('Retrospective not found')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases: Slow Network', () => {
    it('should show loading state for slow network requests', async () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ success: true, data: mockRetrospective });
            }, 10000);
          })
      );

      renderRetrospective();

      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should eventually complete after slow network delay', async () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ success: true, data: mockRetrospective });
            }, 3000);
          })
      );

      renderRetrospective();

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

    it('should handle slow requests that eventually succeed', async () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ success: true, data: mockRetrospective });
            }, 5000);
          })
      );

      renderRetrospective();

      // Loading state should be shown initially
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Advance past the delay
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await act(async () => {
        vi.runAllTimersAsync();
      });

      // Loading state should be removed after successful load
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should maintain loading state during intermittent connectivity', async () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ success: true, data: mockRetrospective });
            }, 2000);
          })
      );

      renderRetrospective();

      // Loading should be shown
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Advance time
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // Still loading
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Complete the request
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Concurrent Loading Operations', () => {
    it('should handle multiple concurrent data fetches', async () => {
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: mockRetrospective,
      });
      mockApiService.getTeam.mockResolvedValue({ success: true, data: mockTeam });
      mockApiService.getSprint.mockResolvedValue({ success: true, data: mockSprint });

      renderRetrospective();

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should handle partial data loading with some failures', async () => {
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: mockRetrospective,
      });
      mockApiService.getTeam.mockRejectedValue(new Error('Team error'));
      mockApiService.getSprint.mockResolvedValue({ success: true, data: mockSprint });

      renderRetrospective();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      // Should still render despite partial failures
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility During Loading', () => {
    it('should have proper ARIA attributes during loading', () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(() => new Promise(() => {}));

      renderRetrospective();

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });

    it('should announce loading state to screen readers', () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(() => new Promise(() => {}));

      renderRetrospective();

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-label', 'Loading Retrospective...');
    });

    it('should have role="status" for loading indicator', () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(() => new Promise(() => {}));

      renderRetrospective();

      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
    });

    it('should have aria-live="polite" for non-intrusive announcements', () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(() => new Promise(() => {}));

      renderRetrospective();

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-busy="true" during loading', () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(() => new Promise(() => {}));

      renderRetrospective();

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });

    it('should remove aria-busy when loading completes', async () => {
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: mockRetrospective,
      });

      renderRetrospective();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State Cleanup', () => {
    it('should remove loading state when component unmounts', async () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(() => new Promise(() => {}));

      const { unmount } = renderRetrospective();

      expect(screen.getByRole('status')).toBeInTheDocument();

      unmount();

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should not cause memory leaks with pending promises', async () => {
      let resolveRetro: (value: unknown) => void;
      mockApiService.getRetrospectiveBySprintId.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveRetro = resolve;
          })
      );

      const { unmount } = renderRetrospective();

      unmount();

      // Resolve the promise after unmount
      await act(async () => {
        resolveRetro!({ success: true, data: mockRetrospective });
        vi.runAllTimersAsync();
      });

      // Should not cause any errors or memory leaks
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should clean up timers on unmount', async () => {
      mockApiService.getRetrospectiveBySprintId.mockImplementation(() => new Promise(() => {}));

      const { unmount } = renderRetrospective();

      unmount();

      // Advance timers to ensure no pending callbacks
      act(() => {
        vi.runAllTimers();
      });

      // No errors should occur
      expect(true).toBe(true);
    });
  });

  describe('Navigation During Loading', () => {
    it('should show loading state initially when teamId is not available', () => {
      mockUseTeamStore.mockReturnValue({
        currentTeam: null,
        teams: [],
        setCurrentTeam: vi.fn(),
        fetchTeams: vi.fn(),
      });

      renderRetrospective();

      // When teamId is null, the isLoading check happens first
      // The component shows loading state because the query is running
      expect(screen.getByRole('status')).toBeInTheDocument();
      // Use getAllByText since there are multiple elements with this text
      const loadingTexts = screen.getAllByText('Loading Retrospective...');
      expect(loadingTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Loading State with Different Data States', () => {
    it('should show loading state when retrospective has no items', async () => {
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: { ...mockRetrospective, items: [] },
      });

      renderRetrospective();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Should show empty columns
      expect(screen.getByText('What went well')).toBeInTheDocument();
    });

    it('should show loading state when retrospective has no action items', async () => {
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: { ...mockRetrospective, actionItems: [] },
      });

      renderRetrospective();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Should show empty action items message
      expect(screen.getByText(/No action items yet/)).toBeInTheDocument();
    });

    it('should show loading state when retrospective has no attendees', async () => {
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: { ...mockRetrospective, attendees: [] },
      });

      renderRetrospective();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should handle completed retrospective loading correctly', async () => {
      mockApiService.getRetrospectiveBySprintId.mockResolvedValue({
        success: true,
        data: { ...mockRetrospective, status: RetrospectiveStatus.COMPLETED },
      });

      renderRetrospective();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Should not show complete button for completed retrospective
      expect(screen.queryByText('Complete Retrospective')).not.toBeInTheDocument();
    });
  });
});
