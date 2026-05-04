import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import { PageErrorBoundary } from './PageErrorBoundary';

const ThrowError: React.FC<{ error?: Error }> = ({ error }) => {
  if (error) {
    throw error;
  }
  return <div>No error</div>;
};

const originalConsoleError = console.error;

vi.mock('./ErrorBoundary.module.css', () => ({
  default: {
    'page-error': 'page-error',
    'page-error-content': 'page-error-content',
    'page-error-title': 'page-error-title',
    'page-error-message': 'page-error-message',
    'page-error-actions': 'page-error-actions',
    'error-button': 'error-button',
    'error-button.primary': 'error-button primary',
    'error-button.secondary': 'error-button secondary',
    'error-details': 'error-details',
  },
}));

describe('PageErrorBoundary Component', () => {
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
        <PageErrorBoundary pageName="Dashboard">
          <div>Page content</div>
        </PageErrorBoundary>
      );

      expect(screen.getByText('Page content')).toBeInTheDocument();
    });

    it('should render error UI when an error is thrown', () => {
      render(
        <PageErrorBoundary pageName="Dashboard">
          <ThrowError error={new Error('Page error')} />
        </PageErrorBoundary>
      );

      expect(screen.getByText('Dashboard Error')).toBeInTheDocument();
    });

    it('should display page name in error title', () => {
      render(
        <PageErrorBoundary pageName="Sprint Board">
          <ThrowError error={new Error('Page error')} />
        </PageErrorBoundary>
      );

      expect(screen.getByText('Sprint Board Error')).toBeInTheDocument();
    });

    it('should display error message', () => {
      render(
        <PageErrorBoundary pageName="Dashboard">
          <ThrowError error={new Error('Page error')} />
        </PageErrorBoundary>
      );

      expect(
        screen.getByText(
          'We encountered an error while loading this page. This might be due to a temporary issue or a problem with your connection.'
        )
      ).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      render(
        <PageErrorBoundary pageName="Dashboard">
          <ThrowError error={new Error('Page error')} />
        </PageErrorBoundary>
      );

      const alertElement = screen.getByRole('alert');
      expect(alertElement).toHaveAttribute('aria-live', 'assertive');
    });
  });

  describe('User Interaction Tests', () => {
    it('should render Reload Page button', () => {
      render(
        <PageErrorBoundary pageName="Dashboard">
          <ThrowError error={new Error('Page error')} />
        </PageErrorBoundary>
      );

      expect(screen.getByText('Reload Page')).toBeInTheDocument();
    });

    it('should call onRetry callback when provided and Reload Page is clicked', () => {
      const onRetry = vi.fn();

      render(
        <PageErrorBoundary pageName="Dashboard" onRetry={onRetry}>
          <ThrowError error={new Error('Page error')} />
        </PageErrorBoundary>
      );

      const reloadButton = screen.getByText('Reload Page');
      fireEvent.click(reloadButton);

      expect(onRetry).toHaveBeenCalled();
    });

    it('should navigate to dashboard when Back to Dashboard button is clicked', () => {
      const originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: '' } as Location;

      render(
        <PageErrorBoundary pageName="Dashboard">
          <ThrowError error={new Error('Page error')} />
        </PageErrorBoundary>
      );

      const backButton = screen.getByText('Back to Dashboard');
      fireEvent.click(backButton);

      expect(window.location.href).toBe('/dashboard');

      window.location = originalLocation;
    });
  });

  describe('Error State Management Tests', () => {
    it('should reset error state when retry is triggered', async () => {
      const { container, rerender } = render(
        <PageErrorBoundary pageName="Dashboard">
          <ThrowError error={new Error('Page error')} />
        </PageErrorBoundary>
      );

      expect(screen.getByText('Dashboard Error')).toBeInTheDocument();

      // First, rerender with non-throwing children while still in error state
      rerender(
        <PageErrorBoundary pageName="Dashboard">
          <div>No error</div>
        </PageErrorBoundary>
      );

      // Verify error UI is still shown (because hasError is true)
      expect(container.querySelector('.page-error')).toBeInTheDocument();

      // Now click retry to reset the error state
      const reloadButton = screen.getByText('Reload Page');
      fireEvent.click(reloadButton);

      // After retry, the error boundary should show the children
      expect(container.querySelector('.page-error')).toBeNull();
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Edge Case Tests', () => {
    it('should handle errors with empty page name', () => {
      render(
        <PageErrorBoundary pageName="">
          <ThrowError error={new Error('Page error')} />
        </PageErrorBoundary>
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
    });

    it('should handle errors with special characters in page name', () => {
      render(
        <PageErrorBoundary pageName="Sprint's Board & Tasks">
          <ThrowError error={new Error('Page error')} />
        </PageErrorBoundary>
      );

      expect(screen.getByText("Sprint's Board & Tasks Error")).toBeInTheDocument();
    });
  });
});
