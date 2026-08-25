import React from 'react';
import { screen, fireEvent, renderWithProviders, initTestI18n } from '../../../../test-utils';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest';

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
  role: 'developers' as const,
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
  isDeveloper: true,
  currentUserId: 'user-1',
};

describe('TaskCreateModal', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render modal title', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    it('should render modal subtitle', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByText('Add a new task to your sprint')).toBeInTheDocument();
    });

    it('should render form fields', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByLabelText(/Parent Backlog Item/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Description/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Assignee/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Estimated Hours/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Remaining Hours/)).toBeInTheDocument();
    });

    it('should render required field indicators', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      const requiredIndicators = screen.getAllByText('*');
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    it('should render required fields legend', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByText('Required fields')).toBeInTheDocument();
    });

    it('should render Cancel and Create Task buttons', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Create Task')).toBeInTheDocument();
    });

    it('should render section titles', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByText('Assignment')).toBeInTheDocument();
      expect(screen.getByText('Time Tracking')).toBeInTheDocument();
    });

    it('should render PBI options', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      const select = screen.getByLabelText(/Parent Backlog Item/) as HTMLSelectElement;
      expect(select.options.length).toBe(2);
    });

    it('should render team member options', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      const select = screen.getByLabelText(/Assignee/) as HTMLSelectElement;
      expect(select.options.length).toBe(2);
    });
  });

  describe('User Interactions', () => {
    it('should call onFormDataChange when title changes', () => {
      const onFormDataChange = vi.fn();
      renderWithProviders(
        <TaskCreateModal {...defaultProps} onFormDataChange={onFormDataChange} />
      );

      const titleInput = screen.getByPlaceholderText('Enter task title');
      fireEvent.change(titleInput, { target: { value: 'New Task Title' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ title: 'New Task Title' });
    });

    it('should call onFormDataChange when description changes', () => {
      const onFormDataChange = vi.fn();
      renderWithProviders(
        <TaskCreateModal {...defaultProps} onFormDataChange={onFormDataChange} />
      );

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
      renderWithProviders(
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
      renderWithProviders(
        <TaskCreateModal
          {...defaultProps}
          teamMembers={teamMembers}
          onFormDataChange={onFormDataChange}
        />
      );

      const select = screen.getByLabelText(/Assignee/);
      await user.selectOptions(select, 'user-1');

      expect(onFormDataChange).toHaveBeenCalledWith({ assigneeId: 'user-1' });
    });

    it('should call onFormDataChange when estimated hours changes', () => {
      const onFormDataChange = vi.fn();
      renderWithProviders(
        <TaskCreateModal {...defaultProps} onFormDataChange={onFormDataChange} />
      );

      const input = screen.getByLabelText(/^Estimated Hours/);
      fireEvent.change(input, { target: { value: '8' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ estimatedHours: 8, remainingHours: 8 });
    });

    it('should call onFormDataChange when remaining hours changes', () => {
      const onFormDataChange = vi.fn();
      renderWithProviders(
        <TaskCreateModal {...defaultProps} onFormDataChange={onFormDataChange} />
      );

      const input = screen.getByLabelText(/^Remaining Hours/);
      fireEvent.change(input, { target: { value: '5' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ remainingHours: 5 });
    });

    it('should call onSubmit when form is submitted', async () => {
      const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
      const user = userEvent.setup();
      renderWithProviders(<TaskCreateModal {...defaultProps} onSubmit={onSubmit} />);

      const submitButton = screen.getByText('Create Task');
      await user.click(submitButton);

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Cancel button is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<TaskCreateModal {...defaultProps} onClose={onClose} />);

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Form Validation', () => {
    it('should display error message when title has error', () => {
      renderWithProviders(
        <TaskCreateModal {...defaultProps} formErrors={{ title: 'Title is required' }} />
      );
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    it('should display error message when description has error', () => {
      renderWithProviders(
        <TaskCreateModal
          {...defaultProps}
          formErrors={{ description: 'Description is required' }}
        />
      );
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    it('should display error message when PBI has error', () => {
      renderWithProviders(
        <TaskCreateModal {...defaultProps} formErrors={{ pbiId: 'Please select a PBI' }} />
      );
      expect(screen.getByText('Please select a PBI')).toBeInTheDocument();
    });

    it('should display error message when assignee has error', () => {
      renderWithProviders(
        <TaskCreateModal {...defaultProps} formErrors={{ assigneeId: 'Assignee is required' }} />
      );
      expect(screen.getByText('Assignee is required')).toBeInTheDocument();
    });

    it('should display error message when estimated hours has error', () => {
      renderWithProviders(
        <TaskCreateModal {...defaultProps} formErrors={{ estimatedHours: 'Invalid hours' }} />
      );
      expect(screen.getByText('Invalid hours')).toBeInTheDocument();
    });

    it('should display error message when remaining hours has error', () => {
      renderWithProviders(
        <TaskCreateModal {...defaultProps} formErrors={{ remainingHours: 'Invalid hours' }} />
      );
      expect(screen.getByText('Invalid hours')).toBeInTheDocument();
    });

    it('should not display error elements when no errors', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Workflow Error', () => {
    it('should display workflow error when present', () => {
      renderWithProviders(
        <TaskCreateModal {...defaultProps} workflowError="Failed to create task" />
      );
      expect(screen.getByText('Failed to create task')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should not display workflow error banner when null', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} workflowError={null} />);
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should disable form buttons when isCreating is true', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} isCreating={true} />);
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Creating...')).toBeDisabled();
    });

    it('should show creating text when isCreating is true', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} isCreating={true} />);
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });

    it('should not call onClose via Escape when isCreating', () => {
      const onClose = vi.fn();
      renderWithProviders(
        <TaskCreateModal {...defaultProps} isCreating={true} onClose={onClose} />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should call handleCloseAttempt when Escape is pressed', () => {
      const onClose = vi.fn();
      renderWithProviders(<TaskCreateModal {...defaultProps} onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should not call handleCloseAttempt when Escape is pressed during creation', () => {
      const onClose = vi.fn();
      renderWithProviders(
        <TaskCreateModal {...defaultProps} isCreating={true} onClose={onClose} />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should focus title input when autoFocus is enabled', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText('Enter task title');
      expect(document.activeElement).toBe(titleInput);
    });
  });

  describe('Accessibility', () => {
    it('should have correct dialog role', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'task-modal-title');
    });

    it('should have aria-label on close button', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });

    it('should have aria-invalid on inputs with errors', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} formErrors={{ title: 'Error' }} />);
      const input = screen.getByPlaceholderText('Enter task title');
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });

    it('should have aria-describedby for error messages', () => {
      renderWithProviders(
        <TaskCreateModal {...defaultProps} formErrors={{ title: 'Title is required' }} />
      );
      const input = screen.getByPlaceholderText('Enter task title');
      expect(input).toHaveAttribute('aria-describedby', 'task-title-error');
    });

    it('should have aria-busy when creating', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} isCreating={true} />);
      const submitButton = screen.getByText('Creating...');
      expect(submitButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Overlay and Modal Behavior', () => {
    it('should not call onClose when modal content is clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      renderWithProviders(<TaskCreateModal {...defaultProps} onClose={onClose} />);

      const modalContent = screen.getByText('Create New Task');
      await user.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty sprint items list', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} sprintItems={[]} />);
      const select = screen.getByLabelText(/Parent Backlog Item/) as HTMLSelectElement;
      expect(select.options.length).toBe(1);
      expect(screen.getByText('Select a backlog item...')).toBeInTheDocument();
    });

    it('should handle empty team members list', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} teamMembers={[]} />);
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
          role: 'developers' as const,
          joinedAt: '2026-01-01T00:00:00Z',
        },
      ];
      renderWithProviders(<TaskCreateModal {...defaultProps} teamMembers={teamMembers} />);
      const select = screen.getByLabelText(/Assignee/) as HTMLSelectElement;
      expect(select.options.length).toBe(2);
    });

    it('should display hint for estimated hours', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      expect(
        screen.getByText('Remaining hours will default to estimated hours')
      ).toBeInTheDocument();
    });

    it('should display hint for remaining hours', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      expect(screen.getByText('Update daily for accurate burndown')).toBeInTheDocument();
    });

    it('should render form with maxLength on title', () => {
      renderWithProviders(<TaskCreateModal {...defaultProps} />);
      const titleInput = screen.getByPlaceholderText('Enter task title');
      expect(titleInput).toHaveAttribute('maxLength', '100');
    });
  });

  describe('Time Tracking', () => {
    it('should update remaining hours when estimated hours changes', () => {
      const onFormDataChange = vi.fn();
      renderWithProviders(
        <TaskCreateModal {...defaultProps} onFormDataChange={onFormDataChange} />
      );

      const input = screen.getByLabelText(/^Estimated Hours/);
      fireEvent.change(input, { target: { value: '10' } });

      expect(onFormDataChange).toHaveBeenCalledWith({ estimatedHours: 10, remainingHours: 10 });
    });

    it('should allow independent remaining hours update', () => {
      const onFormDataChange = vi.fn();
      renderWithProviders(
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
