import React, { useState, useCallback } from 'react';

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
        aria-label={isExpanded ? 'Collapse Danger Zone' : 'Expand Danger Zone'}
      >
        {isExpanded ? (
          <>
            <div className={styles['danger-zone-header-content']}>
              <div className={styles['danger-zone-icon-wrapper']}>
                <AlertTriangleIcon size={20} />
              </div>
              <div className={styles['danger-zone-title-group']}>
                <h3 className={styles['danger-zone-title']}>Danger Zone</h3>
                <p className={styles['danger-zone-subtitle']}>Irreversible and destructive</p>
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
          aria-label="Delete your account permanently"
        >
          <div className={styles['danger-zone-item-content']}>
            <span className={styles['danger-zone-item-icon']}>
              <UserXIcon size={20} />
            </span>
            <div className={styles['danger-zone-item-text']}>
              <h4 className={styles['danger-zone-item-title']}>Delete Account</h4>
              <p className={styles['danger-zone-item-description']}>
                Permanently remove your account and all associated data
              </p>
            </div>
          </div>
          <span className={styles['danger-zone-item-action']}>
            <TrashIcon size={16} />
            Delete
          </span>
        </button>
      </div>
    </div>
  );
};

export default DangerZone;
