import { Component, type ErrorInfo, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';

import { logger } from '../../utils/logger';
import { errorReporter } from '../../utils/errorReporter';
import { navigateTo } from '../../utils/navigation';

import styles from './ErrorBoundary.module.css';

/**
 * Hardcoded English fallbacks for page error text.
 * Used when `t()` is unavailable or throws.
 */
const FALLBACK_TEXT = {
  title: 'Error on {pageName} page',
  description: 'An error occurred while loading this page. Please try again or navigate back.',
  reloadPage: 'Try Again',
  backToDashboard: 'Back to Dashboard',
  technicalDetails: 'Technical Details',
} as const;

function safeT(
  t: WithTranslation['t'],
  key: keyof typeof FALLBACK_TEXT,
  options?: Record<string, string>
): string {
  try {
    const i18nKey = `pageError.${key}`;
    // Cast t to a loose signature to bypass i18next's strict key types.
    const result = (t as (key: string, options?: Record<string, string>) => string)(
      i18nKey,
      options
    );
    return result === i18nKey
      ? FALLBACK_TEXT[key].replace(/\{(\w+)\}/g, (_, k) => options?.[k] ?? k)
      : result;
  } catch {
    return FALLBACK_TEXT[key].replace(/\{(\w+)\}/g, (_, k) => options?.[k] ?? k);
  }
}

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
            <h1 className={styles['page-error-title']}>{safeT(t, 'title', { pageName })}</h1>

            <p className={styles['page-error-message']}>{safeT(t, 'description')}</p>

            <div className={styles['page-error-actions']}>
              <button
                onClick={this.handleRetry}
                className={`${styles['error-button']} ${styles['error-button.primary']}`}
                type="button"
              >
                {safeT(t, 'reloadPage')}
              </button>

              <button
                onClick={() => this.handleNavigate('/dashboard')}
                className={`${styles['error-button']} ${styles['error-button.secondary']}`}
                type="button"
              >
                {safeT(t, 'backToDashboard')}
              </button>
            </div>

            {import.meta.env.DEV && error && (
              <details className={styles['error-details']}>
                <summary>{safeT(t, 'technicalDetails')}</summary>
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
