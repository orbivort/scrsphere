/* eslint-disable icon-rules/no-inline-svg -- Dynamic icons from config and loading spinner */
import React, { useState, useRef, useEffect, useCallback } from 'react';

import styles from './StatusSelector.module.css';

import { LockIcon, CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@/components/common/Icons';

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  description: string;
}

type DropdownPosition = 'left' | 'right' | 'center';

export interface StatusSelectorProps<T extends string> {
  currentStatus: T;
  statuses: T[];
  statusConfig: Record<T, StatusConfig>;
  onStatusChange: (status: T) => void;
  isLoading?: boolean;
  disabled?: boolean;
  /**
   * Optional array of available statuses to show in the dropdown.
   * If provided, only these statuses will be selectable.
   * Statuses not in this list will be shown as disabled.
   * If not provided, all statuses are considered available.
   */
  availableStatuses?: T[];
}

export function StatusSelector<T extends string>({
  currentStatus,
  statuses,
  statusConfig,
  onStatusChange,
  isLoading = false,
  disabled = false,
  availableStatuses,
}: StatusSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>('left');
  const currentConfig = statusConfig[currentStatus];
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownMenuRef = useRef<HTMLDivElement>(null);

  const DROPDOWN_MIN_WIDTH = 260;
  const VIEWPORT_PADDING = 16;

  const calculateDropdownPosition = useCallback(() => {
    if (!triggerRef.current || !dropdownMenuRef.current) return 'left';

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownWidth = Math.max(dropdownMenuRef.current.offsetWidth, DROPDOWN_MIN_WIDTH);
    const viewportWidth = window.innerWidth;

    const spaceOnLeft = triggerRect.left;
    const spaceOnRight = viewportWidth - triggerRect.right;
    const triggerWidth = triggerRect.width;
    const triggerCenter = triggerRect.left + triggerWidth / 2;

    const wouldOverflowRight = triggerRect.left + dropdownWidth > viewportWidth - VIEWPORT_PADDING;
    const wouldOverflowLeft = triggerRect.left + triggerWidth - dropdownWidth < VIEWPORT_PADDING;
    const wouldOverflowCenterLeft = triggerCenter - dropdownWidth / 2 < VIEWPORT_PADDING;
    const wouldOverflowCenterRight =
      triggerCenter + dropdownWidth / 2 > viewportWidth - VIEWPORT_PADDING;

    if (wouldOverflowRight && !wouldOverflowLeft) {
      return 'right';
    }

    if (wouldOverflowLeft && !wouldOverflowRight) {
      return 'left';
    }

    if (wouldOverflowRight && wouldOverflowLeft) {
      if (spaceOnRight > spaceOnLeft) {
        return 'right';
      }
      return 'left';
    }

    if (!wouldOverflowCenterLeft && !wouldOverflowCenterRight) {
      return 'center';
    }

    return 'left';
  }, []);

  const updateDropdownPosition = useCallback(() => {
    if (isOpen) {
      const newPosition = calculateDropdownPosition();
      setDropdownPosition(newPosition);
    }
  }, [isOpen, calculateDropdownPosition]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        updateDropdownPosition();
      });
    }
  }, [isOpen, updateDropdownPosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleResize = () => {
      updateDropdownPosition();
    };

    const handleScroll = () => {
      updateDropdownPosition();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, updateDropdownPosition]);

  const isStatusAvailable = (status: T): boolean => {
    if (!availableStatuses) return true;
    return availableStatuses.includes(status);
  };

  const handleStatusSelect = (status: T) => {
    if (status !== currentStatus && isStatusAvailable(status)) {
      setIsAnimating(true);
      onStatusChange(status);
      setTimeout(() => setIsAnimating(false), 500);
    }
    setIsOpen(false);
  };

  const handleToggle = () => {
    if (isDisabled) return;
    setIsOpen(!isOpen);
  };

  const isDisabled = disabled || isLoading;

  const dropdownPositionClass = {
    left: styles['dropdown-position-left'],
    right: styles['dropdown-position-right'],
    center: styles['dropdown-position-center'],
  }[dropdownPosition];

  return (
    <div className={styles['status-selector']} ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles['status-selector-trigger']} ${isAnimating ? styles.animating : ''} ${isDisabled ? styles['status-disabled'] : ''}`}
        onClick={handleToggle}
        disabled={isDisabled}
        data-status={currentStatus}
        style={
          {
            '--status-color': currentConfig.color,
            '--status-bg': currentConfig.bgColor,
            '--status-border': currentConfig.borderColor,
          } as React.CSSProperties
        }
        aria-haspopup={disabled ? undefined : 'listbox'}
        aria-expanded={disabled ? undefined : isOpen}
        aria-label={`Current status: ${currentConfig.label}${disabled ? ' (locked)' : '. Click to change status.'}`}
      >
        <span className={styles['status-icon-wrapper']}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={currentConfig.icon} />
          </svg>
        </span>
        <span className={styles['status-label']}>{currentConfig.label}</span>
        {isLoading ? (
          <span className={styles['status-loading']}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 12 12"
                  to="360 12 12"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </span>
        ) : disabled ? (
          <span className={styles['status-locked']}>
            <LockIcon size={14} />
          </span>
        ) : (
          <span className={styles['status-arrow']}>
            {isOpen ? <ChevronUpIcon size={12} /> : <ChevronDownIcon size={12} />}
          </span>
        )}
      </button>

      {isOpen && !disabled && (
        <div
          ref={dropdownMenuRef}
          className={`${styles['status-dropdown']} ${dropdownPositionClass}`}
          role="listbox"
          aria-label="Status options"
        >
          <div className={styles['dropdown-header']}>
            <p className={styles['dropdown-title']}>Change Status</p>
          </div>
          <div className={styles['status-options']}>
            {statuses.map((status) => {
              const config = statusConfig[status];
              const isSelected = status === currentStatus;
              const isAvailable = isStatusAvailable(status);
              return (
                <button
                  key={status}
                  type="button"
                  className={`${styles['status-option']} ${isSelected ? styles.selected : ''} ${!isAvailable ? styles['status-option-disabled'] : ''}`}
                  onClick={() => handleStatusSelect(status)}
                  disabled={!isAvailable}
                  style={
                    {
                      '--option-color': config.color,
                      '--option-bg': config.bgColor,
                      '--option-border': config.borderColor,
                    } as React.CSSProperties
                  }
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={!isAvailable}
                >
                  <span className={styles['option-icon-wrapper']}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={config.icon} />
                    </svg>
                  </span>
                  <span className={styles['option-content']}>
                    <span className={styles['option-label']}>{config.label}</span>
                    <span className={styles['option-desc']}>{config.description}</span>
                  </span>
                  {isSelected ? (
                    <span className={styles['option-check']}>
                      <CheckIcon size={12} strokeWidth={3} />
                    </span>
                  ) : !isAvailable ? (
                    <span className={styles['option-locked']}>
                      <LockIcon size={12} />
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className={styles['dropdown-footer']}>
            <p className={styles['dropdown-hint']}>Click to change item status</p>
          </div>
        </div>
      )}
    </div>
  );
}
