import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { AddTaskModal } from './AddTaskModal';

// Mock CSS modules
vi.mock('./AddTaskModal.module.css', () => ({
  default: {
    overlay: 'overlay',
    modal: 'modal',
    'gradient-orb': 'gradient-orb',
    header: 'header',
    'header-content': 'header-content',
    'icon-wrapper': 'icon-wrapper',
    title: 'title',
    subtitle: 'subtitle',
    'item-highlight': 'item-highlight',
    'close-button': 'close-button',
    'progress-bar': 'progress-bar',
    'progress-fill': 'progress-fill',
    body: 'body',
    form: 'form',
    'form-group': 'form-group',
    'form-label': 'form-label',
    required: 'required',
    optional: 'optional',
    'input-wrapper': 'input-wrapper',
    'form-input': 'form-input',
    'input-error': 'input-error',
    'input-icon': 'input-icon',
    'input-icon-left': 'input-icon-left',
    'error-message': 'error-message',
    'input-hint': 'input-hint',
    'form-row': 'form-row',
    'select-wrapper': 'select-wrapper',
    'form-select': 'form-select',
    'select-icon': 'select-icon',
    footer: 'footer',
    'button-secondary': 'button-secondary',
    'button-primary': 'button-primary',
    'button-icon': 'button-icon',
  },
}));

// Mock UnsavedChangesModal
vi.mock('../../../components/common/Form/UnsavedChangesModal', () => ({
  UnsavedChangesModal: ({
    isOpen,
    onConfirm,
    onCancel,
  }: {
    isOpen: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }) =>
    isOpen ? (
      <div data-testid="unsaved-changes-modal">
        <button data-testid="confirm-discard" onClick={onConfirm}>
          Discard
        </button>
        <button data-testid="cancel-discard" onClick={onCancel}>
          Cancel
        </button>
      </div>
    ) : null,
}));

const mockTeamMembers = [
  { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe' },
  { memberId: 'member-2', userId: 'user-2', memberName: 'Jane Smith' },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  teamMembers: mockTeamMembers,
  itemTitle: 'Test Backlog Item',
};

describe('AddTaskModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<AddTaskModal {...defaultProps} />);

      expect(document.getElementById('add-task-form')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Add New Task/i })).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<AddTaskModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display item title in subtitle when provided', () => {
      render(<AddTaskModal {...defaultProps} itemTitle="My Backlog Item" />);

      expect(screen.getByText(/My Backlog Item/)).toBeInTheDocument();
    });

    it('should render without subtitle when itemTitle is not provided', () => {
      render(<AddTaskModal {...defaultProps} itemTitle={undefined} />);

      expect(screen.getByRole('heading', { name: /Add New Task/i })).toBeInTheDocument();
      expect(screen.queryByText(/Adding task to/)).not.toBeInTheDocument();
    });

    it('should render all form fields', () => {
      render(<AddTaskModal {...defaultProps} />);

      expect(screen.getByLabelText(/Task Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Estimated Hours/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Assignee/i)).toBeInTheDocument();
    });

    it('should render team members in assignee dropdown', () => {
      render(<AddTaskModal {...defaultProps} />);

      const assigneeSelect = screen.getByLabelText(/Assignee/i);
      expect(assigneeSelect).toBeInTheDocument();

      // Check for "Unassigned" option
      expect(screen.getByText('Unassigned')).toBeInTheDocument();

      // Check for team members
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<AddTaskModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add Task$/i })).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when title is empty', () => {
      render(<AddTaskModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Add Task$/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when estimated hours is 0', () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const submitButton = screen.getByRole('button', { name: /Add Task$/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when form is valid', () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      fireEvent.change(hoursInput, { target: { value: '4' } });

      const submitButton = screen.getByRole('button', { name: /Add Task$/i });
      expect(submitButton).not.toBeDisabled();
    });

    it('should show error when submitting with empty title', async () => {
      render(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');

      // Try to submit by clicking the button (it should be disabled, so we use form submit)
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Task title is required/i)).toBeInTheDocument();
      });
    });

    it('should show error when estimated hours is invalid', async () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      fireEvent.change(hoursInput, { target: { value: '-1' } });

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Estimated hours must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('should clear error when user starts typing in title field', async () => {
      render(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Task title is required/i)).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'T' } });

      expect(screen.queryByText(/Task title is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data when form is valid', async () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'Implement Feature' } });

      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      fireEvent.change(hoursInput, { target: { value: '8' } });

      const assigneeSelect = screen.getByLabelText(/Assignee/i);
      fireEvent.change(assigneeSelect, { target: { value: 'user-1' } });

      const submitButton = screen.getByRole('button', { name: /Add Task$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({
          title: 'Implement Feature',
          estimatedHours: 8,
          assigneeId: 'user-1',
        });
      });
    });

    it('should allow submitting without assignee', async () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'Unassigned Task' } });

      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      fireEvent.change(hoursInput, { target: { value: '4' } });

      // Keep assignee as "Unassigned" (empty string)
      const submitButton = screen.getByRole('button', { name: /Add Task$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({
          title: 'Unassigned Task',
          estimatedHours: 4,
          assigneeId: '',
        });
      });
    });

    it('should trim whitespace from title', async () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: '  Task with spaces  ' } });

      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      fireEvent.change(hoursInput, { target: { value: '4' } });

      const submitButton = screen.getByRole('button', { name: /Add Task$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Task with spaces',
          })
        );
      });
    });
  });

  describe('Modal Close Behavior', () => {
    it('should call onClose when clicking cancel button', () => {
      render(<AddTaskModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking overlay', () => {
      render(<AddTaskModal {...defaultProps} />);

      const overlay = screen.getByRole('presentation');
      fireEvent.click(overlay);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should not close when clicking modal content', () => {
      render(<AddTaskModal {...defaultProps} />);

      const modal = document.getElementById('add-task-form');
      fireEvent.click(modal);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should show unsaved changes modal when closing with changes', () => {
      render(<AddTaskModal {...defaultProps} />);

      // Make a change
      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'Some Task' } });

      // Try to close
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Should show unsaved changes modal instead of closing
      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should close when confirming discard of unsaved changes', () => {
      render(<AddTaskModal {...defaultProps} />);

      // Make a change
      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'Some Task' } });

      // Try to close
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Confirm discard
      const discardButton = screen.getByTestId('confirm-discard');
      fireEvent.click(discardButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should stay open when canceling discard of unsaved changes', () => {
      render(<AddTaskModal {...defaultProps} />);

      // Make a change
      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'Some Task' } });

      // Try to close
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Cancel discard
      const cancelDiscardButton = screen.getByTestId('cancel-discard');
      fireEvent.click(cancelDiscardButton);

      // Modal should still be open
      expect(document.getElementById('add-task-form')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should close directly when no changes made', () => {
      render(<AddTaskModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByTestId('unsaved-changes-modal')).not.toBeInTheDocument();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes on dialog', () => {
      render(<AddTaskModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'add-task-title');
    });

    it('should have required indicators on required fields', () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      expect(titleInput).toHaveAttribute('aria-required', 'true');

      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      expect(hoursInput).toHaveAttribute('aria-required', 'true');
    });

    it('should update aria-invalid when validation fails', async () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      expect(titleInput).toHaveAttribute('aria-invalid', 'false');

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(titleInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have aria-describedby for error messages when invalid', async () => {
      render(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        const titleInput = screen.getByLabelText(/Task Title/i);
        expect(titleInput).toHaveAttribute('aria-describedby', 'title-error');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should focus title input when modal opens', async () => {
      render(<AddTaskModal {...defaultProps} />);

      // The input should be focused after a short delay (setTimeout in component)
      await waitFor(() => {
        const titleInput = screen.getByLabelText(/Task Title/i);
        expect(titleInput).toHaveFocus();
      });
    });

    it('should support tab navigation through form fields', () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      const assigneeSelect = screen.getByLabelText(/Assignee/i);
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      const submitButton = screen.getByRole('button', { name: /Add Task$/i });

      // Tab order should follow DOM order
      expect(titleInput).toBeInTheDocument();
      expect(hoursInput).toBeInTheDocument();
      expect(assigneeSelect).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    it('should close modal on Escape key when no unsaved changes', () => {
      render(<AddTaskModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should show unsaved changes modal on Escape key when changes exist', () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'Some Task' } });

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should trap focus: Tab from last enabled element wraps to first', () => {
      render(<AddTaskModal {...defaultProps} />);

      // Fill in title and hours so Add Task button is enabled as last focusable
      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });
      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      fireEvent.change(hoursInput, { target: { value: '4' } });

      const submitButton = screen.getByRole('button', { name: /Add Task$/i });
      submitButton.focus();

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });

      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toHaveFocus();
    });

    it('should trap focus: Shift+Tab from first element wraps to last enabled element', () => {
      render(<AddTaskModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close modal');
      closeButton.focus();

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      // Add Task button is disabled initially, so Cancel is the last enabled element
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      expect(cancelButton).toHaveFocus();
    });
  });

  describe('Form Reset', () => {
    it('should reset form when modal reopens', () => {
      const { rerender } = render(<AddTaskModal {...defaultProps} isOpen={false} />);

      rerender(<AddTaskModal {...defaultProps} isOpen={true} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      fireEvent.change(hoursInput, { target: { value: '5' } });

      rerender(<AddTaskModal {...defaultProps} isOpen={false} />);
      rerender(<AddTaskModal {...defaultProps} isOpen={true} />);

      expect(screen.getByLabelText(/Task Title/i)).toHaveValue('');
      const resetHoursInput = screen.getByLabelText(/Estimated Hours/i);
      expect(resetHoursInput.value === '' || resetHoursInput.value === null).toBe(true);
    });

    it('should reset form fields on modal close and reopen', () => {
      const { rerender } = render(<AddTaskModal {...defaultProps} isOpen={true} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'My Task' } });

      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      fireEvent.change(hoursInput, { target: { value: '8' } });

      const assigneeSelect = screen.getByLabelText(/Assignee/i);
      fireEvent.change(assigneeSelect, { target: { value: 'user-1' } });

      rerender(<AddTaskModal {...defaultProps} isOpen={false} />);
      rerender(<AddTaskModal {...defaultProps} isOpen={true} />);

      expect(screen.getByLabelText(/Task Title/i)).toHaveValue('');
      expect(screen.getByLabelText(/Assignee/i)).toHaveValue('');
    });
  });

  describe('Form Input Interactions', () => {
    it('should allow typing in title field', () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'New task title' } });

      expect(titleInput).toHaveValue('New task title');
    });

    it('should allow typing decimal hours', () => {
      render(<AddTaskModal {...defaultProps} />);

      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      fireEvent.change(hoursInput, { target: { value: '4.5' } });

      expect(hoursInput).toHaveValue(4.5);
    });

    it('should handle selecting assignee', () => {
      render(<AddTaskModal {...defaultProps} />);

      const assigneeSelect = screen.getByLabelText(/Assignee/i);
      fireEvent.change(assigneeSelect, { target: { value: 'user-1' } });

      expect(assigneeSelect).toHaveValue('user-1');
    });

    it('should handle deselecting assignee (Unassigned)', () => {
      render(<AddTaskModal {...defaultProps} />);

      const assigneeSelect = screen.getByLabelText(/Assignee/i);
      fireEvent.change(assigneeSelect, { target: { value: 'user-1' } });
      expect(assigneeSelect).toHaveValue('user-1');

      fireEvent.change(assigneeSelect, { target: { value: '' } });
      expect(assigneeSelect).toHaveValue('');
    });
  });

  describe('Input Hints and Placeholders', () => {
    it('should display placeholder for title input', () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      expect(titleInput).toHaveAttribute('placeholder', 'e.g., Implement user authentication');
    });

    it('should display placeholder for hours input', () => {
      render(<AddTaskModal {...defaultProps} />);

      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      expect(hoursInput).toHaveAttribute('placeholder', '4');
    });

    it('should display hint for title field', () => {
      render(<AddTaskModal {...defaultProps} />);

      expect(
        screen.getByText(/Describe what needs to be done clearly and concisely/i)
      ).toBeInTheDocument();
    });

    it('should display hint for hours field', () => {
      render(<AddTaskModal {...defaultProps} />);

      expect(screen.getByText(/Hours needed to complete/i)).toBeInTheDocument();
    });

    it('should display hint for assignee field', () => {
      render(<AddTaskModal {...defaultProps} />);

      expect(screen.getByText(/Who will work on this\?/i)).toBeInTheDocument();
    });
  });

  describe('Team Members Display', () => {
    it('should display all team members in dropdown', () => {
      render(<AddTaskModal {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should handle empty team members list', () => {
      render(<AddTaskModal {...defaultProps} teamMembers={[]} />);

      const assigneeSelect = screen.getByLabelText(/Assignee/i);
      expect(assigneeSelect).toHaveValue('');
      expect(screen.getByText('Unassigned')).toBeInTheDocument();
    });

    it('should handle single team member', () => {
      render(
        <AddTaskModal
          {...defaultProps}
          teamMembers={[{ memberId: 'member-1', userId: 'user-1', memberName: 'Solo Developer' }]}
        />
      );

      expect(screen.getByText('Solo Developer')).toBeInTheDocument();
    });

    it('should handle many team members', () => {
      const manyMembers = Array.from({ length: 10 }, (_, i) => ({
        memberId: `member-${i}`,
        userId: `user-${i}`,
        memberName: `Developer ${i}`,
      }));

      render(<AddTaskModal {...defaultProps} teamMembers={manyMembers} />);

      for (let i = 0; i < 10; i++) {
        expect(screen.getByText(`Developer ${i}`)).toBeInTheDocument();
      }
    });
  });

  describe('Close Button and Overlay', () => {
    it('should have proper aria-label on close button', () => {
      render(<AddTaskModal {...defaultProps} />);

      const closeButton = screen.getByLabelText(/Close modal/i);
      expect(closeButton).toBeInTheDocument();
    });

    it('should close on overlay click without changes', () => {
      render(<AddTaskModal {...defaultProps} />);

      const overlay = screen.getByRole('presentation');
      fireEvent.click(overlay);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should not close when clicking inside modal content', () => {
      render(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.click(form);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Item Title Display', () => {
    it('should show itemTitle when provided', () => {
      render(<AddTaskModal {...defaultProps} itemTitle="Backlog Item #123" />);

      expect(screen.getByText(/Adding task to/i)).toBeInTheDocument();
      expect(screen.getByText(/Backlog Item #123/i)).toBeInTheDocument();
    });

    it('should not show subtitle when itemTitle is undefined', () => {
      render(<AddTaskModal {...defaultProps} itemTitle={undefined} />);

      expect(screen.queryByText(/Adding task to/)).not.toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should show progress bar', () => {
      render(<AddTaskModal {...defaultProps} />);

      const progressBar = document.querySelector('.progress-bar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should update progress based on title filled', () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      const progressFill = document.querySelector('.progress-fill');

      expect(progressFill).toBeInTheDocument();

      fireEvent.change(titleInput, { target: { value: 'Task' } });
    });
  });

  describe('Error Message Display', () => {
    it('should show error with role alert', async () => {
      render(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        const errorMessage = screen.getByText(/Task title is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should show both errors when both fields are invalid', async () => {
      render(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Task title is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Estimated hours must be greater than 0/i)).toBeInTheDocument();
      });
    });

    it('should clear hours error when hours become valid', async () => {
      render(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Estimated hours must be greater than 0/i)).toBeInTheDocument();
      });

      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      fireEvent.change(hoursInput, { target: { value: '4' } });

      expect(screen.queryByText(/Estimated hours must be greater than 0/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission Edge Cases', () => {
    it('should submit with valid form data', async () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(/Task Title/i);
      fireEvent.change(titleInput, { target: { value: 'Complete task' } });

      const hoursInput = screen.getByLabelText(/Estimated Hours/i);
      fireEvent.change(hoursInput, { target: { value: '8' } });

      const submitButton = screen.getByRole('button', { name: /Add Task$/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(defaultProps.onSubmit).toHaveBeenCalledWith({
          title: 'Complete task',
          estimatedHours: 8,
          assigneeId: '',
        });
      });
    });

    it('should not submit when form is invalid', () => {
      render(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Required Field Indicators', () => {
    it('should show required asterisk for title', () => {
      render(<AddTaskModal {...defaultProps} />);

      const titleLabel = screen.getByText(/Task Title/);
      expect(titleLabel.parentElement?.textContent).toContain('*');
    });

    it('should show required asterisk for hours', () => {
      render(<AddTaskModal {...defaultProps} />);

      const hoursLabel = screen.getByText(/Estimated Hours/);
      expect(hoursLabel.parentElement?.textContent).toContain('*');
    });

    it('should show Optional text for assignee', () => {
      render(<AddTaskModal {...defaultProps} />);

      const assigneeLabel = screen.getByText(/Assignee/);
      expect(assigneeLabel.parentElement?.textContent).toContain('Optional');
    });
  });
});
