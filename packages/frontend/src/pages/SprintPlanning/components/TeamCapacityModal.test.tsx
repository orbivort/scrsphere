import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { TeamCapacityModal, type TeamMemberAvailability } from './TeamCapacityModal';

// Mock CSS modules
vi.mock('./TeamCapacityModal.module.css', () => ({
  default: {
    overlay: 'overlay',
    modal: 'modal',
    'gradient-orb': 'gradient-orb',
    header: 'header',
    'header-content': 'header-content',
    'icon-wrapper': 'icon-wrapper',
    title: 'title',
    subtitle: 'subtitle',
    'close-button': 'close-button',
    'progress-bar': 'progress-bar',
    'progress-fill': 'progress-fill',
    body: 'body',
    'total-card': 'total-card',
    'total-icon': 'total-icon',
    'total-content': 'total-content',
    'total-label': 'total-label',
    'total-value': 'total-value',
    'reset-button': 'reset-button',
    'members-section': 'members-section',
    'section-title': 'section-title',
    'members-list': 'members-list',
    'member-row': 'member-row',
    'member-info': 'member-info',
    'member-avatar': 'member-avatar',
    'member-name': 'member-name',
    'hours-control': 'hours-control',
    'adjust-button': 'adjust-button',
    'hours-input-wrapper': 'hours-input-wrapper',
    'hours-input': 'hours-input',
    'hours-suffix': 'hours-suffix',
    'empty-state': 'empty-state',
    'empty-hint': 'empty-hint',
    'notice-box': 'notice-box',
    'notice-text': 'notice-text',
    footer: 'footer',
    'button-secondary': 'button-secondary',
    'button-primary': 'button-primary',
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

const mockTeamAvailability: TeamMemberAvailability[] = [
  { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 40 },
  { memberId: 'member-2', userId: 'user-2', memberName: 'Jane Smith', availableHours: 35 },
  { memberId: 'member-3', userId: 'user-3', memberName: 'Bob Wilson', availableHours: 40 },
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSave: vi.fn(),
  teamAvailability: mockTeamAvailability,
};

describe('TeamCapacityModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Team Capacity/i })).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<TeamCapacityModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display all team members', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should display total capacity', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      // Total should be 40 + 35 + 40 = 115
      expect(screen.getByText('115 hours')).toBeInTheDocument();
    });

    it('should display current hours for each member', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs).toHaveLength(3);
      expect(hourInputs[0]).toHaveValue(40);
      expect(hourInputs[1]).toHaveValue(35);
      expect(hourInputs[2]).toHaveValue(40);
    });

    it('should render action buttons', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Save Changes/i })).toBeInTheDocument();
    });

    it('should render empty state when no team members', () => {
      render(<TeamCapacityModal {...defaultProps} teamAvailability={[]} />);

      expect(screen.getByText(/No team members found/i)).toBeInTheDocument();
    });
  });

  describe('Hours Adjustment', () => {
    it('should increment hours when clicking plus button', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);
      fireEvent.click(incrementButtons[0]);

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(41);
    });

    it('should decrement hours when clicking minus button', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const decrementButtons = screen.getAllByLabelText(/Decrease hours for/i);
      fireEvent.click(decrementButtons[0]);

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(39);
    });

    it('should not decrement below 0', () => {
      render(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 0 },
          ]}
        />
      );

      const decrementButton = screen.getByLabelText(/Decrease hours for John Doe/i);
      expect(decrementButton).toBeDisabled();
    });

    it('should not increment above 60', () => {
      render(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 60 },
          ]}
        />
      );

      const incrementButton = screen.getByLabelText(/Increase hours for John Doe/i);
      expect(incrementButton).toBeDisabled();
    });

    it('should update hours via input field', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const hourInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(hourInputs[0], { target: { value: '25' } });

      expect(hourInputs[0]).toHaveValue(25);
    });

    it('should update total when hours change', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      // Initial total: 115
      expect(screen.getByText('115 hours')).toBeInTheDocument();

      const hourInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(hourInputs[0], { target: { value: '20' } });

      // New total: 20 + 35 + 40 = 95
      expect(screen.getByText('95 hours')).toBeInTheDocument();
    });

    it('should handle non-numeric input gracefully', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const hourInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(hourInputs[0], { target: { value: 'abc' } });

      // Should default to 0
      expect(hourInputs[0]).toHaveValue(0);
    });
  });

  describe('Save Functionality', () => {
    it('should disable save button when no changes made', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when changes are made', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);
      fireEvent.click(incrementButtons[0]);

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).not.toBeDisabled();
    });

    it('should call onSave with updated availability when saving', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      // Make a change
      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);
      fireEvent.click(incrementButtons[0]);

      // Save
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      fireEvent.click(saveButton);

      expect(defaultProps.onSave).toHaveBeenCalledWith([
        { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 41 },
        { memberId: 'member-2', userId: 'user-2', memberName: 'Jane Smith', availableHours: 35 },
        { memberId: 'member-3', userId: 'user-3', memberName: 'Bob Wilson', availableHours: 40 },
      ]);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });

  describe('Reset Functionality', () => {
    it('should show reset button when changes are made', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      // Initially no reset button
      expect(screen.queryByLabelText(/Reset changes/i)).not.toBeInTheDocument();

      // Make a change
      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);
      fireEvent.click(incrementButtons[0]);

      // Reset button should appear
      expect(screen.getByLabelText(/Reset changes/i)).toBeInTheDocument();
    });

    it('should reset to original values when clicking reset', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      // Make changes
      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);
      fireEvent.click(incrementButtons[0]);
      fireEvent.click(incrementButtons[1]);

      // Verify changes
      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(41);
      expect(hourInputs[1]).toHaveValue(36);

      // Reset
      const resetButton = screen.getByLabelText(/Reset changes/i);
      fireEvent.click(resetButton);

      // Verify reset
      expect(hourInputs[0]).toHaveValue(40);
      expect(hourInputs[1]).toHaveValue(35);
    });

    it('should hide reset button after resetting', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      // Make a change
      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);
      fireEvent.click(incrementButtons[0]);

      // Reset
      const resetButton = screen.getByLabelText(/Reset changes/i);
      fireEvent.click(resetButton);

      // Reset button should be hidden
      expect(screen.queryByLabelText(/Reset changes/i)).not.toBeInTheDocument();
    });
  });

  describe('Modal Close Behavior', () => {
    it('should call onClose when clicking cancel button without changes', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should show unsaved changes modal when closing with changes', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      // Make a change
      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);
      fireEvent.click(incrementButtons[0]);

      // Try to close
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Should show unsaved changes modal
      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should close when confirming discard of unsaved changes', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      // Make a change
      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);
      fireEvent.click(incrementButtons[0]);

      // Try to close
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Confirm discard
      const discardButton = screen.getByTestId('confirm-discard');
      fireEvent.click(discardButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should stay open when canceling discard of unsaved changes', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      // Make a change
      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);
      fireEvent.click(incrementButtons[0]);

      // Try to close
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Cancel discard
      const cancelDiscardButton = screen.getByTestId('cancel-discard');
      fireEvent.click(cancelDiscardButton);

      // Modal should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should call onClose when clicking overlay without changes', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const overlay = screen.getByRole('presentation');
      fireEvent.click(overlay);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should not close when clicking modal content', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const modal = screen.getByRole('dialog');
      fireEvent.click(modal);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes on dialog', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'capacity-modal-title');
    });

    it('should have accessible labels on hour inputs', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveAttribute('aria-label', 'John Doe available hours');
      expect(hourInputs[1]).toHaveAttribute('aria-label', 'Jane Smith available hours');
    });

    it('should have accessible labels on adjust buttons', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const decrementButtons = screen.getAllByLabelText(/Decrease hours for/i);
      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);

      expect(decrementButtons[0]).toHaveAttribute('aria-label', 'Decrease hours for John Doe');
      expect(incrementButtons[0]).toHaveAttribute('aria-label', 'Increase hours for John Doe');
    });

    it('should use list roles for member list', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });
  });

  describe('Member Avatar', () => {
    it('should display initials for each member', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe
      expect(screen.getByText('JS')).toBeInTheDocument(); // Jane Smith
      expect(screen.getByText('BW')).toBeInTheDocument(); // Bob Wilson
    });

    it('should handle single name members', () => {
      render(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'Madonna', availableHours: 40 },
          ]}
        />
      );

      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('should handle names with multiple parts', () => {
      render(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            {
              memberId: 'member-1',
              userId: 'user-1',
              memberName: 'John Jacob Jingleheimer Schmidt',
              availableHours: 40,
            },
          ]}
        />
      );

      expect(screen.getByText('JJ')).toBeInTheDocument(); // First two initials
    });
  });

  describe('Form State Management', () => {
    it('should reset to initial values when modal reopens', () => {
      const { rerender } = render(<TeamCapacityModal {...defaultProps} isOpen={false} />);

      rerender(<TeamCapacityModal {...defaultProps} isOpen={true} />);

      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);
      fireEvent.click(incrementButtons[0]);

      rerender(<TeamCapacityModal {...defaultProps} isOpen={false} />);
      rerender(<TeamCapacityModal {...defaultProps} isOpen={true} />);

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(40);
    });

    it('should update when teamAvailability prop changes', () => {
      const { rerender } = render(<TeamCapacityModal {...defaultProps} />);

      const newAvailability: TeamMemberAvailability[] = [
        {
          memberId: 'member-new',
          userId: 'user-new',
          memberName: 'New Member',
          availableHours: 20,
        },
      ];

      rerender(<TeamCapacityModal {...defaultProps} teamAvailability={newAvailability} />);

      expect(screen.getByText('New Member')).toBeInTheDocument();
      expect(screen.getByText('20 hours')).toBeInTheDocument();
    });

    it('should show total capacity as 0 when all members have 0 hours', () => {
      render(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 0 },
            { memberId: 'member-2', userId: 'user-2', memberName: 'Jane Smith', availableHours: 0 },
          ]}
        />
      );

      expect(screen.getByText('0 hours')).toBeInTheDocument();
    });

    it('should handle single team member correctly', () => {
      render(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            {
              memberId: 'member-1',
              userId: 'user-1',
              memberName: 'Solo Member',
              availableHours: 40,
            },
          ]}
        />
      );

      expect(screen.getByText('Solo Member')).toBeInTheDocument();
      expect(screen.getByText('40 hours')).toBeInTheDocument();
      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs).toHaveLength(1);
    });

    it('should handle large number of team members', () => {
      const manyMembers: TeamMemberAvailability[] = Array.from({ length: 10 }, (_, i) => ({
        memberId: `member-${i}`,
        userId: `user-${i}`,
        memberName: `Member ${i}`,
        availableHours: 40,
      }));

      render(<TeamCapacityModal {...defaultProps} teamAvailability={manyMembers} />);

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs).toHaveLength(10);
      expect(screen.getByText('400 hours')).toBeInTheDocument();
    });
  });

  describe('Hours Input Edge Cases', () => {
    it('should handle zero hours correctly', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const hourInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(hourInputs[0], { target: { value: '0' } });

      expect(hourInputs[0]).toHaveValue(0);
      const decrementButton = screen.getAllByLabelText(/Decrease hours for John Doe/i)[0];
      expect(decrementButton).toBeDisabled();
    });

    it('should handle maximum hours limit (60)', () => {
      render(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 60 },
          ]}
        />
      );

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(60);

      const incrementButton = screen.getByLabelText(/Increase hours for John Doe/i);
      expect(incrementButton).toBeDisabled();
    });

    it('should handle values at minimum boundary (0)', () => {
      render(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 0 },
          ]}
        />
      );

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(0);

      const decrementButton = screen.getByLabelText(/Decrease hours for John Doe/i);
      expect(decrementButton).toBeDisabled();
    });

    it('should update capacity when hours changed via input', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      expect(screen.getByText('115 hours')).toBeInTheDocument();

      const hourInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(hourInputs[0], { target: { value: '10' } });

      expect(screen.getByText('85 hours')).toBeInTheDocument();
    });
  });

  describe('Notice Box', () => {
    it('should display capacity information notice', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      expect(
        screen.getByText(/Capacity hours represent the total available time/i)
      ).toBeInTheDocument();
    });

    it('should display default hours notice', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      expect(screen.getByText(/The default is 40 hours/i)).toBeInTheDocument();
    });
  });

  describe('Hours Control Interactions', () => {
    it('should increment multiple times correctly', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);
      const hourInputs = screen.getAllByRole('spinbutton');

      fireEvent.click(incrementButtons[0]);
      fireEvent.click(incrementButtons[0]);
      fireEvent.click(incrementButtons[0]);

      expect(hourInputs[0]).toHaveValue(43);
    });

    it('should decrement multiple times correctly', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const decrementButtons = screen.getAllByLabelText(/Decrease hours for/i);
      const hourInputs = screen.getAllByRole('spinbutton');

      fireEvent.click(decrementButtons[0]);
      fireEvent.click(decrementButtons[0]);
      fireEvent.click(decrementButtons[0]);

      expect(hourInputs[0]).toHaveValue(37);
    });

    it('should not go below 0 when decrementing', () => {
      render(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 0 },
          ]}
        />
      );

      const decrementButton = screen.getByLabelText(/Decrease hours for John Doe/i);
      expect(decrementButton).toBeDisabled();

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(0);
    });

    it('should not exceed 60 when incrementing', () => {
      render(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 60 },
          ]}
        />
      );

      const incrementButton = screen.getByLabelText(/Increase hours for John Doe/i);
      expect(incrementButton).toBeDisabled();

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(60);
    });

    it('should enable save button after incrementing from 0', () => {
      render(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 0 },
          ]}
        />
      );

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).toBeDisabled();

      const incrementButton = screen.getByLabelText(/Increase hours for John Doe/i);
      fireEvent.click(incrementButton);

      expect(saveButton).not.toBeDisabled();
    });

    it('should enable save button after decrementing to 0', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      expect(saveButton).toBeDisabled();

      const decrementButtons = screen.getAllByLabelText(/Decrease hours for/i);
      fireEvent.click(decrementButtons[0]);

      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close modal on Escape key when no unsaved changes', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should show unsaved changes modal on Escape key when changes exist', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);
      fireEvent.click(incrementButtons[0]);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
    });

    it('should trap focus: Tab from last enabled element wraps to first', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      // Make changes so Save Changes button is enabled as the last focusable
      const incrementButtons = screen.getAllByLabelText(/Increase hours for/i);
      fireEvent.click(incrementButtons[0]);

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      saveButton.focus();

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });

      // First focusable element (close button) should receive focus
      const closeButton = screen.getByLabelText('Close modal');
      expect(closeButton).toHaveFocus();
    });

    it('should trap focus: Shift+Tab from first element wraps to last enabled element', () => {
      render(<TeamCapacityModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close modal');
      closeButton.focus();

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      // Last enabled focusable element (Cancel, since Save Changes is disabled) should receive focus
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      expect(cancelButton).toHaveFocus();
    });
  });
});
