import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

import { SessionWarningModal } from './SessionWarningModal';

vi.mock('./SessionWarningModal.module.css', () => ({
  default: {
    overlay: 'overlay',
    'overlay-visible': 'overlay-visible',
    'background-pulse': 'background-pulse',
    backdrop: 'backdrop',
    modal: 'modal',
    'modal-visible': 'modal-visible',
    urgent: 'urgent',
    'glow-border': 'glow-border',
    header: 'header',
    'icon-container': 'icon-container',
    'icon-urgent': 'icon-urgent',
    icon: 'icon',
    'icon-ring': 'icon-ring',
    title: 'title',
    message: 'message',
    'timer-container': 'timer-container',
    'timer-urgent': 'timer-urgent',
    'timer-icon': 'timer-icon',
    'timer-value': 'timer-value',
    'timer-pulse': 'timer-pulse',
    'button-container': 'button-container',
    'primary-button': 'primary-button',
    'secondary-button': 'secondary-button',
    'button-icon': 'button-icon',
    spinning: 'spinning',
  },
}));

vi.mock('../../hooks/useModalFocus', () => ({
  useModalFocus: vi.fn(() => ({ modalRef: { current: null } })),
}));

describe('SessionWarningModal Component', () => {
  const mockOnExtendSession = vi.fn();
  const mockOnLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should not render when isOpen is false', () => {
      render(
        <SessionWarningModal
          isOpen={false}
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.queryByText('Session Timeout Warning')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Session Timeout Warning')).toBeInTheDocument();
    });

    it('should display warning message', () => {
      render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(
        screen.getByText(
          'Your session will expire soon due to inactivity. You will be automatically logged out in:'
        )
      ).toBeInTheDocument();
    });

    it('should render Stay Logged In button', () => {
      render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Stay Logged In')).toBeInTheDocument();
    });

    it('should render Log Out button', () => {
      render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('Log Out')).toBeInTheDocument();
    });
  });

  describe('Countdown Timer Tests', () => {
    it('should display initial time remaining', () => {
      render(
        <SessionWarningModal
          isOpen
          timeRemaining={120000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('2:00')).toBeInTheDocument();
    });

    it('should countdown every second', () => {
      render(
        <SessionWarningModal
          isOpen
          timeRemaining={10000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('0:10')).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText('0:09')).toBeInTheDocument();
    });

    it('should call onLogout when countdown reaches zero', () => {
      render(
        <SessionWarningModal
          isOpen
          timeRemaining={1000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    it('should format time correctly for minutes and seconds', () => {
      const { rerender } = render(
        <SessionWarningModal
          isOpen
          timeRemaining={90000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('1:30')).toBeInTheDocument();

      rerender(
        <SessionWarningModal
          isOpen
          timeRemaining={45000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('0:45')).toBeInTheDocument();
    });

    it('should pad seconds with zero', () => {
      render(
        <SessionWarningModal
          isOpen
          timeRemaining={5000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('0:05')).toBeInTheDocument();
    });
  });

  describe('Urgent State Tests', () => {
    it('should apply urgent class when time is less than 30 seconds', () => {
      const { container } = render(
        <SessionWarningModal
          isOpen
          timeRemaining={25000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const modal = container.querySelector('.modal');
      expect(modal).toHaveClass('urgent');
    });

    it('should not apply urgent class when time is more than 30 seconds', () => {
      const { container } = render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const modal = container.querySelector('.modal');
      expect(modal).not.toHaveClass('urgent');
    });

    it('should transition to urgent state when countdown reaches 30 seconds', () => {
      const { container } = render(
        <SessionWarningModal
          isOpen
          timeRemaining={32000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const modal = container.querySelector('.modal');
      expect(modal).not.toHaveClass('urgent');

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(modal).toHaveClass('urgent');
    });
  });

  describe('User Interaction Tests', () => {
    it('should call onExtendSession when Stay Logged In button is clicked', async () => {
      mockOnExtendSession.mockResolvedValue(undefined);

      render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const extendButton = screen.getByText('Stay Logged In');
      fireEvent.click(extendButton);

      expect(mockOnExtendSession).toHaveBeenCalledTimes(1);
    });

    it('should call onLogout when Log Out button is clicked', () => {
      render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const logoutButton = screen.getByText('Log Out');
      fireEvent.click(logoutButton);

      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });

    it('should show loading state while extending session', async () => {
      let resolvePromise: () => void;
      mockOnExtendSession.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const extendButton = screen.getByText('Stay Logged In');
      fireEvent.click(extendButton);

      // Check loading state immediately after click
      expect(screen.getByText('Extending...')).toBeInTheDocument();

      // Resolve the promise to clean up
      resolvePromise!();
    });

    it('should disable button while extending session', async () => {
      let resolvePromise: () => void;
      mockOnExtendSession.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const extendButton = screen.getByText('Stay Logged In');
      fireEvent.click(extendButton);

      // Check disabled state immediately after click
      expect(extendButton).toBeDisabled();

      // Resolve the promise to clean up
      resolvePromise!();
    });

    it('should reset loading state after extending session', async () => {
      mockOnExtendSession.mockResolvedValue(undefined);

      render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const extendButton = screen.getByText('Stay Logged In');
      fireEvent.click(extendButton);

      // Wait for the async operation to complete and state to reset
      await act(async () => {
        await Promise.resolve();
      });

      expect(screen.getByText('Stay Logged In')).toBeInTheDocument();
    });

    it('should handle extend session error gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockOnExtendSession.mockRejectedValue(new Error('Failed to extend'));

      render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const extendButton = screen.getByText('Stay Logged In');
      fireEvent.click(extendButton);

      // Wait for the async operation to complete
      await act(async () => {
        await Promise.resolve();
      });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper heading structure', () => {
      render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByRole('button', { name: 'Stay Logged In' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Log Out' })).toBeInTheDocument();
    });

    it('should have alertdialog role for screen reader accessibility', () => {
      const { container } = render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const dialog = container.querySelector('[role="alertdialog"]');
      expect(dialog).toBeInTheDocument();
    });

    it('should have aria-modal attribute set to true', () => {
      const { container } = render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const dialog = container.querySelector('[aria-modal="true"]');
      expect(dialog).toBeInTheDocument();
    });

    it('should have aria-labelledby pointing to the title', () => {
      const { container } = render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const dialog = container.querySelector('[aria-labelledby="session-warning-title"]');
      expect(dialog).toBeInTheDocument();
      const title = container.querySelector('#session-warning-title');
      expect(title).toBeInTheDocument();
      expect(title?.textContent).toBe('Session Timeout Warning');
    });

    it('should have aria-describedby pointing to the message', () => {
      const { container } = render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const dialog = container.querySelector('[aria-describedby="session-warning-message"]');
      expect(dialog).toBeInTheDocument();
      const message = container.querySelector('#session-warning-message');
      expect(message).toBeInTheDocument();
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle zero time remaining', () => {
      render(
        <SessionWarningModal
          isOpen
          timeRemaining={0}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('0:00')).toBeInTheDocument();
    });

    it('should handle very large time remaining', () => {
      render(
        <SessionWarningModal
          isOpen
          timeRemaining={3600000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('60:00')).toBeInTheDocument();
    });

    it('should update countdown when timeRemaining prop changes', () => {
      const { rerender } = render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('1:00')).toBeInTheDocument();

      rerender(
        <SessionWarningModal
          isOpen
          timeRemaining={30000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(screen.getByText('0:30')).toBeInTheDocument();
    });

    it('should stop countdown when modal is closed', () => {
      const { rerender } = render(
        <SessionWarningModal
          isOpen
          timeRemaining={10000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      rerender(
        <SessionWarningModal
          isOpen={false}
          timeRemaining={10000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(mockOnLogout).not.toHaveBeenCalled();
    });
  });

  describe('Animation Tests', () => {
    it('should apply visible class after short delay', async () => {
      const { container } = render(
        <SessionWarningModal
          isOpen
          timeRemaining={60000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      act(() => {
        vi.advanceTimersByTime(20);
      });

      const overlay = container.querySelector('.overlay');
      expect(overlay).toHaveClass('overlay-visible');
    });

    it('should apply visible class when transitioning from closed to open', async () => {
      const { container, rerender } = render(
        <SessionWarningModal
          isOpen={false}
          timeRemaining={0}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      expect(container.querySelector('.overlay')).not.toBeInTheDocument();

      rerender(
        <SessionWarningModal
          isOpen
          timeRemaining={120000}
          onExtendSession={mockOnExtendSession}
          onLogout={mockOnLogout}
        />
      );

      const overlay = container.querySelector('.overlay');
      expect(overlay).toBeInTheDocument();
      expect(overlay).not.toHaveClass('overlay-visible');

      act(() => {
        vi.advanceTimersByTime(20);
      });

      expect(overlay).toHaveClass('overlay-visible');
      const modal = container.querySelector('.modal');
      expect(modal).toHaveClass('modal-visible');
    });
  });
});
