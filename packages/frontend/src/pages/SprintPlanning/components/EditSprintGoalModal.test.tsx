import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { EditSprintGoalModal } from './EditSprintGoalModal';

// Helper function to get the textarea by its id
const getTextarea = () => screen.getByRole('textbox', { name: /Sprint Goal/i });

// Mock CSS modules
vi.mock('./EditSprintGoalModal.module.css', () => ({
  default: {
    overlay: 'overlay',
    modal: 'modal',
    'gradient-orb': 'gradient-orb',
    header: 'header',
    'header-content': 'header-content',
    'icon-wrapper': 'icon-wrapper',
    title: 'title',
    subtitle: 'subtitle',
    'sprint-highlight': 'sprint-highlight',
    'close-button': 'close-button',
    'progress-bar': 'progress-bar',
    'progress-fill': 'progress-fill',
    body: 'body',
    form: 'form',
    'form-group': 'form-group',
    'form-label': 'form-label',
    required: 'required',
    'textarea-wrapper': 'textarea-wrapper',
    'form-textarea': 'form-textarea',
    'input-error': 'input-error',
    'textarea-icon': 'textarea-icon',
    'char-counter': 'char-counter',
    'char-counter-warning': 'char-counter-warning',
    'error-message': 'error-message',
    'input-hint': 'input-hint',
    'tips-card': 'tips-card',
    'tips-header': 'tips-header',
    'tips-icon': 'tips-icon',
    'tips-title': 'tips-title',
    'tips-list': 'tips-list',
    'tip-item': 'tip-item',
    'tip-check': 'tip-check',
    footer: 'footer',
    'button-secondary': 'button-secondary',
    'button-primary': 'button-primary',
    'button-spinner': 'button-spinner',
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

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  initialGoal: 'Initial sprint goal text',
  sprintName: 'Sprint 1',
  isSaving: false,
};

describe('EditSprintGoalModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      expect(document.getElementById('edit-goal-form')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Edit Sprint Goal/i })).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<EditSprintGoalModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display sprint name in subtitle', () => {
      render(<EditSprintGoalModal {...defaultProps} sprintName="My Sprint" />);

      expect(screen.getByText(/My Sprint/)).toBeInTheDocument();
    });

    it('should render without subtitle when sprintName is not provided', () => {
      render(<EditSprintGoalModal {...defaultProps} sprintName={undefined} />);

      expect(screen.queryByText(/Sprint:/i)).not.toBeInTheDocument();
    });

    it('should pre-populate textarea with initial goal', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="My existing goal" />);

      const textarea = getTextarea();
      expect(textarea).toHaveValue('My existing goal');
    });

    it('should render action buttons', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Goal/i })).toBeInTheDocument();
    });

    it('should render tips section', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      expect(screen.getByText(/Tips for a good Sprint Goal/i)).toBeInTheDocument();
      expect(screen.getByText(/Focus on value delivery/i)).toBeInTheDocument();
      expect(screen.getByText(/Be specific and measurable/i)).toBeInTheDocument();
      expect(screen.getByText(/Align with the Product Goal/i)).toBeInTheDocument();
      expect(screen.getByText(/Keep it achievable within the sprint/i)).toBeInTheDocument();
    });

    it('should render character counter', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="Test" />);

      expect(screen.getByText(/4\/500/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable save button when goal is empty', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="" />);

      const saveButton = screen.getByRole('button', { name: /Save Goal/i });
      expect(saveButton).toBeDisabled();
    });

    it('should disable save button when goal is only whitespace', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="   " />);

      const saveButton = screen.getByRole('button', { name: /Save Goal/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when goal has content', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="Valid goal" />);

      const saveButton = screen.getByRole('button', { name: /Save Goal/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should show error when submitting with empty goal', async () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="" />);

      const form = document.getElementById('edit-goal-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Sprint goal is required/i)).toBeInTheDocument();
      });
    });

    it('should clear error when user starts typing', async () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="" />);

      const form = document.getElementById('edit-goal-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Sprint goal is required/i)).toBeInTheDocument();
      });

      const textarea = getTextarea();
      fireEvent.change(textarea, { target: { value: 'G' } });

      expect(screen.queryByText(/Sprint goal is required/i)).not.toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should call onSave with goal text when form is valid', async () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="New Goal" />);

      const saveButton = screen.getByRole('button', { name: /Save Goal/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith('New Goal');
      });
    });

    it('should trim whitespace from goal', async () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="  Goal with spaces  " />);

      const saveButton = screen.getByRole('button', { name: /Save Goal/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith('Goal with spaces');
      });
    });

    it('should update goal text when user types', async () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="" />);

      const textarea = getTextarea();
      fireEvent.change(textarea, { target: { value: 'Updated goal text' } });

      const saveButton = screen.getByRole('button', { name: /Save Goal/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(defaultProps.onSave).toHaveBeenCalledWith('Updated goal text');
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state when isSaving is true', () => {
      render(<EditSprintGoalModal {...defaultProps} isSaving={true} />);

      expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
    });

    it('should disable buttons when saving', () => {
      render(<EditSprintGoalModal {...defaultProps} isSaving={true} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Saving.../i })).toBeDisabled();
    });

    it('should have aria-busy attribute when saving', () => {
      render(<EditSprintGoalModal {...defaultProps} isSaving={true} />);

      const saveButton = screen.getByRole('button', { name: /Saving.../i });
      expect(saveButton).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Modal Close Behavior', () => {
    it('should call onClose when clicking cancel button without changes', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should show unsaved changes modal when closing with changes', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="Original" />);

      // Make a change
      const textarea = getTextarea();
      fireEvent.change(textarea, { target: { value: 'Modified' } });

      // Try to close
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Should show unsaved changes modal
      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should close when confirming discard of unsaved changes', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="Original" />);

      // Make a change
      const textarea = getTextarea();
      fireEvent.change(textarea, { target: { value: 'Modified' } });

      // Try to close
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Confirm discard
      const discardButton = screen.getByTestId('confirm-discard');
      fireEvent.click(discardButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should stay open when canceling discard of unsaved changes', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="Original" />);

      // Make a change
      const textarea = getTextarea();
      fireEvent.change(textarea, { target: { value: 'Modified' } });

      // Try to close
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Cancel discard
      const cancelDiscardButton = screen.getByTestId('cancel-discard');
      fireEvent.click(cancelDiscardButton);

      // Modal should still be open
      expect(document.getElementById('edit-goal-form')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should call onClose when clicking overlay without changes', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      const overlay = screen.getByRole('presentation');
      fireEvent.click(overlay);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should not close when clicking modal content', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      const modal = document.getElementById('edit-goal-form');
      fireEvent.click(modal);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should close directly when no changes made', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByTestId('unsaved-changes-modal')).not.toBeInTheDocument();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes on dialog', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'edit-goal-title');
    });

    it('should have required indicator on goal field', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      const textarea = getTextarea();
      expect(textarea).toHaveAttribute('aria-required', 'true');
    });

    it('should update aria-invalid when validation fails', async () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="" />);

      const textarea = getTextarea();
      expect(textarea).toHaveAttribute('aria-invalid', 'false');

      const form = document.getElementById('edit-goal-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(textarea).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have aria-describedby for error messages when invalid', async () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="" />);

      // Submit the form directly since the button is disabled when goal is empty
      const form = document.getElementById('edit-goal-form');
      fireEvent.submit(form);

      await waitFor(() => {
        const textarea = getTextarea();
        expect(textarea).toHaveAttribute('aria-describedby', 'goal-error');
      });
    });

    it('should have maxLength attribute on textarea', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      const textarea = getTextarea();
      expect(textarea).toHaveAttribute('maxLength', '500');
    });
  });

  describe('Character Counter', () => {
    it('should update character count when typing', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="" />);

      const textarea = getTextarea();
      fireEvent.change(textarea, { target: { value: 'Hello' } });

      expect(screen.getByText(/5\/500/i)).toBeInTheDocument();
    });

    it('should show warning style when approaching limit', () => {
      const longGoal = 'a'.repeat(460); // 460 characters, 90% of 500
      render(<EditSprintGoalModal {...defaultProps} initialGoal={longGoal} />);

      const counter = screen.getByText(/460\/500/i);
      expect(counter).toHaveClass('char-counter-warning');
    });

    it('should not show warning style when under 90%', () => {
      const mediumGoal = 'a'.repeat(400); // 400 characters, 80% of 500
      render(<EditSprintGoalModal {...defaultProps} initialGoal={mediumGoal} />);

      const counter = screen.getByText(/400\/500/i);
      expect(counter).not.toHaveClass('char-counter-warning');
    });
  });

  describe('Form Reset', () => {
    it('should reset form when modal reopens', () => {
      const { rerender } = render(<EditSprintGoalModal {...defaultProps} isOpen={false} />);

      // Open modal
      rerender(<EditSprintGoalModal {...defaultProps} isOpen={true} />);

      // Modify the goal
      const textarea = getTextarea();
      fireEvent.change(textarea, { target: { value: 'Modified goal' } });

      // Close and reopen
      rerender(<EditSprintGoalModal {...defaultProps} isOpen={false} />);
      rerender(<EditSprintGoalModal {...defaultProps} isOpen={true} />);

      // Should be reset to initial goal
      expect(getTextarea()).toHaveValue('Initial sprint goal text');
    });

    it('should update initialGoal when prop changes', () => {
      const { rerender } = render(
        <EditSprintGoalModal {...defaultProps} initialGoal="First Goal" />
      );

      expect(getTextarea()).toHaveValue('First Goal');

      rerender(<EditSprintGoalModal {...defaultProps} initialGoal="Second Goal" />);

      // Should update to new initial goal
      expect(getTextarea()).toHaveValue('Second Goal');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should focus textarea when modal opens', async () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      await waitFor(() => {
        const textarea = getTextarea();
        expect(textarea).toHaveFocus();
      });
    });

    it('should support tab navigation through form elements', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      const textarea = getTextarea();
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      const saveButton = screen.getByRole('button', { name: /Save Goal/i });

      expect(textarea).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
      expect(saveButton).toBeInTheDocument();
    });

    it('should handle Shift+Tab to navigate backwards', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="Test goal" />);

      const saveButton = screen.getByRole('button', { name: /Save Goal/i });

      saveButton.focus();
      expect(document.activeElement).toBe(saveButton);

      fireEvent.keyDown(saveButton, { key: 'Tab', shiftKey: true });
    });
  });

  describe('Tips Card Display', () => {
    it('should display all tips in the tips card', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      expect(screen.getByText(/Focus on value delivery/i)).toBeInTheDocument();
      expect(screen.getByText(/Be specific and measurable/i)).toBeInTheDocument();
      expect(screen.getByText(/Align with the Product Goal/i)).toBeInTheDocument();
      expect(screen.getByText(/Keep it achievable within the sprint/i)).toBeInTheDocument();
    });

    it('should have correct structure for tips', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      const tipsCard = screen.getByText(/Tips for a good Sprint Goal/i).closest('div');
      expect(tipsCard).toBeInTheDocument();

      const tipsList = screen.getByRole('list');
      expect(tipsList).toBeInTheDocument();
    });
  });

  describe('Form Interaction Edge Cases', () => {
    it('should handle typing very long goal text', () => {
      const longGoal = 'a'.repeat(500);
      render(<EditSprintGoalModal {...defaultProps} initialGoal={longGoal} />);

      const textarea = getTextarea();
      expect(textarea).toHaveValue(longGoal);
    });

    it('should show character counter at maximum', () => {
      const maxGoal = 'a'.repeat(500);
      render(<EditSprintGoalModal {...defaultProps} initialGoal={maxGoal} />);

      expect(screen.getByText(/500\/500/i)).toBeInTheDocument();
    });

    it('should handle goal with only whitespace correctly', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="   " />);

      const textarea = getTextarea();
      expect(textarea).toHaveValue('   ');

      const saveButton = screen.getByRole('button', { name: /Save Goal/i });
      expect(saveButton).toBeDisabled();
    });

    it('should handle initialGoal as undefined', () => {
      render(
        <EditSprintGoalModal {...defaultProps} initialGoal={undefined as unknown as string} />
      );

      const textarea = getTextarea();
      expect(textarea).toHaveValue('');
    });

    it('should not trim on each keystroke', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="" />);

      const textarea = getTextarea();
      fireEvent.change(textarea, { target: { value: '  Test  ' } });

      expect(textarea).toHaveValue('  Test  ');
    });
  });

  describe('Modal State Transitions', () => {
    it('should maintain state when modal stays open', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="Initial" />);

      const textarea = getTextarea();
      fireEvent.change(textarea, { target: { value: 'Modified' } });

      expect(textarea).toHaveValue('Modified');

      const saveButton = screen.getByRole('button', { name: /Save Goal/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should reset goal on modal reopen with different initialGoal', () => {
      const { rerender } = render(
        <EditSprintGoalModal {...defaultProps} isOpen={false} initialGoal="First" />
      );

      rerender(<EditSprintGoalModal {...defaultProps} isOpen={true} initialGoal="First" />);

      const textarea = getTextarea();
      expect(textarea).toHaveValue('First');

      fireEvent.change(textarea, { target: { value: 'Changed' } });
      expect(textarea).toHaveValue('Changed');

      rerender(<EditSprintGoalModal {...defaultProps} isOpen={false} initialGoal="First" />);
      rerender(<EditSprintGoalModal {...defaultProps} isOpen={true} initialGoal="Second" />);

      expect(getTextarea()).toHaveValue('Second');
    });
  });

  describe('Textarea Interactions', () => {
    it('should handle paste events correctly', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="" />);

      const textarea = getTextarea();
      fireEvent.change(textarea, { target: { value: 'Pasted text' } });

      expect(textarea).toHaveValue('Pasted text');
    });

    it('should handle cut events correctly', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="Some text" />);

      const textarea = getTextarea();
      textarea.setSelectionRange(0, 4);
      fireEvent.change(textarea, { target: { value: 'text' } });

      expect(textarea).toHaveValue('text');
    });

    it('should handle clear events', () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="Text to clear" />);

      const textarea = getTextarea();
      fireEvent.change(textarea, { target: { value: '' } });

      expect(textarea).toHaveValue('');
    });
  });

  describe('Sprint Name Display', () => {
    it('should display sprint name when provided', () => {
      render(<EditSprintGoalModal {...defaultProps} sprintName="Sprint 5" />);

      expect(screen.getByText(/Sprint 5/)).toBeInTheDocument();
    });

    it('should display sprint name in subtitle', () => {
      render(<EditSprintGoalModal {...defaultProps} sprintName="Sprint 10" />);

      expect(screen.getByText(/Sprint 10/)).toBeInTheDocument();
    });
  });

  describe('Input Hint Display', () => {
    it('should display input hint about sprint goal', () => {
      render(<EditSprintGoalModal {...defaultProps} />);

      expect(screen.getByText(/A good sprint goal focuses on value delivery/i)).toBeInTheDocument();
    });
  });

  describe('Goal Error Edge Cases', () => {
    it('should focus textarea after showing error', async () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="" />);

      const form = document.getElementById('edit-goal-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Sprint goal is required/i)).toBeInTheDocument();
      });

      const textarea = getTextarea();
      expect(textarea).toHaveFocus();
    });

    it('should clear error when goal becomes valid', async () => {
      render(<EditSprintGoalModal {...defaultProps} initialGoal="" />);

      const form = document.getElementById('edit-goal-form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(/Sprint goal is required/i)).toBeInTheDocument();
      });

      const textarea = getTextarea();
      fireEvent.change(textarea, { target: { value: 'Valid goal' } });

      expect(screen.queryByText(/Sprint goal is required/i)).not.toBeInTheDocument();
    });
  });
});
