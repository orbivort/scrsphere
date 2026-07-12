import React, { Component, type ErrorInfo } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';

import { logger } from '../../../utils/logger';

import styles from './ChunkErrorBoundary.module.css';

interface Props extends WithTranslation {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ChunkErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkError =
      error.message.includes('Loading chunk') ||
      error.message.includes('Loading CSS chunk') ||
      error.name === 'ChunkLoadError';

    return {
      hasError: isChunkError,
      error: isChunkError ? error : null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.state.hasError) {
      logger.error('Chunk loading failed', undefined, {
        error,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleRetry = (): void => {
    window.location.reload();
  };

  render(): React.ReactNode {
    const { t } = this.props;

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles['chunk-error']} role="alert">
          <div className={styles['error-content']}>
            <h2>{t('chunkError.title')}</h2>
            <p>{t('chunkError.description')}</p>
            <button onClick={this.handleRetry} className="button button-primary">
              {t('chunkError.reload')}
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const ChunkErrorBoundary: React.ComponentType<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = withTranslation('common')(ChunkErrorBoundaryClass);
