import { format, parseISO, type Locale as DateFnsLocale } from 'date-fns';
import { enUS, de, fr, es, it } from 'date-fns/locale';
import type { Locale } from '../constants/index.js';

const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = { en: enUS, de, fr, es, it };

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
  return new Intl.NumberFormat(locale, options).format(value);
}

export function formatCurrency(value: number, locale: Locale, currency = 'EUR'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function formatRelativeTime(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const diffSeconds = (d.getTime() - Date.now()) / 1000;
  const absDiff = Math.abs(diffSeconds);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

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
  return new Intl.ListFormat(locale, { type }).format(items);
}

export function createCollator(
  locale: Locale,
  options: Intl.CollatorOptions = { sensitivity: 'base', numeric: true }
): Intl.Collator {
  return new Intl.Collator(locale, options);
}

export function sortLocaleStrings(items: string[], locale: Locale): string[] {
  return [...items].sort(createCollator(locale).compare);
}
