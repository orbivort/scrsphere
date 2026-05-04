import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { SkeletonCard } from './SkeletonCard';

// Mock the CSS module
vi.mock('./Skeleton.module.css', () => ({
  default: {
    'skeleton-card': 'skeleton-card',
    'skeleton-card-header': 'skeleton-card-header',
    'skeleton-card-body': 'skeleton-card-body',
    'skeleton-title': 'skeleton-title',
    'skeleton-badge': 'skeleton-badge',
    'skeleton-list-item': 'skeleton-list-item',
    'skeleton-dot': 'skeleton-dot',
    'skeleton-line': 'skeleton-line',
    'skeleton-stats': 'skeleton-stats',
    'skeleton-stat-item': 'skeleton-stat-item',
    'skeleton-stat-icon': 'skeleton-stat-icon',
    'skeleton-stat-content': 'skeleton-stat-content',
    'skeleton-stat-value': 'skeleton-stat-value',
    'skeleton-stat-label': 'skeleton-stat-label',
    default: 'default',
    list: 'list',
    stats: 'stats',
  },
}));

describe('SkeletonCard', () => {
  describe('Component Rendering Tests', () => {
    it('renders with default props', () => {
      const { container } = render(<SkeletonCard />);

      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toBeInTheDocument();
    });

    it('renders with default variant', () => {
      const { container } = render(<SkeletonCard />);

      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveClass('default');
    });

    it('renders with list variant', () => {
      const { container } = render(<SkeletonCard variant="list" />);

      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveClass('list');
    });

    it('renders with stats variant', () => {
      const { container } = render(<SkeletonCard variant="stats" />);

      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveClass('stats');
    });
  });

  describe('Card Structure Tests', () => {
    it('renders card header', () => {
      const { container } = render(<SkeletonCard />);

      const header = container.querySelector('.skeleton-card-header');
      expect(header).toBeInTheDocument();
    });

    it('renders card body', () => {
      const { container } = render(<SkeletonCard />);

      const body = container.querySelector('.skeleton-card-body');
      expect(body).toBeInTheDocument();
    });

    it('renders title in header', () => {
      const { container } = render(<SkeletonCard />);

      const title = container.querySelector('.skeleton-title');
      expect(title).toBeInTheDocument();
    });

    it('renders badge in header', () => {
      const { container } = render(<SkeletonCard />);

      const badge = container.querySelector('.skeleton-badge');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Default/List Variant Tests', () => {
    it('renders correct number of list items for default variant', () => {
      const { container } = render(<SkeletonCard itemCount={5} variant="default" />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      expect(listItems).toHaveLength(5);
    });

    it('renders correct number of list items for list variant', () => {
      const { container } = render(<SkeletonCard itemCount={4} variant="list" />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      expect(listItems).toHaveLength(4);
    });

    it('renders default 3 items when itemCount not specified', () => {
      const { container } = render(<SkeletonCard />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      expect(listItems).toHaveLength(3);
    });

    it('renders each list item with dot, line, and badge', () => {
      const { container } = render(<SkeletonCard itemCount={2} variant="default" />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      listItems.forEach((item) => {
        expect(item.querySelector('.skeleton-dot')).toBeInTheDocument();
        expect(item.querySelector('.skeleton-line')).toBeInTheDocument();
        expect(item.querySelector('.skeleton-badge')).toBeInTheDocument();
      });
    });
  });

  describe('Stats Variant Tests', () => {
    it('renders stats container for stats variant', () => {
      const { container } = render(<SkeletonCard variant="stats" />);

      const statsContainer = container.querySelector('.skeleton-stats');
      expect(statsContainer).toBeInTheDocument();
    });

    it('renders correct number of stat items', () => {
      const { container } = render(<SkeletonCard variant="stats" itemCount={4} />);

      const statItems = container.querySelectorAll('.skeleton-stat-item');
      expect(statItems).toHaveLength(4);
    });

    it('renders default 3 stat items when itemCount not specified', () => {
      const { container } = render(<SkeletonCard variant="stats" />);

      const statItems = container.querySelectorAll('.skeleton-stat-item');
      expect(statItems).toHaveLength(3);
    });

    it('renders each stat item with icon, value, and label', () => {
      const { container } = render(<SkeletonCard variant="stats" itemCount={2} />);

      const statItems = container.querySelectorAll('.skeleton-stat-item');
      statItems.forEach((item) => {
        expect(item.querySelector('.skeleton-stat-icon')).toBeInTheDocument();
        expect(item.querySelector('.skeleton-stat-content')).toBeInTheDocument();
        expect(item.querySelector('.skeleton-stat-value')).toBeInTheDocument();
        expect(item.querySelector('.skeleton-stat-label')).toBeInTheDocument();
      });
    });

    it('renders stat content with value and label', () => {
      const { container } = render(<SkeletonCard variant="stats" itemCount={1} />);

      const statContent = container.querySelector('.skeleton-stat-content');
      expect(statContent?.querySelector('.skeleton-stat-value')).toBeInTheDocument();
      expect(statContent?.querySelector('.skeleton-stat-label')).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('has role="status"', () => {
      render(<SkeletonCard />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('has aria-live="polite"', () => {
      render(<SkeletonCard />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('has aria-busy="true"', () => {
      render(<SkeletonCard />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    it('has aria-label for screen readers', () => {
      render(<SkeletonCard label="Loading statistics" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading statistics');
    });

    it('has default aria-label when not provided', () => {
      render(<SkeletonCard />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading card content');
    });

    it('has visually hidden text for screen readers', () => {
      render(<SkeletonCard label="Loading card" />);

      const hiddenText = screen.getByText('Loading card');
      expect(hiddenText).toBeInTheDocument();
      expect(hiddenText).toHaveClass('visually-hidden');
    });
  });

  describe('Custom className Tests', () => {
    it('applies custom className', () => {
      const { container } = render(<SkeletonCard className="custom-skeleton" />);

      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveClass('custom-skeleton');
    });

    it('applies multiple custom classes', () => {
      const { container } = render(<SkeletonCard className="class-one class-two" />);

      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveClass('class-one');
      expect(skeletonCard).toHaveClass('class-two');
    });

    it('applies empty className without errors', () => {
      const { container } = render(<SkeletonCard className="" />);

      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toBeInTheDocument();
    });
  });

  describe('Custom Label Tests', () => {
    it('uses custom label when provided', () => {
      render(<SkeletonCard label="Loading user card" />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading user card');
    });

    it('uses default label when not provided', () => {
      render(<SkeletonCard />);
      expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading card content');
    });
  });

  describe('CSS Class Tests', () => {
    it('has skeleton-card class', () => {
      const { container } = render(<SkeletonCard />);

      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toBeInTheDocument();
    });

    it('has variant class applied', () => {
      const { container } = render(<SkeletonCard variant="stats" />);

      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toHaveClass('stats');
    });
  });

  describe('Edge Cases', () => {
    it('handles 0 items', () => {
      const { container } = render(<SkeletonCard itemCount={0} />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      expect(listItems).toHaveLength(0);
    });

    it('handles very large number of items', () => {
      const { container } = render(<SkeletonCard itemCount={50} />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      expect(listItems).toHaveLength(50);
    });

    it('handles very large number of stat items', () => {
      const { container } = render(<SkeletonCard variant="stats" itemCount={20} />);

      const statItems = container.querySelectorAll('.skeleton-stat-item');
      expect(statItems).toHaveLength(20);
    });

    it('handles negative itemCount (edge case)', () => {
      const { container } = render(<SkeletonCard itemCount={-1} />);

      const listItems = container.querySelectorAll('.skeleton-list-item');
      // Array.from with negative length creates empty array
      expect(listItems).toHaveLength(0);
    });
  });

  describe('Structure Tests', () => {
    it('renders visually hidden span as last child', () => {
      const { container } = render(<SkeletonCard label="Test label" />);

      const skeletonCard = container.querySelector('.skeleton-card');
      const lastChild = skeletonCard?.lastElementChild;
      expect(lastChild).toHaveClass('visually-hidden');
      expect(lastChild).toHaveTextContent('Test label');
    });

    it('renders header before body', () => {
      const { container } = render(<SkeletonCard />);

      const skeletonCard = container.querySelector('.skeleton-card');
      const children = Array.from(skeletonCard?.children || []);

      // First child should be header
      expect(children[0]).toHaveClass('skeleton-card-header');
      // Second child should be body
      expect(children[1]).toHaveClass('skeleton-card-body');
    });
  });

  describe('Integration Tests', () => {
    it('renders complete card structure with default variant', () => {
      const { container } = render(<SkeletonCard itemCount={2} label="Loading tasks" />);

      // Check container
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toBeInTheDocument();

      // Check header
      expect(container.querySelector('.skeleton-card-header')).toBeInTheDocument();
      expect(container.querySelector('.skeleton-title')).toBeInTheDocument();

      // Check body
      expect(container.querySelector('.skeleton-card-body')).toBeInTheDocument();

      // Check items
      const items = container.querySelectorAll('.skeleton-list-item');
      expect(items).toHaveLength(2);

      // Check accessibility
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading tasks')).toBeInTheDocument();
    });

    it('renders complete card structure with stats variant', () => {
      const { container } = render(
        <SkeletonCard variant="stats" itemCount={3} label="Loading stats" />
      );

      // Check container
      const skeletonCard = container.querySelector('.skeleton-card');
      expect(skeletonCard).toBeInTheDocument();
      expect(skeletonCard).toHaveClass('stats');

      // Check stats container
      expect(container.querySelector('.skeleton-stats')).toBeInTheDocument();

      // Check stat items
      const statItems = container.querySelectorAll('.skeleton-stat-item');
      expect(statItems).toHaveLength(3);

      // Check accessibility
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading stats')).toBeInTheDocument();
    });
  });
});
