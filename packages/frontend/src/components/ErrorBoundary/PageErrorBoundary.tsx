import { Component, type ErrorInfo, type ReactNode } from 'react';

import { logger } from '../../utils/logger';
import { errorReporter } from '../../utils/errorReporter';

import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  pageName: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class PageErrorBoundary extends Component<Props, State> {
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
    window.location.href = path;
  };

  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, pageName } = this.props;

    if (hasError) {
      return (
        <div className={styles['page-error']} role="alert" aria-live="assertive">
          <div className={styles['page-error-content']}>
            <h1 className={styles['page-error-title']}>{pageName} Error</h1>

            <p className={styles['page-error-message']}>
              We encountered an error while loading this page. This might be due to a temporary
              issue or a problem with your connection.
            </p>

            <div className={styles['page-error-actions']}>
              <button
                onClick={this.handleRetry}
                className={`${styles['error-button']} ${styles['error-button.primary']}`}
                type="button"
              >
                Reload Page
              </button>

              <button
                onClick={() => this.handleNavigate('/dashboard')}
                className={`${styles['error-button']} ${styles['error-button.secondary']}`}
                type="button"
              >
                Back to Dashboard
              </button>
            </div>

            {import.meta.env.DEV && error && (
              <details className={styles['error-details']}>
                <summary>Technical Details</summary>
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
