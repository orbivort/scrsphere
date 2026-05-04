import React, { useCallback, useRef } from 'react';

import styles from './ConfirmationInput.module.css';

import { XCircleIcon, CheckCircleIcon } from '@/components/common/Icons';

interface ConfirmationInputProps {
  /** Current value of the input */
  value: string;
  /** Callback when input value changes */
  onChange: (value: string) => void;
  /** Whether the current value matches the required phrase */
  isValid: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** The phrase that must be typed to confirm (defaults to "DELETE MY ACCOUNT") */
  requiredPhrase?: string;
  /** Optional callback when Enter is pressed while valid */
  onSubmit?: () => void;
  /** ID for the input element */
  id?: string;
}

/**
 * ConfirmationInput component for account deletion confirmation.
 * Users must type the required phrase exactly to enable the delete action.
 * Provides real-time visual feedback based on input state.
 */
export const ConfirmationInput: React.FC<ConfirmationInputProps> = ({
  value,
  onChange,
  isValid,
  disabled = false,
  requiredPhrase = 'DELETE MY ACCOUNT',
  onSubmit,
  id = 'deletion-confirmation',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine the visual state of the input
  const getInputState = useCallback((): 'neutral' | 'valid' | 'invalid' => {
    if (value === '') return 'neutral';
    if (isValid) return 'valid';
    return 'invalid';
  }, [value, isValid]);

  const inputState = getInputState();

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && isValid && onSubmit && !disabled) {
        e.preventDefault();
        onSubmit();
      }
    },
    [isValid, onSubmit, disabled]
  );

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  // Generate descriptive text for screen readers
  const getAriaDescribedBy = (): string => {
    const ids = [`${id}-instructions`];
    if (inputState === 'invalid') {
      ids.push(`${id}-error`);
    }
    return ids.join(' ');
  };

  // Generate state-based CSS classes
  const inputClassName = [
    styles['confirmation-input'],
    inputState === 'valid' && styles['confirmation-input-valid'],
    inputState === 'invalid' && styles['confirmation-input-invalid'],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles['confirmation-section']}>
      <label htmlFor={id} className={styles['confirmation-label']}>
        To confirm deletion, please type:{' '}
        <span className={styles['confirmation-phrase']}>{requiredPhrase}</span>
      </label>

      <input
        ref={inputRef}
        id={id}
        type="text"
        className={inputClassName}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={`Type "${requiredPhrase}" to confirm`}
        disabled={disabled}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="characters"
        spellCheck="false"
        aria-invalid={inputState === 'invalid'}
        aria-describedby={getAriaDescribedBy()}
        aria-required="true"
      />

      {/* Screen reader instructions */}
      <span id={`${id}-instructions`} className="sr-only">
        Type the phrase exactly as shown, case-sensitive, to enable the delete button. Press Enter
        when the phrase matches to submit.
      </span>

      {/* Error message for invalid state */}
      {inputState === 'invalid' && (
        <div
          id={`${id}-error`}
          className={styles['confirmation-error']}
          role="alert"
          aria-live="polite"
        >
          <span className={styles['confirmation-error-icon']} aria-hidden="true">
            <XCircleIcon size={16} />
          </span>
          <span className={styles['confirmation-error-text']}>
            Phrase does not match. Please type exactly: {requiredPhrase}
          </span>
        </div>
      )}

      {/* Success indicator for valid state */}
      {inputState === 'valid' && (
        <div
          id={`${id}-success`}
          className={styles['confirmation-success']}
          role="status"
          aria-live="polite"
        >
          <span className={styles['confirmation-success-icon']} aria-hidden="true">
            <CheckCircleIcon size={16} />
          </span>
          <span className={styles['confirmation-success-text']}>Confirmation phrase matches</span>
        </div>
      )}
    </div>
  );
};

export default ConfirmationInput;
