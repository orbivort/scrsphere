import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { ToastContainer } from './ToastContainer';

import type { Toast } from '@/hooks/useToast';

vi.mock('./ToastContainer.module.css', () => ({
  default: {
    'toast-container': 'toast-container',
    toast: 'toast',
    'toast-success': 'toast-success',
    'toast-error': 'toast-error',
    'toast-warning': 'toast-warning',
    'toast-info': 'toast-info',
    'toast-icon': 'toast-icon',
    'toast-message': 'toast-message',
    'toast-close': 'toast-close',
  },
}));

vi.mock('../Icons', () => ({
  CheckCircleIcon: () => <svg data-testid="check-circle-icon" />,
  AlertTriangleIcon: () => <svg data-testid="alert-triangle-icon" />,
  InfoIcon: () => <svg data-testid="info-icon" />,
  XIcon: () => <svg data-testid="x-icon" />,
}));

const createMockToast = (type: Toast['type'], message: string): Toast => ({
  id: Math.random().toString(36).substring(2, 9),
  type,
  message,
});

describe('ToastContainer', () => {
  describe('Rendering Tests', () => {
    it('renders nothing when there are no toasts', () => {
      const { container } = render(<ToastContainer toasts={[]} onClose={vi.fn()} />);
      expect(container.firstChild).toBeNull();
    });

    it('renders the toast container when there are toasts', () => {
      const mockToast = createMockToast('success', 'Test success message');
      render(<ToastContainer toasts={[mockToast]} onClose={vi.fn()} />);
      expect(screen.getByRole('region', { name: /notifications/i })).toBeInTheDocument();
    });

    it('renders multiple toasts correctly', () => {
      const toasts = [
        createMockToast('success', 'First toast'),
        createMockToast('error', 'Second toast'),
        createMockToast('info', 'Third toast'),
      ];
      render(<ToastContainer toasts={toasts} onClose={vi.fn()} />);

      expect(screen.getAllByRole('alert')).toHaveLength(3);
      expect(screen.getByText('First toast')).toBeInTheDocument();
      expect(screen.getByText('Second toast')).toBeInTheDocument();
      expect(screen.getByText('Third toast')).toBeInTheDocument();
    });
  });

  describe('Toast Type Tests', () => {
    it('renders success toast with correct icon and style', () => {
      const mockToast = createMockToast('success', 'Success!');
      render(<ToastContainer toasts={[mockToast]} onClose={vi.fn()} />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('toast');
      expect(toast).toHaveClass('toast-success');
      expect(screen.getByText('Success!')).toBeInTheDocument();
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument();
    });

    it('renders error toast with correct icon and style', () => {
      const mockToast = createMockToast('error', 'Error occurred');
      render(<ToastContainer toasts={[mockToast]} onClose={vi.fn()} />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('toast');
      expect(toast).toHaveClass('toast-error');
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('renders warning toast with correct icon and style', () => {
      const mockToast = createMockToast('warning', 'Warning message');
      render(<ToastContainer toasts={[mockToast]} onClose={vi.fn()} />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('toast');
      expect(toast).toHaveClass('toast-warning');
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument();
    });

    it('renders info toast with correct icon and style', () => {
      const mockToast = createMockToast('info', 'Info message');
      render(<ToastContainer toasts={[mockToast]} onClose={vi.fn()} />);

      const toast = screen.getByRole('alert');
      expect(toast).toHaveClass('toast');
      expect(toast).toHaveClass('toast-info');
    });
  });

  describe('Interaction Tests', () => {
    it('calls onClose with the correct id when close button is clicked', async () => {
      const user = userEvent.setup();
      const onCloseMock = vi.fn();
      const mockToast = createMockToast('info', 'Click to close');

      render(<ToastContainer toasts={[mockToast]} onClose={onCloseMock} />);

      const closeButton = screen.getByLabelText(/close notification/i);
      await user.click(closeButton);

      expect(onCloseMock).toHaveBeenCalledTimes(1);
      expect(onCloseMock).toHaveBeenCalledWith(mockToast.id);
    });

    it('calls onClose with correct id for each toast when multiple toasts are present', async () => {
      const user = userEvent.setup();
      const onCloseMock = vi.fn();
      const toast1 = createMockToast('success', 'Toast 1');
      const toast2 = createMockToast('error', 'Toast 2');

      render(<ToastContainer toasts={[toast1, toast2]} onClose={onCloseMock} />);

      const closeButtons = screen.getAllByLabelText(/close notification/i);
      await user.click(closeButtons[1]);

      expect(onCloseMock).toHaveBeenCalledWith(toast2.id);
    });
  });

  describe('Accessibility Tests', () => {
    it('has proper accessibility attributes on container', () => {
      const mockToast = createMockToast('info', 'Accessibility test');
      render(<ToastContainer toasts={[mockToast]} onClose={vi.fn()} />);

      const container = screen.getByRole('region', { name: /notifications/i });
      expect(container).toBeInTheDocument();
    });

    it('has proper accessibility attributes on toast', () => {
      const mockToast = createMockToast('success', 'Accessible toast');
      render(<ToastContainer toasts={[mockToast]} onClose={vi.fn()} />);

      const toast = screen.getByRole('alert');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveAttribute('aria-live', 'polite');
    });

    it('close button has proper aria-label', () => {
      const mockToast = createMockToast('warning', 'Close me');
      render(<ToastContainer toasts={[mockToast]} onClose={vi.fn()} />);

      const closeButton = screen.getByLabelText(/close notification/i);
      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty toast message', () => {
      const mockToast = { ...createMockToast('info', ''), message: '' };
      render(<ToastContainer toasts={[mockToast]} onClose={vi.fn()} />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('handles special characters in message', () => {
      const specialMessage = 'Message with <script>alert("xss")</script> & special chars!';
      const mockToast = createMockToast('success', specialMessage);
      render(<ToastContainer toasts={[mockToast]} onClose={vi.fn()} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });
  });
});
