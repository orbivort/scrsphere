import React from 'react';

import styles from './TeamSearchBar.module.css';

import { CloseIcon, SearchIcon } from '@/components/common/Icons';

interface TeamSearchBarProps {
  search: string;
  onSearchChange: (search: string) => void;
  isDebouncing?: boolean;
}

export const TeamSearchBar: React.FC<TeamSearchBarProps> = ({
  search,
  onSearchChange,
  isDebouncing = false,
}) => {
  return (
    <div className={styles['search-bar']}>
      <span className={styles['search-icon']}>
        <SearchIcon size={16} />
      </span>
      <input
        type="text"
        name="team-search"
        className={styles['search-input']}
        placeholder="Search teams by name..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Search teams"
        autoComplete="off"
      />
      {search && !isDebouncing && (
        <button
          type="button"
          className={styles['search-clear']}
          onClick={() => onSearchChange('')}
          aria-label="Clear search"
        >
          <CloseIcon size={14} />
        </button>
      )}
      {isDebouncing && <span className={styles['debounce-spinner']} aria-hidden="true" />}
    </div>
  );
};
