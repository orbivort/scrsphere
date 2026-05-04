import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { SkeletonList } from './SkeletonList';

// Mock the CSS module
vi.mock('./Skeleton.module.css', () => ({
  default: {
    'skeleton-list': 'skeleton-list',
    'skeleton-list-item': 'skeleton-list-item',
    'skeleton-dot': 'skeleton-dot',
    'skeleton-line': 'skeleton-line',
    'skeleton-badge': 'skeleton-badge',
  },
}));

describe('SkeletonList', () => {
  describe('Component Rendering Tests', () => {
    it('renders with default props', () => {
      const { container } = render(<SkeletonList />);

      const skeletonList = container.querySelector('.skeleton-list');
      expect(skeletonList).toBeInTheDocument();
    });

    it('renders with correct number of items', () => {
      const { container } = render(<SkeletonList itemCount={5} />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      expect(listItems).toHaveLength(5);
    });

    it('renders with default 3 items when itemCount not specified', () => {
      const { container } = render(<SkeletonList />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      expect(listItems).toHaveLength(3);
    });

    it('renders with 0 items (edge case)', () => {
      const { container } = render(<SkeletonList itemCount={0} />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      expect(listItems).toHaveLength(0);
    });

    it('renders with many items', () => {
      const { container } = render(<SkeletonList itemCount={20} />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      expect(listItems).toHaveLength(20);
    });
  });

  describe('List Item Structure Tests', () => {
    it('renders each list item with dot, line, and badge', () => {
      const { container } = render(<SkeletonList itemCount={3} />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      listItems.forEach((item) => {
        expect(item.querySelector('.skeleton-dot')).toBeInTheDocument();
        expect(item.querySelector('.skeleton-line')).toBeInTheDocument();
        expect(item.querySelector('.skeleton-badge')).toBeInTheDocument();
      });
    });

    it('renders dot element in each list item', () => {
      const { container } = render(<SkeletonList itemCount={2} />);

      const dots = container.querySelectorAll('.skeleton-dot');
      expect(dots).toHaveLength(2);
    });

    it('renders line element in each list item', () => {
      const { container } = render(<SkeletonList itemCount={2} />);

      const lines = container.querySelectorAll('.skeleton-line');
      expect(lines).toHaveLength(2);
    });

    it('renders badge element in each list item', () => {
      const { container } = render(<SkeletonList itemCount={2} />);

      const badges = container.querySelectorAll('.skeleton-badge');
      expect(badges).toHaveLength(2);
    });

    it('applies 70% width to line elements', () => {
      const { container } = render(<SkeletonList itemCount={1} />);

      const line = container.querySelector('.skeleton-line');
      expect(line).toHaveStyle({ width: '70%' });
    });
  });

  describe('Accessibility Tests', () => {
    it('has role="status"', () => {
      render(<SkeletonList />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite"', () => {
      render(<SkeletonList />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-busy="true"', () => {
      render(<SkeletonList />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-label for screen readers', () => {
      render(<SkeletonList label="Loading task list" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading task list');
    });

    it('has default aria-label when not provided', () => {
      render(<SkeletonList />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading list items');
    });

    it('has visually hidden text for screen readers', () => {
      render(<SkeletonList label="Loading items" />);

      const hiddenText = screen.getByText('Loading items');
      expect(hiddenText).toBeInTheDocument();
      expect(hiddenText).toHaveClass('visually-hidden');
    });
  });

  describe('Custom className Tests', () => {
    it('applies custom className', () => {
      const { container } = render(<SkeletonList className="custom-skeleton" />);

      const skeletonList = container.querySelector('.skeleton-list');
      expect(skeletonList).toHaveClass('custom-skeleton');
    });

    it('applies multiple custom classes', () => {
      const { container } = render(<SkeletonList className="class-one class-two" />);

      const skeletonList = container.querySelector('.skeleton-list');
      expect(skeletonList).toHaveClass('class-one');
      expect(skeletonList).toHaveClass('class-two');
    });

    it('applies empty className without errors', () => {
      const { container } = render(<SkeletonList className="" />);

      const skeletonList = container.querySelector('.skeleton-list');
      expect(skeletonList).toBeInTheDocument();
    });
  });

  describe('Custom Label Tests', () => {
    it('uses custom label when provided', () => {
      render(<SkeletonList label="Loading user list" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading user list');
    });

    it('uses default label when not provided', () => {
      render(<SkeletonList />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading list items');
    });
  });

  describe('CSS Class Tests', () => {
    it('has skeleton-list class', () => {
      const { container } = render(<SkeletonList />);

      const skeletonList = container.querySelector('.skeleton-list');
      expect(skeletonList).toBeInTheDocument();
    });

    it('has skeleton-list-item class for each item', () => {
      const { container } = render(<SkeletonList itemCount={3} />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      listItems.forEach((item) => {
        expect(item).toHaveClass('skeleton-list-item');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles very large number of items', () => {
      const { container } = render(<SkeletonList itemCount={100} />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      expect(listItems).toHaveLength(100);
    });

    it('handles negative itemCount (edge case)', () => {
      const { container } = render(<SkeletonList itemCount={-1} />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      // Array.from with negative length creates empty array
      expect(listItems).toHaveLength(0);
    });
  });

  describe('Structure Tests', () => {
    it('renders items inside skeleton-list container', () => {
      const { container } = render(<SkeletonList itemCount={3} />);

      const skeletonList = container.querySelector('.skeleton-list');
      const items = skeletonList?.querySelectorAll('.skeleton-list-item');
      expect(items).toHaveLength(3);
    });

    it('renders visually hidden span as last child', () => {
      const { container } = render(<SkeletonList label="Test label" />);

      const skeletonList = container.querySelector('.skeleton-list');
      const lastChild = skeletonList?.lastElementChild;
      expect(lastChild).toHaveClass('visually-hidden');
      expect(lastChild).toHaveTextContent('Test label');
    });

    it('maintains correct order of elements in list item', () => {
      const { container } = render(<SkeletonList itemCount={1} />);

      const listItem = container.querySelector('.skeleton-list-item');
      const children = Array.from(listItem?.children || []);

      expect(children[0]).toHaveClass('skeleton-dot');
      expect(children[1]).toHaveClass('skeleton-line');
      expect(children[2]).toHaveClass('skeleton-badge');
    });
  });

  describe('Integration Tests', () => {
    it('renders complete list structure with all elements', () => {
      const { container } = render(<SkeletonList itemCount={2} label="Loading tasks" />);

      // Check container
      const skeletonList = container.querySelector('.skeleton-list');
      expect(skeletonList).toBeInTheDocument();

      // Check items
      const items = container.querySelectorAll('.skeleton-list-item');
      expect(items).toHaveLength(2);

      // Check accessibility
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading tasks')).toBeInTheDocument();
    });
  });
});
