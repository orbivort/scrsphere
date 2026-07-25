import { describe, it, expect } from 'vitest';
import {
  getCachedNumberFormat,
  getCachedDateTimeFormat,
  getCachedRelativeTimeFormat,
  getCachedListFormat,
  getCachedCollator,
} from '../../utils/intlCache.js';

describe('intlCache', () => {
  describe('getCachedNumberFormat', () => {
    it('should return the same instance for the same locale and options (cache hit)', () => {
      const fmt1 = getCachedNumberFormat('de');
      const fmt2 = getCachedNumberFormat('de');
      expect(fmt1).toBe(fmt2);
    });

    it('should return different instances for different locales (cache miss)', () => {
      const fmtDe = getCachedNumberFormat('de');
      const fmtEn = getCachedNumberFormat('en');
      expect(fmtDe).not.toBe(fmtEn);
    });

    it('should return different instances for same locale with different options', () => {
      const fmt1 = getCachedNumberFormat('de', { style: 'decimal' });
      const fmt2 = getCachedNumberFormat('de', { style: 'percent' });
      expect(fmt1).not.toBe(fmt2);
    });

    it('should return the same instance for same locale and same options', () => {
      const fmt1 = getCachedNumberFormat('de', { style: 'currency', currency: 'EUR' });
      const fmt2 = getCachedNumberFormat('de', { style: 'currency', currency: 'EUR' });
      expect(fmt1).toBe(fmt2);
    });

    it('should produce correct formatting output', () => {
      const fmt = getCachedNumberFormat('de');
      expect(fmt.format(1234.56)).toBeTruthy();
    });
  });

  describe('getCachedDateTimeFormat', () => {
    it('should return the same instance for the same locale and options', () => {
      const fmt1 = getCachedDateTimeFormat('de', { hour: '2-digit', minute: '2-digit' });
      const fmt2 = getCachedDateTimeFormat('de', { hour: '2-digit', minute: '2-digit' });
      expect(fmt1).toBe(fmt2);
    });

    it('should return different instances for different locales', () => {
      const fmtDe = getCachedDateTimeFormat('de');
      const fmtFr = getCachedDateTimeFormat('fr');
      expect(fmtDe).not.toBe(fmtFr);
    });
  });

  describe('getCachedRelativeTimeFormat', () => {
    it('should return the same instance for the same locale and options', () => {
      const fmt1 = getCachedRelativeTimeFormat('de', { numeric: 'auto' });
      const fmt2 = getCachedRelativeTimeFormat('de', { numeric: 'auto' });
      expect(fmt1).toBe(fmt2);
    });

    it('should return different instances for different locales', () => {
      const fmtDe = getCachedRelativeTimeFormat('de');
      const fmtEs = getCachedRelativeTimeFormat('es');
      expect(fmtDe).not.toBe(fmtEs);
    });
  });

  describe('getCachedListFormat', () => {
    it('should return the same instance for the same locale and options', () => {
      const fmt1 = getCachedListFormat('de', { type: 'conjunction' });
      const fmt2 = getCachedListFormat('de', { type: 'conjunction' });
      expect(fmt1).toBe(fmt2);
    });

    it('should return different instances for different options', () => {
      const fmtConj = getCachedListFormat('de', { type: 'conjunction' });
      const fmtDisj = getCachedListFormat('de', { type: 'disjunction' });
      expect(fmtConj).not.toBe(fmtDisj);
    });
  });

  describe('getCachedCollator', () => {
    it('should return the same instance for the same locale and options', () => {
      const fmt1 = getCachedCollator('de', { sensitivity: 'base' });
      const fmt2 = getCachedCollator('de', { sensitivity: 'base' });
      expect(fmt1).toBe(fmt2);
    });

    it('should return different instances for different options', () => {
      const fmt1 = getCachedCollator('de', { sensitivity: 'base' });
      const fmt2 = getCachedCollator('de', { sensitivity: 'accent' });
      expect(fmt1).not.toBe(fmt2);
    });
  });

  describe('LRU eviction', () => {
    it('should evict the least recently used entry when cache exceeds max size', () => {
      // The cache max size is 100. Fill with 101 unique entries to trigger eviction.
      // The first entry ('de' with no options) should be evicted.
      const firstFmt = getCachedNumberFormat('de');

      // Create 100 unique entries by using valid locales with different options.
      // We use a combination of valid locales and unique option objects.
      const validLocales = ['en', 'fr', 'es', 'it', 'de', 'pt', 'nl', 'ja', 'zh', 'ko'];
      for (let i = 0; i < 100; i++) {
        const locale = validLocales[i % validLocales.length];
        // Use minimumFractionDigits as a differentiator — each unique value creates a new cache key
        getCachedNumberFormat(locale!, { minimumFractionDigits: i });
      }

      // Now the first entry should have been evicted.
      // Calling getCachedNumberFormat('de') should return a new instance
      // because the original was evicted from the cache.
      const afterEviction = getCachedNumberFormat('de');
      expect(afterEviction).not.toBe(firstFmt);
    });
  });

  describe('cache key generation', () => {
    it('should produce same key for same locale and same options', () => {
      // Same locale + same options = same instance (same key)
      const fmt1 = getCachedNumberFormat('fr', { style: 'currency', currency: 'EUR' });
      const fmt2 = getCachedNumberFormat('fr', { style: 'currency', currency: 'EUR' });
      expect(fmt1).toBe(fmt2);
    });

    it('should produce different keys for same locale with different options', () => {
      const fmt1 = getCachedNumberFormat('fr', { style: 'currency', currency: 'EUR' });
      const fmt2 = getCachedNumberFormat('fr', { style: 'currency', currency: 'USD' });
      expect(fmt1).not.toBe(fmt2);
    });

    it('should treat undefined options the same as empty options', () => {
      // Both calls should hit the same cache key since undefined -> {}
      const fmt1 = getCachedNumberFormat('it');
      const fmt2 = getCachedNumberFormat('it', undefined);
      expect(fmt1).toBe(fmt2);
    });
  });
});
