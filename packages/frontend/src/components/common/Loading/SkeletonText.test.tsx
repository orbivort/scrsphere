import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { SkeletonText } from './SkeletonText';

// Mock the CSS module
vi.mock('./Skeleton.module.css', () => ({
  default: {
    'skeleton-text': 'skeleton-text',
    'skeleton-line': 'skeleton-line',
  },
}));

describe('SkeletonText', () => {
  describe('Component Rendering Tests', () => {
    it('renders with default props', () => {
      const { container } = render(<SkeletonText />);

      const skeletonText = container.querySelector('.skeleton-text');
      expect(skeletonText).toBeInTheDocument();
    });

    it('renders with correct number of lines', () => {
      const { container } = render(<SkeletonText lines={5} />);

      const lines = container.querySelectorAll('.skeleton-line');
      expect(lines).toHaveLength(5);
    });

    it('renders with default 1 line when lines not specified', () => {
      const { container } = render(<SkeletonText />);

      const lines = container.querySelectorAll('.skeleton-line');
      expect(lines).toHaveLength(1);
    });

    it('renders with 0 lines (edge case)', () => {
      const { container } = render(<SkeletonText lines={0} />);

      const lines = container.querySelectorAll('.skeleton-line');
      expect(lines).toHaveLength(0);
    });

    it('renders with many lines', () => {
      const { container } = render(<SkeletonText lines={20} />);

      const lines = container.querySelectorAll('.skeleton-line');
      expect(lines).toHaveLength(20);
    });
  });

  describe('Last Line Width Tests', () => {
    it('applies lastLineWidth to the last line when multiple lines', () => {
      const { container } = render(<SkeletonText lines={3} lastLineWidth="60%" />);

      const lines = container.querySelectorAll('.skeleton-line');
      expect(lines).toHaveLength(3);

      // First two lines should be 100%
      expect(lines[0]).toHaveStyle({ width: '100%' });
      expect(lines[1]).toHaveStyle({ width: '100%' });
      // Last line should be 60%
      expect(lines[2]).toHaveStyle({ width: '60%' });
    });

    it('applies 100% width to single line regardless of lastLineWidth', () => {
      const { container } = render(<SkeletonText lines={1} lastLineWidth="50%" />);

      const lines = container.querySelectorAll('.skeleton-line');
      expect(lines).toHaveLength(1);
      // Single line should always be 100%
      expect(lines[0]).toHaveStyle({ width: '100%' });
    });

    it('applies lastLineWidth with pixel value', () => {
      const { container } = render(<SkeletonText lines={2} lastLineWidth="200px" />);

      const lines = container.querySelectorAll('.skeleton-line');
      expect(lines[0]).toHaveStyle({ width: '100%' });
      expect(lines[1]).toHaveStyle({ width: '200px' });
    });

    it('applies lastLineWidth with percentage value', () => {
      const { container } = render(<SkeletonText lines={4} lastLineWidth="75%" />);

      const lines = container.querySelectorAll('.skeleton-line');
      expect(lines[0]).toHaveStyle({ width: '100%' });
      expect(lines[1]).toHaveStyle({ width: '100%' });
      expect(lines[2]).toHaveStyle({ width: '100%' });
      expect(lines[3]).toHaveStyle({ width: '75%' });
    });

    it('uses default lastLineWidth of 100% when not specified', () => {
      const { container } = render(<SkeletonText lines={2} />);

      const lines = container.querySelectorAll('.skeleton-line');
      expect(lines[0]).toHaveStyle({ width: '100%' });
      expect(lines[1]).toHaveStyle({ width: '100%' });
    });
  });

  describe('Accessibility Tests', () => {
    it('has role="status"', () => {
      render(<SkeletonText />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite"', () => {
      render(<SkeletonText />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-busy="true"', () => {
      render(<SkeletonText />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-label for screen readers', () => {
      render(<SkeletonText label="Loading article content" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading article content');
    });

    it('has default aria-label when not provided', () => {
      render(<SkeletonText />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading content');
    });

    it('has visually hidden text for screen readers', () => {
      render(<SkeletonText label="Loading description" />);

      const hiddenText = screen.getByText('Loading description');
      expect(hiddenText).toBeInTheDocument();
      expect(hiddenText).toHaveClass('visually-hidden');
    });
  });

  describe('Custom className Tests', () => {
    it('applies custom className', () => {
      const { container } = render(<SkeletonText className="custom-skeleton" />);

      const skeletonText = container.querySelector('.skeleton-text');
      expect(skeletonText).toHaveClass('custom-skeleton');
    });

    it('applies multiple custom classes', () => {
      const { container } = render(<SkeletonText className="class-one class-two" />);

      const skeletonText = container.querySelector('.skeleton-text');
      expect(skeletonText).toHaveClass('class-one');
      expect(skeletonText).toHaveClass('class-two');
    });

    it('applies empty className without errors', () => {
      const { container } = render(<SkeletonText className="" />);

      const skeletonText = container.querySelector('.skeleton-text');
      expect(skeletonText).toBeInTheDocument();
    });
  });

  describe('Custom Label Tests', () => {
    it('uses custom label when provided', () => {
      render(<SkeletonText label="Loading user profile" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading user profile');
    });

    it('uses default label when not provided', () => {
      render(<SkeletonText />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading content');
    });
  });

  describe('CSS Class Tests', () => {
    it('has skeleton-text class', () => {
      const { container } = render(<SkeletonText />);

      const skeletonText = container.querySelector('.skeleton-text');
      expect(skeletonText).toBeInTheDocument();
    });

    it('has skeleton-line class for each line', () => {
      const { container } = render(<SkeletonText lines={3} />);

      const lines = container.querySelectorAll('.skeleton-line');
      lines.forEach((line) => {
        expect(line).toHaveClass('skeleton-line');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles very large number of lines', () => {
      const { container } = render(<SkeletonText lines={100} />);

      const lines = container.querySelectorAll('.skeleton-line');
      expect(lines).toHaveLength(100);
    });

    it('handles decimal lastLineWidth', () => {
      const { container } = render(<SkeletonText lines={2} lastLineWidth="50.5%" />);

      const lines = container.querySelectorAll('.skeleton-line');
      expect(lines[1]).toHaveStyle({ width: '50.5%' });
    });

    it('handles lastLineWidth with calc()', () => {
      const { container } = render(<SkeletonText lines={2} lastLineWidth="calc(100% - 20px)" />);

      const lines = container.querySelectorAll('.skeleton-line');
      expect(lines[1]).toHaveStyle({ width: 'calc(100% - 20px)' });
    });

    it('handles negative lines (edge case)', () => {
      const { container } = render(<SkeletonText lines={-1} />);

      const lines = container.querySelectorAll('.skeleton-line');
      // Array.from with negative length creates empty array
      expect(lines).toHaveLength(0);
    });
  });

  describe('Structure Tests', () => {
    it('renders lines inside skeleton-text container', () => {
      const { container } = render(<SkeletonText lines={3} />);

      const skeletonText = container.querySelector('.skeleton-text');
      const lines = skeletonText?.querySelectorAll('.skeleton-line');
      expect(lines).toHaveLength(3);
    });

    it('renders visually hidden span as last child', () => {
      const { container } = render(<SkeletonText label="Test label" />);

      const skeletonText = container.querySelector('.skeleton-text');
      const lastChild = skeletonText?.lastElementChild;
      expect(lastChild).toHaveClass('visually-hidden');
      expect(lastChild).toHaveTextContent('Test label');
    });
  });
});
