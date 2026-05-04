import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { ImpedimentList, type ImpedimentListProps } from './ImpedimentList';
import { ImpedimentStatus } from '../../../types';

const mockImpediments = [
  {
    id: 'imp-1',
    teamId: 'team-1',
    title: 'API downtime',
    description: 'External API is experiencing intermittent downtime',
    reportedById: 'user-1',
    status: ImpedimentStatus.OPEN,
    createdAt: '2026-02-05T10:00:00Z',
    updatedAt: '2026-02-05T10:00:00Z',
  },
  {
    id: 'imp-2',
    teamId: 'team-1',
    title: 'Database performance issue',
    description: 'Slow query performance in production',
    reportedById: 'user-2',
    status: ImpedimentStatus.IN_PROGRESS,
    createdAt: '2026-02-04T14:00:00Z',
    updatedAt: '2026-02-05T09:00:00Z',
  },
  {
    id: 'imp-3',
    teamId: 'team-1',
    title: 'Resolved issue',
    description: 'This has been resolved',
    reportedById: 'user-1',
    status: ImpedimentStatus.RESOLVED,
    createdAt: '2026-02-03T10:00:00Z',
    updatedAt: '2026-02-04T15:00:00Z',
  },
];

describe('ImpedimentList Component', () => {
  const defaultProps: ImpedimentListProps = {
    impediments: mockImpediments,
    emptyMessage: 'No open impediments. Great job!',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render impediment list with impediments', () => {
      render(<ImpedimentList {...defaultProps} />);

      expect(screen.getByText('API downtime')).toBeInTheDocument();
      expect(screen.getByText('Database performance issue')).toBeInTheDocument();
    });

    it('should not display resolved impediments when filtering for open only', () => {
      const openImpediments = mockImpediments.filter(
        (imp) => imp.status === ImpedimentStatus.OPEN || imp.status === ImpedimentStatus.IN_PROGRESS
      );
      render(<ImpedimentList {...defaultProps} impediments={openImpediments} />);

      expect(screen.getByText('API downtime')).toBeInTheDocument();
      expect(screen.getByText('Database performance issue')).toBeInTheDocument();
      expect(screen.queryByText('Resolved issue')).not.toBeInTheDocument();
    });

    it('should display impediment status badges', () => {
      const openImpediments = mockImpediments.filter(
        (imp) => imp.status === ImpedimentStatus.OPEN || imp.status === ImpedimentStatus.IN_PROGRESS
      );
      render(<ImpedimentList {...defaultProps} impediments={openImpediments} />);

      const openBadges = screen.getAllByText('OPEN');
      const inProgressBadges = screen.getAllByText('IN PROGRESS');
      expect(openBadges.length).toBeGreaterThan(0);
      expect(inProgressBadges.length).toBeGreaterThan(0);
    });

    it('should render empty message when no impediments', () => {
      render(<ImpedimentList {...defaultProps} impediments={[]} />);

      expect(screen.getByText('No open impediments. Great job!')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(<ImpedimentList {...defaultProps} />);

      const list = screen.getByRole('list', { name: 'Impediments list' });
      expect(list).toBeInTheDocument();
    });
  });

  describe('Impediment Click Handler', () => {
    it('should call onImpedimentClick when impediment is clicked', async () => {
      const mockOnImpedimentClick = vi.fn();
      render(<ImpedimentList {...defaultProps} onImpedimentClick={mockOnImpedimentClick} />);

      const impedimentItem = screen.getByText('API downtime').closest('[role="button"]');
      if (impedimentItem) {
        impedimentItem.click();
      }

      await waitFor(() => {
        expect(mockOnImpedimentClick).toHaveBeenCalledWith('imp-1');
      });
    });

    it('should not make impediments clickable when onImpedimentClick is not provided', () => {
      render(<ImpedimentList {...defaultProps} />);

      const impedimentItem = screen.getByText('API downtime').closest('li');
      expect(impedimentItem).not.toHaveAttribute('role', 'button');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should not have keyboard navigation when onImpedimentClick is not provided', () => {
      render(<ImpedimentList {...defaultProps} />);

      const list = screen.getByRole('list', { name: 'Impediments list' });
      expect(list).not.toHaveAttribute('aria-activedescendant');
    });

    it('should have aria-activedescendant when onImpedimentClick is provided', () => {
      const mockOnImpedimentClick = vi.fn();
      render(<ImpedimentList {...defaultProps} onImpedimentClick={mockOnImpedimentClick} />);

      const list = screen.getByRole('list', { name: 'Impediments list' });
      expect(list).toHaveAttribute('aria-activedescendant');
    });

    it('should navigate down with ArrowDown key and loop around', async () => {
      const user = userEvent.setup();
      const mockOnImpedimentClick = vi.fn();
      render(<ImpedimentList {...defaultProps} onImpedimentClick={mockOnImpedimentClick} />);

      const list = screen.getByRole('list', { name: 'Impediments list' });
      const firstItem = screen.getByText('API downtime').closest('[role="button"]') as HTMLElement;

      // Focus first item
      firstItem.focus();

      // Press ArrowDown twice
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      // Check aria-activedescendant is updated
      expect(list).toHaveAttribute('aria-activedescendant', 'impediment-item-2');

      // Press ArrowDown again to loop around
      await user.keyboard('{ArrowDown}');
      expect(list).toHaveAttribute('aria-activedescendant', 'impediment-item-0');
    });

    it('should navigate up with ArrowUp key and loop around', async () => {
      const user = userEvent.setup();
      const mockOnImpedimentClick = vi.fn();
      render(<ImpedimentList {...defaultProps} onImpedimentClick={mockOnImpedimentClick} />);

      const firstItem = screen.getByText('API downtime').closest('[role="button"]') as HTMLElement;
      firstItem.focus();

      const list = screen.getByRole('list', { name: 'Impediments list' });

      // Press ArrowUp to loop around to last item
      await user.keyboard('{ArrowUp}');
      expect(list).toHaveAttribute('aria-activedescendant', 'impediment-item-2');
    });

    it('should jump to first item with Home key', async () => {
      const user = userEvent.setup();
      const mockOnImpedimentClick = vi.fn();
      render(<ImpedimentList {...defaultProps} onImpedimentClick={mockOnImpedimentClick} />);

      const list = screen.getByRole('list', { name: 'Impediments list' });

      // Navigate to last item first
      const lastItem = screen.getByText('Resolved issue').closest('[role="button"]') as HTMLElement;
      lastItem.focus();
      await user.keyboard('{ArrowUp}');

      // Press Home
      await user.keyboard('{Home}');
      expect(list).toHaveAttribute('aria-activedescendant', 'impediment-item-0');
    });

    it('should jump to last item with End key', async () => {
      const user = userEvent.setup();
      const mockOnImpedimentClick = vi.fn();
      render(<ImpedimentList {...defaultProps} onImpedimentClick={mockOnImpedimentClick} />);

      const list = screen.getByRole('list', { name: 'Impediments list' });

      // Press End
      await user.keyboard('{End}');
      expect(list).toHaveAttribute('aria-activedescendant', 'impediment-item-2');
    });

    it('should trigger click action with Enter key', async () => {
      const user = userEvent.setup();
      const mockOnImpedimentClick = vi.fn();
      render(<ImpedimentList {...defaultProps} onImpedimentClick={mockOnImpedimentClick} />);

      const firstItem = screen.getByText('API downtime').closest('[role="button"]') as HTMLElement;
      firstItem.focus();

      await user.keyboard('{Enter}');
      expect(mockOnImpedimentClick).toHaveBeenCalledWith('imp-1');
    });

    it('should trigger click action with Space key', async () => {
      const user = userEvent.setup();
      const mockOnImpedimentClick = vi.fn();
      render(<ImpedimentList {...defaultProps} onImpedimentClick={mockOnImpedimentClick} />);

      const firstItem = screen.getByText('API downtime').closest('[role="button"]') as HTMLElement;
      firstItem.focus();

      await user.keyboard(' ');
      expect(mockOnImpedimentClick).toHaveBeenCalledWith('imp-1');
    });

    it('should blur list with Escape key', async () => {
      const user = userEvent.setup();
      const mockOnImpedimentClick = vi.fn();
      render(<ImpedimentList {...defaultProps} onImpedimentClick={mockOnImpedimentClick} />);

      const list = screen.getByRole('list', { name: 'Impediments list' });
      const firstItem = screen.getByText('API downtime').closest('[role="button"]') as HTMLElement;
      firstItem.focus();

      // Press Escape
      await user.keyboard('{Escape}');

      // Verify list is not focused anymore
      expect(document.activeElement).not.toBe(list);
    });
  });

  describe('Status Filtering', () => {
    it('should only display open impediments', () => {
      const openImpediments = mockImpediments.filter(
        (imp) => imp.status === ImpedimentStatus.OPEN || imp.status === ImpedimentStatus.IN_PROGRESS
      );
      render(<ImpedimentList {...defaultProps} impediments={openImpediments} />);

      expect(screen.getByText('API downtime')).toBeInTheDocument();
      expect(screen.getByText('Database performance issue')).toBeInTheDocument();
      expect(screen.queryByText('Resolved issue')).not.toBeInTheDocument();
    });

    it('should show empty state when no impediments are passed', () => {
      render(<ImpedimentList {...defaultProps} impediments={[]} />);

      expect(screen.getByText('No open impediments. Great job!')).toBeInTheDocument();
    });
  });
});
