import React from 'react';
import { fireEvent } from '@testing-library/react';
import { screen, renderWithProviders, initTestI18n, i18nT } from '../../../test-utils';
import { vi, describe, it, expect, beforeEach, afterEach, beforeAll } from 'vitest';

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
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render modal when isOpen is true', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(
        screen.getByRole('heading', {
          name: i18nT('sprint:sprintPlanning.teamCapacityModal.title'),
        })
      ).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should display all team members', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });

    it('should display total capacity', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      // Total should be 40 + 35 + 40 = 115
      const hoursText = i18nT('sprint:sprintPlanning.teamCapacityModal.hours');
      expect(screen.getByText(`115 ${hoursText}`)).toBeInTheDocument();
    });

    it('should display current hours for each member', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs).toHaveLength(3);
      expect(hourInputs[0]).toHaveValue(40);
      expect(hourInputs[1]).toHaveValue(35);
      expect(hourInputs[2]).toHaveValue(40);
    });

    it('should render action buttons', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      // Cancel button - use getAllByRole since there are two Cancel buttons (close button and footer button)
      const cancelButtons = screen.getAllByRole('button', {
        name: i18nT('sprint:sprintPlanning.teamCapacityModal.cancel'),
      });
      expect(cancelButtons.length).toBe(2); // Both close button and Cancel button
      expect(
        screen.getByRole('button', {
          name: i18nT('sprint:sprintPlanning.teamCapacityModal.saveChanges'),
        })
      ).toBeInTheDocument();
    });

    it('should render empty state when no team members', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} teamAvailability={[]} />);

      expect(
        screen.getByText(i18nT('sprint:sprintPlanning.teamCapacityModal.noTeamMembers'))
      ).toBeInTheDocument();
    });
  });

  describe('Hours Adjustment', () => {
    it('should increment hours when clicking plus button', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const incrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(incrementButtons[0]);

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(41);
    });

    it('should decrement hours when clicking minus button', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const decrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.decreaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(decrementButtons[0]);

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(39);
    });

    it('should not decrement below 0', () => {
      renderWithProviders(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 0 },
          ]}
        />
      );

      const decrementButton = screen.getByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.decreaseHoursFor', { name: 'John Doe' })
      );
      expect(decrementButton).toBeDisabled();
    });

    it('should not increment above 60', () => {
      renderWithProviders(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 60 },
          ]}
        />
      );

      const incrementButton = screen.getByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      expect(incrementButton).toBeDisabled();
    });

    it('should update hours via input field', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const hourInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(hourInputs[0], { target: { value: '25' } });

      expect(hourInputs[0]).toHaveValue(25);
    });

    it('should update total when hours change', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      // Initial total: 115
      const hoursText = i18nT('sprint:sprintPlanning.teamCapacityModal.hours');
      expect(screen.getByText(`115 ${hoursText}`)).toBeInTheDocument();

      const hourInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(hourInputs[0], { target: { value: '20' } });

      // New total: 20 + 35 + 40 = 95
      expect(screen.getByText(`95 ${hoursText}`)).toBeInTheDocument();
    });

    it('should handle non-numeric input gracefully', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const hourInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(hourInputs[0], { target: { value: 'abc' } });

      // Should default to 0
      expect(hourInputs[0]).toHaveValue(0);
    });
  });

  describe('Save Functionality', () => {
    it('should disable save button when no changes made', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.teamCapacityModal.saveChanges'),
      });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when changes are made', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const incrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(incrementButtons[0]);

      const saveButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.teamCapacityModal.saveChanges'),
      });
      expect(saveButton).not.toBeDisabled();
    });

    it('should call onSave with updated availability when saving', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      // Make a change
      const incrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(incrementButtons[0]);

      // Save
      const saveButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.teamCapacityModal.saveChanges'),
      });
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
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      // Initially no reset button
      expect(
        screen.queryByLabelText(
          i18nT('sprint:sprintPlanning.teamCapacityModal.resetToOriginalValues')
        )
      ).not.toBeInTheDocument();

      // Make a change
      const incrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(incrementButtons[0]);

      // Reset button should appear
      expect(
        screen.getByLabelText(
          i18nT('sprint:sprintPlanning.teamCapacityModal.resetToOriginalValues')
        )
      ).toBeInTheDocument();
    });

    it('should reset to original values when clicking reset', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      // Make changes
      const incrementButtonsJohn = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      const incrementButtonsJane = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'Jane Smith' })
      );
      fireEvent.click(incrementButtonsJohn[0]);
      fireEvent.click(incrementButtonsJane[0]);

      // Verify changes
      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(41);
      expect(hourInputs[1]).toHaveValue(36);

      // Reset
      const resetButton = screen.getByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.resetToOriginalValues')
      );
      fireEvent.click(resetButton);

      // Verify reset
      expect(hourInputs[0]).toHaveValue(40);
      expect(hourInputs[1]).toHaveValue(35);
    });

    it('should hide reset button after resetting', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      // Make a change
      const incrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(incrementButtons[0]);

      // Reset
      const resetButton = screen.getByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.resetToOriginalValues')
      );
      fireEvent.click(resetButton);

      // Reset button should be hidden
      expect(
        screen.queryByLabelText(
          i18nT('sprint:sprintPlanning.teamCapacityModal.resetToOriginalValues')
        )
      ).not.toBeInTheDocument();
    });
  });

  describe('Modal Close Behavior', () => {
    it('should call onClose when clicking cancel button without changes', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      // Use getAllByRole to get both buttons, select the Cancel button in footer (index 1)
      const cancelButtons = screen.getAllByRole('button', {
        name: i18nT('sprint:sprintPlanning.teamCapacityModal.cancel'),
      });
      fireEvent.click(cancelButtons[1]); // Cancel button in footer

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should show unsaved changes modal when closing with changes', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      // Make a change
      const incrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(incrementButtons[0]);

      // Try to close - use getAllByRole to get both buttons, select Cancel button in footer (index 1)
      const cancelButtons = screen.getAllByRole('button', {
        name: i18nT('sprint:sprintPlanning.teamCapacityModal.cancel'),
      });
      fireEvent.click(cancelButtons[1]); // Cancel button in footer

      // Should show unsaved changes modal
      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should close when confirming discard of unsaved changes', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      // Make a change
      const incrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(incrementButtons[0]);

      // Try to close - use the Cancel button in footer (second one)
      const cancelButtons = screen.getAllByRole('button', {
        name: i18nT('sprint:sprintPlanning.teamCapacityModal.cancel'),
      });
      fireEvent.click(cancelButtons[1]); // Cancel button in footer

      // Confirm discard
      const discardButton = screen.getByTestId('confirm-discard');
      fireEvent.click(discardButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should stay open when canceling discard of unsaved changes', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      // Make a change
      const incrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(incrementButtons[0]);

      // Try to close - use the Cancel button in footer (second one)
      const cancelButtons = screen.getAllByRole('button', {
        name: i18nT('sprint:sprintPlanning.teamCapacityModal.cancel'),
      });
      fireEvent.click(cancelButtons[1]); // Cancel button in footer

      // Cancel discard
      const cancelDiscardButton = screen.getByTestId('cancel-discard');
      fireEvent.click(cancelDiscardButton);

      // Modal should still be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('should call onClose when clicking overlay without changes', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const overlay = screen.getByRole('presentation');
      fireEvent.click(overlay);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should not close when clicking modal content', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const modal = screen.getByRole('dialog');
      fireEvent.click(modal);

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct ARIA attributes on dialog', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'capacity-modal-title');
    });

    it('should have accessible labels on hour inputs', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveAttribute(
        'aria-label',
        i18nT('sprint:sprintPlanning.teamCapacityModal.availableHoursFor', { name: 'John Doe' })
      );
      expect(hourInputs[1]).toHaveAttribute(
        'aria-label',
        i18nT('sprint:sprintPlanning.teamCapacityModal.availableHoursFor', { name: 'Jane Smith' })
      );
    });

    it('should have accessible labels on adjust buttons', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const decrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.decreaseHoursFor', { name: 'John Doe' })
      );
      const incrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );

      expect(decrementButtons[0]).toHaveAttribute(
        'aria-label',
        i18nT('sprint:sprintPlanning.teamCapacityModal.decreaseHoursFor', { name: 'John Doe' })
      );
      expect(incrementButtons[0]).toHaveAttribute(
        'aria-label',
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
    });

    it('should use list roles for member list', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });
  });

  describe('Member Avatar', () => {
    it('should display initials for each member', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      expect(screen.getByText('JD')).toBeInTheDocument(); // John Doe
      expect(screen.getByText('JS')).toBeInTheDocument(); // Jane Smith
      expect(screen.getByText('BW')).toBeInTheDocument(); // Bob Wilson
    });

    it('should handle single name members', () => {
      renderWithProviders(
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
      renderWithProviders(
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
      const { rerender } = renderWithProviders(
        <TeamCapacityModal {...defaultProps} isOpen={false} />
      );

      rerender(<TeamCapacityModal {...defaultProps} isOpen={true} />);

      const incrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(incrementButtons[0]);

      rerender(<TeamCapacityModal {...defaultProps} isOpen={false} />);
      rerender(<TeamCapacityModal {...defaultProps} isOpen={true} />);

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(40);
    });

    it('should update when teamAvailability prop changes', () => {
      const { rerender } = renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const newAvailability: TeamMemberAvailability[] = [
        {
          memberId: 'member-new',
          userId: 'user-new',
          memberName: 'New Member',
          availableHours: 20,
        },
      ];

      rerender(<TeamCapacityModal {...defaultProps} teamAvailability={newAvailability} />);

      const hoursText = i18nT('sprint:sprintPlanning.teamCapacityModal.hours');
      expect(screen.getByText('New Member')).toBeInTheDocument();
      expect(screen.getByText(`20 ${hoursText}`)).toBeInTheDocument();
    });

    it('should show total capacity as 0 when all members have 0 hours', () => {
      renderWithProviders(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 0 },
            { memberId: 'member-2', userId: 'user-2', memberName: 'Jane Smith', availableHours: 0 },
          ]}
        />
      );

      const hoursText = i18nT('sprint:sprintPlanning.teamCapacityModal.hours');
      expect(screen.getByText(`0 ${hoursText}`)).toBeInTheDocument();
    });

    it('should handle single team member correctly', () => {
      renderWithProviders(
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

      const hoursText = i18nT('sprint:sprintPlanning.teamCapacityModal.hours');
      expect(screen.getByText('Solo Member')).toBeInTheDocument();
      expect(screen.getByText(`40 ${hoursText}`)).toBeInTheDocument();
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

      renderWithProviders(<TeamCapacityModal {...defaultProps} teamAvailability={manyMembers} />);

      const hoursText = i18nT('sprint:sprintPlanning.teamCapacityModal.hours');
      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs).toHaveLength(10);
      expect(screen.getByText(`400 ${hoursText}`)).toBeInTheDocument();
    });
  });

  describe('Hours Input Edge Cases', () => {
    it('should handle zero hours correctly', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const hourInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(hourInputs[0], { target: { value: '0' } });

      expect(hourInputs[0]).toHaveValue(0);
      const decrementButton = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.decreaseHoursFor', { name: 'John Doe' })
      )[0];
      expect(decrementButton).toBeDisabled();
    });

    it('should handle maximum hours limit (60)', () => {
      renderWithProviders(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 60 },
          ]}
        />
      );

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(60);

      const incrementButton = screen.getByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      expect(incrementButton).toBeDisabled();
    });

    it('should handle values at minimum boundary (0)', () => {
      renderWithProviders(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 0 },
          ]}
        />
      );

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(0);

      const decrementButton = screen.getByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.decreaseHoursFor', { name: 'John Doe' })
      );
      expect(decrementButton).toBeDisabled();
    });

    it('should update capacity when hours changed via input', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const hoursText = i18nT('sprint:sprintPlanning.teamCapacityModal.hours');
      expect(screen.getByText(`115 ${hoursText}`)).toBeInTheDocument();

      const hourInputs = screen.getAllByRole('spinbutton');
      fireEvent.change(hourInputs[0], { target: { value: '10' } });

      expect(screen.getByText(`85 ${hoursText}`)).toBeInTheDocument();
    });
  });

  describe('Notice Box', () => {
    it('should display capacity information notice', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      expect(
        screen.getByText(i18nT('sprint:sprintPlanning.teamCapacityModal.capacityNotice'))
      ).toBeInTheDocument();
    });
  });

  describe('Hours Control Interactions', () => {
    it('should increment multiple times correctly', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const incrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      const hourInputs = screen.getAllByRole('spinbutton');

      fireEvent.click(incrementButtons[0]);
      fireEvent.click(incrementButtons[0]);
      fireEvent.click(incrementButtons[0]);

      expect(hourInputs[0]).toHaveValue(43);
    });

    it('should decrement multiple times correctly', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const decrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.decreaseHoursFor', { name: 'John Doe' })
      );
      const hourInputs = screen.getAllByRole('spinbutton');

      fireEvent.click(decrementButtons[0]);
      fireEvent.click(decrementButtons[0]);
      fireEvent.click(decrementButtons[0]);

      expect(hourInputs[0]).toHaveValue(37);
    });

    it('should not go below 0 when decrementing', () => {
      renderWithProviders(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 0 },
          ]}
        />
      );

      const decrementButton = screen.getByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.decreaseHoursFor', { name: 'John Doe' })
      );
      expect(decrementButton).toBeDisabled();

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(0);
    });

    it('should not exceed 60 when incrementing', () => {
      renderWithProviders(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 60 },
          ]}
        />
      );

      const incrementButton = screen.getByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      expect(incrementButton).toBeDisabled();

      const hourInputs = screen.getAllByRole('spinbutton');
      expect(hourInputs[0]).toHaveValue(60);
    });

    it('should enable save button after incrementing from 0', () => {
      renderWithProviders(
        <TeamCapacityModal
          {...defaultProps}
          teamAvailability={[
            { memberId: 'member-1', userId: 'user-1', memberName: 'John Doe', availableHours: 0 },
          ]}
        />
      );

      const saveButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.teamCapacityModal.saveChanges'),
      });
      expect(saveButton).toBeDisabled();

      const incrementButton = screen.getByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(incrementButton);

      expect(saveButton).not.toBeDisabled();
    });

    it('should enable save button after decrementing to 0', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.teamCapacityModal.saveChanges'),
      });
      expect(saveButton).toBeDisabled();

      const decrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.decreaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(decrementButtons[0]);

      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should close modal on Escape key when no unsaved changes', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should show unsaved changes modal on Escape key when changes exist', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      const incrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(incrementButtons[0]);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(screen.getByTestId('unsaved-changes-modal')).toBeInTheDocument();
    });

    it('should trap focus: Tab from last enabled element wraps to first', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      // Make changes so Save Changes button is enabled as the last focusable
      const incrementButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.increaseHoursFor', { name: 'John Doe' })
      );
      fireEvent.click(incrementButtons[0]);

      const saveButton = screen.getByRole('button', {
        name: i18nT('sprint:sprintPlanning.teamCapacityModal.saveChanges'),
      });
      saveButton.focus();

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });

      // First focusable element (close button) should receive focus
      // There are two buttons with "Cancel" label, so we select the first one (close button)
      const closeButtons = screen.getAllByLabelText(
        i18nT('sprint:sprintPlanning.teamCapacityModal.cancel')
      );
      expect(closeButtons[0]).toHaveFocus(); // Close button is first
    });

    it('should trap focus: Shift+Tab from first element wraps to last enabled element', () => {
      renderWithProviders(<TeamCapacityModal {...defaultProps} />);

      // Use getAllByRole to get both buttons - close button (first) and Cancel button in footer (second)
      const cancelButtons = screen.getAllByRole('button', {
        name: i18nT('sprint:sprintPlanning.teamCapacityModal.cancel'),
      });
      cancelButtons[0].focus(); // Close button is first

      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });

      // Last enabled focusable element (Cancel, since Save Changes is disabled) should receive focus
      expect(cancelButtons[1]).toHaveFocus(); // Cancel button in footer is second
    });
  });
});
