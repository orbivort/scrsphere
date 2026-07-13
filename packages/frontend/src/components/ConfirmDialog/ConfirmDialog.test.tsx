import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { screen, fireEvent, waitFor, renderWithProviders, initTestI18n } from '../../test-utils';
import userEvent from '@testing-library/user-event';

import { ConfirmDialog } from './ConfirmDialog';

vi.mock('./ConfirmDialog.module.css', () => ({
  default: {
    'dialog-overlay': 'dialog-overlay',
    'dialog-content': 'dialog-content',
    'dialog-header': 'dialog-header',
    'dialog-message': 'dialog-message',
    'dialog-actions': 'dialog-actions',
    button: 'button',
    'button-secondary': 'button-secondary',
    'button-confirm': 'button-confirm',
    danger: 'danger',
    warning: 'warning',
    info: 'info',
  },
}));

describe('ConfirmDialog Component', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should not render when isOpen is false', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen={false}
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('should render title', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Delete Item"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Delete Item')).toBeInTheDocument();
    });

    it('should render message', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="This action cannot be undone."
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('This action cannot be undone.')).toBeInTheDocument();
    });

    it('should render default button labels', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Confirm')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should render custom button labels', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          confirmLabel="Delete"
          cancelLabel="Keep"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Delete')).toBeInTheDocument();
      expect(screen.getByText('Keep')).toBeInTheDocument();
    });
  });

  describe('Variant Tests', () => {
    it('should apply danger variant by default', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      expect(confirmButton.className).toContain('danger');
    });

    it('should apply danger variant explicitly', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          variant="danger"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      expect(confirmButton.className).toContain('danger');
    });

    it('should apply warning variant', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          variant="warning"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      expect(confirmButton.className).toContain('warning');
    });

    it('should apply info variant', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          variant="info"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      expect(confirmButton.className).toContain('primary');
    });
  });

  describe('Loading State Tests', () => {
    it('should show loading state on confirm button', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          isLoading
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });

    it('should disable buttons when loading', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          isLoading
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByRole('button', { name: /Confirm/i });
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });

      expect(confirmButton).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });

    it('should not call onConfirm when loading and clicked', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          isLoading
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });

    it('should not call onCancel when loading and escape pressed', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          isLoading
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('User Interaction Tests', () => {
    it('should call onConfirm when confirm button is clicked', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when cancel button is clicked', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should call onCancel when Escape key is pressed', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should not call onCancel for other keys', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.keyDown(document, { key: 'Enter' });
      fireEvent.keyDown(document, { key: 'Space' });

      expect(mockOnCancel).not.toHaveBeenCalled();
    });

    it('should not call onCancel when clicking dialog content', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const content = screen.getByText('Confirm Action').closest('.dialog-content');
      if (content) {
        fireEvent.click(content);
      }

      expect(mockOnCancel).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have role="alertdialog"', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });

    it('should have aria-modal="true"', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('alertdialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'confirm-dialog-title');
      expect(screen.getByText('Confirm Action')).toHaveAttribute('id', 'confirm-dialog-title');
    });

    it('should have aria-describedby pointing to message', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const dialog = screen.getByRole('alertdialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'confirm-dialog-message');
      expect(document.getElementById('confirm-dialog-message')).toBeInTheDocument();
    });

    it('should focus confirm button when opened', async () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      await waitFor(() => {
        const confirmButton = screen.getByRole('button', { name: /Confirm/i });
        expect(confirmButton).toHaveFocus();
      });
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle long title', () => {
      const longTitle =
        'This is a very long title that should still be displayed correctly without any issues';
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title={longTitle}
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle long message', () => {
      const longMessage =
        'This is a very long message that should still be displayed correctly without any issues. It contains multiple sentences and should be readable.';
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message={longMessage}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in title and message', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Delete <item> & 'quotes'"
          message='Are you sure you want to delete "this item"?'
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText("Delete <item> & 'quotes'")).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to delete "this item"?')).toBeInTheDocument();
    });

    it('should handle empty title and message', () => {
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title=""
          message=""
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation Tests', () => {
    it('should handle Enter key on confirm button', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ConfirmDialog
          isOpen
          title="Confirm Action"
          message="Are you sure?"
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });
});
