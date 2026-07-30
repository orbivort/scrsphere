import React from 'react';
import { screen, renderWithProviders, initTestI18n } from '../../../../test-utils';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll } from 'vitest';

import { KeyboardHelpModal, type KeyboardHelpModalProps } from './KeyboardHelpModal';

beforeAll(async () => {
  await initTestI18n();
});

describe('KeyboardHelpModal', () => {
  const defaultProps: KeyboardHelpModalProps = {
    onClose: vi.fn(),
    modalRef: { current: null },
  };

  describe('Rendering', () => {
    it('should render modal with title', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('should render navigation shortcuts section', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Move focus to next element')).toBeInTheDocument();
    });

    it('should render task actions shortcuts section', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Task Actions')).toBeInTheDocument();
      expect(screen.getByText('Move task to next column')).toBeInTheDocument();
    });

    it('should render board actions section', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Board Actions')).toBeInTheDocument();
      expect(screen.getByText('Create new task')).toBeInTheDocument();
    });

    it('should render close button', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should render help tip', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText(/Tip:/)).toBeInTheDocument();
      expect(screen.getByText(/Use the skip link/)).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts Content', () => {
    it('should display navigation shortcuts', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Shift')).toBeInTheDocument();
      expect(screen.getByText('Enter')).toBeInTheDocument();
      expect(screen.getByText('Escape')).toBeInTheDocument();
    });

    it('should display task action shortcuts', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Space')).toBeInTheDocument();
      expect(screen.getByText('e')).toBeInTheDocument();
      expect(screen.getByText('d')).toBeInTheDocument();
    });

    it('should display board action shortcuts', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('n')).toBeInTheDocument();
      expect(screen.getByText('b')).toBeInTheDocument();
      expect(screen.getByText('s')).toBeInTheDocument();
      expect(screen.getByText('?')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onClose when close button clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<KeyboardHelpModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      const { container } = renderWithProviders(
        <KeyboardHelpModal {...defaultProps} onClose={onClose} />
      );

      const overlay = container.querySelector('[role="dialog"]');
      if (overlay) {
        await user.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have correct dialog role', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'keyboard-help-title');
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });

    it('should have kbd elements for keyboard shortcuts', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      const kbdElements = document.querySelectorAll('kbd');
      expect(kbdElements.length).toBeGreaterThan(0);
    });

    it('should have aria-label on close button', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close keyboard shortcuts help');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    it('should have shortcut sections', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Task Actions')).toBeInTheDocument();
      expect(screen.getByText('Board Actions')).toBeInTheDocument();
    });

    it('should have shortcut items with descriptions', () => {
      renderWithProviders(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Move focus to next element')).toBeInTheDocument();
      expect(screen.getByText('Move task to next column')).toBeInTheDocument();
      expect(screen.getByText('Create new task')).toBeInTheDocument();
    });
  });
});
