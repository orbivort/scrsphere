import { Component, type ErrorInfo, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';

import styles from './ErrorBoundary.module.css';

import { PlugIcon } from '@/components/common/Icons';
import { logger } from '@/utils/logger';
import { errorReporter } from '@/utils/errorReporter';

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

interface APIErrorBoundaryProps extends WithTranslation {
  children: ReactNode;
  onRetry?: () => void;
}

class APIErrorBoundaryClass extends Component<APIErrorBoundaryProps, State> {
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
    const { children, t } = this.props;

    if (hasError) {
      const errorMessage = this.getErrorMessage(error ?? new Error('Unknown error'));

      return (
        <div className={styles['api-error-boundary']}>
          <div className={styles['api-error-container']}>
            <div className={styles['api-error-icon']}>
              <PlugIcon size={48} />
            </div>
            <h2 className={styles['api-error-title']}>{t('errorBoundary.connectionError')}</h2>
            <p className={styles['api-error-message']}>{errorMessage}</p>
            <button className={styles['api-error-button']} onClick={this.handleRetry}>
              {t('retry')}
            </button>
          </div>
        </div>
      );
    }

    return children;
  }

  private getErrorMessage(error: Error): string {
    const { t } = this.props;
    if (error.message.includes('Network Error')) {
      return t('errorBoundary.networkError');
    }
    if (error.message.includes('timeout')) {
      return t('errorBoundary.timeoutError');
    }
    if (error.message.includes('401')) {
      return t('errorBoundary.authError');
    }
    if (error.message.includes('403')) {
      return t('errorBoundary.forbiddenError');
    }
    if (error.message.includes('404')) {
      return t('errorBoundary.notFoundError');
    }
    if (error.message.includes('500')) {
      return t('errorBoundary.serverError');
    }
    return t('errorBoundary.apiError');
  }
}

export const APIErrorBoundary: React.ComponentType<{
  children: ReactNode;
  onRetry?: () => void;
}> = withTranslation('common')(APIErrorBoundaryClass);
