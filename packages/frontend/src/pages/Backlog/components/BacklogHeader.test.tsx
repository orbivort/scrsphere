import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { BacklogHeader } from './BacklogHeader';

describe('BacklogHeader', () => {
  const mockOnViewModeChange = vi.fn();
  const mockOnNewItem = vi.fn();
  const mockOnBulkImport = vi.fn();

  const defaultProps = {
    itemCount: 5,
    viewMode: 'board' as const,
    onViewModeChange: mockOnViewModeChange,
    onNewItem: mockOnNewItem,
    onBulkImport: mockOnBulkImport,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render page title', () => {
      render(<BacklogHeader {...defaultProps} />);

      expect(screen.getByText('Product Backlog')).toBeInTheDocument();
    });

    it('should render item count', () => {
      render(<BacklogHeader {...defaultProps} />);

      expect(screen.getByText('5 items')).toBeInTheDocument();
    });

    it('should render singular item count', () => {
      render(<BacklogHeader {...defaultProps} itemCount={1} />);

      expect(screen.getByText('1 items')).toBeInTheDocument();
    });

    it('should render page subtitle', () => {
      render(<BacklogHeader {...defaultProps} />);

      expect(
        screen.getByText('Manage and prioritize work items for the active product goal')
      ).toBeInTheDocument();
    });

    it('should render view toggle buttons', () => {
      render(<BacklogHeader {...defaultProps} />);

      expect(screen.getByRole('button', { name: /board/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /list/i })).toBeInTheDocument();
    });

    it('should render New Item button', () => {
      render(<BacklogHeader {...defaultProps} />);

      expect(screen.getByRole('button', { name: /new item/i })).toBeInTheDocument();
    });

    it('should render Bulk Import button', () => {
      render(<BacklogHeader {...defaultProps} />);

      expect(screen.getByRole('button', { name: /bulk import/i })).toBeInTheDocument();
    });
  });

  describe('View Mode Toggle', () => {
    it('should highlight board button when in board mode', () => {
      render(<BacklogHeader {...defaultProps} viewMode="board" />);

      const boardButton = screen.getByRole('button', { name: /board/i });
      expect(boardButton.className).toMatch(/active/);
    });

    it('should highlight list button when in list mode', () => {
      render(<BacklogHeader {...defaultProps} viewMode="list" />);

      const listButton = screen.getByRole('button', { name: /list/i });
      expect(listButton.className).toMatch(/active/);
    });

    it('should call onViewModeChange when clicking board button', async () => {
      render(<BacklogHeader {...defaultProps} viewMode="list" />);

      await userEvent.click(screen.getByRole('button', { name: /board/i }));

      expect(mockOnViewModeChange).toHaveBeenCalledWith('board');
    });

    it('should call onViewModeChange when clicking list button', async () => {
      render(<BacklogHeader {...defaultProps} viewMode="board" />);

      await userEvent.click(screen.getByRole('button', { name: /list/i }));

      expect(mockOnViewModeChange).toHaveBeenCalledWith('list');
    });
  });

  describe('Action Buttons', () => {
    it('should call onNewItem when clicking New Item button', async () => {
      render(<BacklogHeader {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: /new item/i }));

      expect(mockOnNewItem).toHaveBeenCalled();
    });

    it('should call onBulkImport when clicking Bulk Import button', async () => {
      render(<BacklogHeader {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: /bulk import/i }));

      expect(mockOnBulkImport).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have title attribute on view toggle buttons', () => {
      render(<BacklogHeader {...defaultProps} />);

      expect(screen.getByRole('button', { name: /board/i })).toHaveAttribute('title');
      expect(screen.getByRole('button', { name: /list/i })).toHaveAttribute('title');
    });

    it('should have title attribute on action buttons', () => {
      render(<BacklogHeader {...defaultProps} />);

      expect(screen.getByRole('button', { name: /bulk import/i })).toHaveAttribute('title');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero item count', () => {
      render(<BacklogHeader {...defaultProps} itemCount={0} />);

      expect(screen.getByText('0 items')).toBeInTheDocument();
    });

    it('should handle large item count', () => {
      render(<BacklogHeader {...defaultProps} itemCount={1000} />);

      expect(screen.getByText('1000 items')).toBeInTheDocument();
    });
  });
});
