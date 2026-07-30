import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  formatDateForInput,
  parseDateFromInput,
  isValidDateForLocale,
  DATE_FORMAT_EXAMPLES,
} from '@scrumooth/shared';

import { useI18nStore } from '../../../i18n/useI18nStore';
import { CalendarIcon } from '../Icons';

import styles from './LocaleDateInput.module.css';

export interface LocaleDateInputProps {
  id: string;
  value: string; // ISO format YYYY-MM-DD
  onChange: (value: string) => void; // Returns ISO format YYYY-MM-DD
  onBlur?: (value: string) => void; // Returns ISO format YYYY-MM-DD
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  hasError?: boolean;
  errorId?: string;
  ariaDescribedBy?: string;
  className?: string;
}

/**
 * A locale-aware date input component that displays dates in the user's preferred language format.
 *
 * Supports:
 * - English (en): dd/MM/yyyy (e.g., 15/06/2024)
 * - German (de): dd.MM.yyyy (e.g., 15.06.2024)
 * - French (fr): dd/MM/yyyy (e.g., 15/06/2024)
 * - Spanish (es): dd/MM/yyyy (e.g., 15/06/2024)
 * - Italian (it): dd/MM/yyyy (e.g., 15/06/2024)
 *
 * The component displays the date in the locale-specific format but internally works with ISO format (YYYY-MM-DD).
 * Clicking the calendar icon opens the native browser date picker.
 */
export const LocaleDateInput: React.FC<LocaleDateInputProps> = ({
  id,
  value,
  onChange,
  onBlur,
  placeholder,
  disabled = false,
  required = false,
  hasError = false,
  errorId,
  ariaDescribedBy,
  className = '',
}) => {
  const { t } = useTranslation('common');
  const { locale } = useI18nStore();
  const textInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Get the locale-specific placeholder
  const datePlaceholder = placeholder ?? DATE_FORMAT_EXAMPLES[locale];

  // Convert ISO value to locale-specific display format
  const [displayValue, setDisplayValue] = useState<string>(() => {
    return value ? formatDateForInput(value, locale) : '';
  });

  // Update display when ISO value changes externally
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value ? formatDateForInput(value, locale) : '');
    }
  }, [value, locale, isFocused]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      setDisplayValue(inputValue);

      // Only update parent if we have a complete and valid date
      if (inputValue.length > 0 && isValidDateForLocale(inputValue, locale)) {
        const isoDate = parseDateFromInput(inputValue, locale);
        onChange(isoDate);
      } else if (inputValue.length === 0) {
        onChange('');
      }
    },
    [locale, onChange]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const inputValue = e.target.value;

      // Parse and validate the input
      if (inputValue && isValidDateForLocale(inputValue, locale)) {
        const isoDate = parseDateFromInput(inputValue, locale);
        setDisplayValue(formatDateForInput(isoDate, locale));
        onChange(isoDate);
        onBlur?.(isoDate);
      } else if (inputValue) {
        // Invalid date - reset to previous valid value
        setDisplayValue(value ? formatDateForInput(value, locale) : '');
      } else {
        onBlur?.('');
      }
    },
    [locale, value, onChange, onBlur]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleClear = useCallback(() => {
    setDisplayValue('');
    onChange('');
    onBlur?.('');
  }, [onChange, onBlur]);

  const handleCalendarClick = useCallback(() => {
    if (!disabled && dateInputRef.current) {
      dateInputRef.current.showPicker();
    }
  }, [disabled]);

  const handleDateInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const isoValue = e.target.value;
      if (isoValue) {
        // Convert ISO to locale format for display
        const formatted = formatDateForInput(isoValue, locale);
        setDisplayValue(formatted);
        onChange(isoValue);
      } else {
        setDisplayValue('');
        onChange('');
      }
    },
    [locale, onChange]
  );

  return (
    <div
      className={`${styles['date-input-wrapper']} ${hasError ? styles['has-error'] : ''} ${className}`}
    >
      <input
        ref={textInputRef}
        id={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={datePlaceholder}
        disabled={disabled}
        required={required}
        className={hasError ? styles['input-error'] : ''}
        aria-invalid={hasError ? 'true' : 'false'}
        aria-describedby={ariaDescribedBy ?? (hasError && errorId ? errorId : undefined)}
        autoComplete="off"
        pattern={locale === 'de' ? '\\d{2}\\.\\d{2}\\.\\d{4}' : '\\d{2}/\\d{2}/\\d{4}'}
        maxLength={10}
      />
      <input
        ref={dateInputRef}
        type="date"
        value={value}
        onChange={handleDateInputChange}
        disabled={disabled}
        className={styles['hidden-date-input']}
        tabIndex={-1}
        aria-hidden="true"
      />
      <button
        type="button"
        className={styles['calendar-button']}
        onClick={handleCalendarClick}
        disabled={disabled}
        aria-label={t('dateInput.openCalendar') as string}
        tabIndex={-1}
      >
        <CalendarIcon size={18} />
      </button>
      {displayValue && !disabled && (
        <button
          type="button"
          className={styles['clear-button']}
          onClick={handleClear}
          aria-label={t('dateInput.clearDate') as string}
          tabIndex={-1}
        >
          ×
        </button>
      )}
    </div>
  );
};
