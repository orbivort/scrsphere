import React, { Component, type ErrorInfo } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';

import { logger } from '../../../utils/logger';

import styles from './ChunkErrorBoundary.module.css';

/**
 * Hardcoded English fallbacks for chunk/i18n error text.
 * Used when `t()` is unavailable or throws.
 */
const FALLBACK_TEXT = {
  title: 'Page failed to load',
  description:
    'A required resource could not be loaded. This may be caused by a network issue or an outdated version of the application.',
  reload: 'Reload Page',
} as const;

function safeT(t: WithTranslation['t'], key: keyof typeof FALLBACK_TEXT): string {
  try {
    const i18nKey = `chunkError.${key}`;
    // Cast t to a loose signature to bypass i18next's strict key types.
    const result = (t as (key: string) => string)(i18nKey);
    return result === i18nKey ? FALLBACK_TEXT[key] : result;
  } catch {
    return FALLBACK_TEXT[key];
  }
}

interface Props extends WithTranslation {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
}

class ChunkErrorBoundaryClass extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    const isChunkOrI18nError =
      error.message.includes('Loading chunk') ||
      error.message.includes('Loading CSS chunk') ||
      error.name === 'ChunkLoadError' ||
      // i18n namespace load failures
      error.message.includes('loadNamespace') ||
      error.message.includes('i18next');

    return {
      hasError: isChunkOrI18nError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.state.hasError) {
      logger.error('Resource loading failed (chunk or i18n)', undefined, {
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
            <h2>{safeT(t, 'title')}</h2>
            <p>{safeT(t, 'description')}</p>
            <button onClick={this.handleRetry} className="button button-primary">
              {safeT(t, 'reload')}
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
