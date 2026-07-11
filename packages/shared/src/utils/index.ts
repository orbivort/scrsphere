export {
  isRTL,
  getDirection,
  getBaseLanguage,
  isSupportedLocale,
  normalizeLocale,
} from './locale.js';
export {
  formatDate as formatLocaleDate,
  formatNumber,
  formatCurrency,
  formatRelativeTime,
  formatList,
  createCollator,
  sortLocaleStrings,
} from './formatters.js';

// Backward-compatible formatDate (uses DEFAULT_LOCALE)
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0] ?? '';
}

// Backward-compatible formatDateTime (uses DEFAULT_LOCALE)
export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
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
