import { renderWithProviders, screen, initTestI18n, i18nT } from '../../../test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

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

  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render sprint name', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      expect(screen.getByText('Sprint 1')).toBeInTheDocument();
    });

    it('should render sprint dates', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      // Dates should be formatted (exact format depends on locale)
      expect(screen.getByText(/2026/)).toBeInTheDocument();
    });

    it('should render days remaining', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      expect(
        screen.getByText(new RegExp(i18nT('sprint:daysRemaining', { count: 7 })))
      ).toBeInTheDocument();
    });

    it('should render all action buttons', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      expect(
        screen.getByLabelText(i18nT('sprint:boardHeader.keyboardShortcuts'))
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: i18nT('sprint:boardHeader.burndown') })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: i18nT('sprint:boardHeader.manageBacklog') })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: i18nT('sprint:boardHeader.addTask') })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: i18nT('sprint:boardHeader.completeSprint') })
      ).toBeInTheDocument();
    });
  });

  describe('Days Remaining Styling', () => {
    it('should show warning style when 2 or fewer days remaining', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} daysRemaining={2} />);

      const daysElement = screen.getByText(new RegExp(i18nT('sprint:daysRemaining', { count: 2 })));
      expect(daysElement.className).toContain('warning');
    });

    it('should show warning style when 1 day remaining', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} daysRemaining={1} />);

      const daysElement = screen.getByText(new RegExp(i18nT('sprint:daysRemaining', { count: 1 })));
      expect(daysElement.className).toContain('warning');
    });

    it('should not show warning style when more than 2 days remaining', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} daysRemaining={3} />);

      const daysElement = screen.getByText(new RegExp(i18nT('sprint:daysRemaining', { count: 3 })));
      expect(daysElement.className).not.toContain('warning');
    });

    it('should show warning style when 0 days remaining', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} daysRemaining={0} />);

      const daysElement = screen.getByText(new RegExp(i18nT('sprint:daysRemaining', { count: 0 })));
      expect(daysElement.className).toContain('warning');
    });
  });

  describe('Button Interactions', () => {
    it('should call onKeyboardHelp when clicking keyboard help button', async () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      await userEvent.click(screen.getByLabelText(i18nT('sprint:boardHeader.keyboardShortcuts')));

      expect(mockOnKeyboardHelp).toHaveBeenCalledTimes(1);
    });

    it('should call onToggleBurndown when clicking burndown button', async () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      await userEvent.click(
        screen.getByRole('button', { name: i18nT('sprint:boardHeader.burndown') })
      );

      expect(mockOnToggleBurndown).toHaveBeenCalledTimes(1);
    });

    it('should call onOpenBacklogManager when clicking manage backlog button', async () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      await userEvent.click(
        screen.getByRole('button', { name: i18nT('sprint:boardHeader.manageBacklog') })
      );

      expect(mockOnOpenBacklogManager).toHaveBeenCalledTimes(1);
    });

    it('should call onOpenCreateModal when clicking add task button', async () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      await userEvent.click(
        screen.getByRole('button', { name: i18nT('sprint:boardHeader.addTask') })
      );

      expect(mockOnOpenCreateModal).toHaveBeenCalledTimes(1);
    });

    it('should call onCompleteSprint when clicking complete sprint button', async () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      await userEvent.click(
        screen.getByRole('button', { name: i18nT('sprint:boardHeader.completeSprint') })
      );

      expect(mockOnCompleteSprint).toHaveBeenCalledTimes(1);
    });
  });

  describe('Burndown Button State', () => {
    it('should indicate expanded state when burndown is shown', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} showBurndown={true} />);

      const burndownButton = screen.getByRole('button', {
        name: i18nT('sprint:boardHeader.burndown'),
      });
      expect(burndownButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('should indicate collapsed state when burndown is hidden', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} showBurndown={false} />);

      const burndownButton = screen.getByRole('button', {
        name: i18nT('sprint:boardHeader.burndown'),
      });
      expect(burndownButton).toHaveAttribute('aria-expanded', 'false');
    });

    it('should have aria-controls for burndown panel', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      const burndownButton = screen.getByRole('button', {
        name: i18nT('sprint:boardHeader.burndown'),
      });
      expect(burndownButton).toHaveAttribute('aria-controls', 'burndown-panel');
    });
  });

  describe('Accessibility', () => {
    it('should have correct aria-label for keyboard help button', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      const button = screen.getByLabelText(i18nT('sprint:boardHeader.keyboardShortcuts'));
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute(
        'title',
        `${i18nT('sprint:boardHeader.keyboardShortcuts')} (?)`
      );
    });

    it('should have correct aria-label for manage backlog button', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      const button = screen.getByRole('button', {
        name: i18nT('sprint:boardHeader.manageBacklog'),
      });
      expect(button).toHaveAttribute('aria-label', i18nT('sprint:boardHeader.manageBacklog'));
    });

    it('should have correct aria-label for add task button', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      const button = screen.getByRole('button', { name: i18nT('sprint:boardHeader.addTask') });
      expect(button).toHaveAttribute('aria-label', i18nT('sprint:boardHeader.addTask'));
    });

    it('should have correct aria-label for complete sprint button', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      const button = screen.getByRole('button', {
        name: i18nT('sprint:boardHeader.completeSprint'),
      });
      expect(button).toHaveAttribute('aria-label', i18nT('sprint:boardHeader.completeSprint'));
    });

    it('should have keyboard shortcut hint visible', () => {
      renderWithProviders(<SprintBoardHeader {...defaultProps} />);

      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle sprint with no sprint goal', () => {
      const sprintWithoutGoal = { ...mockSprint, sprintGoal: undefined };
      renderWithProviders(<SprintBoardHeader {...defaultProps} sprint={sprintWithoutGoal} />);

      expect(screen.getByText('Sprint 1')).toBeInTheDocument();
    });

    it('should handle sprint with different date formats', () => {
      const sprintWithDifferentDates: Sprint = {
        ...mockSprint,
        startDate: '2026-12-25T00:00:00Z',
        endDate: '2027-01-08T23:59:59Z',
      };
      renderWithProviders(
        <SprintBoardHeader {...defaultProps} sprint={sprintWithDifferentDates} />
      );

      // Check that dates are rendered (format depends on locale)
      expect(screen.getByText(/2026/)).toBeInTheDocument();
      expect(screen.getByText(/2027/)).toBeInTheDocument();
    });

    it('should handle very long sprint name', () => {
      const sprintWithLongName: Sprint = {
        ...mockSprint,
        name: 'Sprint 1 - This is a very long sprint name that might cause layout issues',
      };
      renderWithProviders(<SprintBoardHeader {...defaultProps} sprint={sprintWithLongName} />);

      expect(screen.getByText(sprintWithLongName.name)).toBeInTheDocument();
    });

    it('should handle negative days remaining (overdue sprint)', () => {
      // Component should handle negative days gracefully
      renderWithProviders(<SprintBoardHeader {...defaultProps} daysRemaining={-5} />);

      // The component displays whatever is passed, styling logic may vary
      expect(
        screen.getByText(new RegExp(i18nT('sprint:daysRemaining', { count: -5 })))
      ).toBeInTheDocument();
    });
  });
});
