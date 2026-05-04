import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { LoadingState } from './LoadingState';

// Mock the CSS modules
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
 * Helper function to get the outer LoadingState container
 * For skeleton variants, the inner skeleton component also has role="status",
 * so we need to query by class to get the outer container.
 */
function getLoadingStateContainer(container: HTMLElement, variant: string) {
  // For spinner and page variants, there's only one role="status"
  if (variant === 'spinner' || variant === 'page') {
    return screen.getByRole('status');
  }
  // For skeleton variants, query by the loading-state class to get the outer container
  return container.querySelector('.loading-state');
}

describe('LoadingState', () => {
  describe('Variant Rendering Tests', () => {
    it('renders spinner variant with correct size', () => {
      render(<LoadingState variant="spinner" size="sm" />);

      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('data-variant', 'spinner');
      expect(loader).toHaveAttribute('data-size', 'sm');
      expect(loader).toHaveClass('loading-state');
      expect(loader).toHaveClass('variant-spinner');
    });

    it('renders spinner variant with md size', () => {
      render(<LoadingState variant="spinner" size="md" />);

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('data-size', 'md');
    });

    it('renders spinner variant with lg size', () => {
      render(<LoadingState variant="spinner" size="lg" />);

      const loader = screen.getByRole('status');
      expect(loader).toHaveAttribute('data-size', 'lg');
    });

    it('renders skeleton-text variant with correct lines', () => {
      const { container } = render(<LoadingState variant="skeleton-text" lines={5} />);

      const loader = getLoadingStateContainer(container, 'skeleton-text');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('data-variant', 'skeleton-text');
      expect(loader).toHaveAttribute('data-lines', '5');
    });

    it('renders skeleton-text variant with default lines', () => {
      const { container } = render(<LoadingState variant="skeleton-text" />);

      const loader = getLoadingStateContainer(container, 'skeleton-text');
      expect(loader).toHaveAttribute('data-lines', '3');
    });

    it('renders skeleton-text variant with custom lastLineWidth', () => {
      const { container } = render(<LoadingState variant="skeleton-text" lastLineWidth="60%" />);

      const loader = getLoadingStateContainer(container, 'skeleton-text');
      expect(loader).toBeInTheDocument();
    });

    it('renders skeleton-card variant', () => {
      const { container } = render(<LoadingState variant="skeleton-card" />);

      const loader = getLoadingStateContainer(container, 'skeleton-card');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('data-variant', 'skeleton-card');
    });

    it('renders skeleton-card variant with default cardVariant', () => {
      const { container } = render(<LoadingState variant="skeleton-card" />);

      const loader = getLoadingStateContainer(container, 'skeleton-card');
      expect(loader).toHaveAttribute('data-card-variant', 'default');
    });

    it('renders skeleton-card variant with stats cardVariant', () => {
      const { container } = render(<LoadingState variant="skeleton-card" cardVariant="stats" />);

      const loader = getLoadingStateContainer(container, 'skeleton-card');
      expect(loader).toHaveAttribute('data-card-variant', 'stats');
    });

    it('renders skeleton-card variant with list cardVariant', () => {
      const { container } = render(<LoadingState variant="skeleton-card" cardVariant="list" />);

      const loader = getLoadingStateContainer(container, 'skeleton-card');
      expect(loader).toHaveAttribute('data-card-variant', 'list');
    });

    it('renders skeleton-card variant with correct itemCount', () => {
      const { container } = render(<LoadingState variant="skeleton-card" itemCount={5} />);

      const loader = getLoadingStateContainer(container, 'skeleton-card');
      expect(loader).toHaveAttribute('data-item-count', '5');
    });

    it('renders skeleton-list variant with correct itemCount', () => {
      const { container } = render(<LoadingState variant="skeleton-list" itemCount={5} />);

      const loader = getLoadingStateContainer(container, 'skeleton-list');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('data-variant', 'skeleton-list');
      expect(loader).toHaveAttribute('data-item-count', '5');
    });

    it('renders skeleton-list variant with default itemCount', () => {
      const { container } = render(<LoadingState variant="skeleton-list" />);

      const loader = getLoadingStateContainer(container, 'skeleton-list');
      expect(loader).toHaveAttribute('data-item-count', '3');
    });

    it('renders skeleton-chart variant', () => {
      const { container } = render(<LoadingState variant="skeleton-chart" />);

      const loader = getLoadingStateContainer(container, 'skeleton-chart');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveAttribute('data-variant', 'skeleton-chart');
    });

    it('renders page variant', () => {
      render(<LoadingState variant="page" />);

      const loader = screen.getByRole('status');
      expect(loader).toBeInTheDocument();
      expect(loader).toHaveClass('page-loader');
      // Loading... appears in both visually hidden span and paragraph
      const loadingTexts = screen.getAllByText('Loading...');
      expect(loadingTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('renders page variant with fullScreen overlay', () => {
      render(<LoadingState variant="page" fullScreen />);

      const loader = screen.getByRole('status');
      expect(loader).toHaveClass('page-loader');
      expect(loader).toHaveClass('full-screen');
    });

    it('renders page variant without fullScreen by default', () => {
      render(<LoadingState variant="page" />);

      const loader = screen.getByRole('status');
      expect(loader).not.toHaveClass('full-screen');
    });
  });

  describe('Accessibility Tests', () => {
    it('has role="status" for spinner variant', () => {
      render(<LoadingState variant="spinner" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has role="status" for skeleton-text variant', () => {
      render(<LoadingState variant="skeleton-text" />);
      // Both outer and inner elements have role="status"
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThanOrEqual(1);
    });

    it('has role="status" for skeleton-card variant', () => {
      render(<LoadingState variant="skeleton-card" />);
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThanOrEqual(1);
    });

    it('has role="status" for skeleton-list variant', () => {
      render(<LoadingState variant="skeleton-list" />);
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThanOrEqual(1);
    });

    it('has role="status" for skeleton-chart variant', () => {
      render(<LoadingState variant="skeleton-chart" />);
      const statusElements = screen.getAllByRole('status');
      expect(statusElements.length).toBeGreaterThanOrEqual(1);
    });

    it('has role="status" for page variant', () => {
      render(<LoadingState variant="page" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite" for spinner variant', () => {
      render(<LoadingState variant="spinner" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-live="polite" for skeleton-text variant', () => {
      const { container } = render(<LoadingState variant="skeleton-text" />);
      const loader = getLoadingStateContainer(container, 'skeleton-text');
      expect(loader).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-live="polite" for skeleton-card variant', () => {
      const { container } = render(<LoadingState variant="skeleton-card" />);
      const loader = getLoadingStateContainer(container, 'skeleton-card');
      expect(loader).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-live="polite" for skeleton-list variant', () => {
      const { container } = render(<LoadingState variant="skeleton-list" />);
      const loader = getLoadingStateContainer(container, 'skeleton-list');
      expect(loader).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-live="polite" for skeleton-chart variant', () => {
      const { container } = render(<LoadingState variant="skeleton-chart" />);
      const loader = getLoadingStateContainer(container, 'skeleton-chart');
      expect(loader).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-live="polite" for page variant', () => {
      render(<LoadingState variant="page" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-label for screen readers', () => {
      render(<LoadingState variant="spinner" label="Loading data..." />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading data...');
    });

    it('has aria-busy="true" for spinner variant', () => {
      render(<LoadingState variant="spinner" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-busy="true" for skeleton-text variant', () => {
      const { container } = render(<LoadingState variant="skeleton-text" />);
      const loader = getLoadingStateContainer(container, 'skeleton-text');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-busy="true" for skeleton-card variant', () => {
      const { container } = render(<LoadingState variant="skeleton-card" />);
      const loader = getLoadingStateContainer(container, 'skeleton-card');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-busy="true" for skeleton-list variant', () => {
      const { container } = render(<LoadingState variant="skeleton-list" />);
      const loader = getLoadingStateContainer(container, 'skeleton-list');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-busy="true" for skeleton-chart variant', () => {
      const { container } = render(<LoadingState variant="skeleton-chart" />);
      const loader = getLoadingStateContainer(container, 'skeleton-chart');
      expect(loader).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-busy="true" for page variant', () => {
      render(<LoadingState variant="page" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Custom className Tests', () => {
    it('applies custom className to spinner variant', () => {
      render(<LoadingState variant="spinner" className="custom-class" />);
      expect(screen.getByRole('status')).toHaveClass('custom-class');
    });

    it('applies custom className to skeleton-text variant', () => {
      const { container } = render(
        <LoadingState variant="skeleton-text" className="custom-class" />
      );
      const loader = getLoadingStateContainer(container, 'skeleton-text');
      expect(loader).toHaveClass('custom-class');
    });

    it('applies custom className to skeleton-card variant', () => {
      const { container } = render(
        <LoadingState variant="skeleton-card" className="custom-class" />
      );
      const loader = getLoadingStateContainer(container, 'skeleton-card');
      expect(loader).toHaveClass('custom-class');
    });

    it('applies custom className to skeleton-list variant', () => {
      const { container } = render(
        <LoadingState variant="skeleton-list" className="custom-class" />
      );
      const loader = getLoadingStateContainer(container, 'skeleton-list');
      expect(loader).toHaveClass('custom-class');
    });

    it('applies custom className to skeleton-chart variant', () => {
      const { container } = render(
        <LoadingState variant="skeleton-chart" className="custom-class" />
      );
      const loader = getLoadingStateContainer(container, 'skeleton-chart');
      expect(loader).toHaveClass('custom-class');
    });

    it('applies custom className to page variant', () => {
      render(<LoadingState variant="page" className="custom-class" />);
      expect(screen.getByRole('status')).toHaveClass('custom-class');
    });
  });

  describe('Default Props Tests', () => {
    it('uses default label when not provided for spinner variant', () => {
      render(<LoadingState variant="spinner" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading...');
    });

    it('uses default label when not provided for skeleton-text variant', () => {
      const { container } = render(<LoadingState variant="skeleton-text" />);
      const loader = getLoadingStateContainer(container, 'skeleton-text');
      expect(loader).toHaveAttribute('aria-label', 'Loading...');
    });

    it('uses default label when not provided for page variant', () => {
      render(<LoadingState variant="page" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading...');
      // Loading... appears in both visually hidden span and paragraph
      const loadingTexts = screen.getAllByText('Loading...');
      expect(loadingTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('uses default size when not provided', () => {
      render(<LoadingState variant="spinner" />);
      expect(screen.getByRole('status')).toHaveAttribute('data-size', 'md');
    });

    it('uses default lines when not provided', () => {
      const { container } = render(<LoadingState variant="skeleton-text" />);
      const loader = getLoadingStateContainer(container, 'skeleton-text');
      expect(loader).toHaveAttribute('data-lines', '3');
    });

    it('uses default itemCount when not provided', () => {
      const { container } = render(<LoadingState variant="skeleton-list" />);
      const loader = getLoadingStateContainer(container, 'skeleton-list');
      expect(loader).toHaveAttribute('data-item-count', '3');
    });

    it('uses default cardVariant when not provided', () => {
      const { container } = render(<LoadingState variant="skeleton-card" />);
      const loader = getLoadingStateContainer(container, 'skeleton-card');
      expect(loader).toHaveAttribute('data-card-variant', 'default');
    });

    it('uses default fullScreen when not provided', () => {
      render(<LoadingState variant="page" />);
      expect(screen.getByRole('status')).not.toHaveClass('full-screen');
    });
  });

  describe('Custom Props Tests', () => {
    it('uses custom label when provided', () => {
      render(<LoadingState variant="spinner" label="Loading dashboard..." />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading dashboard...');
    });

    it('uses custom size when provided', () => {
      render(<LoadingState variant="spinner" size="lg" />);
      expect(screen.getByRole('status')).toHaveAttribute('data-size', 'lg');
    });

    it('uses custom lines when provided', () => {
      const { container } = render(<LoadingState variant="skeleton-text" lines={10} />);
      const loader = getLoadingStateContainer(container, 'skeleton-text');
      expect(loader).toHaveAttribute('data-lines', '10');
    });

    it('uses custom itemCount when provided for skeleton-list', () => {
      const { container } = render(<LoadingState variant="skeleton-list" itemCount={7} />);
      const loader = getLoadingStateContainer(container, 'skeleton-list');
      expect(loader).toHaveAttribute('data-item-count', '7');
    });

    it('uses custom itemCount when provided for skeleton-card', () => {
      const { container } = render(<LoadingState variant="skeleton-card" itemCount={4} />);
      const loader = getLoadingStateContainer(container, 'skeleton-card');
      expect(loader).toHaveAttribute('data-item-count', '4');
    });

    it('uses custom cardVariant when provided', () => {
      const { container } = render(<LoadingState variant="skeleton-card" cardVariant="stats" />);
      const loader = getLoadingStateContainer(container, 'skeleton-card');
      expect(loader).toHaveAttribute('data-card-variant', 'stats');
    });

    it('uses fullScreen when set to true', () => {
      render(<LoadingState variant="page" fullScreen={true} />);
      expect(screen.getByRole('status')).toHaveClass('full-screen');
    });
  });

  describe('Page Variant Specific Tests', () => {
    it('renders LoadingSpinner with correct label', () => {
      render(<LoadingState variant="page" label="Loading reports..." />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Loading reports...');
    });

    it('renders loading text below spinner', () => {
      render(<LoadingState variant="page" label="Loading dashboard..." />);
      const loader = screen.getByRole('status');
      const textElement = loader.querySelector('p');
      expect(textElement).toHaveTextContent('Loading dashboard...');
    });

    it('renders with page-loader class', () => {
      render(<LoadingState variant="page" />);
      expect(screen.getByRole('status')).toHaveClass('page-loader');
    });
  });

  describe('Edge Cases', () => {
    it('handles lines=1 correctly', () => {
      const { container } = render(<LoadingState variant="skeleton-text" lines={1} />);
      const loader = getLoadingStateContainer(container, 'skeleton-text');
      expect(loader).toHaveAttribute('data-lines', '1');
    });

    it('handles itemCount=1 correctly', () => {
      const { container } = render(<LoadingState variant="skeleton-list" itemCount={1} />);
      const loader = getLoadingStateContainer(container, 'skeleton-list');
      expect(loader).toHaveAttribute('data-item-count', '1');
    });

    it('handles empty className', () => {
      render(<LoadingState variant="spinner" className="" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('handles multiple custom classes', () => {
      render(<LoadingState variant="spinner" className="class-one class-two" />);
      const loader = screen.getByRole('status');
      expect(loader).toHaveClass('class-one');
      expect(loader).toHaveClass('class-two');
    });
  });
});
