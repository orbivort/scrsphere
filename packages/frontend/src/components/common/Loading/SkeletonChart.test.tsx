import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { SkeletonChart } from './SkeletonChart';

// Mock the CSS module
vi.mock('./Skeleton.module.css', () => ({
  default: {
    'skeleton-chart': 'skeleton-chart',
    'skeleton-chart-area': 'skeleton-chart-area',
  },
}));

describe('SkeletonChart', () => {
  describe('Component Rendering Tests', () => {
    it('renders with default props', () => {
      const { container } = render(<SkeletonChart />);

      const skeletonChart = container.querySelector('.skeleton-chart');
      expect(skeletonChart).toBeInTheDocument();
    });

    it('renders chart container', () => {
      const { container } = render(<SkeletonChart />);

      const chartContainer = container.querySelector('.skeleton-chart');
      expect(chartContainer).toBeInTheDocument();
    });

    it('renders chart area placeholder', () => {
      const { container } = render(<SkeletonChart />);

      const chartArea = container.querySelector('.skeleton-chart-area');
      expect(chartArea).toBeInTheDocument();
    });
  });

  describe('Chart Structure Tests', () => {
    it('renders chart area inside chart container', () => {
      const { container } = render(<SkeletonChart />);

      const chartContainer = container.querySelector('.skeleton-chart');
      const chartArea = chartContainer?.querySelector('.skeleton-chart-area');
      expect(chartArea).toBeInTheDocument();
    });

    it('renders visually hidden span as last child', () => {
      const { container } = render(<SkeletonChart label="Test label" />);

      const skeletonChart = container.querySelector('.skeleton-chart');
      const lastChild = skeletonChart?.lastElementChild;
      expect(lastChild).toHaveClass('visually-hidden');
      expect(lastChild).toHaveTextContent('Test label');
    });
  });

  describe('Accessibility Tests', () => {
    it('has role="status"', () => {
      render(<SkeletonChart />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite"', () => {
      render(<SkeletonChart />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-busy="true"', () => {
      render(<SkeletonChart />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-label for screen readers', () => {
      render(<SkeletonChart label="Loading performance chart" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading performance chart');
    });

    it('has default aria-label when not provided', () => {
      render(<SkeletonChart />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading chart');
    });

    it('has visually hidden text for screen readers', () => {
      render(<SkeletonChart label="Loading burndown chart" />);

      const hiddenText = screen.getByText('Loading burndown chart');
      expect(hiddenText).toBeInTheDocument();
      expect(hiddenText).toHaveClass('visually-hidden');
    });
  });

  describe('Custom className Tests', () => {
    it('applies custom className', () => {
      const { container } = render(<SkeletonChart className="custom-skeleton" />);

      const skeletonChart = container.querySelector('.skeleton-chart');
      expect(skeletonChart).toHaveClass('custom-skeleton');
    });

    it('applies multiple custom classes', () => {
      const { container } = render(<SkeletonChart className="class-one class-two" />);

      const skeletonChart = container.querySelector('.skeleton-chart');
      expect(skeletonChart).toHaveClass('class-one');
      expect(skeletonChart).toHaveClass('class-two');
    });

    it('applies empty className without errors', () => {
      const { container } = render(<SkeletonChart className="" />);

      const skeletonChart = container.querySelector('.skeleton-chart');
      expect(skeletonChart).toBeInTheDocument();
    });
  });

  describe('Custom Label Tests', () => {
    it('uses custom label when provided', () => {
      render(<SkeletonChart label="Loading analytics chart" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading analytics chart');
    });

    it('uses default label when not provided', () => {
      render(<SkeletonChart />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading chart');
    });

    it('supports descriptive labels', () => {
      render(<SkeletonChart label="Loading burndown chart for Sprint 5" />);
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        'Loading burndown chart for Sprint 5'
      );
    });
  });

  describe('CSS Class Tests', () => {
    it('has skeleton-chart class', () => {
      const { container } = render(<SkeletonChart />);

      const skeletonChart = container.querySelector('.skeleton-chart');
      expect(skeletonChart).toBeInTheDocument();
    });

    it('has skeleton-chart-area class', () => {
      const { container } = render(<SkeletonChart />);

      const chartArea = container.querySelector('.skeleton-chart-area');
      expect(chartArea).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty label', () => {
      render(<SkeletonChart label="" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', '');
    });

    it('handles long label', () => {
      const longLabel =
        'Loading a very long chart description that might be used for accessibility purposes in complex dashboards';
      render(<SkeletonChart label={longLabel} />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', longLabel);
    });

    it('handles special characters in label', () => {
      render(<SkeletonChart label="Loading chart: <data> & 'values'" />);
      expect(screen.getByRole('status')).toHaveAttribute(
        'aria-label',
        "Loading chart: <data> & 'values'"
      );
    });
  });

  describe('Integration Tests', () => {
    it('renders complete chart structure with all elements', () => {
      const { container } = render(<SkeletonChart label="Loading metrics chart" />);

      // Check container
      const skeletonChart = container.querySelector('.skeleton-chart');
      expect(skeletonChart).toBeInTheDocument();

      // Check chart area
      expect(container.querySelector('.skeleton-chart-area')).toBeInTheDocument();

      // Check accessibility
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading metrics chart')).toBeInTheDocument();
    });

    it('maintains correct element hierarchy', () => {
      const { container } = render(<SkeletonChart />);

      const skeletonChart = container.querySelector('.skeleton-chart');
      const children = Array.from(skeletonChart?.children || []);

      // Should have chart area and visually hidden span
      expect(children.length).toBe(2);
      expect(children[0]).toHaveClass('skeleton-chart-area');
      expect(children[1]).toHaveClass('visually-hidden');
    });
  });
});
