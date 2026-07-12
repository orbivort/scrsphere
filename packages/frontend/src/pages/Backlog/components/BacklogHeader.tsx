import React from 'react';
import { useTranslation } from 'react-i18next';

import styles from './BacklogHeader.module.css';

import { ListIcon, GridViewIcon, UploadIcon, PlusIcon } from '@/components/common/Icons';

export interface BacklogHeaderProps {
  itemCount: number;
  viewMode: 'board' | 'list';
  onViewModeChange: (mode: 'board' | 'list') => void;
  onNewItem: () => void;
  onBulkImport: () => void;
}

export const BacklogHeader: React.FC<BacklogHeaderProps> = ({
  itemCount,
  viewMode,
  onViewModeChange,
  onNewItem,
  onBulkImport,
}) => {
  const { t } = useTranslation('backlog');

  return (
    <header className={styles['backlog-header']}>
      <div className={styles['header-left']}>
        <h1 className={styles['page-title']}>
          <span className={styles['page-title-icon']}>
            <ListIcon width="28" height="28" />
          </span>
          {t('title') as string}
          <span className={styles['item-count']}>
            {t('boardView.itemsCount', { count: itemCount }) as string}
          </span>
        </h1>
        <p className={styles['page-subtitle']}>{t('description') as string}</p>
      </div>
      <div className={styles['header-right']}>
        <div className={styles['view-toggle']}>
          <button
            className={`${styles['toggle-button']} ${viewMode === 'board' ? styles.active : ''}`}
            onClick={() => onViewModeChange('board')}
            title={t('viewToggle.board') as string}
          >
            <GridViewIcon width="16" height="16" />
            {t('viewToggle.board') as string}
          </button>
          <button
            className={`${styles['toggle-button']} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => onViewModeChange('list')}
            title={t('viewToggle.list') as string}
          >
            <ListIcon width="16" height="16" />
            {t('viewToggle.list') as string}
          </button>
        </div>
        <div className={styles['header-actions']}>
          <button
            className={`${styles['new-item-btn']} ${styles['bulk-import-btn']}`}
            onClick={onBulkImport}
            title={t('bulkImport') as string}
          >
            <UploadIcon width="16" height="16" />
            {t('bulkImport') as string}
          </button>
          <button className={styles['new-item-btn']} onClick={onNewItem}>
            <PlusIcon width="16" height="16" />
            {t('newItem') as string}
          </button>
        </div>
      </div>
    </header>
  );
};
