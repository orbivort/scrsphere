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
  RUNTIME = 'RUNTIME',
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
      case ErrorType.NETWORK:
        return t('errorBoundary.networkError');
      case ErrorType.AUTH:
        return t('errorBoundary.authError');
      case ErrorType.VALIDATION:
        return t('errorBoundary.validationError');
      case ErrorType.NOT_FOUND:
        return t('errorBoundary.notFoundError');
      case ErrorType.RUNTIME:
        return t('errorBoundary.runtimeError');
      default:
        return t('errorBoundary.defaultError');
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
            <h1 className={styles['error-title']}>{t('errorBoundary.title')}</h1>
            <p className={styles['error-message']}>
              {this.getErrorMessage(error ?? new Error('Unknown error'))}
            </p>

            {import.meta.env.DEV && error && (
              <details className={styles['error-details']}>
                <summary>{t('errorBoundary.devDetails')}</summary>
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
                  {t('errorBoundary.tryAgain')}
                </button>
              )}
              <button
                className={`${styles['error-button']} ${styles['error-button.secondary']}`}
                onClick={this.handleReload}
              >
                {t('errorBoundary.reloadPage')}
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
