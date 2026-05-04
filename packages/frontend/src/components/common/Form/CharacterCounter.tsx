import React from 'react';

import styles from './CharacterCounter.module.css';

interface CharacterCounterProps {
  current: number;
  min?: number;
  max: number;
  showMin?: boolean;
  id?: string;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({
  current,
  min,
  max,
  showMin = false,
  id,
}) => {
  const isOverLimit = current > max;
  const isUnderMin = min !== undefined && current < min && current > 0;
  const isValid = !isOverLimit && !isUnderMin && current > 0;

  const getStatusClass = () => {
    if (isOverLimit) return styles.error;
    if (isUnderMin) return styles.warning;
    if (isValid) return styles.valid;
    return styles.neutral;
  };

  return (
    <span
      id={id}
      className={`${styles.counter} ${getStatusClass()}`}
      aria-live="polite"
      data-testid="character-counter"
    >
      {showMin && min !== undefined && current < min && (
        <span className={styles['min-indicator']} data-testid="min-indicator">
          min {min} ·{' '}
        </span>
      )}
      <span className={styles.count} data-testid="count">
        {current}
      </span>
      <span className={styles.separator} data-testid="separator">
        /
      </span>
      <span className={styles.max} data-testid="max">
        {max}
      </span>
    </span>
  );
};
