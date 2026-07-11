import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from '../constants/index.js';

const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

export function isRTL(locale: Locale | string): boolean {
  return RTL_LANGUAGES.has(getBaseLanguage(locale));
}

export function getDirection(locale: Locale | string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

export function getBaseLanguage(locale: string): string {
  return locale.split('-')[0]?.toLowerCase() ?? '';
}

export function isSupportedLocale(locale: string): locale is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale as Locale);
}

export function normalizeLocale(locale: string): Locale {
  const base = getBaseLanguage(locale);
  return isSupportedLocale(base) ? base : DEFAULT_LOCALE;
}
