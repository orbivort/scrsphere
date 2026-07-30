import React from 'react';
import { screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';

import { renderWithProviders, initTestI18n, i18nT } from '../../../test-utils';

import { AddTaskModal } from './AddTaskModal';

// Initialize i18n before all tests
beforeAll(async () => {
  await initTestI18n();
});

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
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      expect(document.getElementById('add-task-form')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: i18nT('sprint:sprintPlanning.addTaskModal.addNewTask'),
        })
      ).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display item title in subtitle when provided', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} itemTitle="My Backlog Item" />);

      expect(screen.getByText(/My Backlog Item/)).toBeInTheDocument();
    });

    it('should render without subtitle when itemTitle is not provided', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} itemTitle={undefined} />);

      expect(
        screen.getByRole('heading', {
          name: i18nT('sprint:sprintPlanning.addTaskModal.addNewTask'),
        })
      ).toBeInTheDocument();
      expect(
        screen.queryByText(i18nT('sprint:sprintPlanning.addTaskModal.addingTaskTo'))
      ).not.toBeInTheDocument();
    });

    it('should render all form fields', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      expect(
        screen.getByLabelText(
          new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
        )
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(
          new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
        )
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(
          new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.assigneeLabel')}`)
        )
      ).toBeInTheDocument();
    });

    it('should render team members in assignee dropdown', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const assigneeSelect = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.assigneeLabel')}`)
      );
      expect(assigneeSelect).toBeInTheDocument();

      // Check for "Unassigned" option
      expect(
        screen.getByText(i18nT('sprint:sprintPlanning.addTaskModal.unassigned'))
      ).toBeInTheDocument();

      // Check for team members
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      expect(
        screen.getAllByRole('button', {
          name: i18nT('sprint:sprintPlanning.addTaskModal.cancel'),
        })[1]
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: i18nT('sprint:sprintPlanning.addTaskModal.addTask') })
      ).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when title is empty', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.addTask'),
      });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when estimated hours is 0', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const submitButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.addTask'),
      });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when form is valid', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      fireEvent.change(hoursInput, { target: { value: '4' } });

      const submitButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.addTask'),
      });
      expect(submitButton).not.toBeDisabled();
    });

    it('should show error when submitting with empty title', async () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');

      // Try to submit by clicking the button (it should be disabled, so we use form submit)
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(i18nT('sprint:sprintPlanning.addTaskModal.taskTitleRequired'))
        ).toBeInTheDocument();
      });
    });

    it('should show error when estimated hours is invalid', async () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      fireEvent.change(hoursInput, { target: { value: '-1' } });

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(i18nT('sprint:sprintPlanning.addTaskModal.hoursGreaterThanZero'))
        ).toBeInTheDocument();
      });
    });

    it('should clear error when user starts typing in title field', async () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(i18nT('sprint:sprintPlanning.addTaskModal.taskTitleRequired'))
        ).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'T' } });

      expect(
        screen.queryByText(i18nT('sprint:sprintPlanning.addTaskModal.taskTitleRequired'))
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSubmit with correct data when form is valid', async () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'Implement Feature' } });

      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      fireEvent.change(hoursInput, { target: { value: '8' } });

      const assigneeSelect = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.assigneeLabel')}`)
      );
      fireEvent.change(assigneeSelect, { target: { value: 'user-1' } });

      const submitButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.addTask'),
      });
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
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'Unassigned Task' } });

      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      fireEvent.change(hoursInput, { target: { value: '4' } });

      // Keep assignee as "Unassigned" (empty string)
      const submitButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.addTask'),
      });
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
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: '  Task with spaces  ' } });

      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      fireEvent.change(hoursInput, { target: { value: '4' } });

      const submitButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.addTask'),
      });
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
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const cancelButton = screen.getAllByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.cancel'),
      })[1];
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking overlay', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const overlay = screen.getByRole('presentation');
      fireEvent.click(overlay);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should not close when clicking modal content', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const modal = document.getElementById('add-task-form');
      fireEvent.click(modal);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should show unsaved changes modal when closing with changes', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      // Make a change
      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'Some Task' } });

      // Try to close
      const cancelButton = screen.getAllByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.cancel'),
      })[1];
      fireEvent.click(cancelButton);

      // Should show unsaved changes modal instead of closing
      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should close when confirming discard of unsaved changes', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      // Make a change
      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'Some Task' } });

      // Try to close
      const cancelButton = screen.getAllByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.cancel'),
      })[1];
      fireEvent.click(cancelButton);

      // Confirm discard
      const discardButton = screen.getByTestId('confirm-discard');
      fireEvent.click(discardButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should stay open when canceling discard of unsaved changes', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      // Make a change
      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'Some Task' } });

      // Try to close
      const cancelButton = screen.getAllByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.cancel'),
      })[1];
      fireEvent.click(cancelButton);

      // Cancel discard
      const cancelDiscardButton = screen.getByTestId('cancel-discard');
      fireEvent.click(cancelDiscardButton);

      // Modal should still be open
      expect(document.getElementById('add-task-form')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should close directly when no changes made', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const cancelButton = screen.getAllByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.cancel'),
      })[1];
      fireEvent.click(cancelButton);

      expect(screen.queryByTestId('unsaved-changes-modal')).not.toBeInTheDocument();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes on dialog', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'add-task-title');
    });

    it('should have required indicators on required fields', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      expect(titleInput).toHaveAttribute('aria-required', 'true');

      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      expect(hoursInput).toHaveAttribute('aria-required', 'true');
    });

    it('should update aria-invalid when validation fails', async () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      expect(titleInput).toHaveAttribute('aria-invalid', 'false');

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(titleInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have aria-describedby for error messages when invalid', async () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        const titleInput = screen.getByLabelText(
          new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
        );
        expect(titleInput).toHaveAttribute('aria-describedby', 'title-error');
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('should focus title input when modal opens', async () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      // The input should be focused after a short delay (setTimeout in component)
      await waitFor(() => {
        const titleInput = screen.getByLabelText(
          new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
        );
        expect(titleInput).toHaveFocus();
      });
    });

    it('should support tab navigation through form fields', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      const assigneeSelect = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.assigneeLabel')}`)
      );
      const cancelButton = screen.getAllByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.cancel'),
      })[1];
      const submitButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.addTask'),
      });

      // Tab order should follow DOM order
      expect(titleInput).toBeInTheDocument();
      expect(hoursInput).toBeInTheDocument();
      expect(assigneeSelect).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    it('should close modal on Escape key when no unsaved changes', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should show unsaved changes modal on Escape key when changes exist', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'Some Task' } });

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should trap focus: Tab from last enabled element wraps to first', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      // Fill in title and hours so Add Task button is enabled as last focusable
      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });
      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      fireEvent.change(hoursInput, { target: { value: '4' } });

      const submitButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.addTask'),
      });
      submitButton.focus();

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });

      const closeButton = screen.getByLabelText(i18nT('sprint:sprintPlanning.addTaskModal.cancel'));
      expect(closeButton).toHaveFocus();
    });

    it('should trap focus: Shift+Tab from first element wraps to last enabled element', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const closeButton = screen.getByLabelText(i18nT('sprint:sprintPlanning.addTaskModal.cancel'));
      closeButton.focus();

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      // Add Task button is disabled initially, so Cancel is the last enabled element
      // There are two buttons with "Cancel": close button (X) and footer Cancel button
      const cancelButtons = screen.getAllByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.cancel'),
      });
      // The footer Cancel button is the second one (index 1)
      expect(cancelButtons[1]).toHaveFocus();
    });
  });

  describe('Form Reset', () => {
    it('should reset form when modal reopens', () => {
      const { rerender } = renderWithProviders(<AddTaskModal {...defaultProps} isOpen={false} />);

      rerender(<AddTaskModal {...defaultProps} isOpen={true} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'Test Task' } });

      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      fireEvent.change(hoursInput, { target: { value: '5' } });

      rerender(<AddTaskModal {...defaultProps} isOpen={false} />);
      rerender(<AddTaskModal {...defaultProps} isOpen={true} />);

      expect(
        screen.getByLabelText(
          new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
        )
      ).toHaveValue('');
      const resetHoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      expect(resetHoursInput.value === '' || resetHoursInput.value === null).toBe(true);
    });

    it('should reset form fields on modal close and reopen', () => {
      const { rerender } = renderWithProviders(<AddTaskModal {...defaultProps} isOpen={true} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'My Task' } });

      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      fireEvent.change(hoursInput, { target: { value: '8' } });

      const assigneeSelect = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.assigneeLabel')}`)
      );
      fireEvent.change(assigneeSelect, { target: { value: 'user-1' } });

      rerender(<AddTaskModal {...defaultProps} isOpen={false} />);
      rerender(<AddTaskModal {...defaultProps} isOpen={true} />);

      expect(
        screen.getByLabelText(
          new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
        )
      ).toHaveValue('');
      expect(
        screen.getByLabelText(
          new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.assigneeLabel')}`)
        )
      ).toHaveValue('');
    });
  });

  describe('Form Input Interactions', () => {
    it('should allow typing in title field', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'New task title' } });

      expect(titleInput).toHaveValue('New task title');
    });

    it('should allow typing decimal hours', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      fireEvent.change(hoursInput, { target: { value: '4.5' } });

      expect(hoursInput).toHaveValue(4.5);
    });

    it('should handle selecting assignee', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const assigneeSelect = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.assigneeLabel')}`)
      );
      fireEvent.change(assigneeSelect, { target: { value: 'user-1' } });

      expect(assigneeSelect).toHaveValue('user-1');
    });

    it('should handle deselecting assignee (Unassigned)', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const assigneeSelect = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.assigneeLabel')}`)
      );
      fireEvent.change(assigneeSelect, { target: { value: 'user-1' } });
      expect(assigneeSelect).toHaveValue('user-1');

      fireEvent.change(assigneeSelect, { target: { value: '' } });
      expect(assigneeSelect).toHaveValue('');
    });
  });

  describe('Input Hints and Placeholders', () => {
    it('should display placeholder for title input', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      expect(titleInput).toHaveAttribute(
        'placeholder',
        i18nT('sprint:sprintPlanning.addTaskModal.titlePlaceholder')
      );
    });

    it('should display placeholder for hours input', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      expect(hoursInput).toHaveAttribute('placeholder', '4');
    });

    it('should display hint for title field', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      expect(
        screen.getByText(i18nT('sprint:sprintPlanning.addTaskModal.describeTaskHint'))
      ).toBeInTheDocument();
    });

    it('should display hint for hours field', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      expect(
        screen.getByText(i18nT('sprint:sprintPlanning.addTaskModal.hoursNeededHint'))
      ).toBeInTheDocument();
    });

    it('should display hint for assignee field', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      expect(
        screen.getByText(i18nT('sprint:sprintPlanning.addTaskModal.whoWillWorkHint'))
      ).toBeInTheDocument();
    });
  });

  describe('Team Members Display', () => {
    it('should display all team members in dropdown', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should handle empty team members list', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} teamMembers={[]} />);

      const assigneeSelect = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.assigneeLabel')}`)
      );
      expect(assigneeSelect).toHaveValue('');
      expect(
        screen.getByText(i18nT('sprint:sprintPlanning.addTaskModal.unassigned'))
      ).toBeInTheDocument();
    });

    it('should handle single team member', () => {
      renderWithProviders(
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

      renderWithProviders(<AddTaskModal {...defaultProps} teamMembers={manyMembers} />);

      for (let i = 0; i < 10; i++) {
        expect(screen.getByText(`Developer ${i}`)).toBeInTheDocument();
      }
    });
  });

  describe('Close Button and Overlay', () => {
    it('should have proper aria-label on close button', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const closeButton = screen.getByLabelText(i18nT('sprint:sprintPlanning.addTaskModal.cancel'));
      expect(closeButton).toBeInTheDocument();
    });

    it('should close on overlay click without changes', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const overlay = screen.getByRole('presentation');
      fireEvent.click(overlay);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should not close when clicking inside modal content', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.click(form);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Item Title Display', () => {
    it('should show itemTitle when provided', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} itemTitle="Backlog Item #123" />);

      expect(
        screen.getByText(
          new RegExp(i18nT('sprint:sprintPlanning.addTaskModal.addingTaskTo').trim())
        )
      ).toBeInTheDocument();
      expect(screen.getByText(/Backlog Item #123/i)).toBeInTheDocument();
    });

    it('should not show subtitle when itemTitle is undefined', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} itemTitle={undefined} />);

      expect(
        screen.queryByText(i18nT('sprint:sprintPlanning.addTaskModal.addingTaskTo'))
      ).not.toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should show progress bar', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const progressBar = document.querySelector('.progress-bar');
      expect(progressBar).toBeInTheDocument();
    });

    it('should update progress based on title filled', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      const progressFill = document.querySelector('.progress-fill');

      expect(progressFill).toBeInTheDocument();

      fireEvent.change(titleInput, { target: { value: 'Task' } });
    });
  });

  describe('Error Message Display', () => {
    it('should show error with role alert', async () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        const errorMessage = screen.getByText(
          i18nT('sprint:sprintPlanning.addTaskModal.taskTitleRequired')
        );
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should show both errors when both fields are invalid', async () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(i18nT('sprint:sprintPlanning.addTaskModal.taskTitleRequired'))
        ).toBeInTheDocument();
        expect(
          screen.getByText(i18nT('sprint:sprintPlanning.addTaskModal.hoursGreaterThanZero'))
        ).toBeInTheDocument();
      });
    });

    it('should clear hours error when hours become valid', async () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(
          screen.getByText(i18nT('sprint:sprintPlanning.addTaskModal.hoursGreaterThanZero'))
        ).toBeInTheDocument();
      });

      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      fireEvent.change(hoursInput, { target: { value: '4' } });

      expect(
        screen.queryByText(i18nT('sprint:sprintPlanning.addTaskModal.hoursGreaterThanZero'))
      ).not.toBeInTheDocument();
    });
  });

  describe('Form Submission Edge Cases', () => {
    it('should submit with valid form data', async () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.titleLabel')}`)
      );
      fireEvent.change(titleInput, { target: { value: 'Complete task' } });

      const hoursInput = screen.getByLabelText(
        new RegExp(`^${i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')}`)
      );
      fireEvent.change(hoursInput, { target: { value: '8' } });

      const submitButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.addTaskModal.addTask'),
      });
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
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const form = document.getElementById('add-task-form');
      fireEvent.submit(form);

      expect(defaultProps.onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Required Field Indicators', () => {
    it('should show required asterisk for title', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const titleLabel = screen.getByText(i18nT('sprint:sprintPlanning.addTaskModal.titleLabel'));
      expect(titleLabel.parentElement?.textContent).toContain('*');
    });

    it('should show required asterisk for hours', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const hoursLabel = screen.getByText(
        i18nT('sprint:sprintPlanning.addTaskModal.estimatedHoursLabel')
      );
      expect(hoursLabel.parentElement?.textContent).toContain('*');
    });

    it('should show Optional text for assignee', () => {
      renderWithProviders(<AddTaskModal {...defaultProps} />);

      const assigneeLabel = screen.getByText(
        i18nT('sprint:sprintPlanning.addTaskModal.assigneeLabel')
      );
      expect(assigneeLabel.parentElement?.textContent).toContain(
        i18nT('sprint:sprintPlanning.addTaskModal.optional')
      );
    });
  });
});
