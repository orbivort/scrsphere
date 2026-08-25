import React from 'react';
import { renderWithProviders, screen, initTestI18n, i18nT } from '../../../../test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll } from 'vitest';

import { CancelSprintModal, type CancelSprintModalProps } from './CancelSprintModal';

describe('CancelSprintModal', () => {
  const defaultProps: CancelSprintModalProps = {
    sprintName: 'Sprint 1',
    isCancelling: false,
    cancelSprintError: null,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    modalRef: { current: null },
  };

  beforeAll(async () => {
    await initTestI18n();
  });

  const getConfirmButton = () => screen.getByRole('button', { name: /Cancel Sprint|Cancelling/i });

  describe('Rendering', () => {
    it('should render modal with dialog role', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('should render title with sprint name', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} />);

      expect(screen.getByRole('heading', { name: 'Cancel Sprint' })).toBeInTheDocument();
      expect(
        screen.getByText(i18nT('sprint:cancelSprint.warning', { sprintName: 'Sprint 1' }))
      ).toBeInTheDocument();
    });

    it('should render warning box with sprint name', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} sprintName="Sprint Alpha" />);

      expect(
        screen.getByText(i18nT('sprint:cancelSprint.warning', { sprintName: 'Sprint Alpha' }))
      ).toBeInTheDocument();
    });

    it('should render reason label, textarea and hint', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} />);

      expect(screen.getByText('Reason for cancellation')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Explain why the Sprint Goal has become obsolete...')
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          'This reason is recorded with the cancellation and shown in the Sprint history.'
        )
      ).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} />);

      expect(screen.getByText('Keep Sprint')).toBeInTheDocument();
      const confirmButton = getConfirmButton();
      expect(confirmButton).toBeInTheDocument();
    });

    it('should render close button with aria-label', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} />);

      expect(screen.getByLabelText('Close modal')).toBeInTheDocument();
    });
  });

  describe('Confirm button enabled/disabled state', () => {
    it('should disable confirm button when reason is empty', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} reason={'' as never} />);

      const confirmButton = getConfirmButton();
      expect(confirmButton).toBeDisabled();
    });

    it('should enable confirm button when reason has content', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CancelSprintModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(
        'Explain why the Sprint Goal has become obsolete...'
      );
      await user.type(textarea, 'Sprint goal obsolete');

      const confirmButton = getConfirmButton();
      expect(confirmButton).not.toBeDisabled();
    });

    it('should disable confirm button when reason is only whitespace', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CancelSprintModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(
        'Explain why the Sprint Goal has become obsolete...'
      );
      await user.type(textarea, '    ');

      const confirmButton = getConfirmButton();
      expect(confirmButton).toBeDisabled();
    });
  });

  describe('Reason input', () => {
    it('should update reason textarea on change', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CancelSprintModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(
        'Explain why the Sprint Goal has become obsolete...'
      ) as HTMLTextAreaElement;
      await user.type(textarea, 'Goal no longer relevant');

      expect(textarea.value).toBe('Goal no longer relevant');
    });

    it('should enforce maxLength of 500 characters', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} />);

      const textarea = screen.getByPlaceholderText(
        'Explain why the Sprint Goal has become obsolete...'
      ) as HTMLTextAreaElement;
      expect(textarea).toHaveAttribute('maxlength', '500');
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<CancelSprintModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByLabelText('Close modal'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when Keep Sprint button clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<CancelSprintModal {...defaultProps} onClose={onClose} />);

      await user.click(screen.getByText('Keep Sprint'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onConfirm with trimmed reason when confirm clicked', async () => {
      const onConfirm = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<CancelSprintModal {...defaultProps} onConfirm={onConfirm} />);

      const textarea = screen.getByPlaceholderText(
        'Explain why the Sprint Goal has become obsolete...'
      );
      await user.type(textarea, '  Sprint goal obsolete  ');
      await user.click(getConfirmButton());

      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onConfirm).toHaveBeenCalledWith('Sprint goal obsolete');
    });

    it('should not call onConfirm when reason empty and confirm clicked', async () => {
      const onConfirm = vi.fn();

      renderWithProviders(<CancelSprintModal {...defaultProps} onConfirm={onConfirm} />);

      const confirmButton = getConfirmButton();
      expect(confirmButton).toBeDisabled();
      // Button is disabled so clicking has no effect; calling directly is not possible via UI.
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should stop propagation when inner modal clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      renderWithProviders(<CancelSprintModal {...defaultProps} onClose={onClose} />);

      // Click on the modal body area (not a button) should not trigger close
      const body = screen.getByText('Reason for cancellation');
      await user.click(body);

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Error State', () => {
    it('should display error message when cancelSprintError present', () => {
      renderWithProviders(
        <CancelSprintModal {...defaultProps} cancelSprintError="Failed to cancel sprint" />
      );

      expect(screen.getByText('Failed to cancel sprint')).toBeInTheDocument();
    });

    it('should not display error message when cancelSprintError is null', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} cancelSprintError={null} />);

      expect(screen.queryByText('Failed to cancel sprint')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show processing text when cancelling', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} isCancelling={true} />);

      expect(screen.getByText('Cancelling...')).toBeInTheDocument();
    });

    it('should show confirm label when not cancelling', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} isCancelling={false} />);

      expect(getConfirmButton()).toHaveTextContent('Cancel Sprint');
    });

    it('should disable both buttons when cancelling', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} isCancelling={true} />);

      expect(screen.getByText('Keep Sprint')).toBeDisabled();
      expect(getConfirmButton()).toBeDisabled();
    });

    it('should set aria-busy on confirm button when cancelling', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} isCancelling={true} />);

      const confirmButton = getConfirmButton();
      expect(confirmButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should set aria-busy to false on confirm button when not cancelling', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} isCancelling={false} />);

      const confirmButton = getConfirmButton();
      expect(confirmButton).toHaveAttribute('aria-busy', 'false');
    });
  });

  describe('Accessibility', () => {
    it('should have correct dialog role with aria-modal', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'cancel-sprint-title');
    });

    it('should associate reason label with textarea via htmlFor/id', () => {
      renderWithProviders(<CancelSprintModal {...defaultProps} />);

      const label = screen.getByText('Reason for cancellation');
      expect(label).toHaveAttribute('for', 'cancel-sprint-reason');
      const textarea = screen.getByPlaceholderText(
        'Explain why the Sprint Goal has become obsolete...'
      );
      expect(textarea).toHaveAttribute('id', 'cancel-sprint-reason');
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = renderWithProviders(<CancelSprintModal {...defaultProps} />);

      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });

    it('should expose error message with role alert', () => {
      const { container } = renderWithProviders(
        <CancelSprintModal {...defaultProps} cancelSprintError="Failed to cancel sprint" />
      );

      const alerts = container.querySelectorAll('[role="alert"]');
      // warning box + error message
      expect(alerts.length).toBeGreaterThanOrEqual(2);
    });
  });
});
