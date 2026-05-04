import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { KeyboardHelpModal, type KeyboardHelpModalProps } from './KeyboardHelpModal';

describe('KeyboardHelpModal', () => {
  const defaultProps: KeyboardHelpModalProps = {
    onClose: vi.fn(),
    modalRef: { current: null },
  };

  describe('Rendering', () => {
    it('should render modal with title', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });

    it('should render navigation shortcuts section', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Move focus to next element')).toBeInTheDocument();
    });

    it('should render task actions shortcuts section', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Task Actions')).toBeInTheDocument();
      expect(screen.getByText('Move task to next column')).toBeInTheDocument();
    });

    it('should render board actions section', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Board Actions')).toBeInTheDocument();
      expect(screen.getByText('Create new task')).toBeInTheDocument();
    });

    it('should render close button', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Close')).toBeInTheDocument();
    });

    it('should render help tip', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText(/Tip:/)).toBeInTheDocument();
      expect(screen.getByText(/Use the skip link/)).toBeInTheDocument();
    });
  });

  describe('Keyboard Shortcuts Content', () => {
    it('should display navigation shortcuts', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Shift')).toBeInTheDocument();
      expect(screen.getByText('Enter')).toBeInTheDocument();
      expect(screen.getByText('Escape')).toBeInTheDocument();
    });

    it('should display task action shortcuts', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Space')).toBeInTheDocument();
      expect(screen.getByText('e')).toBeInTheDocument();
      expect(screen.getByText('d')).toBeInTheDocument();
    });

    it('should display board action shortcuts', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

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

      render(<KeyboardHelpModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay clicked', async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();

      const { container } = render(<KeyboardHelpModal {...defaultProps} onClose={onClose} />);

      const overlay = container.querySelector('[role="dialog"]');
      if (overlay) {
        await user.click(overlay);
        expect(onClose).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('Accessibility', () => {
    it('should have correct dialog role', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('should have aria-labelledby pointing to title', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'keyboard-help-title');
    });

    it('should have aria-hidden on decorative icons', () => {
      const { container } = render(<KeyboardHelpModal {...defaultProps} />);

      const hiddenElements = container.querySelectorAll('[aria-hidden="true"]');
      expect(hiddenElements.length).toBeGreaterThan(0);
    });

    it('should have kbd elements for keyboard shortcuts', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      const kbdElements = document.querySelectorAll('kbd');
      expect(kbdElements.length).toBeGreaterThan(0);
    });

    it('should have aria-label on close button', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      const closeButton = screen.getByLabelText('Close keyboard shortcuts help');
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Structure', () => {
    it('should have shortcut sections', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Task Actions')).toBeInTheDocument();
      expect(screen.getByText('Board Actions')).toBeInTheDocument();
    });

    it('should have shortcut items with descriptions', () => {
      render(<KeyboardHelpModal {...defaultProps} />);

      expect(screen.getByText('Move focus to next element')).toBeInTheDocument();
      expect(screen.getByText('Move task to next column')).toBeInTheDocument();
      expect(screen.getByText('Create new task')).toBeInTheDocument();
    });
  });
});
