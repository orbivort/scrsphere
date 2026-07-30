import { Component, type ErrorInfo, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';

import styles from './ErrorBoundary.module.css';

import { AlertTriangleIcon } from '@/components/common/Icons';
import { logger } from '@/utils/logger';
import { errorReporter } from '@/utils/errorReporter';

enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  I18N = 'I18N',
  RUNTIME = 'RUNTIME',
}

/**
 * Hardcoded English fallbacks for error boundary text.
 * These are used when `t()` fails (e.g., i18n namespace not loaded),
 * ensuring the error boundary can always render meaningful text.
 */
const FALLBACK_TEXT = {
  title: 'Something went wrong',
  networkError: 'A network error occurred. Please check your connection.',
  authError: 'Authentication error. Please log in again.',
  validationError: 'The submitted data is invalid.',
  notFoundError: 'The requested resource was not found.',
  i18nError: 'Failed to load language resources. Please reload the page.',
  runtimeError: 'An unexpected error occurred.',
  defaultError: 'An error occurred.',
  devDetails: 'Developer Details',
  tryAgain: 'Try Again',
  reloadPage: 'Reload Page',
} as const;

/**
 * Safe translation wrapper that falls back to hardcoded English
 * when `t()` is unavailable or throws (e.g., i18n not initialized).
 */
function safeT(t: WithTranslation['t'], key: keyof typeof FALLBACK_TEXT): string {
  try {
    const i18nKey = `errorBoundary.${key}`;
    // Cast t to a loose signature to bypass i18next's strict key types.
    // The safeT wrapper itself guarantees correctness via FALLBACK_TEXT.
    const result = (t as (key: string) => string)(i18nKey);
    // If t() returns the key itself (missing translation), use fallback
    return result === i18nKey ? FALLBACK_TEXT[key] : result;
  } catch {
    return FALLBACK_TEXT[key];
  }
}

interface Props extends WithTranslation {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to structured logger
    logger.error('Error caught by boundary', undefined, {
      error,
      componentStack: errorInfo.componentStack,
    });

    // Report to error tracking service
    errorReporter.captureException(error, {
      componentName: 'ErrorBoundary',
      extra: { componentStack: errorInfo.componentStack },
    });

    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    });
  };

  handleRetry = (): void => {
    const { retryCount } = this.state;
    const { maxRetries = 3 } = this.props;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    }
  };

  handleReload = (): void => {
    window.location.reload();
  };

  private categorizeError(error: Error): ErrorType {
    // Detect i18n resource loading failures
    if (
      error.message.includes('i18n') ||
      error.message.includes('loadNamespace') ||
      error.message.includes('failed to load') ||
      error.message.includes('locales/')
    ) {
      return ErrorType.I18N;
    }
    if (error.message.includes('Network Error') || error.message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      return ErrorType.AUTH;
    }
    if (
      error.message.includes('400') ||
      error.message.includes('422') ||
      error.message.includes('validation')
    ) {
      return ErrorType.VALIDATION;
    }
    if (error.message.includes('404')) {
      return ErrorType.NOT_FOUND;
    }
    return ErrorType.RUNTIME;
  }

  private getErrorMessage(error: Error): string {
    const { t } = this.props;
    switch (this.categorizeError(error)) {
      case ErrorType.I18N:
        return safeT(t, 'i18nError');
      case ErrorType.NETWORK:
        return safeT(t, 'networkError');
      case ErrorType.AUTH:
        return safeT(t, 'authError');
      case ErrorType.VALIDATION:
        return safeT(t, 'validationError');
      case ErrorType.NOT_FOUND:
        return safeT(t, 'notFoundError');
      case ErrorType.RUNTIME:
        return safeT(t, 'runtimeError');
      default:
        return safeT(t, 'defaultError');
    }
  }

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback, t } = this.props;

    if (hasError) {
      if (fallback) {
        return fallback;
      }

      return (
        <div className={styles['error-boundary']}>
          <div className={styles['error-boundary-container']}>
            <div className={styles['error-icon']}>
              <AlertTriangleIcon size={48} />
            </div>
            <h1 className={styles['error-title']}>{safeT(t, 'title')}</h1>
            <p className={styles['error-message']}>
              {this.getErrorMessage(error ?? new Error('Unknown error'))}
            </p>

            {import.meta.env.DEV && error && (
              <details className={styles['error-details']}>
                <summary>{safeT(t, 'devDetails')}</summary>
                <pre>{error.toString()}</pre>
                {errorInfo?.componentStack && <pre>{errorInfo.componentStack}</pre>}
              </details>
            )}

            <div className={styles['error-actions']}>
              {this.state.retryCount < (this.props.maxRetries ?? 3) && (
                <button
                  className={`${styles['error-button']} ${styles['error-button.primary']}`}
                  onClick={this.handleRetry}
                >
                  {safeT(t, 'tryAgain')}
                </button>
              )}
              <button
                className={`${styles['error-button']} ${styles['error-button.secondary']}`}
                onClick={this.handleReload}
              >
                {safeT(t, 'reloadPage')}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export const ErrorBoundary: React.ComponentType<{
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  maxRetries?: number;
}> = withTranslation('common')(ErrorBoundaryClass);
