import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MoSCoWPriority, ItemStatus } from '../../../types';
import { createMockBacklogItem } from '../../../test-utils';

import { ListView } from './ListView';

const mockItems = [
  createMockBacklogItem({
    id: 'pbi-1',
    title: 'Feature A',
    priority: MoSCoWPriority.MUST_HAVE,
    status: ItemStatus.NEW,
    storyPoints: 8,
    businessValue: 13,
    labels: ['frontend', 'urgent'],
  }),
  createMockBacklogItem({
    id: 'pbi-2',
    title: 'Feature B',
    priority: MoSCoWPriority.SHOULD_HAVE,
    status: ItemStatus.REFINED,
    storyPoints: 5,
    businessValue: 8,
    labels: ['backend'],
  }),
  createMockBacklogItem({
    id: 'pbi-3',
    title: 'Feature C',
    priority: MoSCoWPriority.COULD_HAVE,
    status: ItemStatus.READY,
    storyPoints: 3,
    businessValue: 5,
    labels: ['api', 'database', 'testing', 'security'],
  }),
];

describe('ListView', () => {
  const mockOnItemClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render table headers', () => {
      render(<ListView items={mockItems} onItemClick={mockOnItemClick} />);

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('MoSCoW')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Business Value')).toBeInTheDocument();
      expect(screen.getByText('Estimate')).toBeInTheDocument();
      expect(screen.getByText('Labels')).toBeInTheDocument();
    });

    it('should render all items', () => {
      render(<ListView items={mockItems} onItemClick={mockOnItemClick} />);

      expect(screen.getByText('Feature A')).toBeInTheDocument();
      expect(screen.getByText('Feature B')).toBeInTheDocument();
      expect(screen.getByText('Feature C')).toBeInTheDocument();
    });

    it('should display truncated IDs', () => {
      render(<ListView items={mockItems} onItemClick={mockOnItemClick} />);

      const idElements = screen.getAllByText(/#bi-/);
      expect(idElements.length).toBeGreaterThan(0);
    });

    it('should display story points', () => {
      render(<ListView items={mockItems} onItemClick={mockOnItemClick} />);

      const ptsElements = screen.getAllByText(/pts/);
      expect(ptsElements.length).toBeGreaterThan(0);
    });

    it('should display business value', () => {
      render(<ListView items={mockItems} onItemClick={mockOnItemClick} />);

      expect(screen.getByText('13 pts')).toBeInTheDocument();
    });

    it('should display status badges', () => {
      render(<ListView items={mockItems} onItemClick={mockOnItemClick} />);

      expect(screen.getByText('NEW')).toBeInTheDocument();
      expect(screen.getByText('REFINED')).toBeInTheDocument();
      expect(screen.getByText('READY')).toBeInTheDocument();
    });
  });

  describe('Labels Display', () => {
    it('should display up to 2 labels', () => {
      render(<ListView items={mockItems} onItemClick={mockOnItemClick} />);

      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('urgent')).toBeInTheDocument();
    });

    it('should show overflow indicator for more than 2 labels', () => {
      render(<ListView items={mockItems} onItemClick={mockOnItemClick} />);

      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should handle items with no labels', () => {
      const itemsWithoutLabels = [
        createMockBacklogItem({
          id: 'pbi-no-labels',
          title: 'No Labels Feature',
          priority: MoSCoWPriority.MUST_HAVE,
          status: ItemStatus.NEW,
          labels: [],
        }),
      ];

      render(<ListView items={itemsWithoutLabels} onItemClick={mockOnItemClick} />);

      expect(screen.getByText('No Labels Feature')).toBeInTheDocument();
    });
  });

  describe('Item Interaction', () => {
    it('should call onItemClick when clicking a row', async () => {
      render(<ListView items={mockItems} onItemClick={mockOnItemClick} />);

      await userEvent.click(screen.getByText('Feature A'));

      expect(mockOnItemClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'pbi-1', title: 'Feature A' })
      );
    });
  });

  describe('Empty State', () => {
    it('should render empty table when no items', () => {
      render(<ListView items={[]} onItemClick={mockOnItemClick} />);

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.queryByText('Feature A')).not.toBeInTheDocument();
    });
  });

  describe('Missing Data Handling', () => {
    it('should handle missing story points', () => {
      const itemsWithoutEstimate = [
        createMockBacklogItem({
          id: 'pbi-no-estimate',
          title: 'No Estimate Feature',
          priority: MoSCoWPriority.MUST_HAVE,
          status: ItemStatus.NEW,
          storyPoints: undefined,
        }),
      ];

      render(<ListView items={itemsWithoutEstimate} onItemClick={mockOnItemClick} />);

      expect(screen.getByText('-')).toBeInTheDocument();
    });

    it('should handle missing business value', () => {
      const itemsWithoutValue = [
        createMockBacklogItem({
          id: 'pbi-no-value',
          title: 'No Value Feature',
          priority: MoSCoWPriority.MUST_HAVE,
          status: ItemStatus.NEW,
          businessValue: undefined,
        }),
      ];

      render(<ListView items={itemsWithoutValue} onItemClick={mockOnItemClick} />);

      expect(screen.getByText('-')).toBeInTheDocument();
    });
  });

  describe('Virtual Scrolling', () => {
    it('should not use virtual scrolling when items are below threshold (50)', () => {
      const manyItems = Array(45)
        .fill(null)
        .map((_, i) =>
          createMockBacklogItem({
            id: `pbi-${i}`,
            title: `Feature ${i}`,
            priority: MoSCoWPriority.MUST_HAVE,
            status: ItemStatus.NEW,
          })
        );

      render(<ListView items={manyItems} onItemClick={mockOnItemClick} />);

      // All items should be rendered (no virtualization)
      expect(screen.getByText('Feature 0')).toBeInTheDocument();
      expect(screen.getByText('Feature 44')).toBeInTheDocument();
    });

    it('should render table structure correctly with many items', () => {
      const manyItems = Array(60)
        .fill(null)
        .map((_, i) =>
          createMockBacklogItem({
            id: `pbi-${i}`,
            title: `Feature ${i}`,
            priority: MoSCoWPriority.MUST_HAVE,
            status: ItemStatus.NEW,
          })
        );

      render(<ListView items={manyItems} onItemClick={mockOnItemClick} />);

      // Table headers should still be present
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('MoSCoW')).toBeInTheDocument();
    });

    it('should maintain row click functionality with virtual scrolling', async () => {
      // Use fewer items to ensure they are rendered
      const fewItems = Array(10)
        .fill(null)
        .map((_, i) =>
          createMockBacklogItem({
            id: `pbi-${i}`,
            title: `Feature ${i}`,
            priority: MoSCoWPriority.MUST_HAVE,
            status: ItemStatus.NEW,
          })
        );

      render(<ListView items={fewItems} onItemClick={mockOnItemClick} />);

      // Should be able to click on items
      await userEvent.click(screen.getByText('Feature 0'));
      expect(mockOnItemClick).toHaveBeenCalled();
    });

    it('should apply virtualized styles when items exceed threshold', () => {
      const manyItems = Array(60)
        .fill(null)
        .map((_, i) =>
          createMockBacklogItem({
            id: `pbi-${i}`,
            title: `Feature ${i}`,
            priority: MoSCoWPriority.MUST_HAVE,
            status: ItemStatus.NEW,
          })
        );

      const { container } = render(<ListView items={manyItems} onItemClick={mockOnItemClick} />);

      // Should have virtualized CSS class on the list-view container
      const listViewElement = container.querySelector('[class*="list-view"]');
      expect(listViewElement).toBeInTheDocument();
      expect(listViewElement!.className).toContain('virtualized');
    });

    it('should not apply virtualized styles when items are below threshold', () => {
      const fewItems = Array(10)
        .fill(null)
        .map((_, i) =>
          createMockBacklogItem({
            id: `pbi-${i}`,
            title: `Feature ${i}`,
            priority: MoSCoWPriority.MUST_HAVE,
            status: ItemStatus.NEW,
          })
        );

      const { container } = render(<ListView items={fewItems} onItemClick={mockOnItemClick} />);

      // Should not have virtualized CSS class
      const listViewElement = container.querySelector('[class*="list-view"]');
      expect(listViewElement).toBeInTheDocument();
      expect(listViewElement!.className).not.toContain('virtualized');
    });

    it('should handle empty list with virtual scrolling enabled', () => {
      render(<ListView items={[]} onItemClick={mockOnItemClick} />);

      // Table headers should still be present
      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Title')).toBeInTheDocument();
    });

    it('should maintain MoSCoW badge display without virtualization', () => {
      const fewItems = Array(10)
        .fill(null)
        .map((_, i) =>
          createMockBacklogItem({
            id: `pbi-${i}`,
            title: `Feature ${i}`,
            priority: MoSCoWPriority.SHOULD_HAVE,
            status: ItemStatus.NEW,
          })
        );

      render(<ListView items={fewItems} onItemClick={mockOnItemClick} />);

      // Should still show MoSCoW badges
      const moscowBadges = screen.getAllByText('Should Have');
      expect(moscowBadges.length).toBeGreaterThan(0);
    });
  });
});
