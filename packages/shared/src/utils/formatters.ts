import { format, parse, parseISO, isValid, type Locale as DateFnsLocale } from 'date-fns';
import { enGB, de, fr, it, es } from 'date-fns/locale';
import { DATE_INPUT_FORMATS } from '../constants/index.js';
import type { Locale } from '../constants/index.js';
import {
  getCachedNumberFormat,
  getCachedDateTimeFormat,
  getCachedRelativeTimeFormat,
  getCachedListFormat,
  getCachedCollator,
} from './intlCache.js';

const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = { en: enGB, de, fr, it, es };

function resolveDateFnsLocale(locale: Locale): DateFnsLocale {
  // Locale is a union of all keys in DATE_FNS_LOCALES, so access is always safe
  return DATE_FNS_LOCALES[locale];
}

export function formatDate(date: Date | string, locale: Locale, fmt = 'PP'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt, { locale: resolveDateFnsLocale(locale) });
}

export function formatNumber(
  value: number,
  locale: Locale,
  options?: Intl.NumberFormatOptions
): string {
  return getCachedNumberFormat(locale, options).format(value);
}

export function formatCurrency(value: number, locale: Locale, currency = 'EUR'): string {
  return getCachedNumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatRelativeTime(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const diffSeconds = (d.getTime() - Date.now()) / 1000;
  const absDiff = Math.abs(diffSeconds);
  const rtf = getCachedRelativeTimeFormat(locale, { numeric: 'auto' });

  if (absDiff < 60) return rtf.format(Math.round(diffSeconds), 'second');
  if (absDiff < 3600) return rtf.format(Math.round(diffSeconds / 60), 'minute');
  if (absDiff < 86400) return rtf.format(Math.round(diffSeconds / 3600), 'hour');
  if (absDiff < 604800) return rtf.format(Math.round(diffSeconds / 86400), 'day');
  if (absDiff < 2592000) return rtf.format(Math.round(diffSeconds / 604800), 'week');
  if (absDiff < 31536000) return rtf.format(Math.round(diffSeconds / 2592000), 'month');
  return rtf.format(Math.round(diffSeconds / 31536000), 'year');
}

export function formatList(
  items: string[],
  locale: Locale,
  type: 'conjunction' | 'disjunction' = 'conjunction'
): string {
  return getCachedListFormat(locale, { type }).format(items);
}

export function createCollator(
  locale: Locale,
  options: Intl.CollatorOptions = { sensitivity: 'base', numeric: true }
): Intl.Collator {
  return getCachedCollator(locale, options);
}

export function sortLocaleStrings(items: string[], locale: Locale): string[] {
  return [...items].sort(createCollator(locale).compare);
}

export function formatDateRange(
  startDate: Date | string,
  endDate: Date | string,
  locale: Locale,
  fmt = 'PP'
): string {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  const startFormatted = format(start, fmt, { locale: resolveDateFnsLocale(locale) });
  const endFormatted = format(end, fmt, { locale: resolveDateFnsLocale(locale) });
  return `${startFormatted}\u2013${endFormatted}`;
}

export function formatDateRangeCompact(
  startDate: Date | string,
  endDate: Date | string,
  locale: Locale
): string {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  const fmt = 'PP';
  const startFormatted = format(start, fmt, { locale: resolveDateFnsLocale(locale) });
  const endFormatted = format(end, fmt, { locale: resolveDateFnsLocale(locale) });
  return `${startFormatted}\u2013${endFormatted}`;
}

/**
 * Format a date for display in a date input field using locale-specific format
 * @param date - Date to format (Date object or ISO string)
 * @param locale - Target locale
 * @returns Formatted date string in locale-specific format (e.g., '15.06.2024' for German)
 */
export function formatDateForInput(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) {
    return '';
  }
  const formatStr = DATE_INPUT_FORMATS[locale];
  return format(d, formatStr, { locale: resolveDateFnsLocale(locale) });
}

/**
 * Parse a locale-formatted date string from an input field into ISO format
 * @param dateString - Date string in locale-specific format
 * @param locale - Source locale
 * @returns ISO date string (YYYY-MM-DD) or empty string if invalid
 */
export function parseDateFromInput(dateString: string, locale: Locale): string {
  if (!dateString || dateString.trim() === '') {
    return '';
  }

  const formatStr = DATE_INPUT_FORMATS[locale];
  const dateFnsLocale = resolveDateFnsLocale(locale);

  try {
    const parsed = parse(dateString, formatStr, new Date(), { locale: dateFnsLocale });
    if (isValid(parsed)) {
      // Return ISO format YYYY-MM-DD
      return format(parsed, 'yyyy-MM-dd');
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Validate if a date string matches the locale-specific format
 * @param dateString - Date string to validate
 * @param locale - Target locale
 * @returns True if valid, false otherwise
 */
export function isValidDateForLocale(dateString: string, locale: Locale): boolean {
  if (!dateString || dateString.trim() === '') {
    return false;
  }

  const formatStr = DATE_INPUT_FORMATS[locale];
  const dateFnsLocale = resolveDateFnsLocale(locale);

  try {
    const parsed = parse(dateString, formatStr, new Date(), { locale: dateFnsLocale });
    return isValid(parsed);
  } catch {
    return false;
  }
}

/**
 * Format a time for display using locale-specific conventions.
 * All locales use 24-hour format, aligning with the enGB date-fns locale
 * (British English defaults to 24-hour in business/technical contexts).
 * The target organization is European, where 24-hour time is the standard.
 * @param date - Date to format (Date object or ISO string)
 * @param locale - Target locale
 * @returns Formatted time string in 24-hour format (e.g., '14:30')
 */
export function formatTime(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  };
  return getCachedDateTimeFormat(locale, options).format(d);
}

/**
 * Format a date and time for display using locale-specific conventions.
 * Combines date-fns locale-aware date formatting with Intl time formatting.
 * @param date - Date to format (Date object or ISO string)
 * @param locale - Target locale
 * @param dateFormat - date-fns format string for the date part (default: 'PP')
 * @returns Formatted date-time string (e.g., '15. Jun. 2024, 14:30' for German)
 */
export function formatDateTime(
  date: Date | string,
  locale: Locale,
  dateFormat: string = 'PP'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const dateStr = format(d, dateFormat, { locale: resolveDateFnsLocale(locale) });
  const timeStr = formatTime(d, locale);
  return `${dateStr}, ${timeStr}`;
}

/**
 * Format a date for chart axis labels using a compact, locale-aware format.
 * Falls back to the raw string if the date is invalid.
 * @param date - Date to format (Date object or ISO string)
 * @param locale - Target locale
 * @returns Compact formatted date string (e.g., '15 Jun' for English, '15. Jun' for German)
 */
export function formatChartDate(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) {
    return typeof date === 'string' ? date : '';
  }
  return format(d, 'd MMM', { locale: resolveDateFnsLocale(locale) });
}
