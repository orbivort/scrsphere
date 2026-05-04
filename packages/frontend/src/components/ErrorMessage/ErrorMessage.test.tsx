import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { ErrorMessage } from './ErrorMessage';

vi.mock('./ErrorMessage.module.css', () => ({
  default: {
    'error-message': 'error-message',
    error: 'error-message-error',
    warning: 'error-message-warning',
    info: 'error-message-info',
    'error-message-content': 'error-message-content',
    'error-message-icon': 'error-message-icon',
    'error-message-text': 'error-message-text',
    'error-message-title': 'error-message-title',
    'error-message-description': 'error-message-description',
    'error-message-dismiss': 'error-message-dismiss',
  },
}));

describe('ErrorMessage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should render with required message prop', () => {
      render(<ErrorMessage message="Test error message" />);

      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should render with title when provided', () => {
      render(<ErrorMessage message="Test error message" title="Error Title" />);

      expect(screen.getByText('Error Title')).toBeInTheDocument();
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });

    it('should render without title when not provided', () => {
      render(<ErrorMessage message="Test error message" />);

      expect(screen.queryByRole('strong')).not.toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <ErrorMessage message="Test error message" className="custom-class" />
      );

      expect(container.firstChild).toHaveClass('custom-class');
      expect(container.firstChild).toHaveClass('error-message');
    });

    it('should render with custom id', () => {
      render(<ErrorMessage message="Test error message" id="custom-error-id" />);

      const errorElement = document.getElementById('custom-error-id');
      expect(errorElement).toBeInTheDocument();
    });

    it('should generate unique id when not provided', () => {
      render(<ErrorMessage message="Test error message" />);

      const errorElement = document.querySelector('[id^="error-"]');
      expect(errorElement).toBeInTheDocument();
    });
  });

  describe('Error Type Tests', () => {
    it('should render error type by default', () => {
      const { container } = render(<ErrorMessage message="Test error message" />);

      expect(container.firstChild).toHaveClass('error-message-error');
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render error type explicitly', () => {
      const { container } = render(<ErrorMessage message="Test error message" type="error" />);

      expect(container.firstChild).toHaveClass('error-message-error');
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render warning type', () => {
      const { container } = render(<ErrorMessage message="Test warning message" type="warning" />);

      expect(container.firstChild).toHaveClass('error-message-warning');
      expect(container.querySelector('svg')).toBeInTheDocument();
    });

    it('should render info type', () => {
      const { container } = render(<ErrorMessage message="Test info message" type="info" />);

      expect(container.firstChild).toHaveClass('error-message-info');
      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('ARIA Role Tests', () => {
    it('should have alert role for error type', () => {
      render(<ErrorMessage message="Test error message" type="error" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have alert role for warning type', () => {
      render(<ErrorMessage message="Test warning message" type="warning" />);

      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('should have status role for info type', () => {
      render(<ErrorMessage message="Test info message" type="info" />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      const { container } = render(<ErrorMessage message="Test error message" />);

      expect(container.firstChild).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-atomic="true"', () => {
      const { container } = render(<ErrorMessage message="Test error message" />);

      expect(container.firstChild).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have aria-hidden on icon svg', () => {
      const { container } = render(<ErrorMessage message="Test error message" />);

      const iconSvg = container.querySelector('svg');
      expect(iconSvg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Dismiss Button Tests', () => {
    it('should render dismiss button when onDismiss is provided', () => {
      const onDismiss = vi.fn();
      render(<ErrorMessage message="Test error message" onDismiss={onDismiss} />);

      expect(screen.getByRole('button', { name: 'Dismiss error message' })).toBeInTheDocument();
    });

    it('should not render dismiss button when onDismiss is not provided', () => {
      render(<ErrorMessage message="Test error message" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = vi.fn();
      render(<ErrorMessage message="Test error message" onDismiss={onDismiss} />);

      const dismissButton = screen.getByRole('button', { name: 'Dismiss error message' });
      fireEvent.click(dismissButton);

      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle empty message', () => {
      render(<ErrorMessage message="" />);

      const messageElement = screen.getByRole('alert');
      expect(messageElement).toBeInTheDocument();
    });

    it('should handle long message', () => {
      const longMessage =
        'This is a very long error message that should still be displayed correctly without any issues or truncation.';
      render(<ErrorMessage message={longMessage} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should handle special characters in message', () => {
      const specialMessage = 'Error: <script>alert("xss")</script> & "quotes" \'apostrophes\'';
      render(<ErrorMessage message={specialMessage} />);

      expect(screen.getByText(specialMessage)).toBeInTheDocument();
    });

    it('should handle special characters in title', () => {
      render(<ErrorMessage message="Test message" title={'Error: <test> & \'quotes\' "double"'} />);

      expect(screen.getByText('Error: <test> & \'quotes\' "double"')).toBeInTheDocument();
    });
  });
});
