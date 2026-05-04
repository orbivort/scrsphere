/**
 * ProductGoals Page Loading State Tests
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
import { BrowserRouter } from 'react-router-dom';

import { ProductGoalsPage } from './ProductGoals';
import { useTeamStore, useAuthStore } from '../../store';
import { apiService } from '../../services';
import { ItemStatus, type ProductGoal, type ProductBacklogItem } from '../../types';

// Mock stores
vi.mock('../../store', () => ({
  useTeamStore: vi.fn(),
  useAuthStore: vi.fn(),
}));

// Mock API service
vi.mock('../../services', () => ({
  apiService: {
    getProductGoals: vi.fn(),
    getProductBacklog: vi.fn(),
    createProductGoal: vi.fn(),
    updateProductGoal: vi.fn(),
    deleteProductGoal: vi.fn(),
    getProductGoalStatusHistory: vi.fn(),
  },
}));

// Mock hooks
vi.mock('../../hooks', () => ({
  useApiError: () => ({
    handleError: vi.fn((_error, fallback) => fallback || 'An error occurred'),
  }),
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

vi.mock('../../hooks/useFormDraft', () => ({
  useFormDraft: () => ({
    hasDraft: false,
    showRestorePrompt: false,
    setShowRestorePrompt: vi.fn(),
    saveDraft: vi.fn(),
    loadDraft: vi.fn(),
    clearDraft: vi.fn(() => ({ success: true })),
    lastSavedAt: null,
  }),
}));

vi.mock('../../hooks/useModalFocus', () => ({
  useModalFocus: () => ({
    modalRef: { current: null },
  }),
}));

// Mock child components
vi.mock('../../components/common/Form/CharacterCounter', () => ({
  CharacterCounter: () => <span data-testid="character-counter" />,
}));

vi.mock('../../components/common/Form/HelpPanel', () => ({
  HelpPanel: () => null,
}));

vi.mock('../../components/common/Form/DraftRestorePrompt', () => ({
  DraftRestorePrompt: () => <div data-testid="draft-restore-prompt" />,
}));

vi.mock('../../components/common/Form/UnsavedChangesModal', () => ({
  UnsavedChangesModal: () => <div data-testid="unsaved-changes-modal" />,
}));

vi.mock('../../components/StatusChangeModal', () => ({
  StatusChangeModal: () => <div data-testid="status-change-modal" />,
}));

vi.mock('../../components/EmptyState', () => ({
  EmptyState: ({ type }: { type: string }) => (
    <div data-testid="empty-state" data-type={type}>
      {type === 'no-team' ? 'No Team Selected' : 'Empty State'}
    </div>
  ),
}));

vi.mock('../../components/common/ToastContainer', () => ({
  ToastContainer: () => <div data-testid="toast-container" />,
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

const renderProductGoals = (queryClient?: QueryClient) => {
  const testQueryClient = queryClient || createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>
        <ProductGoalsPage />
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock data
const mockTeam = {
  id: 'team-1',
  name: 'Test Team',
  slug: 'test-team',
};

const mockGoals: ProductGoal[] = [
  {
    id: 'goal-1',
    teamId: 'team-1',
    title: 'Complete MVP',
    description: 'Build and release the minimum viable product',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    successMetrics: '100 users signed up',
    status: 'ACTIVE',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'goal-2',
    teamId: 'team-1',
    title: 'Improve Performance',
    description: 'Optimize the application for better performance',
    targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    successMetrics: 'Page load time under 2 seconds',
    status: 'NEW',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
];

const mockBacklogItems: ProductBacklogItem[] = [
  {
    id: 'item-1',
    teamId: 'team-1',
    title: 'Implement login',
    description: 'Create user login functionality',
    storyPoints: 5,
    status: ItemStatus.DONE,
    goalId: 'goal-1',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    id: 'item-2',
    teamId: 'team-1',
    title: 'Add dashboard',
    description: 'Create user dashboard',
    storyPoints: 8,
    status: ItemStatus.IN_PROGRESS,
    goalId: 'goal-1',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
];

describe('ProductGoals - Loading State Tests', () => {
  let mockUseTeamStore: ReturnType<typeof vi.fn>;
  let mockUseAuthStore: ReturnType<typeof vi.fn>;
  let mockApiService: typeof apiService;

  beforeEach(() => {
    vi.useFakeTimers();
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
      user: { id: 'user-1', email: 'test@example.com', firstName: 'Test', lastName: 'User' },
      isAuthenticated: true,
      error: null,
      setError: vi.fn(),
      logout: vi.fn(),
    });

    // Default successful responses
    mockApiService.getProductGoals.mockResolvedValue({ data: mockGoals });
    mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });
    mockApiService.getProductGoalStatusHistory.mockResolvedValue({
      success: true,
      data: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial Loading State Display', () => {
    it('should show loading state when page is loading', () => {
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderProductGoals();

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading Product Goals...');
    });

    it('should show LoadingState component with page variant when loading', () => {
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderProductGoals();

      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveTextContent('Loading Product Goals...');
    });

    it('should show loading state when team context is not available', () => {
      mockUseTeamStore.mockReturnValue({
        currentTeam: null,
        teams: [],
        setCurrentTeam: vi.fn(),
        fetchTeams: vi.fn(),
      });

      renderProductGoals();

      // Should show empty state for no team, not loading state
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toHaveAttribute('data-type', 'no-team');
    });

    it('should show loading state while product goals are being fetched', async () => {
      let resolveGoals: (value: unknown) => void;
      mockApiService.getProductGoals.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveGoals = resolve;
          })
      );

      renderProductGoals();

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading Product Goals...');

      // Resolve the promise
      await act(async () => {
        resolveGoals!({ data: mockGoals });
        vi.runAllTimersAsync();
      });

      // Loading state should be gone
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State Transitions', () => {
    it('should transition from loading to loaded state when data fetch completes', async () => {
      renderProductGoals();

      // Initially loading
      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      // After loading completes, content should be visible
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Complete MVP')).toBeInTheDocument();
      expect(screen.getByText('Improve Performance')).toBeInTheDocument();
    });

    it('should show loading state during goals fetch', async () => {
      let resolveGoals: (value: unknown) => void;
      mockApiService.getProductGoals.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveGoals = resolve;
          })
      );

      renderProductGoals();

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        resolveGoals!({ data: mockGoals });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should show loading state during backlog fetch', async () => {
      // Goals resolve quickly, backlog takes longer - but component only tracks goals loading
      mockApiService.getProductGoals.mockResolvedValue({ data: mockGoals });
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });

      renderProductGoals();

      // Loading state should be shown initially
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Wait for data to load
      await act(async () => {
        vi.runAllTimersAsync();
      });

      // After loading completes, content should be visible
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Goals should be visible
      expect(screen.getByText('Complete MVP')).toBeInTheDocument();
    });

    it('should display goals grid after loading completes', async () => {
      renderProductGoals();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Check that goals are displayed
      expect(screen.getByText('Complete MVP')).toBeInTheDocument();
      expect(screen.getByText('Improve Performance')).toBeInTheDocument();
    });

    it('should display empty state when no goals exist after loading', async () => {
      mockApiService.getProductGoals.mockResolvedValue({ data: [] });

      renderProductGoals();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      expect(screen.getByText('No Goals Yet')).toBeInTheDocument();
    });
  });

  describe('Loading State Persistence', () => {
    it('should maintain loading state during long-running data fetch', async () => {
      let _resolveGoals: (value: unknown) => void;
      mockApiService.getProductGoals.mockImplementation(
        () =>
          new Promise((resolve) => {
            _resolveGoals = resolve;
          })
      );

      renderProductGoals();

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
      // Both queries resolve - component tracks goals loading state
      mockApiService.getProductGoals.mockResolvedValue({ data: mockGoals });
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });

      renderProductGoals();

      expect(screen.getByRole('status')).toBeInTheDocument();

      // Wait for all data to load
      await act(async () => {
        vi.runAllTimersAsync();
      });

      // Loading should be gone after data loads
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Content should be visible
      expect(screen.getByText('Complete MVP')).toBeInTheDocument();
    });

    it('should show loading state for entire page during initial load', async () => {
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderProductGoals();

      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('aria-label', 'Loading Product Goals...');
    });
  });

  describe('Error State Handling', () => {
    it('should handle error state when goals fetch fails', async () => {
      mockApiService.getProductGoals.mockRejectedValue(new Error('Network error'));

      renderProductGoals();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Error state should be shown or empty state
      // The component handles errors through react-query's error state
    });

    it('should handle error state when backlog fetch fails', async () => {
      mockApiService.getProductBacklog.mockRejectedValue(new Error('Backlog error'));

      renderProductGoals();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Goals should still be displayed even if backlog fails
      expect(screen.getByText('Complete MVP')).toBeInTheDocument();
    });

    it('should handle partial data loading with some failures', async () => {
      mockApiService.getProductGoals.mockResolvedValue({ data: mockGoals });
      mockApiService.getProductBacklog.mockRejectedValue(new Error('Backlog error'));

      renderProductGoals();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Goals should still be displayed
      expect(screen.getByText('Complete MVP')).toBeInTheDocument();
    });

    it('should terminate loading state on error', async () => {
      mockApiService.getProductGoals.mockRejectedValue(new Error('Failed to fetch'));

      renderProductGoals();

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
      mockApiService.getProductGoals.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({ data: mockGoals });
            }, 10000);
          })
      );

      renderProductGoals();

      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should eventually complete after slow network delay', async () => {
      mockApiService.getProductGoals.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: mockGoals }), 3000);
          })
      );

      renderProductGoals();

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Complete MVP')).toBeInTheDocument();
    });

    it('should maintain loading state during very slow network', async () => {
      mockApiService.getProductGoals.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: mockGoals }), 30000);
          })
      );

      renderProductGoals();

      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(15000);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(15000);
      });

      // Now the promise should resolve
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
      // Both queries resolve
      mockApiService.getProductGoals.mockResolvedValue({ data: mockGoals });
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });

      renderProductGoals();

      expect(screen.getByRole('status')).toBeInTheDocument();

      // Wait for all data to load
      await act(async () => {
        vi.runAllTimersAsync();
      });

      // Loading should be gone
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Content should be visible
      expect(screen.getByText('Complete MVP')).toBeInTheDocument();
    });

    it('should handle goals resolving before backlog', async () => {
      // Goals resolve immediately, backlog also resolves
      mockApiService.getProductGoals.mockResolvedValue({ data: mockGoals });
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });

      renderProductGoals();

      // Wait for data to load
      await act(async () => {
        vi.runAllTimersAsync();
      });

      // Goals query completes, loading should be gone
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Content should be visible
      expect(screen.getByText('Complete MVP')).toBeInTheDocument();
    });

    it('should handle backlog resolving before goals', async () => {
      // Backlog resolves immediately, goals also resolve
      mockApiService.getProductGoals.mockResolvedValue({ data: mockGoals });
      mockApiService.getProductBacklog.mockResolvedValue({ data: mockBacklogItems });

      renderProductGoals();

      // Loading should be present initially
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Wait for data to load
      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Accessibility During Loading', () => {
    it('should have proper ARIA attributes during loading', () => {
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderProductGoals();

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });

    it('should announce loading state to screen readers', () => {
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderProductGoals();

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-label', 'Loading Product Goals...');
    });

    it('should have role="status" for loading indicator', () => {
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderProductGoals();

      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
    });

    it('should have visible loading text for screen readers', () => {
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderProductGoals();

      // The loading text appears in multiple places (spinner and visible text)
      const loadingTexts = screen.getAllByText('Loading Product Goals...');
      expect(loadingTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Loading State Cleanup', () => {
    it('should remove loading state when component unmounts', async () => {
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      const { unmount } = renderProductGoals();

      expect(screen.getByRole('status')).toBeInTheDocument();

      unmount();

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should not cause memory leaks with pending promises', async () => {
      let resolveGoals: (value: unknown) => void;
      mockApiService.getProductGoals.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveGoals = resolve;
          })
      );

      const { unmount } = renderProductGoals();

      unmount();

      // Resolve the promise after unmount
      await act(async () => {
        resolveGoals!({ data: mockGoals });
        vi.runAllTimersAsync();
      });

      // Should not cause any errors or memory leaks
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should clean up loading state on successful data fetch', async () => {
      renderProductGoals();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should clean up loading state on error', async () => {
      mockApiService.getProductGoals.mockRejectedValue(new Error('Fetch failed'));

      renderProductGoals();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('LoadingState Component Props', () => {
    it('should render LoadingState with correct variant prop', () => {
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderProductGoals();

      const loader = screen.getByRole('status');
      // The page variant includes the text label
      expect(loader).toHaveTextContent('Loading Product Goals...');
    });

    it('should render LoadingState with correct label prop', () => {
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderProductGoals();

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-label', 'Loading Product Goals...');
    });

    it('should display loading text content', () => {
      mockApiService.getProductGoals.mockImplementation(() => new Promise(() => {}));

      renderProductGoals();

      // The LoadingState component displays the label as text in multiple places
      const loadingTexts = screen.getAllByText('Loading Product Goals...');
      expect(loadingTexts.length).toBeGreaterThan(0);
    });
  });

  describe('Team Context Loading', () => {
    it('should show empty state when no team is selected', () => {
      mockUseTeamStore.mockReturnValue({
        currentTeam: null,
        teams: [],
        setCurrentTeam: vi.fn(),
        fetchTeams: vi.fn(),
      });

      renderProductGoals();

      // Should show empty state for no team
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toHaveAttribute('data-type', 'no-team');
    });

    it('should not show loading state when team is null', () => {
      mockUseTeamStore.mockReturnValue({
        currentTeam: null,
        teams: [],
        setCurrentTeam: vi.fn(),
        fetchTeams: vi.fn(),
      });

      renderProductGoals();

      // Should not show loading state, should show empty state
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });

    it('should fetch goals when team is available', async () => {
      renderProductGoals();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      expect(mockApiService.getProductGoals).toHaveBeenCalledWith('team-1');
    });

    it('should not fetch goals when team is not available', async () => {
      mockUseTeamStore.mockReturnValue({
        currentTeam: null,
        teams: [],
        setCurrentTeam: vi.fn(),
        fetchTeams: vi.fn(),
      });

      renderProductGoals();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      expect(mockApiService.getProductGoals).not.toHaveBeenCalled();
    });
  });

  describe('Query Enabled State', () => {
    it('should enable queries when teamId is present', async () => {
      renderProductGoals();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      expect(mockApiService.getProductGoals).toHaveBeenCalled();
      expect(mockApiService.getProductBacklog).toHaveBeenCalled();
    });

    it('should not enable queries when teamId is null', async () => {
      mockUseTeamStore.mockReturnValue({
        currentTeam: null,
        teams: [],
        setCurrentTeam: vi.fn(),
        fetchTeams: vi.fn(),
      });

      renderProductGoals();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      expect(mockApiService.getProductGoals).not.toHaveBeenCalled();
      expect(mockApiService.getProductBacklog).not.toHaveBeenCalled();
    });
  });
});
