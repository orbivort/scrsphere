import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { SprintBoardHeader } from './SprintBoardHeader';
import type { SprintBoardHeaderProps } from './SprintBoardHeader';
import type { Sprint } from '../../../types';

const mockSprint: Sprint = {
  id: 'sprint-1',
  teamId: 'team-1',
  name: 'Sprint 1',
  startDate: '2026-01-01T00:00:00Z',
  endDate: '2026-01-14T23:59:59Z',
  status: 'ACTIVE',
  sprintGoal: 'Complete user authentication feature',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('SprintBoardHeader', () => {
  const mockOnKeyboardHelp = vi.fn();
  const mockOnToggleBurndown = vi.fn();
  const mockOnOpenBacklogManager = vi.fn();
  const mockOnOpenCreateModal = vi.fn();
  const mockOnCompleteSprint = vi.fn();

  const defaultProps: SprintBoardHeaderProps = {
    sprint: mockSprint,
    daysRemaining: 7,
    onKeyboardHelp: mockOnKeyboardHelp,
    onToggleBurndown: mockOnToggleBurndown,
    onOpenBacklogManager: mockOnOpenBacklogManager,
    onOpenCreateModal: mockOnOpenCreateModal,
    onCompleteSprint: mockOnCompleteSprint,
    showBurndown: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render sprint name', () => {
      render(<SprintBoardHeader {...defaultProps} />);

      expect(screen.getByText('Sprint 1')).toBeInTheDocument();
    });

    it('should render sprint dates', () => {
      render(<SprintBoardHeader {...defaultProps} />);

      // Dates should be formatted (exact format depends on locale)
      expect(screen.getByText(/2026/)).toBeInTheDocument();
    });

    it('should render days remaining', () => {
      render(<SprintBoardHeader {...defaultProps} />);

      expect(screen.getByText(/7 days remaining/)).toBeInTheDocument();
    });

    it('should render all action buttons', () => {
      render(<SprintBoardHeader {...defaultProps} />);

      expect(screen.getByLabelText('Keyboard shortcuts help')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /burndown/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /manage sprint backlog/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add new task/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /complete sprint/i })).toBeInTheDocument();
    });
  });

  describe('Days Remaining Styling', () => {
    it('should show warning style when 2 or fewer days remaining', () => {
      render(<SprintBoardHeader {...defaultProps} daysRemaining={2} />);

      const daysElement = screen.getByText(/2 days remaining/);
      expect(daysElement.className).toContain('warning');
    });

    it('should show warning style when 1 day remaining', () => {
      render(<SprintBoardHeader {...defaultProps} daysRemaining={1} />);

      const daysElement = screen.getByText(/1 days remaining/);
      expect(daysElement.className).toContain('warning');
    });

    it('should not show warning style when more than 2 days remaining', () => {
      render(<SprintBoardHeader {...defaultProps} daysRemaining={3} />);

      const daysElement = screen.getByText(/3 days remaining/);
      expect(daysElement.className).not.toContain('warning');
    });

    it('should show warning style when 0 days remaining', () => {
      render(<SprintBoardHeader {...defaultProps} daysRemaining={0} />);

      const daysElement = screen.getByText(/0 days remaining/);
      expect(daysElement.className).toContain('warning');
    });
  });

  describe('Button Interactions', () => {
    it('should call onKeyboardHelp when clicking keyboard help button', async () => {
      render(<SprintBoardHeader {...defaultProps} />);

      await userEvent.click(screen.getByLabelText('Keyboard shortcuts help'));

      expect(mockOnKeyboardHelp).toHaveBeenCalledTimes(1);
    });

    it('should call onToggleBurndown when clicking burndown button', async () => {
      render(<SprintBoardHeader {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: /burndown/i }));

      expect(mockOnToggleBurndown).toHaveBeenCalledTimes(1);
    });

    it('should call onOpenBacklogManager when clicking manage backlog button', async () => {
      render(<SprintBoardHeader {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: /manage sprint backlog/i }));

      expect(mockOnOpenBacklogManager).toHaveBeenCalledTimes(1);
    });

    it('should call onOpenCreateModal when clicking add task button', async () => {
      render(<SprintBoardHeader {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: /add new task/i }));

      expect(mockOnOpenCreateModal).toHaveBeenCalledTimes(1);
    });

    it('should call onCompleteSprint when clicking complete sprint button', async () => {
      render(<SprintBoardHeader {...defaultProps} />);

      await userEvent.click(screen.getByRole('button', { name: /complete sprint/i }));

      expect(mockOnCompleteSprint).toHaveBeenCalledTimes(1);
    });
  });

  describe('Burndown Button State', () => {
    it('should indicate expanded state when burndown is shown', () => {
      render(<SprintBoardHeader {...defaultProps} showBurndown={true} />);

      const burndownButton = screen.getByRole('button', { name: /burndown/i });
      expect(burndownButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should indicate collapsed state when burndown is hidden', () => {
      render(<SprintBoardHeader {...defaultProps} showBurndown={false} />);

      const burndownButton = screen.getByRole('button', { name: /burndown/i });
      expect(burndownButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have aria-controls for burndown panel', () => {
      render(<SprintBoardHeader {...defaultProps} />);

      const burndownButton = screen.getByRole('button', { name: /burndown/i });
      expect(burndownButton).toHaveAttribute('aria-controls', 'burndown-panel');
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label for keyboard help button', () => {
      render(<SprintBoardHeader {...defaultProps} />);

      const button = screen.getByLabelText('Keyboard shortcuts help');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('title', 'Keyboard shortcuts (?)');
    });

    it('should have correct aria-label for manage backlog button', () => {
      render(<SprintBoardHeader {...defaultProps} />);

      const button = screen.getByRole('button', { name: /manage sprint backlog/i });
      expect(button).toHaveAttribute('aria-label', 'Manage sprint backlog');
    });

    it('should have correct aria-label for add task button', () => {
      render(<SprintBoardHeader {...defaultProps} />);

      const button = screen.getByRole('button', { name: /add new task/i });
      expect(button).toHaveAttribute('aria-label', 'Add new task');
    });

    it('should have correct aria-label for complete sprint button', () => {
      render(<SprintBoardHeader {...defaultProps} />);

      const button = screen.getByRole('button', { name: /complete sprint/i });
      expect(button).toHaveAttribute('aria-label', 'Complete sprint');
    });

    it('should have keyboard shortcut hint visible', () => {
      render(<SprintBoardHeader {...defaultProps} />);

      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle sprint with no sprint goal', () => {
      const sprintWithoutGoal = { ...mockSprint, sprintGoal: undefined };
      render(<SprintBoardHeader {...defaultProps} sprint={sprintWithoutGoal} />);

      expect(screen.getByText('Sprint 1')).toBeInTheDocument();
    });

    it('should handle sprint with different date formats', () => {
      const sprintWithDifferentDates: Sprint = {
        ...mockSprint,
        startDate: '2026-12-25T00:00:00Z',
        endDate: '2027-01-08T23:59:59Z',
      };
      render(<SprintBoardHeader {...defaultProps} sprint={sprintWithDifferentDates} />);

      // Check that dates are rendered (format depends on locale)
      expect(screen.getByText(/2026/)).toBeInTheDocument();
      expect(screen.getByText(/2027/)).toBeInTheDocument();
    });

    it('should handle very long sprint name', () => {
      const sprintWithLongName: Sprint = {
        ...mockSprint,
        name: 'Sprint 1 - This is a very long sprint name that might cause layout issues',
      };
      render(<SprintBoardHeader {...defaultProps} sprint={sprintWithLongName} />);

      expect(screen.getByText(sprintWithLongName.name)).toBeInTheDocument();
    });

    it('should handle negative days remaining (overdue sprint)', () => {
      // Component should handle negative days gracefully
      render(<SprintBoardHeader {...defaultProps} daysRemaining={-5} />);

      // The component displays whatever is passed, styling logic may vary
      expect(screen.getByText(/days remaining/)).toBeInTheDocument();
    });
  });
});
