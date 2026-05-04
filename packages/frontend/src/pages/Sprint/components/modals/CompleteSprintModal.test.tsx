import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { CompleteSprintModal, type CompleteSprintModalProps } from './CompleteSprintModal';

describe('CompleteSprintModal', () => {
  const defaultProps: CompleteSprintModalProps = {
    sprintName: 'Sprint 1',
    daysRemaining: 5,
    sprintStats: {
      totalTasks: 10,
      doneTasks: 7,
      completedStoryPoints: 24,
      totalStoryPoints: 40,
      progressPercentage: 60,
    },
    incompleteTasks: [
      { id: 'task-1', title: 'Incomplete Task 1', status: 'IN_PROGRESS', pbiTitle: 'PBI 1' },
      { id: 'task-2', title: 'Incomplete Task 2', status: 'TODO', pbiTitle: 'PBI 2' },
    ],
    incompleteTasksCount: 2,
    incompletePbisCount: 2,
    outstandingImpediments: [],
    outstandingImpedimentsCount: 0,
    completeSprintError: null,
    onClose: vi.fn(),
    onProceedToDodVerification: vi.fn(),
    onManageBacklog: vi.fn(),
    onViewImpediments: vi.fn(),
    isCompleting: false,
    modalRef: { current: null },
  };

  describe('Rendering', () => {
    it('should render modal with sprint name', () => {
      render(<CompleteSprintModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Complete Sprint')).toBeInTheDocument();
      expect(screen.getByText(/Sprint 1/)).toBeInTheDocument();
    });

    it('should render sprint stats', () => {
      render(<CompleteSprintModal {...defaultProps} />);

      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('should render incomplete tasks warning', () => {
      render(<CompleteSprintModal {...defaultProps} />);

      expect(screen.getByText(/Incomplete Work Detected/)).toBeInTheDocument();
      expect(screen.getByText(/2 incomplete tasks/)).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<CompleteSprintModal {...defaultProps} />);

      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
  });

  describe('All Tasks Completed', () => {
    const allCompletedProps = {
      ...defaultProps,
      incompleteTasks: [],
      incompleteTasksCount: 0,
      incompletePbisCount: 0,
      sprintStats: {
        ...defaultProps.sprintStats,
        totalTasks: 10,
        doneTasks: 10,
        progressPercentage: 100,
      },
    };

    it('should show success message when all tasks completed', () => {
      render(<CompleteSprintModal {...allCompletedProps} />);

      expect(screen.getByText(/All tasks are complete/)).toBeInTheDocument();
    });

    it('should not show incomplete tasks warning when all done', () => {
      render(<CompleteSprintModal {...allCompletedProps} />);

      expect(screen.queryByText(/Incomplete Work/)).not.toBeInTheDocument();
    });
  });

  describe('No Tasks', () => {
    it('should handle empty tasks array', () => {
      render(
        <CompleteSprintModal
          {...defaultProps}
          sprintStats={{ ...defaultProps.sprintStats, totalTasks: 0, doneTasks: 0 }}
          incompleteTasks={[]}
          incompleteTasksCount={0}
        />
      );

      // Both total and completed tasks show 0
      const zeroElements = screen.getAllByText('0');
      expect(zeroElements.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Error State', () => {
    it('should display error message when present', () => {
      render(
        <CompleteSprintModal {...defaultProps} completeSprintError="Failed to complete sprint" />
      );

      // Look for the error message specifically
      expect(screen.getByText('Failed to complete sprint')).toBeInTheDocument();
    });

    it('should not show error message text when error is null', () => {
      render(<CompleteSprintModal {...defaultProps} completeSprintError={null} />);

      // The specific error message should not be present
      expect(screen.queryByText('Failed to complete sprint')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClose when cancel button clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      render(<CompleteSprintModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onManageBacklog when manage backlog button clicked', async () => {
      const onManageBacklog = vi.fn();
      const user = userEvent.setup();

      render(<CompleteSprintModal {...defaultProps} onManageBacklog={onManageBacklog} />);

      const manageButton = screen.getByText('Manage Backlog');
      await user.click(manageButton);

      expect(onManageBacklog).toHaveBeenCalledTimes(1);
    });
  });

  describe('Loading State', () => {
    it('should show loading state when completing', () => {
      render(<CompleteSprintModal {...defaultProps} isCompleting={true} />);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should disable buttons when completing', () => {
      render(<CompleteSprintModal {...defaultProps} isCompleting={true} />);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct dialog role', () => {
      render(<CompleteSprintModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(<CompleteSprintModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'complete-sprint-title');
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = render(<CompleteSprintModal {...defaultProps} />);

      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });
  });
});
