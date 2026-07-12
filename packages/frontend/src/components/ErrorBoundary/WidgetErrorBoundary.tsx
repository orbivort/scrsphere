import { Component, type ErrorInfo, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';

import { logger } from '../../utils/logger';
import { errorReporter } from '../../utils/errorReporter';

import styles from './ErrorBoundary.module.css';

interface Props extends WithTranslation {
  children: ReactNode;
  widgetName: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class WidgetErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error(`Widget error in ${this.props.widgetName}`, undefined, {
      error,
      componentStack: errorInfo.componentStack,
    });

    // Report to error tracking service
    errorReporter.captureException(error, {
      componentName: `WidgetErrorBoundary:${this.props.widgetName}`,
      extra: { componentStack: errorInfo.componentStack },
    });
  }

  handleRetry = (): void => {
    this.setState({
      hasError: false,
      error: null,
    });
    this.props.onRetry?.();
  };

  render(): ReactNode {
    const { hasError } = this.state;
    const { children, widgetName, t } = this.props;

    if (hasError) {
      return (
        <div className={styles['widget-error']} role="alert" aria-live="polite">
          <div className={styles['widget-error-content']}>
            <span className={styles['widget-error-icon']} aria-hidden="true">
              ⚠️
            </span>

            <p className={styles['widget-error-message']}>
              {t('widgetError.failedToLoad', { widgetName })}
            </p>

            <button
              onClick={this.handleRetry}
              className={styles['widget-error-button']}
              type="button"
              aria-label={t('widgetError.retryAria', { widgetName })}
            >
              {t('retry')}
            </button>
          </div>
        </div>
      );
    }

    return children;
  }
}

export const WidgetErrorBoundary: React.ComponentType<{
  children: ReactNode;
  widgetName: string;
  onRetry?: () => void;
}> = withTranslation('common')(WidgetErrorBoundaryClass);
