/**
 * IncrementList Page Loading State Tests
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

import { IncrementList } from './IncrementList';
import { useTeamContext } from '../../contexts/TeamContext';
import { apiService } from '../../services';
import { IncrementStatus } from '../../types';

// Mock contexts
vi.mock('../../contexts/TeamContext', () => ({
  useTeamContext: vi.fn(),
}));

// Mock API service
vi.mock('../../services', () => ({
  apiService: {
    getIncrements: vi.fn(),
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

const renderIncrementList = (queryClient?: QueryClient) => {
  const testQueryClient = queryClient || createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <MemoryRouter>
        <IncrementList />
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

const mockIncrements = [
  {
    id: 'increment-1',
    name: 'Test Increment 1',
    description: 'Test description',
    status: IncrementStatus.DRAFT,
    teamId: 'team-1',
    sprintId: 'sprint-1',
    sprint: { id: 'sprint-1', name: 'Sprint 1' },
    totalStoryPoints: 10,
    includedPBIs: ['pbi-1', 'pbi-2'],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'increment-2',
    name: 'Test Increment 2',
    description: 'Test description 2',
    status: IncrementStatus.DELIVERED,
    teamId: 'team-1',
    sprintId: 'sprint-2',
    sprint: { id: 'sprint-2', name: 'Sprint 2' },
    totalStoryPoints: 15,
    includedPBIs: ['pbi-3'],
    deliveredAt: '2026-01-15T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-15T00:00:00Z',
  },
];

describe('IncrementList - Loading State Tests', () => {
  let mockUseTeamContext: ReturnType<typeof vi.fn>;
  let mockApiService: typeof apiService;

  beforeEach(() => {
    vi.useFakeTimers();
    mockUseTeamContext = vi.mocked(useTeamContext);
    mockApiService = vi.mocked(apiService);

    mockUseTeamContext.mockReturnValue({
      currentTeam: mockTeam,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('Initial Loading State Display', () => {
    it('should show loading state when page is loading', () => {
      mockApiService.getIncrements.mockImplementation(() => new Promise(() => {}));

      const { container } = renderIncrementList();

      expect(screen.getByRole('status')).toBeInTheDocument();
      // Use container query to avoid duplicate text matches
      expect(container.querySelector('[class*="page-loader"]')).toBeInTheDocument();
    });

    it('should show loading spinner during initial load', () => {
      mockApiService.getIncrements.mockImplementation(() => new Promise(() => {}));

      renderIncrementList();

      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
    });

    it('should show empty state when no team is selected', () => {
      mockUseTeamContext.mockReturnValue({
        currentTeam: null,
      });

      renderIncrementList();

      expect(screen.getByTestId('empty-state-no-team')).toBeInTheDocument();
    });
  });

  describe('Loading State Transitions', () => {
    it('should transition from loading to loaded state when data fetch completes', async () => {
      mockApiService.getIncrements.mockResolvedValue({ data: mockIncrements });

      renderIncrementList();

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Increments')).toBeInTheDocument();
    });

    it('should show loading state during increments fetch', async () => {
      let resolveIncrements: (value: unknown) => void;
      mockApiService.getIncrements.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveIncrements = resolve;
          })
      );

      renderIncrementList();

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        resolveIncrements!({ data: mockIncrements });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State Persistence', () => {
    it('should maintain loading state during long-running data fetch', async () => {
      mockApiService.getIncrements.mockImplementation(() => new Promise(() => {}));

      renderIncrementList();

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

    it('should persist loading state until data is loaded', async () => {
      let resolveIncrements: (value: unknown) => void;

      mockApiService.getIncrements.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveIncrements = resolve;
          })
      );

      renderIncrementList();

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        resolveIncrements!({ data: mockIncrements });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error State Handling', () => {
    it('should handle error state when increments fetch fails', async () => {
      mockApiService.getIncrements.mockRejectedValue(new Error('Network error'));

      renderIncrementList();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('should show content area even when fetch fails', async () => {
      mockApiService.getIncrements.mockRejectedValue(new Error('Network error'));

      renderIncrementList();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Should still show the page header
      expect(screen.getByText('Increments')).toBeInTheDocument();
    });
  });

  describe('Edge Cases: Slow Network', () => {
    it('should show loading state for slow network requests', async () => {
      mockApiService.getIncrements.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: mockIncrements }), 10000);
          })
      );

      renderIncrementList();

      expect(screen.getByRole('status')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should eventually complete after slow network delay', async () => {
      mockApiService.getIncrements.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve({ data: mockIncrements }), 3000);
          })
      );

      renderIncrementList();

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
  });

  describe('Accessibility During Loading', () => {
    it('should have proper ARIA attributes during loading', () => {
      mockApiService.getIncrements.mockImplementation(() => new Promise(() => {}));

      renderIncrementList();

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });

    it('should announce loading state to screen readers', () => {
      mockApiService.getIncrements.mockImplementation(() => new Promise(() => {}));

      renderIncrementList();

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-label', 'Loading increments...');
    });
  });

  describe('Loading State Cleanup', () => {
    it('should remove loading state when component unmounts', async () => {
      mockApiService.getIncrements.mockImplementation(() => new Promise(() => {}));

      const { unmount } = renderIncrementList();

      expect(screen.getByRole('status')).toBeInTheDocument();

      unmount();

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should not cause memory leaks with pending promises', async () => {
      let resolveIncrements: (value: unknown) => void;
      mockApiService.getIncrements.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveIncrements = resolve;
          })
      );

      const { unmount } = renderIncrementList();

      unmount();

      await act(async () => {
        resolveIncrements!({ data: mockIncrements });
        vi.runAllTimersAsync();
      });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should clean up loading state after error', async () => {
      mockApiService.getIncrements.mockRejectedValue(new Error('Network error'));

      renderIncrementList();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State with Empty Data', () => {
    it('should show empty state when no increments exist', async () => {
      mockApiService.getIncrements.mockResolvedValue({ data: [] });

      renderIncrementList();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Should show the empty state message
      expect(screen.getByText(/No Increments found/i)).toBeInTheDocument();
    });

    it('should transition from loading to empty state', async () => {
      let resolveIncrements: (value: unknown) => void;
      mockApiService.getIncrements.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveIncrements = resolve;
          })
      );

      renderIncrementList();

      expect(screen.getByRole('status')).toBeInTheDocument();

      await act(async () => {
        resolveIncrements!({ data: [] });
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      expect(screen.getByText(/No Increments found/i)).toBeInTheDocument();
    });
  });

  describe('Loading State with Data', () => {
    it('should show increment cards when data is loaded', async () => {
      mockApiService.getIncrements.mockResolvedValue({ data: mockIncrements });

      renderIncrementList();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      expect(screen.getByText('Test Increment 1')).toBeInTheDocument();
      expect(screen.getByText('Test Increment 2')).toBeInTheDocument();
    });

    it('should show stats when data is loaded', async () => {
      mockApiService.getIncrements.mockResolvedValue({ data: mockIncrements });

      const { container } = renderIncrementList();

      await act(async () => {
        vi.runAllTimersAsync();
      });

      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      // Use more specific selectors to avoid duplicate matches
      const statValues = container.querySelectorAll('[class*="stat-value"]');
      expect(statValues.length).toBeGreaterThan(0);
    });
  });
});
