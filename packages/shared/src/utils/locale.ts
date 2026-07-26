import {
  SUPPORTED_LOCALES,
  SUPPORTED_LOCALES_DEV,
  DEFAULT_LOCALE,
  type Locale,
  type LocaleDev,
} from '../constants/index.js';

/** Production RTL languages — does NOT include dev-only pseudo locales */
export const RTL_LANGUAGES = new Set(['ar', 'he', 'fa', 'ur']);

/** Dev-only RTL languages — includes pseudo-rtl for dry-run testing */
export const RTL_LANGUAGES_DEV = new Set([...RTL_LANGUAGES, 'pseudo-rtl']);

export function isRTL(locale: Locale | string): boolean {
  const base = getBaseLanguage(locale);
  return RTL_LANGUAGES.has(base) || RTL_LANGUAGES.has(locale);
}

export function isRTLDev(locale: Locale | string): boolean {
  const base = getBaseLanguage(locale);
  return RTL_LANGUAGES_DEV.has(base) || RTL_LANGUAGES_DEV.has(locale);
}

export function getDirection(locale: Locale | string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

export function getDirectionDev(locale: Locale | string): 'ltr' | 'rtl' {
  return isRTLDev(locale) ? 'rtl' : 'ltr';
}

export function getBaseLanguage(locale: string): string {
  return locale.split('-')[0]?.toLowerCase() ?? '';
}

export function isSupportedLocale(locale: string): locale is Locale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale as Locale);
}

/**
 * Development-only locale check that also accepts pseudo-localization locales
 * like 'pseudo' and 'pseudo-rtl'. Use this in dev-mode code paths that need
 * to validate user-facing locale values beyond the production set.
 */
export function isSupportedLocaleDev(locale: string): locale is LocaleDev {
  return (SUPPORTED_LOCALES_DEV as readonly string[]).includes(locale as LocaleDev);
}

export function normalizeLocale(locale: string): Locale {
  const base = getBaseLanguage(locale);
  return isSupportedLocale(base) ? base : DEFAULT_LOCALE;
}

/**
 * Development-only normalizer that also recognizes dev locales like
 * 'pseudo' and 'pseudo-rtl'. Returns the dev locale as-is when it matches
 * SUPPORTED_LOCALES_DEV, otherwise normalizes to the production default.
 */
export function normalizeLocaleDev(locale: string): LocaleDev {
  // Check the full string first so that compound codes like 'pseudo-rtl'
  // are not incorrectly stripped to their base language ('pseudo').
  if (isSupportedLocaleDev(locale)) {
    return locale;
  }
  const base = getBaseLanguage(locale);
  if (isSupportedLocaleDev(base)) {
    return base as LocaleDev;
  }
  return DEFAULT_LOCALE;
}
