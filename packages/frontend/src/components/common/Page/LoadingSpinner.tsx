/* eslint-disable icon-rules/no-inline-svg -- Loading spinner animation, not a static icon */
import React from 'react';

import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  /** Size of the spinner in pixels */
  size?: number;
  /** Color of the spinner stroke */
  color?: string;
  /** Additional CSS class name */
  className?: string;
  /** Accessible label for the spinner */
  label?: string;
}

/**
 * Accessible SVG loading spinner component.
 * Uses role="progressbar" and aria-busy="true" for screen reader support.
 * Respects prefers-reduced-motion media query.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 48,
  color = '#1a66ff',
  className = '',
  label = 'Loading',
}) => {
  const strokeWidth = Math.max(2, size / 12);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * 0.75;

  return (
    <div
      className={`${styles['spinner-container']} ${className}`}
      role="progressbar"
      aria-busy="true"
      aria-label={label}
      aria-valuetext={label}
    >
      <svg
        className={styles.spinner}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        {/* Background circle */}
        <circle
          className={styles['spinner-track']}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
        />
        {/* Animated spinner arc */}
        <circle
          className={styles['spinner-arc']}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
        />
      </svg>
      <span className="visually-hidden">{label}</span>
    </div>
  );
};

export default LoadingSpinner;
