import React from 'react';

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
  return (
    <header className={styles['backlog-header']}>
      <div className={styles['header-left']}>
        <h1 className={styles['page-title']}>
          <span className={styles['page-title-icon']}>
            <ListIcon width="28" height="28" />
          </span>
          Product Backlog
          <span className={styles['item-count']}>{itemCount} items</span>
        </h1>
        <p className={styles['page-subtitle']}>
          Manage and prioritize work items for the active product goal
        </p>
      </div>
      <div className={styles['header-right']}>
        <div className={styles['view-toggle']}>
          <button
            className={`${styles['toggle-button']} ${viewMode === 'board' ? styles.active : ''}`}
            onClick={() => onViewModeChange('board')}
            title="MoSCoW Board View"
          >
            <GridViewIcon width="16" height="16" />
            Board
          </button>
          <button
            className={`${styles['toggle-button']} ${viewMode === 'list' ? styles.active : ''}`}
            onClick={() => onViewModeChange('list')}
            title="List View"
          >
            <ListIcon width="16" height="16" />
            List
          </button>
        </div>
        <div className={styles['header-actions']}>
          <button
            className={`${styles['new-item-btn']} ${styles['bulk-import-btn']}`}
            onClick={onBulkImport}
            title="Bulk import from CSV"
          >
            <UploadIcon width="16" height="16" />
            Bulk Import
          </button>
          <button className={styles['new-item-btn']} onClick={onNewItem}>
            <PlusIcon width="16" height="16" />
            New Item
          </button>
        </div>
      </div>
    </header>
  );
};
