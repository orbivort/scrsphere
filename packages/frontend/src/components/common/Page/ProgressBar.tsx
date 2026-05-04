import React from 'react';

import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  /** Current value of the progress bar */
  value: number;
  /** Minimum value (default: 0) */
  min?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Label for screen readers */
  label?: string;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Size variant */
  size?: 'small' | 'medium' | 'large';
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  /** Additional CSS class name */
  className?: string;
}

/**
 * Accessible progress bar component with proper ARIA attributes.
 * Supports keyboard accessibility and respects prefers-reduced-motion.
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  min = 0,
  max = 100,
  label,
  showPercentage = true,
  size = 'medium',
  variant = 'primary',
  className = '',
}) => {
  // Clamp value between min and max
  const clampedValue = Math.min(Math.max(value, min), max);
  const percentage = Math.round(((clampedValue - min) / (max - min)) * 100);

  return (
    <div
      className={`${styles['progress-container']} ${styles[size]} ${className}`}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-label={label || `Progress: ${percentage}%`}
      tabIndex={0}
    >
      <div className={styles['progress-track']}>
        <div
          className={`${styles['progress-fill']} ${styles[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showPercentage && (
        <span className={styles['progress-text']} aria-hidden="true">
          {percentage}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
