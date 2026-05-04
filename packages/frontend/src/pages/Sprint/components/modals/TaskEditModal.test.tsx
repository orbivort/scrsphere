import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { TaskEditModal, type TaskEditModalProps } from './TaskEditModal';
import {
  TaskStatus,
  type Task,
  type ProductBacklogItem,
  type TeamMember,
  type User,
} from '../../../../types';
import { hasUnsavedChangesForEdit } from '../../utils/formChangeDetection';

vi.mock('../../utils/formChangeDetection', () => ({
  hasUnsavedChangesForEdit: vi.fn(() => false),
}));

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  sprintId: 'sprint-1',
  pbiId: 'pbi-1',
  title: 'Test Task',
  description: 'Test description',
  status: TaskStatus.TODO,
  assigneeId: 'user-1',
  estimatedHours: 8,
  remainingHours: 5,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
  ...overrides,
});

const createMockPBI = (overrides: Partial<ProductBacklogItem> = {}): ProductBacklogItem => ({
  id: 'pbi-1',
  teamId: 'team-1',
  title: 'User Authentication',
  description: 'Implement user login and logout',
  priority: 'MUST_HAVE' as const,
  storyPoints: 5,
  status: 'READY' as const,
  labels: [],
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  ...overrides,
});

const createMockTeamMember = (
  overrides: Partial<TeamMember & { user?: User }> = {}
): TeamMember & { user?: User } => ({
  id: 'tm-1',
  teamId: 'team-1',
  userId: 'user-1',
  role: 'developer' as const,
  joinedAt: '2026-01-01T00:00:00Z',
  user: {
    id: 'user-1',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  ...overrides,
});

const defaultFormData = {
  title: 'Test Task',
  description: 'Test description',
  pbiId: 'pbi-1',
  assigneeId: 'user-1',
  status: TaskStatus.TODO,
  estimatedHours: 8,
  remainingHours: 5,
};

const defaultProps: TaskEditModalProps = {
  task: createMockTask(),
  formData: defaultFormData,
  formErrors: {},
  workflowError: null,
  sprintItems: [createMockPBI()],
  teamMembers: [createMockTeamMember()],
  onClose: vi.fn(),
  onBackToDetails: vi.fn(),
  onSubmit: vi.fn(),
  onFormDataChange: vi.fn(),
  isUpdating: false,
  modalRef: { current: null },
};

describe('TaskEditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen', () => {
      render(<TaskEditModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render modal title with task ID', () => {
      render(<TaskEditModal {...defaultProps} />);
      expect(screen.getByText(/Edit Task #/)).toBeInTheDocument();
    });

    it('should render modal subtitle', () => {
      render(<TaskEditModal {...defaultProps} />);
      expect(screen.getByText('Make changes to your task')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      render(<TaskEditModal {...defaultProps} />);
      expect(screen.getByLabelText(/Parent Backlog Item/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Assignee/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Estimated Hours/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Remaining Hours/)).toBeInTheDocument();
    });

    it('should render required field indicators', () => {
      render(<TaskEditModal {...defaultProps} />);
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    it('should render Back to Details and Save Changes buttons', () => {
      render(<TaskEditModal {...defaultProps} />);
      expect(screen.getByText('Back to Details')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render section titles', () => {
      render(<TaskEditModal {...defaultProps} />);
      expect(screen.getByText('Assignment')).toBeInTheDocument();
      expect(screen.getByText('Time Tracking')).toBeInTheDocument();
    });

    it('should have disabled PBI select', () => {
      render(<TaskEditModal {...defaultProps} />);
      const select = screen.getByLabelText(/Parent Backlog Item/);
      expect(select).toBeDisabled();
    });

    it('should render PBI select with task value', () => {
      render(<TaskEditModal {...defaultProps} />);
      const select = screen.getByLabelText(/Parent Backlog Item/) as HTMLSelectElement;
      expect(select.value).toBe('pbi-1');
    });

    it('should show hint that parent item cannot be changed', () => {
      render(<TaskEditModal {...defaultProps} />);
      expect(screen.getByText('Parent item cannot be changed')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should call onFormDataChange when title changes', () => {
      const onFormDataChange = vi.fn();
      render(<TaskEditModal {...defaultProps} onFormDataChange={onFormDataChange} />);

      const titleInput = screen.getByLabelText(/Title/);
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ title: 'Updated Title' });
    });

    it('should call onFormDataChange when description changes', () => {
      const onFormDataChange = vi.fn();
      render(<TaskEditModal {...defaultProps} onFormDataChange={onFormDataChange} />);

      const descInput = screen.getByLabelText(/Description/);
      fireEvent.change(descInput, { target: { value: 'Updated description' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ description: 'Updated description' });
    });

    it('should call onFormDataChange when assignee selection changes', async () => {
      const onFormDataChange = vi.fn();
      const user = userEvent.setup();
      const teamMembers = [
        createMockTeamMember({ id: 'tm-1', userId: 'user-1' }),
        createMockTeamMember({
          id: 'tm-2',
          userId: 'user-2',
          user: {
            id: 'user-2',
            email: 'jane@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            createdAt: '2026-01-01T00:00:00Z',
            updatedAt: '2026-01-01T00:00:00Z',
          },
        }),
      ];
      render(
        <TaskEditModal
          {...defaultProps}
          teamMembers={teamMembers}
          onFormDataChange={onFormDataChange}
        />
      );

      const select = screen.getByLabelText(/Assignee/);
      await user.selectOptions(select, 'user-2');

      expect(onFormDataChange).toHaveBeenCalledWith({ assigneeId: 'user-2' });
    });

    it('should call onFormDataChange when estimated hours changes', () => {
      const onFormDataChange = vi.fn();
      render(<TaskEditModal {...defaultProps} onFormDataChange={onFormDataChange} />);

      const input = screen.getByLabelText(/Estimated Hours/);
      fireEvent.change(input, { target: { value: '10' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ estimatedHours: 10, remainingHours: 10 });
    });

    it('should call onFormDataChange when remaining hours changes', () => {
      const onFormDataChange = vi.fn();
      render(<TaskEditModal {...defaultProps} onFormDataChange={onFormDataChange} />);

      const input = screen.getByLabelText(/Remaining Hours/);
      fireEvent.change(input, { target: { value: '3' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ remainingHours: 3 });
    });

    it('should call onSubmit when form is submitted', async () => {
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      const user = userEvent.setup();
      render(<TaskEditModal {...defaultProps} onSubmit={onSubmit} />);

      const submitButton = screen.getByText('Save Changes');
      await user.click(submitButton);

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Cancel button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<TaskEditModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onBackToDetails when Back to Details button is clicked', async () => {
      const onBackToDetails = vi.fn();
      const user = userEvent.setup();
      render(<TaskEditModal {...defaultProps} onBackToDetails={onBackToDetails} />);

      const backButton = screen.getByText('Back to Details');
      await user.click(backButton);

      expect(onBackToDetails).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Validation', () => {
    it('should display error message when title has error', () => {
      render(<TaskEditModal {...defaultProps} formErrors={{ title: 'Title is required' }} />);
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    it('should display error message when description has error', () => {
      render(
        <TaskEditModal {...defaultProps} formErrors={{ description: 'Description is required' }} />
      );
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    it('should display error message when assignee has error', () => {
      render(
        <TaskEditModal {...defaultProps} formErrors={{ assigneeId: 'Assignee is required' }} />
      );
      expect(screen.getByText('Assignee is required')).toBeInTheDocument();
    });

    it('should display error message when estimated hours has error', () => {
      render(<TaskEditModal {...defaultProps} formErrors={{ estimatedHours: 'Invalid hours' }} />);
      expect(screen.getByText('Invalid hours')).toBeInTheDocument();
    });

    it('should display error message when remaining hours has error', () => {
      render(<TaskEditModal {...defaultProps} formErrors={{ remainingHours: 'Invalid hours' }} />);
      expect(screen.getByText('Invalid hours')).toBeInTheDocument();
    });

    it('should apply error class to title input', () => {
      render(<TaskEditModal {...defaultProps} formErrors={{ title: 'Title is required' }} />);
      const input = screen.getByLabelText(/Title/);
      expect(input.className).toContain('error');
    });

    it('should not display error elements when no errors', () => {
      render(<TaskEditModal {...defaultProps} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Workflow Error', () => {
    it('should display workflow error when present', () => {
      render(<TaskEditModal {...defaultProps} workflowError="Failed to update task" />);
      expect(screen.getByText('Failed to update task')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should not display workflow error banner when null', () => {
      render(<TaskEditModal {...defaultProps} workflowError={null} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should disable form buttons when isUpdating is true', () => {
      render(<TaskEditModal {...defaultProps} isUpdating={true} />);
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Back to Details')).toBeDisabled();
      expect(screen.getByText('Saving...')).toBeDisabled();
    });

    it('should show saving text when isUpdating is true', () => {
      render(<TaskEditModal {...defaultProps} isUpdating={true} />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('should disable close via Escape when isUpdating', () => {
      const onClose = vi.fn();
      render(<TaskEditModal {...defaultProps} isUpdating={true} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call handleCloseAttempt when Escape is pressed', () => {
      const onClose = vi.fn();
      render(<TaskEditModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call handleCloseAttempt when Escape is pressed during update', () => {
      const onClose = vi.fn();
      render(<TaskEditModal {...defaultProps} isUpdating={true} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should focus title input when autoFocus is enabled', () => {
      render(<TaskEditModal {...defaultProps} />);
      const titleInput = screen.getByLabelText(/Title/);
      expect(document.activeElement).toBe(titleInput);
    });
  });

  describe('Accessibility', () => {
    it('should have correct dialog role', () => {
      render(<TaskEditModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(<TaskEditModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'task-edit-title');
    });

    it('should have aria-label on close button', () => {
      render(<TaskEditModal {...defaultProps} />);
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('should have aria-invalid on inputs with errors', () => {
      render(<TaskEditModal {...defaultProps} formErrors={{ title: 'Error' }} />);
      const input = screen.getByLabelText(/Title/);
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-describedby for error messages', () => {
      render(<TaskEditModal {...defaultProps} formErrors={{ title: 'Title is required' }} />);
      const input = screen.getByLabelText(/Title/);
      expect(input).toHaveAttribute('aria-describedby', 'edit-task-title-error');
    });

    it('should have aria-busy when updating', () => {
      render(<TaskEditModal {...defaultProps} isUpdating={true} />);
      const submitButton = screen.getByText('Saving...');
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Overlay and Modal Behavior', () => {
    it('should call handleCloseAttempt when overlay is clicked', () => {
      const onClose = vi.fn();
      const { container } = render(<TaskEditModal {...defaultProps} onClose={onClose} />);

      const overlay = container.querySelector('[role="dialog"]');
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call onClose when modal content is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<TaskEditModal {...defaultProps} onClose={onClose} />);

      const modalContent = screen.getByText(/Edit Task #/);
      await user.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sprint items list', () => {
      render(<TaskEditModal {...defaultProps} sprintItems={[]} />);
      const select = screen.getByLabelText(/Parent Backlog Item/) as HTMLSelectElement;
      expect(select.options.length).toBe(1);
    });

    it('should handle empty team members list', () => {
      render(<TaskEditModal {...defaultProps} teamMembers={[]} />);
      const select = screen.getByLabelText(/Assignee/) as HTMLSelectElement;
      expect(select.options.length).toBe(1);
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should handle undefined user on team member gracefully', () => {
      const teamMembers = [
        {
          id: 'tm-1',
          teamId: 'team-1',
          userId: 'user-1',
          role: 'developer' as const,
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ];
      render(<TaskEditModal {...defaultProps} teamMembers={teamMembers} />);
      const select = screen.getByLabelText(/Assignee/) as HTMLSelectElement;
      expect(select.options.length).toBe(2);
    });

    it('should display hint for estimated hours', () => {
      render(<TaskEditModal {...defaultProps} />);
      expect(
        screen.getByText('Remaining hours will default to estimated hours')
      ).toBeInTheDocument();
    });

    it('should display hint for remaining hours', () => {
      render(<TaskEditModal {...defaultProps} />);
      expect(screen.getByText('Update daily for accurate burndown')).toBeInTheDocument();
    });

    it('should render form with maxLength on title', () => {
      render(<TaskEditModal {...defaultProps} />);
      const titleInput = screen.getByLabelText(/Title/);
      expect(titleInput).toHaveAttribute('maxLength', '100');
    });

    it('should handle decimal estimated hours via paste', () => {
      const onFormDataChange = vi.fn();
      render(<TaskEditModal {...defaultProps} onFormDataChange={onFormDataChange} />);

      const input = screen.getByLabelText(/Estimated Hours/);
      fireEvent.change(input, { target: { value: '4.5' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ estimatedHours: 4.5, remainingHours: 4.5 });
    });

    it('should handle task without description', () => {
      const taskWithoutDesc = createMockTask({ description: undefined });
      render(
        <TaskEditModal
          {...defaultProps}
          task={taskWithoutDesc}
          formData={{ ...defaultFormData, description: '' }}
        />
      );
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
    });
  });

  describe('Time Tracking', () => {
    it('should update remaining hours when estimated hours changes', () => {
      const onFormDataChange = vi.fn();
      render(<TaskEditModal {...defaultProps} onFormDataChange={onFormDataChange} />);

      const input = screen.getByLabelText(/Estimated Hours/);
      fireEvent.change(input, { target: { value: '10' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ estimatedHours: 10, remainingHours: 10 });
    });

    it('should allow independent remaining hours update', () => {
      const onFormDataChange = vi.fn();
      render(
        <TaskEditModal
          {...defaultProps}
          formData={{ ...defaultFormData, estimatedHours: 8, remainingHours: 8 }}
          onFormDataChange={onFormDataChange}
        />
      );

      const input = screen.getByLabelText(/Remaining Hours/);
      fireEvent.change(input, { target: { value: '3' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ remainingHours: 3 });
    });
  });

  describe('Unsaved Changes Modal', () => {
    it('should show unsaved changes modal when hasUnsavedChanges is true and closing', () => {
      vi.mocked(hasUnsavedChangesForEdit).mockReturnValue(true);

      const { container } = render(<TaskEditModal {...defaultProps} />);

      const overlay = container.querySelector('[role="dialog"]');
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(screen.getByText('Discard Changes?')).toBeInTheDocument();
    });

    it('should show unsaved changes modal when hasUnsavedChanges is true and going back', () => {
      vi.mocked(hasUnsavedChangesForEdit).mockReturnValue(true);

      render(<TaskEditModal {...defaultProps} />);

      const backButton = screen.getByText('Back to Details');
      fireEvent.click(backButton);

      expect(screen.getByText('Discard Changes?')).toBeInTheDocument();
    });

    it('should not show unsaved changes modal when hasUnsavedChanges is false', () => {
      vi.mocked(hasUnsavedChangesForEdit).mockReturnValue(false);

      const { container } = render(<TaskEditModal {...defaultProps} />);

      const overlay = container.querySelector('[role="dialog"]');
      if (overlay) {
        fireEvent.click(overlay);
      }

      expect(screen.queryByText('Discard Changes?')).not.toBeInTheDocument();
    });

    it('should render unsaved changes modal message', () => {
      vi.mocked(hasUnsavedChangesForEdit).mockReturnValue(true);

      render(<TaskEditModal {...defaultProps} />);

      const backButton = screen.getByText('Back to Details');
      fireEvent.click(backButton);

      expect(screen.getByText(/unsaved changes to this task/)).toBeInTheDocument();
    });
  });
});
