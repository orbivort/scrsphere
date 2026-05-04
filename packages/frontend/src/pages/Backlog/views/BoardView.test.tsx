import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { MoSCoWPriority, ItemStatus } from '../../../types';
import { createMockBacklogItem } from '../../../test-utils';

import { BoardView } from './BoardView';

const mockItems = [
  createMockBacklogItem({
    id: 'pbi-1',
    title: 'Must Have Feature',
    priority: MoSCoWPriority.MUST_HAVE,
    status: ItemStatus.NEW,
    storyPoints: 8,
    businessValue: 13,
  }),
  createMockBacklogItem({
    id: 'pbi-2',
    title: 'Should Have Feature',
    priority: MoSCoWPriority.SHOULD_HAVE,
    status: ItemStatus.REFINED,
    storyPoints: 5,
    businessValue: 8,
  }),
  createMockBacklogItem({
    id: 'pbi-3',
    title: 'Could Have Feature',
    priority: MoSCoWPriority.COULD_HAVE,
    status: ItemStatus.READY,
    storyPoints: 3,
    businessValue: 5,
  }),
  createMockBacklogItem({
    id: 'pbi-4',
    title: 'Wont Have Feature',
    priority: MoSCoWPriority.WONT_HAVE,
    status: ItemStatus.DONE,
    storyPoints: 2,
    businessValue: 1,
  }),
];

const mockItemsByMoscow = {
  [MoSCoWPriority.MUST_HAVE]: [mockItems[0]],
  [MoSCoWPriority.SHOULD_HAVE]: [mockItems[1]],
  [MoSCoWPriority.COULD_HAVE]: [mockItems[2]],
  [MoSCoWPriority.WONT_HAVE]: [mockItems[3]],
};

describe('BoardView', () => {
  const mockOnItemClick = vi.fn();
  const mockOnPriorityChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all MoSCoW columns', () => {
      render(
        <BoardView
          itemsByMoscow={mockItemsByMoscow}
          onItemClick={mockOnItemClick}
          onPriorityChange={mockOnPriorityChange}
        />
      );

      const mustHaveElements = screen.getAllByText('Must Have');
      expect(mustHaveElements.length).toBeGreaterThan(0);

      const shouldHaveElements = screen.getAllByText('Should Have');
      expect(shouldHaveElements.length).toBeGreaterThan(0);

      const couldHaveElements = screen.getAllByText('Could Have');
      expect(couldHaveElements.length).toBeGreaterThan(0);

      const wontHaveElements = screen.getAllByText("Won't Have");
      expect(wontHaveElements.length).toBeGreaterThan(0);
    });

    it('should render items in correct columns', () => {
      render(
        <BoardView
          itemsByMoscow={mockItemsByMoscow}
          onItemClick={mockOnItemClick}
          onPriorityChange={mockOnPriorityChange}
        />
      );

      expect(screen.getByText('Must Have Feature')).toBeInTheDocument();
      expect(screen.getByText('Should Have Feature')).toBeInTheDocument();
      expect(screen.getByText('Could Have Feature')).toBeInTheDocument();
      expect(screen.getByText('Wont Have Feature')).toBeInTheDocument();
    });

    it('should render item counts in column headers', () => {
      render(
        <BoardView
          itemsByMoscow={mockItemsByMoscow}
          onItemClick={mockOnItemClick}
          onPriorityChange={mockOnPriorityChange}
        />
      );

      const countElements = screen.getAllByText('1');
      expect(countElements.length).toBeGreaterThan(0);
    });

    it('should render empty state for empty columns', () => {
      const emptyItemsByMoscow = {
        [MoSCoWPriority.MUST_HAVE]: [],
        [MoSCoWPriority.SHOULD_HAVE]: [],
        [MoSCoWPriority.COULD_HAVE]: [],
        [MoSCoWPriority.WONT_HAVE]: [],
      };

      render(
        <BoardView
          itemsByMoscow={emptyItemsByMoscow}
          onItemClick={mockOnItemClick}
          onPriorityChange={mockOnPriorityChange}
        />
      );

      const dropPlaceholders = screen.getAllByText('Drop items here');
      expect(dropPlaceholders.length).toBe(4);
    });
  });

  describe('Drag and Drop', () => {
    it('should render draggable cards', () => {
      render(
        <BoardView
          itemsByMoscow={mockItemsByMoscow}
          onItemClick={mockOnItemClick}
          onPriorityChange={mockOnPriorityChange}
        />
      );

      const cards = document.querySelectorAll('[draggable="true"]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should have proper ARIA attributes for accessibility', () => {
      render(
        <BoardView
          itemsByMoscow={mockItemsByMoscow}
          onItemClick={mockOnItemClick}
          onPriorityChange={mockOnPriorityChange}
        />
      );

      const board = document.querySelector('[aria-label="MoSCoW priority board"]');
      expect(board).toBeInTheDocument();
    });
  });

  describe('Item Interaction', () => {
    it('should call onItemClick when clicking an item', async () => {
      render(
        <BoardView
          itemsByMoscow={mockItemsByMoscow}
          onItemClick={mockOnItemClick}
          onPriorityChange={mockOnPriorityChange}
        />
      );

      await userEvent.click(screen.getByText('Must Have Feature'));

      expect(mockOnItemClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'pbi-1', title: 'Must Have Feature' })
      );
    });
  });

  describe('Column Descriptions', () => {
    it('should display column descriptions', () => {
      render(
        <BoardView
          itemsByMoscow={mockItemsByMoscow}
          onItemClick={mockOnItemClick}
          onPriorityChange={mockOnPriorityChange}
        />
      );

      expect(screen.getByText('Critical for delivery - Non-negotiable')).toBeInTheDocument();
      expect(screen.getByText('Important but not vital - High priority')).toBeInTheDocument();
      expect(screen.getByText('Desirable if possible - Nice to have')).toBeInTheDocument();
      expect(screen.getByText('Not in this release - Out of scope')).toBeInTheDocument();
    });
  });

  describe('Virtual Scrolling', () => {
    it('should not use virtual scrolling when items are below threshold (50)', () => {
      const itemsByMoscowWithFewItems = {
        [MoSCoWPriority.MUST_HAVE]: Array(10)
          .fill(null)
          .map((_, i) =>
            createMockBacklogItem({
              id: `pbi-must-${i}`,
              title: `Must Have Item ${i}`,
              priority: MoSCoWPriority.MUST_HAVE,
            })
          ),
        [MoSCoWPriority.SHOULD_HAVE]: [],
        [MoSCoWPriority.COULD_HAVE]: [],
        [MoSCoWPriority.WONT_HAVE]: [],
      };

      render(
        <BoardView
          itemsByMoscow={itemsByMoscowWithFewItems}
          onItemClick={mockOnItemClick}
          onPriorityChange={mockOnPriorityChange}
        />
      );

      // All 10 items should be rendered (no virtualization)
      for (let i = 0; i < 10; i++) {
        expect(screen.getByText(`Must Have Item ${i}`)).toBeInTheDocument();
      }
    });

    it('should render all items when virtualization is not needed', () => {
      const manyItems = Array(60)
        .fill(null)
        .map((_, i) =>
          createMockBacklogItem({
            id: `pbi-must-${i}`,
            title: `Must Have Item ${i}`,
            priority: MoSCoWPriority.MUST_HAVE,
          })
        );

      const itemsByMoscowWithManyItems = {
        [MoSCoWPriority.MUST_HAVE]: manyItems,
        [MoSCoWPriority.SHOULD_HAVE]: [],
        [MoSCoWPriority.COULD_HAVE]: [],
        [MoSCoWPriority.WONT_HAVE]: [],
      };

      render(
        <BoardView
          itemsByMoscow={itemsByMoscowWithManyItems}
          onItemClick={mockOnItemClick}
          onPriorityChange={mockOnPriorityChange}
        />
      );

      // Column should show correct count
      expect(screen.getByText('60')).toBeInTheDocument();
    });

    it('should maintain drag and drop functionality without virtualization', () => {
      // Use fewer items to avoid virtualization
      const fewItems = Array(10)
        .fill(null)
        .map((_, i) =>
          createMockBacklogItem({
            id: `pbi-must-${i}`,
            title: `Must Have Item ${i}`,
            priority: MoSCoWPriority.MUST_HAVE,
          })
        );

      const itemsByMoscowWithFewItems = {
        [MoSCoWPriority.MUST_HAVE]: fewItems,
        [MoSCoWPriority.SHOULD_HAVE]: [],
        [MoSCoWPriority.COULD_HAVE]: [],
        [MoSCoWPriority.WONT_HAVE]: [],
      };

      render(
        <BoardView
          itemsByMoscow={itemsByMoscowWithFewItems}
          onItemClick={mockOnItemClick}
          onPriorityChange={mockOnPriorityChange}
        />
      );

      // Should still have draggable cards
      const cards = document.querySelectorAll('[draggable="true"]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should maintain ARIA labels for accessibility with virtual scrolling', () => {
      const manyItems = Array(60)
        .fill(null)
        .map((_, i) =>
          createMockBacklogItem({
            id: `pbi-must-${i}`,
            title: `Must Have Item ${i}`,
            priority: MoSCoWPriority.MUST_HAVE,
          })
        );

      const itemsByMoscowWithManyItems = {
        [MoSCoWPriority.MUST_HAVE]: manyItems,
        [MoSCoWPriority.SHOULD_HAVE]: [],
        [MoSCoWPriority.COULD_HAVE]: [],
        [MoSCoWPriority.WONT_HAVE]: [],
      };

      render(
        <BoardView
          itemsByMoscow={itemsByMoscowWithManyItems}
          onItemClick={mockOnItemClick}
          onPriorityChange={mockOnPriorityChange}
        />
      );

      // Should have aria-label indicating item count
      const column = screen.getByRole('list', { name: /Must Have column/i });
      expect(column).toBeInTheDocument();
      expect(column).toHaveAttribute('aria-label', expect.stringContaining('60'));
    });

    it('should handle mixed columns with and without virtualization', () => {
      const itemsByMoscowMixed = {
        [MoSCoWPriority.MUST_HAVE]: Array(60)
          .fill(null)
          .map((_, i) =>
            createMockBacklogItem({
              id: `pbi-must-${i}`,
              title: `Must Have Item ${i}`,
              priority: MoSCoWPriority.MUST_HAVE,
            })
          ),
        [MoSCoWPriority.SHOULD_HAVE]: Array(5)
          .fill(null)
          .map((_, i) =>
            createMockBacklogItem({
              id: `pbi-should-${i}`,
              title: `Should Have Item ${i}`,
              priority: MoSCoWPriority.SHOULD_HAVE,
            })
          ),
        [MoSCoWPriority.COULD_HAVE]: [],
        [MoSCoWPriority.WONT_HAVE]: [],
      };

      render(
        <BoardView
          itemsByMoscow={itemsByMoscowMixed}
          onItemClick={mockOnItemClick}
          onPriorityChange={mockOnPriorityChange}
        />
      );

      // Both columns should show correct counts
      expect(screen.getByText('60')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });
  });
});
