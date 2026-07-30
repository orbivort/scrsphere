export {
  RTL_LANGUAGES,
  RTL_LANGUAGES_DEV,
  isRTL,
  isRTLDev,
  getDirection,
  getDirectionDev,
  getBaseLanguage,
  isSupportedLocale,
  isSupportedLocaleDev,
  normalizeLocale,
  normalizeLocaleDev,
} from './locale.js';
export {
  getCachedNumberFormat,
  getCachedDateTimeFormat,
  getCachedRelativeTimeFormat,
  getCachedListFormat,
  getCachedCollator,
} from './intlCache.js';
export { escapeHtml } from './escapeHtml.js';
export {
  LOCALE_COOKIE_NAME,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_COOKIE_SAME_SITE,
  LOCALE_COOKIE_PATH,
  getLocaleCookieOptions,
  buildLocaleCookieString,
  type LocaleCookieOptions,
} from './cookieConfig.js';
export {
  formatDate as formatLocaleDate,
  formatNumber,
  formatCurrency,
  formatRelativeTime,
  formatList,
  createCollator,
  sortLocaleStrings,
  formatDateRange,
  formatDateRangeCompact,
  formatDateForInput,
  parseDateFromInput,
  isValidDateForLocale,
  formatTime,
  formatDateTime,
  formatChartDate,
} from './formatters.js';

// Backward-compatible formatDate (uses DEFAULT_LOCALE)
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0] ?? '';
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
