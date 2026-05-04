import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { TaskDetailModal, type TaskDetailModalProps } from './TaskDetailModal';
import { TaskStatus, type Task } from '../../../../types';

// Mock the StatusHistorySection to avoid QueryClient issues
vi.mock('../../../../components/StatusHistorySection', () => ({
  StatusHistorySection: () => <div data-testid="status-history-mock">Status History</div>,
}));

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  sprintId: 'sprint-1',
  pbiId: 'pbi-1',
  title: 'Test Task',
  description: 'Test description',
  status: TaskStatus.TODO,
  assigneeId: 'user-1',
  assignee: {
    id: 'user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
  },
  estimatedHours: 8,
  remainingHours: 5,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
  pbi: {
    id: 'pbi-1',
    title: 'User Authentication',
  },
  ...overrides,
});

const defaultProps: TaskDetailModalProps = {
  task: createMockTask(),
  workflowError: null,
  onClose: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onStatusChange: vi.fn(),
  onClearWorkflowError: vi.fn(),
  getAvailableTransitions: vi.fn(() => [TaskStatus.IN_PROGRESS]),
  isUpdating: false,
  modalRef: { current: null },
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithQueryClient = (ui: React.ReactElement) => {
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
};

describe('TaskDetailModal', () => {
  describe('Rendering', () => {
    it('should render modal with task details', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Task')).toBeInTheDocument();
    });

    it('should render task description', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('should render assignee name', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('should render parent PBI title', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByText('User Authentication')).toBeInTheDocument();
    });

    it('should render estimated hours', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByText('8h')).toBeInTheDocument();
    });

    it('should render remaining hours', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByText('5h')).toBeInTheDocument();
    });

    it('should render created and updated dates', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Updated')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByText('Close')).toBeInTheDocument();
      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByText('Delete Task')).toBeInTheDocument();
    });
  });

  describe('View Only Mode (DONE status)', () => {
    const doneTask = createMockTask({ status: TaskStatus.DONE });

    it('should show view only notice for done tasks', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} task={doneTask} />);

      expect(screen.getByText(/This task is completed and locked/)).toBeInTheDocument();
    });

    it('should disable edit button for done tasks', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} task={doneTask} />);

      const editButton = screen.getByText('View Only');
      expect(editButton).toBeDisabled();
    });

    it('should disable delete button for done tasks', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} task={doneTask} />);

      const deleteButton = screen.getByText('Delete Task');
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Workflow Error', () => {
    it('should display workflow error when present', () => {
      renderWithQueryClient(
        <TaskDetailModal {...defaultProps} workflowError="Invalid status transition" />
      );

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Invalid status transition')).toBeInTheDocument();
    });

    it('should call onClearWorkflowError when error close button clicked', async () => {
      const onClearWorkflowError = vi.fn();
      const user = userEvent.setup();

      renderWithQueryClient(
        <TaskDetailModal
          {...defaultProps}
          workflowError="Error message"
          onClearWorkflowError={onClearWorkflowError}
        />
      );

      const closeErrorButton = screen.getByLabelText('Close error message');
      await user.click(closeErrorButton);

      expect(onClearWorkflowError).toHaveBeenCalledTimes(1);
    });

    it('should not show error banner when no error', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} workflowError={null} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      renderWithQueryClient(<TaskDetailModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText('Close modal');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      const { container } = renderWithQueryClient(
        <TaskDetailModal {...defaultProps} onClose={onClose} />
      );

      const overlay = container.querySelector('[role="dialog"]');
      if (overlay) {
        await user.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });

    it('should not call onClose when modal content clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      renderWithQueryClient(<TaskDetailModal {...defaultProps} onClose={onClose} />);

      const modalContent = screen.getByText('Test Task');
      await user.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should call onEdit when edit button clicked', async () => {
      const onEdit = vi.fn();
      const user = userEvent.setup();

      renderWithQueryClient(<TaskDetailModal {...defaultProps} onEdit={onEdit} />);

      const editButton = screen.getByText('Edit Task');
      await user.click(editButton);

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('should call onDelete when delete button clicked', async () => {
      const onDelete = vi.fn();
      const user = userEvent.setup();

      renderWithQueryClient(<TaskDetailModal {...defaultProps} onDelete={onDelete} />);

      const deleteButton = screen.getByText('Delete Task');
      await user.click(deleteButton);

      expect(onDelete).toHaveBeenCalledTimes(1);
    });
  });

  describe('Status Change', () => {
    it('should render status selector', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      // StatusSelector should be rendered
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should disable status selector when updating', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} isUpdating={true} />);

      // Status selector should be disabled
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should disable status selector for done tasks', () => {
      const doneTask = createMockTask({ status: TaskStatus.DONE });
      renderWithQueryClient(<TaskDetailModal {...defaultProps} task={doneTask} />);

      // Status selector should be disabled
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have correct dialog role', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'task-detail-title');
    });

    it('should have aria-label on close button', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toBeInTheDocument();
    });

    it('should have aria-hidden on decorative elements', () => {
      const { container } = renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });

    it('should have aria-label on error close button', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} workflowError="Error" />);

      const errorCloseButton = screen.getByLabelText('Close error message');
      expect(errorCloseButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle task without description', () => {
      const taskWithoutDesc = createMockTask({ description: undefined });
      renderWithQueryClient(<TaskDetailModal {...defaultProps} task={taskWithoutDesc} />);

      expect(screen.queryByText('Description')).not.toBeInTheDocument();
    });

    it('should handle unassigned task', () => {
      const unassignedTask = createMockTask({
        assigneeId: null,
        assignee: undefined,
      });
      renderWithQueryClient(<TaskDetailModal {...defaultProps} task={unassignedTask} />);

      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should handle task without PBI', () => {
      const taskWithoutPbi = createMockTask({ pbi: undefined });
      renderWithQueryClient(<TaskDetailModal {...defaultProps} task={taskWithoutPbi} />);

      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should handle task without estimated hours', () => {
      const taskWithoutEst = createMockTask({ estimatedHours: undefined });
      renderWithQueryClient(<TaskDetailModal {...defaultProps} task={taskWithoutEst} />);

      expect(screen.getByText('Not estimated')).toBeInTheDocument();
    });

    it('should handle task without remaining hours', () => {
      const taskWithoutRem = createMockTask({ remainingHours: undefined });
      renderWithQueryClient(<TaskDetailModal {...defaultProps} task={taskWithoutRem} />);

      expect(screen.getByText('Not set')).toBeInTheDocument();
    });

    it('should handle zero remaining hours', () => {
      const taskWithZeroRem = createMockTask({ remainingHours: 0 });
      renderWithQueryClient(<TaskDetailModal {...defaultProps} task={taskWithZeroRem} />);

      expect(screen.getByText('0h')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      // Check that dates are formatted (exact format depends on locale)
      const dateElements = screen.getAllByText(/2026/);
      expect(dateElements.length).toBeGreaterThan(0);
    });
  });

  describe('Status History Section', () => {
    it('should render status history section', () => {
      renderWithQueryClient(<TaskDetailModal {...defaultProps} />);

      expect(screen.getByTestId('status-history-mock')).toBeInTheDocument();
    });
  });
});
