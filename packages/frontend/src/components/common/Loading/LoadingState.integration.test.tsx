/**
 * Comprehensive LoadingState Integration Tests
 *
 * Test Coverage:
 * - Loading state transitions during data fetching
 * - Loading state persistence during async operations
 * - Proper termination of loading state upon completion or error
 * - Edge cases: slow network, failed fetch, concurrent loading
 */

import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { LoadingState } from './LoadingState';

// Mock CSS modules
vi.mock('./LoadingState.module.css', () => ({
  default: {
    'loading-state': 'loading-state',
    'variant-spinner': 'variant-spinner',
    'variant-skeleton-text': 'variant-skeleton-text',
    'variant-skeleton-card': 'variant-skeleton-card',
    'variant-skeleton-list': 'variant-skeleton-list',
    'variant-skeleton-chart': 'variant-skeleton-chart',
    'page-loader': 'page-loader',
    'full-screen': 'full-screen',
    'page-loader-text': 'page-loader-text',
  },
}));

vi.mock('./Skeleton.module.css', () => ({
  default: {
    'skeleton-text': 'skeleton-text',
    'skeleton-line': 'skeleton-line',
    'skeleton-list': 'skeleton-list',
    'skeleton-list-item': 'skeleton-list-item',
    'skeleton-dot': 'skeleton-dot',
    'skeleton-badge': 'skeleton-badge',
    'skeleton-card': 'skeleton-card',
    'skeleton-card-header': 'skeleton-card-header',
    'skeleton-card-body': 'skeleton-card-body',
    'skeleton-title': 'skeleton-title',
    'skeleton-stats': 'skeleton-stats',
    'skeleton-stat-item': 'skeleton-stat-item',
    'skeleton-stat-icon': 'skeleton-stat-icon',
    'skeleton-stat-content': 'skeleton-stat-content',
    'skeleton-stat-value': 'skeleton-stat-value',
    'skeleton-stat-label': 'skeleton-stat-label',
    'skeleton-chart': 'skeleton-chart',
    'skeleton-chart-area': 'skeleton-chart-area',
    default: 'default',
    list: 'list',
    stats: 'stats',
  },
}));

/**
 * Test Component: AsyncDataLoader
 * Simulates real-world data fetching with loading states
 */
const AsyncDataLoader: React.FC<{
  isLoading: boolean;
  error?: Error | null;
  data?: unknown;
  onRetry?: () => void;
}> = ({ isLoading, error, data, onRetry }) => {
  if (isLoading) {
    return <LoadingState variant="page" label="Loading data..." />;
  }

  if (error) {
    return (
      <div role="alert" data-testid="error-state">
        <p>Error: {error.message}</p>
        {onRetry && (
          <button onClick={onRetry} data-testid="retry-button">
            Retry
          </button>
        )}
      </div>
    );
  }

  if (data) {
    return (
      <div data-testid="data-loaded">
        <h2>Data Loaded Successfully</h2>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }

  return <div data-testid="empty-state">No data available</div>;
};

/**
 * Test Component: ConcurrentLoader
 * Simulates multiple concurrent loading operations
 */
const ConcurrentLoader: React.FC<{
  loadingStates: { id: string; isLoading: boolean; label: string }[];
}> = ({ loadingStates }) => {
  return (
    <div data-testid="concurrent-loader">
      {loadingStates.map(({ id, isLoading, label }) => (
        <div key={id} data-testid={`loader-${id}`}>
          {isLoading ? (
            <LoadingState variant="spinner" size="sm" label={label} />
          ) : (
            <span data-testid={`loaded-${id}`}>Loaded: {id}</span>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * Test Component: SlowNetworkLoader
 * Simulates slow network conditions with delayed loading
 */
const SlowNetworkLoader: React.FC<{
  loadDuration: number;
  onLoadComplete: () => void;
}> = ({ loadDuration, onLoadComplete }) => {
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      onLoadComplete();
    }, loadDuration);

    return () => clearTimeout(timer);
  }, [loadDuration, onLoadComplete]);

  return isLoading ? (
    <LoadingState variant="skeleton-card" label="Loading with slow network..." />
  ) : (
    <div data-testid="slow-load-complete">Data loaded after {loadDuration}ms</div>
  );
};

describe('LoadingState - Comprehensive Integration Tests', () => {
  describe('Loading State Transitions', () => {
    it('should display loading state initially when data fetch starts', () => {
      const { rerender: _rerender } = render(<AsyncDataLoader isLoading={true} data={null} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading data...');
    });

    it('should transition from loading to loaded state when data fetch completes', async () => {
      const { rerender } = render(<AsyncDataLoader isLoading={true} data={null} />);

      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<AsyncDataLoader isLoading={false} data={{ items: [1, 2, 3] }} />);

      await waitFor(() => {
        expect(screen.getByTestId('data-loaded')).toBeInTheDocument();
      });

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should transition from loading to error state when data fetch fails', async () => {
      const { rerender } = render(<AsyncDataLoader isLoading={true} data={null} />);

      expect(screen.getByRole('status')).toBeInTheDocument();

      const error = new Error('Network request failed');
      rerender(<AsyncDataLoader isLoading={false} error={error} data={null} />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      expect(screen.getByText(/Network request failed/)).toBeInTheDocument();
    });

    it('should handle loading → error → retry → loading transition', async () => {
      const onRetry = vi.fn();
      const { rerender } = render(<AsyncDataLoader isLoading={true} data={null} />);

      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<AsyncDataLoader isLoading={false} error={new Error('Failed')} onRetry={onRetry} />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      rerender(<AsyncDataLoader isLoading={true} data={null} onRetry={onRetry} />);

      await waitFor(() => {
        expect(screen.getByRole('status')).toBeInTheDocument();
      });
    });

    it('should handle rapid loading state toggles', async () => {
      const { rerender } = render(<AsyncDataLoader isLoading={true} data={null} />);

      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<AsyncDataLoader isLoading={false} data={{}} />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();

      rerender(<AsyncDataLoader isLoading={true} data={null} />);
      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<AsyncDataLoader isLoading={false} data={{}} />);
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  describe('Loading State Persistence', () => {
    it('should maintain loading state during long-running async operations', async () => {
      vi.useFakeTimers();
      const loadDuration = 5000;
      const onLoadComplete = vi.fn();

      render(<SlowNetworkLoader loadDuration={loadDuration} onLoadComplete={onLoadComplete} />);

      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);
      expect(onLoadComplete).not.toHaveBeenCalled();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
      expect(onLoadComplete).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByTestId('slow-load-complete')).toBeInTheDocument();
      expect(onLoadComplete).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('should persist loading state across multiple re-renders', () => {
      const { rerender } = render(<LoadingState variant="spinner" label="Persistent loading..." />);

      for (let i = 0; i < 10; i++) {
        rerender(<LoadingState variant="spinner" label="Persistent loading..." />);
        expect(screen.getByRole('status')).toBeInTheDocument();
      }
    });

    it('should maintain accessibility attributes during persistent loading', () => {
      const { rerender } = render(<LoadingState variant="page" label="Loading..." />);

      const loader = screen.getByRole('status');

      rerender(<LoadingState variant="page" label="Loading..." />);

      expect(loader).toHaveAttribute('aria-live', 'polite');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Edge Cases: Slow Network Conditions', () => {
    it('should show loading state for slow network requests', async () => {
      vi.useFakeTimers();
      const loadDuration = 10000;
      const onLoadComplete = vi.fn();

      render(<SlowNetworkLoader loadDuration={loadDuration} onLoadComplete={onLoadComplete} />);

      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThan(0);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
      vi.useRealTimers();
    });

    it('should eventually complete after slow network delay', async () => {
      vi.useFakeTimers();
      const loadDuration = 3000;
      const onLoadComplete = vi.fn();

      render(<SlowNetworkLoader loadDuration={loadDuration} onLoadComplete={onLoadComplete} />);

      await act(async () => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByTestId('slow-load-complete')).toBeInTheDocument();
      vi.useRealTimers();
    });
  });

  describe('Edge Cases: Failed Data Fetching', () => {
    it('should display error state when data fetch fails', async () => {
      const { rerender } = render(<AsyncDataLoader isLoading={true} data={null} />);

      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<AsyncDataLoader isLoading={false} error={new Error('Fetch failed')} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should allow retry after fetch failure', async () => {
      const onRetry = vi.fn();
      const { rerender: _rerender } = render(
        <AsyncDataLoader isLoading={false} error={new Error('Failed')} onRetry={onRetry} />
      );

      const retryButton = screen.getByTestId('retry-button');
      retryButton.click();

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple consecutive failures', async () => {
      const { rerender } = render(<AsyncDataLoader isLoading={true} data={null} />);

      for (let i = 0; i < 3; i++) {
        rerender(<AsyncDataLoader isLoading={false} error={new Error(`Failure ${i + 1}`)} />);

        expect(screen.getByRole('alert')).toBeInTheDocument();

        rerender(<AsyncDataLoader isLoading={true} data={null} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
      }
    }, 10000);
  });

  describe('Edge Cases: Concurrent Loading Operations', () => {
    it('should handle multiple concurrent loading states', () => {
      const loadingStates = [
        { id: 'users', isLoading: true, label: 'Loading users...' },
        { id: 'tasks', isLoading: true, label: 'Loading tasks...' },
        { id: 'sprints', isLoading: true, label: 'Loading sprints...' },
      ];

      render(<ConcurrentLoader loadingStates={loadingStates} />);

      const loaders = screen.getAllByRole('status');
      expect(loaders).toHaveLength(3);
    });

    it('should handle partial loading completion', async () => {
      const { rerender } = render(
        <ConcurrentLoader
          loadingStates={[
            { id: 'users', isLoading: true, label: 'Loading users...' },
            { id: 'tasks', isLoading: true, label: 'Loading tasks...' },
            { id: 'sprints', isLoading: true, label: 'Loading sprints...' },
          ]}
        />
      );

      expect(screen.getAllByRole('status')).toHaveLength(3);

      rerender(
        <ConcurrentLoader
          loadingStates={[
            { id: 'users', isLoading: false, label: 'Loading users...' },
            { id: 'tasks', isLoading: true, label: 'Loading tasks...' },
            { id: 'sprints', isLoading: true, label: 'Loading sprints...' },
          ]}
        />
      );

      expect(screen.getAllByRole('status')).toHaveLength(2);
      expect(screen.getByTestId('loaded-users')).toBeInTheDocument();
    });

    it('should handle all concurrent loads completing', async () => {
      const { rerender } = render(
        <ConcurrentLoader
          loadingStates={[
            { id: 'users', isLoading: true, label: 'Loading users...' },
            { id: 'tasks', isLoading: true, label: 'Loading tasks...' },
            { id: 'sprints', isLoading: true, label: 'Loading sprints...' },
          ]}
        />
      );

      rerender(
        <ConcurrentLoader
          loadingStates={[
            { id: 'users', isLoading: false, label: 'Loading users...' },
            { id: 'tasks', isLoading: false, label: 'Loading tasks...' },
            { id: 'sprints', isLoading: false, label: 'Loading sprints...' },
          ]}
        />
      );

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
      expect(screen.getByTestId('loaded-users')).toBeInTheDocument();
      expect(screen.getByTestId('loaded-tasks')).toBeInTheDocument();
      expect(screen.getByTestId('loaded-sprints')).toBeInTheDocument();
    });

    it('should maintain independent loading states for each operation', async () => {
      const { rerender: _rerender } = render(
        <ConcurrentLoader
          loadingStates={[
            { id: 'users', isLoading: true, label: 'Loading users...' },
            { id: 'tasks', isLoading: false, label: 'Loading tasks...' },
          ]}
        />
      );

      const statuses = screen.getAllByRole('status');
      expect(statuses).toHaveLength(1);
      expect(statuses[0]).toHaveAttribute('aria-label', 'Loading users...');
    });
  });

  describe('Accessibility During State Transitions', () => {
    it('should announce loading state to screen readers', () => {
      render(<LoadingState variant="page" label="Loading dashboard..." />);

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
      expect(loader).toHaveAttribute('aria-label', 'Loading dashboard...');
    });

    it('should maintain proper ARIA attributes during loading persistence', () => {
      const { container } = render(<LoadingState variant="spinner" label="Loading..." />);

      const loader = container.querySelector('[data-variant="spinner"]');

      expect(loader).toHaveAttribute('role', 'status');
      expect(loader).toHaveAttribute('aria-live', 'polite');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });

    it('should have correct aria-busy attribute during loading', () => {
      const { container } = render(
        <LoadingState variant="skeleton-list" label="Loading items..." />
      );

      const loader = container.querySelector('[data-variant="skeleton-list"]');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Performance and Memory', () => {
    it('should not cause memory leaks when unmounted during loading', () => {
      const { unmount } = render(<LoadingState variant="page" label="Loading..." />);

      expect(screen.getByRole('status')).toBeInTheDocument();

      unmount();

      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    it('should handle rapid mount/unmount cycles', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(<LoadingState variant="spinner" label={`Loading ${i}...`} />);
        expect(screen.getByRole('status')).toBeInTheDocument();
        unmount();
      }
    });
  });

  describe('Variant-Specific Loading Behaviors', () => {
    it('should render spinner variant correctly during loading', () => {
      render(<LoadingState variant="spinner" size="sm" label="Processing..." />);

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('data-variant', 'spinner');
      expect(loader).toHaveAttribute('data-size', 'sm');
    });

    it('should render skeleton variants with correct structure during loading', () => {
      const { container } = render(
        <LoadingState variant="skeleton-list" itemCount={5} label="Loading list..." />
      );

      const loader = container.querySelector('[data-variant="skeleton-list"]');
      expect(loader).toHaveAttribute('data-item-count', '5');
    });

    it('should render page variant with full-screen overlay when specified', () => {
      render(<LoadingState variant="page" fullScreen label="Loading app..." />);

      const loader = screen.getByRole('status');
      expect(loader).toHaveClass('full-screen');
    });
  });
});
