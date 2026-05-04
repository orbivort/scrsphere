import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';

import { TaskCreateModal, type TaskCreateModalProps } from './TaskCreateModal';
import { TaskStatus, type ProductBacklogItem, type TeamMember, type User } from '../../../../types';

vi.mock('../../utils/formChangeDetection', () => ({
  hasUnsavedChangesForCreate: vi.fn(() => false),
}));

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
  title: '',
  description: '',
  pbiId: '',
  assigneeId: '',
  status: TaskStatus.TODO,
  estimatedHours: 0,
  remainingHours: 0,
};

const defaultProps: TaskCreateModalProps = {
  formData: defaultFormData,
  formErrors: {},
  workflowError: null,
  sprintItems: [createMockPBI()],
  teamMembers: [createMockTeamMember()],
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  onFormDataChange: vi.fn(),
  isCreating: false,
  modalRef: { current: null },
};

describe('TaskCreateModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen', () => {
      render(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render modal title', () => {
      render(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    it('should render modal subtitle', () => {
      render(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByText('Add a new task to your sprint')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      render(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByLabelText(/Parent Backlog Item/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Description/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Assignee/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Estimated Hours/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Remaining Hours/)).toBeInTheDocument();
    });

    it('should render required field indicators', () => {
      render(<TaskCreateModal {...defaultProps} />);
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    it('should render required fields legend', () => {
      render(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByText('Required fields')).toBeInTheDocument();
    });

    it('should render Cancel and Create Task buttons', () => {
      render(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create Task')).toBeInTheDocument();
    });

    it('should render section titles', () => {
      render(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByText('Assignment')).toBeInTheDocument();
      expect(screen.getByText('Time Tracking')).toBeInTheDocument();
    });

    it('should render PBI options', () => {
      render(<TaskCreateModal {...defaultProps} />);
      const select = screen.getByLabelText(/Parent Backlog Item/) as HTMLSelectElement;
      expect(select.options.length).toBe(2);
    });

    it('should render team member options', () => {
      render(<TaskCreateModal {...defaultProps} />);
      const select = screen.getByLabelText(/Assignee/) as HTMLSelectElement;
      expect(select.options.length).toBe(2);
    });
  });

  describe('User Interactions', () => {
    it('should call onFormDataChange when title changes', () => {
      const onFormDataChange = vi.fn();
      render(<TaskCreateModal {...defaultProps} onFormDataChange={onFormDataChange} />);

      const titleInput = screen.getByPlaceholderText('Enter task title');
      fireEvent.change(titleInput, { target: { value: 'New Task Title' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ title: 'New Task Title' });
    });

    it('should call onFormDataChange when description changes', () => {
      const onFormDataChange = vi.fn();
      render(<TaskCreateModal {...defaultProps} onFormDataChange={onFormDataChange} />);

      const descInput = screen.getByPlaceholderText('Enter task description');
      fireEvent.change(descInput, { target: { value: 'Task description' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ description: 'Task description' });
    });

    it('should call onFormDataChange when PBI selection changes', async () => {
      const onFormDataChange = vi.fn();
      const user = userEvent.setup();
      const sprintItems = [
        createMockPBI({ id: 'pbi-1' }),
        createMockPBI({ id: 'pbi-2', title: 'Second PBI' }),
      ];
      render(
        <TaskCreateModal
          {...defaultProps}
          sprintItems={sprintItems}
          onFormDataChange={onFormDataChange}
        />
      );

      const select = screen.getByLabelText(/Parent Backlog Item/);
      await user.selectOptions(select, 'pbi-2');

      expect(onFormDataChange).toHaveBeenCalledWith({ pbiId: 'pbi-2' });
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
        <TaskCreateModal
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
      render(<TaskCreateModal {...defaultProps} onFormDataChange={onFormDataChange} />);

      const input = screen.getByLabelText(/^Estimated Hours/);
      fireEvent.change(input, { target: { value: '8' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ estimatedHours: 8, remainingHours: 8 });
    });

    it('should call onFormDataChange when remaining hours changes', () => {
      const onFormDataChange = vi.fn();
      render(<TaskCreateModal {...defaultProps} onFormDataChange={onFormDataChange} />);

      const input = screen.getByLabelText(/^Remaining Hours/);
      fireEvent.change(input, { target: { value: '5' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ remainingHours: 5 });
    });

    it('should call onSubmit when form is submitted', async () => {
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      const user = userEvent.setup();
      render(<TaskCreateModal {...defaultProps} onSubmit={onSubmit} />);

      const submitButton = screen.getByText('Create Task');
      await user.click(submitButton);

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Cancel button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<TaskCreateModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Validation', () => {
    it('should display error message when title has error', () => {
      render(<TaskCreateModal {...defaultProps} formErrors={{ title: 'Title is required' }} />);
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    it('should display error message when description has error', () => {
      render(
        <TaskCreateModal
          {...defaultProps}
          formErrors={{ description: 'Description is required' }}
        />
      );
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    it('should display error message when PBI has error', () => {
      render(<TaskCreateModal {...defaultProps} formErrors={{ pbiId: 'Please select a PBI' }} />);
      expect(screen.getByText('Please select a PBI')).toBeInTheDocument();
    });

    it('should display error message when assignee has error', () => {
      render(
        <TaskCreateModal {...defaultProps} formErrors={{ assigneeId: 'Assignee is required' }} />
      );
      expect(screen.getByText('Assignee is required')).toBeInTheDocument();
    });

    it('should display error message when estimated hours has error', () => {
      render(
        <TaskCreateModal {...defaultProps} formErrors={{ estimatedHours: 'Invalid hours' }} />
      );
      expect(screen.getByText('Invalid hours')).toBeInTheDocument();
    });

    it('should display error message when remaining hours has error', () => {
      render(
        <TaskCreateModal {...defaultProps} formErrors={{ remainingHours: 'Invalid hours' }} />
      );
      expect(screen.getByText('Invalid hours')).toBeInTheDocument();
    });

    it('should not display error elements when no errors', () => {
      render(<TaskCreateModal {...defaultProps} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Workflow Error', () => {
    it('should display workflow error when present', () => {
      render(<TaskCreateModal {...defaultProps} workflowError="Failed to create task" />);
      expect(screen.getByText('Failed to create task')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should not display workflow error banner when null', () => {
      render(<TaskCreateModal {...defaultProps} workflowError={null} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should disable form buttons when isCreating is true', () => {
      render(<TaskCreateModal {...defaultProps} isCreating={true} />);
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Creating...')).toBeDisabled();
    });

    it('should show creating text when isCreating is true', () => {
      render(<TaskCreateModal {...defaultProps} isCreating={true} />);
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    it('should not call onClose via Escape when isCreating', () => {
      const onClose = vi.fn();
      render(<TaskCreateModal {...defaultProps} isCreating={true} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call handleCloseAttempt when Escape is pressed', () => {
      const onClose = vi.fn();
      render(<TaskCreateModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call handleCloseAttempt when Escape is pressed during creation', () => {
      const onClose = vi.fn();
      render(<TaskCreateModal {...defaultProps} isCreating={true} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should focus title input when autoFocus is enabled', () => {
      render(<TaskCreateModal {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText('Enter task title');
      expect(document.activeElement).toBe(titleInput);
    });
  });

  describe('Accessibility', () => {
    it('should have correct dialog role', () => {
      render(<TaskCreateModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(<TaskCreateModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'task-modal-title');
    });

    it('should have aria-label on close button', () => {
      render(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('should have aria-invalid on inputs with errors', () => {
      render(<TaskCreateModal {...defaultProps} formErrors={{ title: 'Error' }} />);
      const input = screen.getByPlaceholderText('Enter task title');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-describedby for error messages', () => {
      render(<TaskCreateModal {...defaultProps} formErrors={{ title: 'Title is required' }} />);
      const input = screen.getByPlaceholderText('Enter task title');
      expect(input).toHaveAttribute('aria-describedby', 'task-title-error');
    });

    it('should have aria-busy when creating', () => {
      render(<TaskCreateModal {...defaultProps} isCreating={true} />);
      const submitButton = screen.getByText('Creating...');
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Overlay and Modal Behavior', () => {
    it('should not call onClose when modal content is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(<TaskCreateModal {...defaultProps} onClose={onClose} />);

      const modalContent = screen.getByText('Create New Task');
      await user.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sprint items list', () => {
      render(<TaskCreateModal {...defaultProps} sprintItems={[]} />);
      const select = screen.getByLabelText(/Parent Backlog Item/) as HTMLSelectElement;
      expect(select.options.length).toBe(1);
      expect(screen.getByText('Select a backlog item...')).toBeInTheDocument();
    });

    it('should handle empty team members list', () => {
      render(<TaskCreateModal {...defaultProps} teamMembers={[]} />);
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
      render(<TaskCreateModal {...defaultProps} teamMembers={teamMembers} />);
      const select = screen.getByLabelText(/Assignee/) as HTMLSelectElement;
      expect(select.options.length).toBe(2);
    });

    it('should display hint for estimated hours', () => {
      render(<TaskCreateModal {...defaultProps} />);
      expect(
        screen.getByText('Remaining hours will default to estimated hours')
      ).toBeInTheDocument();
    });

    it('should display hint for remaining hours', () => {
      render(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByText('Update daily for accurate burndown')).toBeInTheDocument();
    });

    it('should render form with maxLength on title', () => {
      render(<TaskCreateModal {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText('Enter task title');
      expect(titleInput).toHaveAttribute('maxLength', '100');
    });
  });

  describe('Time Tracking', () => {
    it('should update remaining hours when estimated hours changes', () => {
      const onFormDataChange = vi.fn();
      render(<TaskCreateModal {...defaultProps} onFormDataChange={onFormDataChange} />);

      const input = screen.getByLabelText(/^Estimated Hours/);
      fireEvent.change(input, { target: { value: '10' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ estimatedHours: 10, remainingHours: 10 });
    });

    it('should allow independent remaining hours update', () => {
      const onFormDataChange = vi.fn();
      render(
        <TaskCreateModal
          {...defaultProps}
          formData={{ ...defaultFormData, estimatedHours: 8, remainingHours: 8 }}
          onFormDataChange={onFormDataChange}
        />
      );

      const input = screen.getByLabelText(/^Remaining Hours/);
      fireEvent.change(input, { target: { value: '3' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ remainingHours: 3 });
    });
  });
});
