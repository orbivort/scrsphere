import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import styles from './DangerZone.module.css';

import {
  AlertTriangleIcon,
  ChevronDownIcon,
  IndicatorDotIcon,
  TrashIcon,
  UserXIcon,
} from '@/components/common/Icons';

interface DangerZoneProps {
  onDeleteClick: () => void;
}

export const DangerZone: React.FC<DangerZoneProps> = ({ onDeleteClick }) => {
  const { t } = useTranslation('common');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  const handleDeleteKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onDeleteClick();
      }
    },
    [onDeleteClick]
  );

  return (
    <div className={`${styles['danger-zone']} ${isExpanded ? styles['danger-zone-expanded'] : ''}`}>
      {/* Danger Zone Header - Ultra Minimal When Collapsed */}
      <button
        type="button"
        className={styles['danger-zone-header']}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls="danger-zone-content"
        id="danger-zone-header"
        aria-label={t(
          isExpanded ? 'deleteAccount.dangerZone.collapse' : 'deleteAccount.dangerZone.expand'
        )}
      >
        {isExpanded ? (
          <>
            <div className={styles['danger-zone-header-content']}>
              <div className={styles['danger-zone-icon-wrapper']}>
                <AlertTriangleIcon size={20} />
              </div>
              <div className={styles['danger-zone-title-group']}>
                <h3 className={styles['danger-zone-title']}>
                  {t('deleteAccount.dangerZone.title')}
                </h3>
                <p className={styles['danger-zone-subtitle']}>
                  {t('deleteAccount.dangerZone.subtitle')}
                </p>
              </div>
            </div>
            <span className={styles['danger-zone-toggle']} aria-hidden="true">
              <ChevronDownIcon size={16} />
            </span>
          </>
        ) : (
          <span className={styles['danger-zone-collapsed-indicator']} aria-hidden="true">
            <IndicatorDotIcon />
            <ChevronDownIcon size={16} />
          </span>
        )}
      </button>

      {/* Danger Zone Content */}
      <div
        id="danger-zone-content"
        className={styles['danger-zone-content']}
        role="region"
        aria-labelledby="danger-zone-header"
      >
        <button
          type="button"
          className={styles['danger-zone-item']}
          onClick={onDeleteClick}
          onKeyDown={handleDeleteKeyDown}
          aria-label={t('deleteAccount.dangerZone.deleteAccount.ariaLabel')}
        >
          <div className={styles['danger-zone-item-content']}>
            <span className={styles['danger-zone-item-icon']}>
              <UserXIcon size={20} />
            </span>
            <div className={styles['danger-zone-item-text']}>
              <h4 className={styles['danger-zone-item-title']}>
                {t('deleteAccount.dangerZone.deleteAccount.title')}
              </h4>
              <p className={styles['danger-zone-item-description']}>
                {t('deleteAccount.dangerZone.deleteAccount.description')}
              </p>
            </div>
          </div>
          <span className={styles['danger-zone-item-action']}>
            <TrashIcon size={16} />
            {t('deleteAccount.dangerZone.delete')}
          </span>
        </button>
      </div>
    </div>
  );
};

export default DangerZone;
