// Page Header Component

import React from 'react';

import { ArrowLeftIcon } from '../Icons';

import styles from './PageHeader.module.css';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backLabel?: string;
  actions?: React.ReactNode;
}

/**
 * Page Header Component
 * Provides a consistent header for pages with optional back button and actions
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backLabel = 'Back',
  actions,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <div className={styles['title-section']}>
          {onBack && (
            <button
              type="button"
              className={styles['back-button']}
              onClick={onBack}
              aria-label={backLabel}
            >
              <ArrowLeftIcon size={20} />
              <span className={styles['back-label']}>{backLabel}</span>
            </button>
          )}
          <div className={styles['text-content']}>
            <h1 className={styles.title}>{title}</h1>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
    </header>
  );
};

export default PageHeader;
