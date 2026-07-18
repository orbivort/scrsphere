import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
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
} from '../../utils/formatters.js';
import { DATE_INPUT_FORMATS, DATE_FORMAT_EXAMPLES, type Locale } from '../../constants/index.js';

describe('formatters', () => {
  describe('formatDate', () => {
    it('should format a Date object with default PP format', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDate(date, 'en');
      expect(result).toBeTruthy();
      // PP format produces something like "15 Jun 2024" in English
      expect(result).toContain('2024');
    });

    it('should format an ISO date string', () => {
      const result = formatDate('2024-06-15T12:00:00Z', 'en');
      expect(result).toBeTruthy();
      expect(result).toContain('2024');
    });

    it('should format differently per locale', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const enResult = formatDate(date, 'en');
      const deResult = formatDate(date, 'de');
      // German date format is different from English
      expect(enResult).not.toBe(deResult);
    });

    it('should use custom format string', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDate(date, 'en', 'yyyy-MM-dd');
      expect(result).toBe('2024-06-15');
    });

    it('should format with German locale', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDate(date, 'de', 'yyyy-MM-dd');
      expect(result).toBe('2024-06-15');
    });
  });

  describe('formatNumber', () => {
    it('should format an integer in English', () => {
      const result = formatNumber(1234, 'en');
      // English uses comma as thousands separator
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    it('should format a decimal number', () => {
      const result = formatNumber(1234.56, 'en');
      expect(result).toContain('56');
    });

    it('should use German number formatting', () => {
      const result = formatNumber(1234.56, 'de');
      // German uses period as thousands separator and comma as decimal
      expect(result).toBeTruthy();
    });

    it('should accept Intl.NumberFormatOptions', () => {
      const result = formatNumber(0.1234, 'en', { style: 'percent' });
      expect(result).toContain('12');
    });

    it('should format large numbers', () => {
      const result = formatNumber(1000000, 'en');
      expect(result).toContain('1');
      expect(result).toContain('000');
    });
  });

  describe('formatCurrency', () => {
    it('should format EUR by default', () => {
      const result = formatCurrency(1234.56, 'en');
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    it('should format USD when specified', () => {
      const result = formatCurrency(1234.56, 'en', 'USD');
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    it('should format currency differently per locale', () => {
      const enResult = formatCurrency(1234.56, 'en', 'EUR');
      const deResult = formatCurrency(1234.56, 'de', 'EUR');
      // Same amount, different formatting conventions
      expect(enResult).not.toBe(deResult);
    });

    it('should format zero', () => {
      const result = formatCurrency(0, 'en', 'EUR');
      expect(result).toBeTruthy();
    });
  });

  describe('formatRelativeTime', () => {
    let realDateNow: () => number;

    beforeEach(() => {
      realDateNow = Date.now;
      // Pin Date.now so relative time is deterministic
      Date.now = () => new Date('2024-06-15T12:00:00Z').getTime();
    });

    afterEach(() => {
      Date.now = realDateNow;
    });

    it('should format seconds ago', () => {
      const date = new Date('2024-06-15T11:59:30Z'); // 30 seconds ago
      const result = formatRelativeTime(date, 'en');
      expect(result).toBeTruthy();
    });

    it('should format minutes ago', () => {
      const date = new Date('2024-06-15T11:30:00Z'); // 30 minutes ago
      const result = formatRelativeTime(date, 'en');
      expect(result).toBeTruthy();
    });

    it('should format hours ago', () => {
      const date = new Date('2024-06-15T09:00:00Z'); // 3 hours ago
      const result = formatRelativeTime(date, 'en');
      expect(result).toBeTruthy();
    });

    it('should format days ago', () => {
      const date = new Date('2024-06-13T12:00:00Z'); // 2 days ago
      const result = formatRelativeTime(date, 'en');
      expect(result).toBeTruthy();
    });

    it('should format weeks ago', () => {
      const date = new Date('2024-06-01T12:00:00Z'); // ~2 weeks ago
      const result = formatRelativeTime(date, 'en');
      expect(result).toBeTruthy();
    });

    it('should format months ago', () => {
      const date = new Date('2024-03-15T12:00:00Z'); // ~3 months ago
      const result = formatRelativeTime(date, 'en');
      expect(result).toBeTruthy();
    });

    it('should format years ago', () => {
      const date = new Date('2022-06-15T12:00:00Z'); // ~2 years ago
      const result = formatRelativeTime(date, 'en');
      expect(result).toBeTruthy();
    });

    it('should accept ISO date string', () => {
      const result = formatRelativeTime('2024-06-15T11:30:00Z', 'en');
      expect(result).toBeTruthy();
    });

    it('should format future times', () => {
      const date = new Date('2024-06-15T12:00:30Z'); // 30 seconds in the future
      const result = formatRelativeTime(date, 'en');
      expect(result).toBeTruthy();
    });
  });

  describe('formatList', () => {
    it('should format a conjunction list in English', () => {
      const result = formatList(['Alice', 'Bob', 'Charlie'], 'en');
      // English conjunction: "Alice, Bob, and Charlie"
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
      expect(result).toContain('Charlie');
    });

    it('should format a disjunction list in English', () => {
      const result = formatList(['Alice', 'Bob'], 'en', 'disjunction');
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
    });

    it('should format a conjunction list in German', () => {
      const result = formatList(['Alice', 'Bob', 'Charlie'], 'de');
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
      expect(result).toContain('Charlie');
    });

    it('should handle two items', () => {
      const result = formatList(['Alice', 'Bob'], 'en');
      expect(result).toContain('Alice');
      expect(result).toContain('Bob');
    });

    it('should handle a single item', () => {
      const result = formatList(['Alice'], 'en');
      expect(result).toBe('Alice');
    });
  });

  describe('createCollator', () => {
    it('should return an Intl.Collator instance', () => {
      const collator = createCollator('en');
      expect(collator).toBeInstanceOf(Intl.Collator);
    });

    it('should use default options (sensitivity: base, numeric: true)', () => {
      const collator = createCollator('en');
      // "base" sensitivity ignores case and accents
      expect(collator.compare('a', 'A')).toBe(0);
      // numeric: true means "2" < "10"
      expect(collator.compare('2', '10')).toBeLessThan(0);
    });

    it('should accept custom options', () => {
      const collator = createCollator('en', { sensitivity: 'case' });
      // "case" sensitivity distinguishes case but not accents
      expect(collator.compare('a', 'A')).not.toBe(0);
    });

    it('should create a collator for each supported locale', () => {
      const locales: Locale[] = ['en', 'de', 'fr', 'es', 'it'];
      for (const locale of locales) {
        const collator = createCollator(locale);
        expect(collator).toBeInstanceOf(Intl.Collator);
      }
    });
  });

  describe('sortLocaleStrings', () => {
    it('should sort English strings alphabetically', () => {
      const items = ['cherry', 'apple', 'banana'];
      const result = sortLocaleStrings(items, 'en');
      expect(result).toEqual(['apple', 'banana', 'cherry']);
    });

    it('should not mutate the original array', () => {
      const items = ['cherry', 'apple', 'banana'];
      const original = [...items];
      sortLocaleStrings(items, 'en');
      expect(items).toEqual(original);
    });

    it('should sort German strings with umlauts correctly', () => {
      // In German collation with sensitivity:base, Ä sorts like A (near the beginning, not after Z)
      const items = ['Zebra', 'Ökonom', 'Apfel'];
      const result = sortLocaleStrings(items, 'de');
      // Apfel and Ökonom should sort before Zebra in German
      expect(result[2]).toBe('Zebra');
      // Ä and A are treated as equivalent with sensitivity:base
    });

    it('should sort numeric strings numerically when numeric option is on', () => {
      // createCollator defaults to numeric: true
      const items = ['item10', 'item2', 'item1'];
      const result = sortLocaleStrings(items, 'en');
      expect(result).toEqual(['item1', 'item2', 'item10']);
    });

    it('should handle empty arrays', () => {
      const result = sortLocaleStrings([], 'en');
      expect(result).toEqual([]);
    });

    it('should handle single-element arrays', () => {
      const result = sortLocaleStrings(['solo'], 'en');
      expect(result).toEqual(['solo']);
    });
  });

  describe('formatDateRange', () => {
    it('should format a date range correctly', () => {
      const start = new Date('2024-06-15T12:00:00Z');
      const end = new Date('2024-06-20T12:00:00Z');
      const result = formatDateRange(start, end, 'en');
      expect(result).toContain('2024');
      expect(result).toContain('\u2013');
    });

    it('should use custom format string', () => {
      const start = new Date('2024-06-15T12:00:00Z');
      const end = new Date('2024-06-20T12:00:00Z');
      const result = formatDateRange(start, end, 'en', 'yyyy-MM-dd');
      expect(result).toBe('2024-06-15\u20132024-06-20');
    });

    it('should work with different locales', () => {
      const start = new Date('2024-06-15T12:00:00Z');
      const end = new Date('2024-06-20T12:00:00Z');
      const enResult = formatDateRange(start, end, 'en');
      const deResult = formatDateRange(start, end, 'de');
      expect(enResult).not.toBe(deResult);
    });
  });

  describe('formatDateRangeCompact', () => {
    it('should format a compact date range', () => {
      const start = new Date('2024-06-15T12:00:00Z');
      const end = new Date('2024-06-20T12:00:00Z');
      const result = formatDateRangeCompact(start, end, 'en');
      expect(result).toContain('2024');
      expect(result).toContain('\u2013');
    });
  });

  describe('formatDateForInput', () => {
    it('should format date in English format (dd/MM/yyyy)', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDateForInput(date, 'en');
      expect(result).toBe('15/06/2024');
    });

    it('should format date in German format (dd.MM.yyyy)', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDateForInput(date, 'de');
      expect(result).toBe('15.06.2024');
    });

    it('should format date in French format (dd/MM/yyyy)', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDateForInput(date, 'fr');
      expect(result).toBe('15/06/2024');
    });

    it('should format date in Spanish format (dd/MM/yyyy)', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDateForInput(date, 'es');
      expect(result).toBe('15/06/2024');
    });

    it('should format date in Italian format (dd/MM/yyyy)', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatDateForInput(date, 'it');
      expect(result).toBe('15/06/2024');
    });

    it('should accept ISO date string', () => {
      const result = formatDateForInput('2024-06-15', 'en');
      expect(result).toBe('15/06/2024');
    });

    it('should return empty string for invalid date', () => {
      const result = formatDateForInput('invalid', 'en');
      expect(result).toBe('');
    });

    it('should return empty string for empty input', () => {
      const result = formatDateForInput('', 'en');
      expect(result).toBe('');
    });
  });

  describe('parseDateFromInput', () => {
    it('should parse English format (dd/MM/yyyy) to ISO', () => {
      const result = parseDateFromInput('15/06/2024', 'en');
      expect(result).toBe('2024-06-15');
    });

    it('should parse German format (dd.MM.yyyy) to ISO', () => {
      const result = parseDateFromInput('15.06.2024', 'de');
      expect(result).toBe('2024-06-15');
    });

    it('should parse French format (dd/MM/yyyy) to ISO', () => {
      const result = parseDateFromInput('15/06/2024', 'fr');
      expect(result).toBe('2024-06-15');
    });

    it('should parse Spanish format (dd/MM/yyyy) to ISO', () => {
      const result = parseDateFromInput('15/06/2024', 'es');
      expect(result).toBe('2024-06-15');
    });

    it('should parse Italian format (dd/MM/yyyy) to ISO', () => {
      const result = parseDateFromInput('15/06/2024', 'it');
      expect(result).toBe('2024-06-15');
    });

    it('should return empty string for invalid format', () => {
      const result = parseDateFromInput('2024-06-15', 'en');
      expect(result).toBe('');
    });

    it('should return empty string for empty input', () => {
      const result = parseDateFromInput('', 'en');
      expect(result).toBe('');
    });

    it('should handle edge case dates', () => {
      const result = parseDateFromInput('01/01/2024', 'en');
      expect(result).toBe('2024-01-01');
    });
  });

  describe('isValidDateForLocale', () => {
    it('should validate English format correctly', () => {
      expect(isValidDateForLocale('15/06/2024', 'en')).toBe(true);
      expect(isValidDateForLocale('2024-06-15', 'en')).toBe(false);
      expect(isValidDateForLocale('invalid', 'en')).toBe(false);
    });

    it('should validate German format correctly', () => {
      expect(isValidDateForLocale('15.06.2024', 'de')).toBe(true);
      expect(isValidDateForLocale('15/06/2024', 'de')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isValidDateForLocale('', 'en')).toBe(false);
    });
  });

  describe('DATE_INPUT_FORMATS', () => {
    it('should have format for all supported locales', () => {
      const locales: Locale[] = ['en', 'de', 'fr', 'es', 'it'];
      for (const locale of locales) {
        expect(DATE_INPUT_FORMATS[locale]).toBeTruthy();
        expect(typeof DATE_INPUT_FORMATS[locale]).toBe('string');
      }
    });

    it('should use correct separators', () => {
      expect(DATE_INPUT_FORMATS.en).toContain('/');
      expect(DATE_INPUT_FORMATS.de).toContain('.');
      expect(DATE_INPUT_FORMATS.fr).toContain('/');
      expect(DATE_INPUT_FORMATS.es).toContain('/');
      expect(DATE_INPUT_FORMATS.it).toContain('/');
    });
  });

  describe('DATE_FORMAT_EXAMPLES', () => {
    it('should have examples for all supported locales', () => {
      const locales: Locale[] = ['en', 'de', 'fr', 'es', 'it'];
      for (const locale of locales) {
        expect(DATE_FORMAT_EXAMPLES[locale]).toBeTruthy();
        expect(typeof DATE_FORMAT_EXAMPLES[locale]).toBe('string');
      }
    });
  });

  describe('formatTime', () => {
    it('should format time in 24-hour format for English locale', () => {
      const date = new Date('2024-06-15T14:30:00Z');
      const result = formatTime(date, 'en');
      expect(result).not.toMatch(/AM|PM/);
      expect(result).toContain(':');
    });

    it('should format time in 24-hour format for German locale', () => {
      const date = new Date('2024-06-15T14:30:00Z');
      const result = formatTime(date, 'de');
      expect(result).not.toMatch(/AM|PM/);
      expect(result).toContain(':');
    });

    it('should format time in 24-hour format for French locale', () => {
      const date = new Date('2024-06-15T14:30:00Z');
      const result = formatTime(date, 'fr');
      expect(result).not.toMatch(/AM|PM/);
    });

    it('should format time in 24-hour format for Spanish locale', () => {
      const date = new Date('2024-06-15T14:30:00Z');
      const result = formatTime(date, 'es');
      expect(result).not.toMatch(/AM|PM/);
    });

    it('should format time in 24-hour format for Italian locale', () => {
      const date = new Date('2024-06-15T14:30:00Z');
      const result = formatTime(date, 'it');
      expect(result).not.toMatch(/AM|PM/);
    });

    it('should accept ISO string input', () => {
      const result = formatTime('2024-06-15T14:30:00Z', 'de');
      expect(result).toContain(':');
    });
  });

  describe('formatDateTime', () => {
    it('should combine date and time for English locale', () => {
      const date = new Date('2024-06-15T14:30:00Z');
      const result = formatDateTime(date, 'en');
      expect(result).toContain('2024');
      expect(result).toContain(',');
    });

    it('should combine date and time for German locale with 24h time', () => {
      const date = new Date('2024-06-15T14:30:00Z');
      const result = formatDateTime(date, 'de');
      expect(result).toContain('2024');
      expect(result).not.toMatch(/AM|PM/);
    });

    it('should accept custom date format', () => {
      const date = new Date('2024-06-15T14:30:00Z');
      const result = formatDateTime(date, 'en', 'yyyy-MM-dd');
      expect(result).toContain('2024-06-15');
    });

    it('should accept ISO string input', () => {
      const result = formatDateTime('2024-06-15T14:30:00Z', 'en');
      expect(result).toContain('2024');
    });
  });

  describe('formatChartDate', () => {
    it('should format date in compact format for English locale', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatChartDate(date, 'en');
      expect(result).toContain('Jun');
    });

    it('should format date in compact format for German locale', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const result = formatChartDate(date, 'de');
      expect(result).toContain('Jun');
    });

    it('should produce different output for different locales', () => {
      const date = new Date('2024-06-15T12:00:00Z');
      const enResult = formatChartDate(date, 'en');
      const deResult = formatChartDate(date, 'de');
      // German uses dots in date format, English does not
      expect(enResult).not.toBe(deResult);
    });

    it('should accept ISO string input', () => {
      const result = formatChartDate('2024-06-15T12:00:00Z', 'en');
      expect(result).toContain('Jun');
    });
  });
});
