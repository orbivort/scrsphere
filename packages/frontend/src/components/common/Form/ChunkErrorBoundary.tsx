import React, { Component, type ErrorInfo } from 'react';

import { logger } from '../../../utils/logger';

import styles from './ChunkErrorBoundary.module.css';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ChunkErrorBoundary extends Component<Props, State> {
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
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={styles['chunk-error']} role="alert">
          <div className={styles['error-content']}>
            <h2>Unable to load page</h2>
            <p>
              A portion of the application failed to load. This may be due to a network issue or an
              outdated version.
            </p>
            <button onClick={this.handleRetry} className="button button-primary">
              Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
