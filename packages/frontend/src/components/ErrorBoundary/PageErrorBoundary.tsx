import { Component, type ErrorInfo, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';

import { logger } from '../../utils/logger';
import { errorReporter } from '../../utils/errorReporter';
import { navigateTo } from '../../utils/navigation';

import styles from './ErrorBoundary.module.css';

interface Props extends WithTranslation {
  children: ReactNode;
  pageName: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class PageErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    logger.error(`Page error in ${this.props.pageName}`, undefined, {
      error,
      componentStack: errorInfo.componentStack,
    });

    // Report to error tracking service
    errorReporter.captureException(error, {
      componentName: `PageErrorBoundary:${this.props.pageName}`,
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

  handleNavigate = (path: string): void => {
    navigateTo(path);
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, pageName, t } = this.props;

    if (hasError) {
      return (
        <div className={styles['page-error']} role="alert" aria-live="assertive">
          <div className={styles['page-error-content']}>
            <h1 className={styles['page-error-title']}>{t('pageError.title', { pageName })}</h1>

            <p className={styles['page-error-message']}>{t('pageError.description')}</p>

            <div className={styles['page-error-actions']}>
              <button
                onClick={this.handleRetry}
                className={`${styles['error-button']} ${styles['error-button.primary']}`}
                type="button"
              >
                {t('pageError.reloadPage')}
              </button>

              <button
                onClick={() => this.handleNavigate('/dashboard')}
                className={`${styles['error-button']} ${styles['error-button.secondary']}`}
                type="button"
              >
                {t('pageError.backToDashboard')}
              </button>
            </div>

            {import.meta.env.DEV && error && (
              <details className={styles['error-details']}>
                <summary>{t('pageError.technicalDetails')}</summary>
                <pre>{error.message}</pre>
                {errorInfo?.componentStack && <pre>{errorInfo.componentStack}</pre>}
              </details>
            )}
          </div>
        </div>
      );
    }

    return children;
  }
}

export const PageErrorBoundary: React.ComponentType<{
  children: ReactNode;
  pageName: string;
  onRetry?: () => void;
}> = withTranslation('common')(PageErrorBoundaryClass);
