import React from 'react';

import { ItemStatus } from '../../../types';
import type { FilterState } from '../types/backlog.types';

import styles from './BacklogFilterBar.module.css';

import { SearchIcon, XIcon } from '@/components/common/Icons';

export interface BacklogFilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

export const BacklogFilterBar: React.FC<BacklogFilterBarProps> = ({ filters, onFiltersChange }) => {
  return (
    <div className={styles['filter-bar']}>
      <div className={styles['filter-main']}>
        <div className={styles['search-container']}>
          <SearchIcon className={styles['search-icon']} width="16" height="16" />
          <input
            type="text"
            className={styles['filter-search-input']}
            placeholder="Search items..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
          {filters.search && (
            <button
              className={styles['search-clear']}
              onClick={() => onFiltersChange({ ...filters, search: '' })}
              aria-label="Clear search"
            >
              <XIcon width="12" height="12" />
            </button>
          )}
        </div>

        <div className={styles['status-filter-chips']}>
          <button
            className={`${styles['status-chip']} ${filters.status.length === 0 ? styles.active : ''}`}
            onClick={() => onFiltersChange({ ...filters, status: [] })}
          >
            ALL
          </button>
          {Object.values(ItemStatus).map((status) => (
            <button
              key={status}
              className={`${styles['status-chip']} ${filters.status.includes(status) ? styles.active : ''}`}
              onClick={() =>
                onFiltersChange({
                  ...filters,
                  status: filters.status.includes(status)
                    ? filters.status.filter((s) => s !== status)
                    : [...filters.status, status],
                })
              }
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
