import { Component, type ErrorInfo, type ReactNode } from 'react';

import styles from './ErrorBoundary.module.css';

import { AlertTriangleIcon, PlugIcon } from '@/components/common/Icons';
import { logger } from '@/utils/logger';
import { errorReporter } from '@/utils/errorReporter';

enum ErrorType {
  NETWORK = 'NETWORK',
  AUTH = 'AUTH',
  VALIDATION = 'VALIDATION',
  NOT_FOUND = 'NOT_FOUND',
  RUNTIME = 'RUNTIME',
}

interface Props {
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

export class ErrorBoundary extends Component<Props, State> {
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
    switch (this.categorizeError(error)) {
      case ErrorType.NETWORK:
        return 'Unable to connect to the server. Please check your internet connection.';
      case ErrorType.AUTH:
        return 'Your session has expired. Please log in again.';
      case ErrorType.VALIDATION:
        return 'Invalid data provided. Please check your input.';
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.';
      case ErrorType.RUNTIME:
        return 'An unexpected error occurred. Please try again.';
      default:
        return 'An error occurred. Please try again later.';
    }
  }

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, fallback } = this.props;

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
            <h1 className={styles['error-title']}>Something went wrong</h1>
            <p className={styles['error-message']}>
              {this.getErrorMessage(error || new Error('Unknown error'))}
            </p>

            {import.meta.env.DEV && error && (
              <details className={styles['error-details']}>
                <summary>Error Details (Development Only)</summary>
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
                  Try Again
                </button>
              )}
              <button
                className={`${styles['error-button']} ${styles['error-button.secondary']}`}
                onClick={this.handleReload}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

interface APIErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

export class APIErrorBoundary extends Component<APIErrorBoundaryProps, State> {
  constructor(props: APIErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const isAPIError =
      error.message.includes('Network Error') ||
      error.message.includes('timeout') ||
      error.message.includes('401') ||
      error.message.includes('403') ||
      error.message.includes('404') ||
      error.message.includes('500') ||
      error.message.includes('API');

    if (isAPIError) {
      return { hasError: true, error };
    }

    throw error;
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // Log to structured logger
    logger.error('API Error caught', undefined, {
      error,
      componentStack: errorInfo.componentStack,
    });

    // Report to error tracking service
    errorReporter.captureException(error, {
      componentName: 'APIErrorBoundary',
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    const { hasError, error } = this.state;
    const { children } = this.props;

    if (hasError) {
      const errorMessage = this.getErrorMessage(error || new Error('Unknown error'));

      return (
        <div className={styles['api-error-boundary']}>
          <div className={styles['api-error-container']}>
            <div className={styles['api-error-icon']}>
              <PlugIcon size={48} />
            </div>
            <h2 className={styles['api-error-title']}>Connection Error</h2>
            <p className={styles['api-error-message']}>{errorMessage}</p>
            <button className={styles['api-error-button']} onClick={this.handleRetry}>
              Retry
            </button>
          </div>
        </div>
      );
    }

    return children;
  }

  private getErrorMessage(error: Error): string {
    if (error.message.includes('Network Error')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (error.message.includes('timeout')) {
      return 'The request timed out. Please try again.';
    }
    if (error.message.includes('401')) {
      return 'Your session has expired. Please log in again.';
    }
    if (error.message.includes('403')) {
      return 'You do not have permission to perform this action.';
    }
    if (error.message.includes('404')) {
      return 'The requested resource was not found.';
    }
    if (error.message.includes('500')) {
      return 'A server error occurred. Please try again later.';
    }
    return 'An error occurred while communicating with the server.';
  }
}

export default ErrorBoundary;
