import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { CompleteSprintModal, type CompleteSprintModalProps } from './CompleteSprintModal';
import { ImpedimentStatus, type Impediment } from '../../../../types';

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

  describe('Outstanding Impediments', () => {
    const mockImpediments: Impediment[] = [
      {
        id: 'imp-1',
        teamId: 'team-1',
        title: 'Database connection timeout',
        description: 'Database is slow',
        reportedById: 'user-1',
        status: ImpedimentStatus.OPEN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sprint: { id: 'sprint-1', name: 'Sprint 1' },
      },
      {
        id: 'imp-2',
        teamId: 'team-1',
        title: 'API rate limit reached',
        description: 'Third-party API rate limit',
        reportedById: 'user-2',
        status: ImpedimentStatus.IN_PROGRESS,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const impedimentsProps = {
      ...defaultProps,
      outstandingImpediments: mockImpediments,
      outstandingImpedimentsCount: 2,
    };

    it('should show outstanding impediments warning when impediments exist', () => {
      render(<CompleteSprintModal {...impedimentsProps} />);

      expect(screen.getByText(/Outstanding Impediments Detected/)).toBeInTheDocument();
      expect(screen.getByText(/2 outstanding impediments/)).toBeInTheDocument();
    });

    it('should render OPEN status badge for open impediments', () => {
      render(<CompleteSprintModal {...impedimentsProps} />);

      expect(screen.getByText('Open')).toBeInTheDocument();
      expect(screen.getByText('Database connection timeout')).toBeInTheDocument();
    });

    it('should render IN_PROGRESS status badge for in-progress impediments', () => {
      render(<CompleteSprintModal {...impedimentsProps} />);

      // Find all elements with "In Progress" text (one for task, one for impediment)
      const inProgressElements = screen.getAllByText('In Progress');
      expect(inProgressElements.length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('API rate limit reached')).toBeInTheDocument();
    });

    it('should show sprint name when impediment has sprint association', () => {
      render(<CompleteSprintModal {...impedimentsProps} />);

      // Find all "Sprint 1" elements (one in summary header, one in impediment)
      const sprintElements = screen.getAllByText('Sprint 1');
      expect(sprintElements.length).toBeGreaterThanOrEqual(1);
    });

    it('should show +N more impediments when count exceeds 5', () => {
      const manyImpediments: Impediment[] = Array.from({ length: 7 }, (_, i) => ({
        id: `imp-${i}`,
        teamId: 'team-1',
        title: `Impediment ${i}`,
        description: `Description ${i}`,
        reportedById: 'user-1',
        status: ImpedimentStatus.OPEN,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      render(
        <CompleteSprintModal
          {...defaultProps}
          outstandingImpediments={manyImpediments}
          outstandingImpedimentsCount={7}
        />
      );

      expect(screen.getByText('+2 more impediments')).toBeInTheDocument();
    });

    it('should call onViewImpediments when View Impediments button clicked', async () => {
      const onViewImpediments = vi.fn();
      const user = userEvent.setup();

      render(<CompleteSprintModal {...impedimentsProps} onViewImpediments={onViewImpediments} />);

      const viewButton = screen.getByText('View Impediments');
      await user.click(viewButton);

      expect(onViewImpediments).toHaveBeenCalledTimes(1);
    });

    it('should disable Complete Sprint button when impediments exist', () => {
      render(<CompleteSprintModal {...impedimentsProps} />);

      const completeButton = screen.getByRole('button', { name: /Complete Sprint/i });
      expect(completeButton).toBeDisabled();
      expect(screen.getByText(/Complete Sprint \(Disabled\)/)).toBeInTheDocument();
    });
  });

  describe('Duration Display', () => {
    it('should show days remaining when daysRemaining > 0', () => {
      render(<CompleteSprintModal {...defaultProps} daysRemaining={3} />);

      expect(screen.getByText('3 days remaining')).toBeInTheDocument();
    });

    it('should show timebox ended when daysRemaining is 0', () => {
      render(<CompleteSprintModal {...defaultProps} daysRemaining={0} />);

      expect(screen.getByText('Timebox ended')).toBeInTheDocument();
    });
  });

  describe('All Clear State', () => {
    const allClearProps = {
      ...defaultProps,
      incompleteTasks: [],
      incompleteTasksCount: 0,
      incompletePbisCount: 0,
      outstandingImpediments: [],
      outstandingImpedimentsCount: 0,
      sprintStats: {
        ...defaultProps.sprintStats,
        totalTasks: 10,
        doneTasks: 10,
        progressPercentage: 100,
      },
    };

    it('should show ready to complete message when all tasks done and no impediments', () => {
      render(<CompleteSprintModal {...allClearProps} />);

      expect(screen.getByText(/All tasks are complete/)).toBeInTheDocument();
    });

    it('should show Proceed to DoD Verification button when all clear', () => {
      render(<CompleteSprintModal {...allClearProps} />);

      const dodButton = screen.getByText('Proceed to DoD Verification');
      expect(dodButton).toBeInTheDocument();
      expect(dodButton).not.toBeDisabled();
    });

    it('should call onProceedToDodVerification when Proceed button clicked', async () => {
      const onProceedToDodVerification = vi.fn();
      const user = userEvent.setup();

      render(
        <CompleteSprintModal
          {...allClearProps}
          onProceedToDodVerification={onProceedToDodVerification}
        />
      );

      const dodButton = screen.getByText('Proceed to DoD Verification');
      await user.click(dodButton);

      expect(onProceedToDodVerification).toHaveBeenCalledTimes(1);
    });

    it('should show correct title attribute tooltip for all-clear button', () => {
      render(<CompleteSprintModal {...allClearProps} />);

      const dodButton = screen.getByText('Proceed to DoD Verification');
      expect(dodButton.closest('button')).toHaveAttribute(
        'title',
        'Proceed to Definition of Done verification'
      );
    });
  });

  describe('Impediments Only (No Incomplete Tasks)', () => {
    const impedimentsOnlyProps = {
      ...defaultProps,
      incompleteTasks: [],
      incompleteTasksCount: 0,
      incompletePbisCount: 0,
      outstandingImpediments: [
        {
          id: 'imp-1',
          teamId: 'team-1',
          title: 'Blocking issue',
          description: 'Description',
          reportedById: 'user-1',
          status: ImpedimentStatus.OPEN,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          sprint: { id: 'sprint-1', name: 'Sprint 1' },
        } as Impediment,
      ],
      outstandingImpedimentsCount: 1,
    };

    it('should show impediments warning but not incomplete tasks warning', () => {
      render(<CompleteSprintModal {...impedimentsOnlyProps} />);

      expect(screen.getByText(/Outstanding Impediments Detected/)).toBeInTheDocument();
      expect(screen.queryByText(/Incomplete Work Detected/)).not.toBeInTheDocument();
    });

    it('should show singular "impediment" when count is 1', () => {
      render(<CompleteSprintModal {...impedimentsOnlyProps} />);

      expect(screen.getByText(/1 outstanding impediment/)).toBeInTheDocument();
    });
  });
});
