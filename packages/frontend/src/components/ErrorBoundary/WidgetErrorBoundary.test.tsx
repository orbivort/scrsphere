import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { WidgetErrorBoundary } from './WidgetErrorBoundary';

const ThrowError: React.FC<{ error?: Error }> = ({ error }) => {
  if (error) {
    throw error;
  }
  return <div>No error</div>;
};

const originalConsoleError = console.error;

vi.mock('./ErrorBoundary.module.css', () => ({
  default: {
    'widget-error': 'widget-error',
    'widget-error-content': 'widget-error-content',
    'widget-error-icon': 'widget-error-icon',
    'widget-error-message': 'widget-error-message',
    'widget-error-button': 'widget-error-button',
  },
}));

describe('WidgetErrorBoundary Component', () => {
  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should render children when no error occurs', () => {
      render(
        <WidgetErrorBoundary widgetName="Chart Widget">
          <div>Widget content</div>
        </WidgetErrorBoundary>
      );

      expect(screen.getByText('Widget content')).toBeInTheDocument();
    });

    it('should render error UI when an error is thrown', () => {
      render(
        <WidgetErrorBoundary widgetName="Chart Widget">
          <ThrowError error={new Error('Widget error')} />
        </WidgetErrorBoundary>
      );

      expect(screen.getByText('Chart Widget failed to load')).toBeInTheDocument();
    });

    it('should display widget name in error message', () => {
      render(
        <WidgetErrorBoundary widgetName="Statistics Panel">
          <ThrowError error={new Error('Widget error')} />
        </WidgetErrorBoundary>
      );

      expect(screen.getByText('Statistics Panel failed to load')).toBeInTheDocument();
    });

    it('should display warning icon', () => {
      render(
        <WidgetErrorBoundary widgetName="Chart Widget">
          <ThrowError error={new Error('Widget error')} />
        </WidgetErrorBoundary>
      );

      expect(screen.getByText('⚠️')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <WidgetErrorBoundary widgetName="Chart Widget">
          <ThrowError error={new Error('Widget error')} />
        </WidgetErrorBoundary>
      );

      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-label on retry button', () => {
      render(
        <WidgetErrorBoundary widgetName="Chart Widget">
          <ThrowError error={new Error('Widget error')} />
        </WidgetErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: 'Retry loading Chart Widget' });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('User Interaction Tests', () => {
    it('should call handleRetry when Retry button is clicked', () => {
      const { container, rerender } = render(
        <WidgetErrorBoundary widgetName="Chart Widget">
          <ThrowError error={new Error('Widget error')} />
        </WidgetErrorBoundary>
      );

      // First, rerender with non-throwing children while still in error state
      rerender(
        <WidgetErrorBoundary widgetName="Chart Widget">
          <div>No error</div>
        </WidgetErrorBoundary>
      );

      // Verify error UI is still shown (because hasError is true)
      expect(container.querySelector('.widget-error')).toBeInTheDocument();

      // Now click retry to reset the error state
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      // After retry, the error boundary should show the children
      expect(container.querySelector('.widget-error')).toBeNull();
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should call onRetry callback when provided and Retry is clicked', () => {
      const onRetry = vi.fn();

      render(
        <WidgetErrorBoundary widgetName="Chart Widget" onRetry={onRetry}>
          <ThrowError error={new Error('Widget error')} />
        </WidgetErrorBoundary>
      );

      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('Error State Management Tests', () => {
    it('should reset error state when retry is triggered', async () => {
      const { container, rerender } = render(
        <WidgetErrorBoundary widgetName="Chart Widget">
          <ThrowError error={new Error('Widget error')} />
        </WidgetErrorBoundary>
      );

      expect(screen.getByText('Chart Widget failed to load')).toBeInTheDocument();

      // First, rerender with non-throwing children while still in error state
      rerender(
        <WidgetErrorBoundary widgetName="Chart Widget">
          <div>No error</div>
        </WidgetErrorBoundary>
      );

      // Verify error UI is still shown (because hasError is true)
      expect(container.querySelector('.widget-error')).toBeInTheDocument();

      // Now click retry to reset the error state
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);

      // After retry, the error boundary should show the children
      expect(container.querySelector('.widget-error')).toBeNull();
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle errors with empty widget name', () => {
      render(
        <WidgetErrorBoundary widgetName="">
          <ThrowError error={new Error('Widget error')} />
        </WidgetErrorBoundary>
      );

      expect(screen.getByText('failed to load')).toBeInTheDocument();
    });

    it('should handle errors with special characters in widget name', () => {
      render(
        <WidgetErrorBoundary widgetName="User's Stats & Metrics">
          <ThrowError error={new Error('Widget error')} />
        </WidgetErrorBoundary>
      );

      expect(screen.getByText("User's Stats & Metrics failed to load")).toBeInTheDocument();
    });

    it('should handle long widget names', () => {
      const longName = 'Very Long Widget Name That Should Still Display Correctly';
      render(
        <WidgetErrorBoundary widgetName={longName}>
          <ThrowError error={new Error('Widget error')} />
        </WidgetErrorBoundary>
      );

      expect(screen.getByText(`${longName} failed to load`)).toBeInTheDocument();
    });
  });

  describe('Accessibility Tests', () => {
    it('should have warning icon with aria-hidden', () => {
      render(
        <WidgetErrorBoundary widgetName="Chart Widget">
          <ThrowError error={new Error('Widget error')} />
        </WidgetErrorBoundary>
      );

      const icon = screen.getByText('⚠️');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });

    it('should have button type attribute', () => {
      render(
        <WidgetErrorBoundary widgetName="Chart Widget">
          <ThrowError error={new Error('Widget error')} />
        </WidgetErrorBoundary>
      );

      const retryButton = screen.getByText('Retry');
      expect(retryButton).toHaveAttribute('type', 'button');
    });
  });
});
