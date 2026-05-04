/**
 * MoscowCard Component Tests
 *
 * Unit tests for the MoscowCard component using React Testing Library.
 * Includes tests for keyboard drag-and-drop accessibility.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { ItemStatus, MoSCoWPriority } from '../../../../types';
import { MoscowCard } from './MoscowCard';
import styles from './MoscowCard.module.css';
import { AnnouncerProvider } from '../../../../components/LiveAnnouncer';

/**
 * Mock product backlog item for testing
 */
const mockItem = {
  id: 'item-12345',
  title: 'Test Backlog Item',
  description: 'Test description',
  status: ItemStatus.NEW,
  priority: MoSCoWPriority.MUST_HAVE,
  storyPoints: 5,
  businessValue: 8,
  labels: ['frontend', 'bug'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  teamId: 'team-1',
  goalId: 'goal-1',
};

/**
 * Mock items count by priority for announcements
 */
const mockItemsCountByPriority: Record<MoSCoWPriority, number> = {
  [MoSCoWPriority.MUST_HAVE]: 3,
  [MoSCoWPriority.SHOULD_HAVE]: 2,
  [MoSCoWPriority.COULD_HAVE]: 1,
  [MoSCoWPriority.WONT_HAVE]: 0,
};

/**
 * Helper to render component with AnnouncerProvider
 */
const renderWithAnnouncer = (ui: React.ReactElement) => {
  return render(<AnnouncerProvider>{ui}</AnnouncerProvider>);
};

describe('MoscowCard', () => {
  const mockOnDragStart = vi.fn();
  const mockOnDragEnd = vi.fn();
  const mockOnClick = vi.fn();
  const mockOnMovePriority = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render the card with item details', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      expect(screen.getByText('#2345')).toBeInTheDocument();
      expect(screen.getByText('Test Backlog Item')).toBeInTheDocument();
      expect(screen.getByText('5 pts')).toBeInTheDocument();
    });

    it('should display status badge', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      expect(screen.getByText('New')).toBeInTheDocument();
    });

    it('should display value and effort indicators', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      expect(screen.getByTitle('Business Value')).toHaveTextContent('V8');
      expect(screen.getByTitle('Effort (Story Points)')).toHaveTextContent('E5');
    });

    it('should display labels', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      expect(screen.getByText('frontend')).toBeInTheDocument();
      expect(screen.getByText('bug')).toBeInTheDocument();
    });

    it('should show overflow indicator for more than 2 labels', () => {
      const itemWithManyLabels = {
        ...mockItem,
        labels: ['label1', 'label2', 'label3', 'label4'],
      };

      renderWithAnnouncer(
        <MoscowCard
          item={itemWithManyLabels}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      expect(screen.getByText('+2')).toBeInTheDocument();
    });

    it('should not display story points when undefined', () => {
      const itemWithoutPoints = {
        ...mockItem,
        storyPoints: undefined,
      };

      renderWithAnnouncer(
        <MoscowCard
          item={itemWithoutPoints}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      expect(screen.queryByText('pts')).not.toBeInTheDocument();
    });

    it('should not display labels when empty', () => {
      const itemWithoutLabels = {
        ...mockItem,
        labels: [],
      };

      renderWithAnnouncer(
        <MoscowCard
          item={itemWithoutLabels}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      expect(screen.queryByText('frontend')).not.toBeInTheDocument();
    });
  });

  describe('Mouse Drag and Drop', () => {
    it('should handle click events', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      fireEvent.click(screen.getByRole('listitem'));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('should handle drag start event', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      const card = screen.getByRole('listitem');
      fireEvent.dragStart(card);
      expect(mockOnDragStart).toHaveBeenCalledTimes(1);
    });

    it('should handle drag end event', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      const card = screen.getByRole('listitem');
      fireEvent.dragEnd(card);
      expect(mockOnDragEnd).toHaveBeenCalledTimes(1);
    });

    it('should apply dragging class when isDragging is true', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={true}
        />
      );

      const card = screen.getByRole('listitem');
      expect(card).toHaveClass(styles.dragging);
    });
  });

  describe('ARIA Attributes', () => {
    it('should have correct role attribute', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      expect(screen.getByRole('listitem')).toBeInTheDocument();
    });

    it('should have accessible label with priority information', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      const card = screen.getByRole('listitem');
      expect(card).toHaveAttribute(
        'aria-label',
        'Backlog item: Test Backlog Item. Priority: Must Have'
      );
    });

    it('should have aria-grabbed attribute', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      const card = screen.getByRole('listitem');
      expect(card).toHaveAttribute('aria-grabbed', 'false');
    });

    it('should have aria-roledescription attribute', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      const card = screen.getByRole('listitem');
      expect(card).toHaveAttribute('aria-roledescription', 'draggable backlog item');
    });

    it('should have tabIndex for keyboard accessibility', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      const card = screen.getByRole('listitem');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('should have data-priority attribute', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      const card = screen.getByRole('listitem');
      expect(card).toHaveAttribute('data-priority', MoSCoWPriority.MUST_HAVE);
    });
  });

  describe('Keyboard Drag and Drop', () => {
    it('should grab card on Space key press', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
          onMovePriority={mockOnMovePriority}
          itemsCountByPriority={mockItemsCountByPriority}
        />
      );

      const card = screen.getByRole('listitem');
      fireEvent.keyDown(card, { key: ' ' });

      expect(card).toHaveClass(styles.grabbed);
      expect(card).toHaveAttribute('aria-grabbed', 'true');
    });

    it('should grab card on Enter key press', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
          onMovePriority={mockOnMovePriority}
          itemsCountByPriority={mockItemsCountByPriority}
        />
      );

      const card = screen.getByRole('listitem');
      fireEvent.keyDown(card, { key: 'Enter' });

      expect(card).toHaveClass(styles.grabbed);
      expect(card).toHaveAttribute('aria-grabbed', 'true');
    });

    it('should not grab card when onMovePriority is not provided', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      const card = screen.getByRole('listitem');
      fireEvent.keyDown(card, { key: ' ' });

      expect(card).not.toHaveClass(styles.grabbed);
    });

    it('should show grab indicator when grabbed', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
          onMovePriority={mockOnMovePriority}
          itemsCountByPriority={mockItemsCountByPriority}
        />
      );

      const card = screen.getByRole('listitem');
      fireEvent.keyDown(card, { key: ' ' });

      expect(screen.getByText('Use Arrow keys to change priority')).toBeInTheDocument();
    });

    it('should change target priority on ArrowRight key', async () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
          onMovePriority={mockOnMovePriority}
          itemsCountByPriority={mockItemsCountByPriority}
        />
      );

      const card = screen.getByRole('listitem');

      // Grab the card
      fireEvent.keyDown(card, { key: ' ' });

      // Move right to Should Have
      fireEvent.keyDown(card, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText('Moving to Should Have')).toBeInTheDocument();
      });
    });

    it('should change target priority on ArrowLeft key', async () => {
      const itemInShouldHave = { ...mockItem, priority: MoSCoWPriority.SHOULD_HAVE };

      renderWithAnnouncer(
        <MoscowCard
          item={itemInShouldHave}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
          onMovePriority={mockOnMovePriority}
          itemsCountByPriority={mockItemsCountByPriority}
        />
      );

      const card = screen.getByRole('listitem');

      // Grab the card
      fireEvent.keyDown(card, { key: ' ' });

      // Move left to Must Have
      fireEvent.keyDown(card, { key: 'ArrowLeft' });

      await waitFor(() => {
        expect(screen.getByText('Moving to Must Have')).toBeInTheDocument();
      });
    });

    it('should not move past first priority on ArrowLeft', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
          onMovePriority={mockOnMovePriority}
          itemsCountByPriority={mockItemsCountByPriority}
        />
      );

      const card = screen.getByRole('listitem');

      // Grab the card (already at MUST_HAVE)
      fireEvent.keyDown(card, { key: ' ' });

      // Try to move left (should stay at MUST_HAVE)
      fireEvent.keyDown(card, { key: 'ArrowLeft' });

      expect(screen.getByText('Use Arrow keys to change priority')).toBeInTheDocument();
    });

    it('should not move past last priority on ArrowRight', () => {
      const itemInWontHave = { ...mockItem, priority: MoSCoWPriority.WONT_HAVE };

      renderWithAnnouncer(
        <MoscowCard
          item={itemInWontHave}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
          onMovePriority={mockOnMovePriority}
          itemsCountByPriority={mockItemsCountByPriority}
        />
      );

      const card = screen.getByRole('listitem');

      // Grab the card (already at WONT_HAVE)
      fireEvent.keyDown(card, { key: ' ' });

      // Try to move right (should stay at WONT_HAVE)
      fireEvent.keyDown(card, { key: 'ArrowRight' });

      expect(screen.getByText('Use Arrow keys to change priority')).toBeInTheDocument();
    });

    it('should drop card and call onMovePriority on Enter', async () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
          onMovePriority={mockOnMovePriority}
          itemsCountByPriority={mockItemsCountByPriority}
        />
      );

      const card = screen.getByRole('listitem');

      // Grab the card
      fireEvent.keyDown(card, { key: ' ' });

      // Move right to Should Have
      fireEvent.keyDown(card, { key: 'ArrowRight' });

      // Drop the card
      fireEvent.keyDown(card, { key: 'Enter' });

      await waitFor(() => {
        expect(mockOnMovePriority).toHaveBeenCalledWith('item-12345', MoSCoWPriority.SHOULD_HAVE);
      });
    });

    it('should cancel drag on Escape key', async () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
          onMovePriority={mockOnMovePriority}
          itemsCountByPriority={mockItemsCountByPriority}
        />
      );

      const card = screen.getByRole('listitem');

      // Grab the card
      fireEvent.keyDown(card, { key: ' ' });
      expect(card).toHaveClass(styles.grabbed);

      // Cancel the drag
      fireEvent.keyDown(card, { key: 'Escape' });

      await waitFor(() => {
        expect(card).not.toHaveClass(styles.grabbed);
        expect(card).toHaveAttribute('aria-grabbed', 'false');
      });

      // Should not have called onMovePriority
      expect(mockOnMovePriority).not.toHaveBeenCalled();
    });

    it('should not call onMovePriority when dropping on same priority', async () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
          onMovePriority={mockOnMovePriority}
          itemsCountByPriority={mockItemsCountByPriority}
        />
      );

      const card = screen.getByRole('listitem');

      // Grab the card
      fireEvent.keyDown(card, { key: ' ' });

      // Drop without moving (same priority)
      fireEvent.keyDown(card, { key: 'Enter' });

      await waitFor(() => {
        expect(card).not.toHaveClass(styles.grabbed);
      });

      // Should not have called onMovePriority
      expect(mockOnMovePriority).not.toHaveBeenCalled();
    });

    it('should update aria-label when dragging', async () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
          onMovePriority={mockOnMovePriority}
          itemsCountByPriority={mockItemsCountByPriority}
        />
      );

      const card = screen.getByRole('listitem');

      // Grab the card
      fireEvent.keyDown(card, { key: ' ' });

      await waitFor(() => {
        expect(card).toHaveAttribute(
          'aria-label',
          'Dragging Test Backlog Item. Current: Must Have. Target: Must Have'
        );
      });
    });

    it('should have moving-to-target class when target differs from current', async () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
          onMovePriority={mockOnMovePriority}
          itemsCountByPriority={mockItemsCountByPriority}
        />
      );

      const card = screen.getByRole('listitem');

      // Grab the card
      fireEvent.keyDown(card, { key: ' ' });

      // Move right
      fireEvent.keyDown(card, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(card).toHaveClass(styles['moving-to-target']);
      });
    });
  });

  describe('Focus Management', () => {
    it('should be focusable', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      const card = screen.getByRole('listitem');
      card.focus();
      expect(card).toHaveFocus();
    });

    it('should have focus styles', () => {
      renderWithAnnouncer(
        <MoscowCard
          item={mockItem}
          onDragStart={mockOnDragStart}
          onDragEnd={mockOnDragEnd}
          onClick={mockOnClick}
          isDragging={false}
        />
      );

      const card = screen.getByRole('listitem');
      card.focus();
      expect(card).toHaveFocus();
    });
  });
});
