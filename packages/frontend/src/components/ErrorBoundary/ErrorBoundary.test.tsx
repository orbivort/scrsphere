import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest';
import { createRef } from 'react';
import { screen, fireEvent, renderWithProviders, act } from '@/test-utils';

import { initTestI18n, i18nT } from '@/test-utils';
import { ErrorBoundary } from './ErrorBoundary';
import { APIErrorBoundary } from './APIErrorBoundary';
import { getTestI18nInstance } from '@/i18n/testConfig';

const ThrowError: React.FC<{ error?: Error }> = ({ error }) => {
  if (error) {
    throw error;
  }
  return <div>No error</div>;
};

const originalConsoleError = console.error;

vi.mock('./ErrorBoundary.module.css', () => ({
  default: {
    'error-boundary': 'error-boundary',
    'error-boundary-container': 'error-boundary-container',
    'error-icon': 'error-icon',
    'error-title': 'error-title',
    'error-message': 'error-message',
    'error-details': 'error-details',
    'error-actions': 'error-actions',
    'error-button': 'error-button',
    'error-button.primary': 'error-button primary',
    'error-button.secondary': 'error-button secondary',
    'api-error-boundary': 'api-error-boundary',
    'api-error-container': 'api-error-container',
    'api-error-icon': 'api-error-icon',
    'api-error-title': 'api-error-title',
    'api-error-message': 'api-error-message',
    'api-error-button': 'api-error-button',
  },
}));

// react-i18next's withTranslation attaches the underlying class to the
// `WrappedComponent` static, letting tests exercise instance methods that are
// not wired up to any UI (e.g. handleReset / handleRetry at the retry limit).
interface ErrorBoundaryClassProps {
  children?: React.ReactNode;
  t: (key: string, options?: Record<string, string>) => string;
  i18n: object;
  tReady: boolean;
  maxRetries?: number;
}

interface ErrorBoundaryInstance {
  handleReset: () => void;
  handleRetry: () => void;
}

const ErrorBoundaryClass = (
  ErrorBoundary as unknown as {
    WrappedComponent: React.ForwardRefExoticComponent<
      ErrorBoundaryClassProps & React.RefAttributes<ErrorBoundaryInstance>
    >;
  }
).WrappedComponent;

describe('ErrorBoundary Component', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should render children when no error occurs', () => {
      renderWithProviders(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render error UI when an error is thrown', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('Test error')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.title'))).toBeInTheDocument();
    });

    it('should render custom fallback when provided', () => {
      renderWithProviders(
        <ErrorBoundary fallback={<div>Custom fallback</div>}>
          <ThrowError error={new Error('Test error')} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Custom fallback')).toBeInTheDocument();
      expect(screen.queryByText(i18nT('errorBoundary.title'))).not.toBeInTheDocument();
    });

    it('should display error icon', () => {
      const { container } = renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('Test error')} />
        </ErrorBoundary>
      );

      expect(container.querySelector('svg')).toBeInTheDocument();
    });
  });

  describe('Error Categorization Tests', () => {
    it('should display network error message for Network Error', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('Network Error: Failed to fetch')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.networkError'))).toBeInTheDocument();
    });

    it('should display auth error message for 401 errors', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('401 Unauthorized')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.authError'))).toBeInTheDocument();
    });

    it('should display validation error message for 400 errors', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('400 Bad Request')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.validationError'))).toBeInTheDocument();
    });

    it('should display not found error message for 404 errors', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('404 Not Found')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.notFoundError'))).toBeInTheDocument();
    });

    it('should display generic error message for unknown errors', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('Unknown error')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.runtimeError'))).toBeInTheDocument();
    });

    it('should display validation error for 422 errors', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('422 Unprocessable Entity')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.validationError'))).toBeInTheDocument();
    });

    it('should display validation error for validation keyword', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('validation failed')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.validationError'))).toBeInTheDocument();
    });

    it('should display i18n error message for i18n resource failures', () => {
      renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('Failed to load i18n locale resources')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.i18nError'))).toBeInTheDocument();
    });
  });

  describe('User Interaction Tests', () => {
    it('should show Try Again button when retries are available', () => {
      renderWithProviders(
        <ErrorBoundary maxRetries={3}>
          <ThrowError error={new Error('Test error')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.tryAgain'))).toBeInTheDocument();
    });

    it('should hide Try Again button when max retries reached', () => {
      renderWithProviders(
        <ErrorBoundary maxRetries={0}>
          <ThrowError error={new Error('Test error')} />
        </ErrorBoundary>
      );

      expect(screen.queryByText(i18nT('errorBoundary.tryAgain'))).not.toBeInTheDocument();
    });

    it('should reset error state and render children again when Try Again is clicked', () => {
      const { container, rerender } = renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('Test error')} />
        </ErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.tryAgain'))).toBeInTheDocument();

      // Swap in non-throwing children while still in the error state
      rerender(
        <ErrorBoundary>
          <div>Recovered content</div>
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText(i18nT('errorBoundary.tryAgain')));

      expect(container.querySelector('.error-boundary')).toBeNull();
      expect(screen.getByText('Recovered content')).toBeInTheDocument();
    });

    it('should reload the page when Reload Page is clicked', () => {
      const reloadMock = vi.fn();
      vi.stubGlobal('location', { ...window.location, reload: reloadMock });

      renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('Test error')} />
        </ErrorBoundary>
      );

      fireEvent.click(screen.getByText(i18nT('errorBoundary.reloadPage')));
      expect(reloadMock).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });

  describe('safeT fallback and error handling', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    const mockGetFixedT = (tImpl: (key: string) => string) => {
      const i18nInstance = getTestI18nInstance();
      // i18next's getFixedT has overloaded types; casting through `never` keeps
      // the mock typed without reaching for `any`.
      vi.spyOn(i18nInstance, 'getFixedT').mockReturnValue(tImpl as never);
    };

    it('uses hardcoded English when t() returns the i18n key unchanged', () => {
      mockGetFixedT((key: string) => key);

      renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('Test error')} />
        </ErrorBoundary>
      );

      // FALLBACK_TEXT.runtimeError, distinct from the translated runtime message
      expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    });

    it('uses hardcoded English when t() throws', () => {
      mockGetFixedT(() => {
        throw new Error('i18n unavailable');
      });

      renderWithProviders(
        <ErrorBoundary>
          <ThrowError error={new Error('Test error')} />
        </ErrorBoundary>
      );

      expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
    });
  });

  describe('instance method coverage (direct class access)', () => {
    it('handleReset clears the error state and renders children again', () => {
      const instanceRef = createRef<ErrorBoundaryInstance>();
      const { container, rerender } = renderWithProviders(
        <ErrorBoundaryClass ref={instanceRef} t={() => ''} i18n={{}} tReady>
          <ThrowError error={new Error('Test error')} />
        </ErrorBoundaryClass>
      );

      expect(container.querySelector('.error-boundary')).toBeInTheDocument();

      // Swap in non-throwing children while still in the error state
      rerender(
        <ErrorBoundaryClass ref={instanceRef} t={() => ''} i18n={{}} tReady>
          <div>Recovered content</div>
        </ErrorBoundaryClass>
      );

      act(() => {
        instanceRef.current?.handleReset();
      });

      expect(container.querySelector('.error-boundary')).toBeNull();
      expect(screen.getByText('Recovered content')).toBeInTheDocument();
    });

    it('handleRetry is a no-op once the retry limit is reached', () => {
      const instanceRef = createRef<ErrorBoundaryInstance>();
      const { container, rerender } = renderWithProviders(
        <ErrorBoundaryClass ref={instanceRef} t={() => ''} i18n={{}} tReady maxRetries={0}>
          <ThrowError error={new Error('Test error')} />
        </ErrorBoundaryClass>
      );

      expect(container.querySelector('.error-boundary')).toBeInTheDocument();

      rerender(
        <ErrorBoundaryClass ref={instanceRef} t={() => ''} i18n={{}} tReady maxRetries={0}>
          <div>Recovered content</div>
        </ErrorBoundaryClass>
      );

      // retryCount (0) is not < maxRetries (0), so the state is not reset
      act(() => {
        instanceRef.current?.handleRetry();
      });

      expect(container.querySelector('.error-boundary')).toBeInTheDocument();
    });
  });
});

describe('APIErrorBoundary Component', () => {
  beforeAll(async () => {
    await initTestI18n();
  });

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
    vi.clearAllMocks();
  });

  describe('Component Rendering Tests', () => {
    it('should render children when no error occurs', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <div>API content</div>
        </APIErrorBoundary>
      );

      expect(screen.getByText('API content')).toBeInTheDocument();
    });

    it('should render error UI for network errors', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('Network Error')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.connectionError'))).toBeInTheDocument();
    });

    it('should render error UI for timeout errors', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('Request timeout')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.connectionError'))).toBeInTheDocument();
    });

    it('should render error UI for 401 errors', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('401 Unauthorized')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.connectionError'))).toBeInTheDocument();
    });

    it('should render error UI for 403 errors', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('403 Forbidden')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.connectionError'))).toBeInTheDocument();
    });

    it('should render error UI for 404 errors', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('404 Not Found')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.connectionError'))).toBeInTheDocument();
    });

    it('should render error UI for 500 errors', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('500 Internal Server Error')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.connectionError'))).toBeInTheDocument();
    });

    it('should render error UI for API errors', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('API request failed')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.connectionError'))).toBeInTheDocument();
    });
  });

  describe('Error Message Tests', () => {
    it('should display network error message', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('Network Error')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.networkError'))).toBeInTheDocument();
    });

    it('should display timeout error message', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('Request timeout')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.timeoutError'))).toBeInTheDocument();
    });

    it('should display 401 error message', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('401 Unauthorized')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.authError'))).toBeInTheDocument();
    });

    it('should display 403 error message', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('403 Forbidden')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.forbiddenError'))).toBeInTheDocument();
    });

    it('should display 404 error message', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('404 Not Found')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.notFoundError'))).toBeInTheDocument();
    });

    it('should display 500 error message', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('500 Internal Server Error')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.serverError'))).toBeInTheDocument();
    });

    it('should display generic error message for unknown API errors', () => {
      renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('API error')} />
        </APIErrorBoundary>
      );

      expect(screen.getByText(i18nT('errorBoundary.apiError'))).toBeInTheDocument();
    });
  });

  describe('User Interaction Tests', () => {
    it('should call onRetry when Retry button is clicked', () => {
      const onRetry = vi.fn();

      renderWithProviders(
        <APIErrorBoundary onRetry={onRetry}>
          <ThrowError error={new Error('Network Error')} />
        </APIErrorBoundary>
      );

      const retryButton = screen.getByText(i18nT('retry'));
      fireEvent.click(retryButton);

      expect(onRetry).toHaveBeenCalled();
    });

    it('should reset error state when Retry button is clicked', () => {
      const { container, rerender } = renderWithProviders(
        <APIErrorBoundary>
          <ThrowError error={new Error('Network Error')} />
        </APIErrorBoundary>
      );

      // First, rerender with non-throwing children while still in error state
      rerender(
        <APIErrorBoundary>
          <div>No error</div>
        </APIErrorBoundary>
      );

      // Verify error UI is still shown (because hasError is true)
      expect(container.querySelector('.api-error-boundary')).toBeInTheDocument();

      // Now click retry to reset the error state
      const retryButton = screen.getByText(i18nT('retry'));
      fireEvent.click(retryButton);

      // After retry, the error boundary should show the children
      expect(container.querySelector('.api-error-boundary')).toBeNull();
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Non-API Error Handling Tests', () => {
    it('should not catch non-API errors', () => {
      // Use an error message that doesn't contain any of the API error patterns
      // (Network Error, timeout, 401, 403, 404, 500, API)
      const nonAPIError = new Error('Generic runtime error');

      // Non-API errors should not be caught by APIErrorBoundary
      // The error boundary will re-throw them
      expect(() => {
        renderWithProviders(
          <APIErrorBoundary>
            <ThrowError error={nonAPIError} />
          </APIErrorBoundary>
        );
      }).toThrow('Generic runtime error');
    });
  });
});
