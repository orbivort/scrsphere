import React from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('settings');

  return (
    <div className={styles['search-bar']}>
      <span className={styles['search-icon']}>
        <SearchIcon size={16} />
      </span>
      <input
        type="text"
        name="team-search"
        className={styles['search-input']}
        placeholder={t('teamSearchBar.placeholder')}
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label={t('teamSearchBar.ariaLabel')}
        autoComplete="off"
      />
      {search && !isDebouncing && (
        <button
          type="button"
          className={styles['search-clear']}
          onClick={() => onSearchChange('')}
          aria-label={t('teamSearchBar.clearSearch')}
        >
          <CloseIcon size={14} />
        </button>
      )}
      {isDebouncing && <span className={styles['debounce-spinner']} aria-hidden="true" />}
    </div>
  );
};
