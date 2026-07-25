import { describe, it, expect } from 'vitest';
import {
  isRTL,
  getDirection,
  getBaseLanguage,
  isSupportedLocale,
  isSupportedLocaleDev,
  normalizeLocale,
  normalizeLocaleDev,
} from '../../utils/locale.js';
import { SUPPORTED_LOCALES, SUPPORTED_LOCALES_DEV, DEFAULT_LOCALE } from '../../constants/index.js';

describe('locale utilities', () => {
  describe('isRTL', () => {
    it('should return true for Arabic', () => {
      expect(isRTL('ar')).toBe(true);
    });

    it('should return true for Hebrew', () => {
      expect(isRTL('he')).toBe(true);
    });

    it('should return true for Farsi', () => {
      expect(isRTL('fa')).toBe(true);
    });

    it('should return true for Urdu', () => {
      expect(isRTL('ur')).toBe(true);
    });

    it('should return false for English', () => {
      expect(isRTL('en')).toBe(false);
    });

    it('should return false for German', () => {
      expect(isRTL('de')).toBe(false);
    });

    it('should return false for French', () => {
      expect(isRTL('fr')).toBe(false);
    });

    it('should return false for Spanish', () => {
      expect(isRTL('es')).toBe(false);
    });

    it('should return false for Italian', () => {
      expect(isRTL('it')).toBe(false);
    });

    it('should detect RTL from locale tags like ar-SA', () => {
      expect(isRTL('ar-SA')).toBe(true);
    });

    it('should detect RTL from locale tags like he-IL', () => {
      expect(isRTL('he-IL')).toBe(true);
    });

    it('should return true for pseudo-rtl dev locale', () => {
      expect(isRTL('pseudo-rtl')).toBe(true);
    });

    it('should return false for pseudo dev locale', () => {
      expect(isRTL('pseudo')).toBe(false);
    });
  });

  describe('getDirection', () => {
    it('should return rtl for RTL locales', () => {
      expect(getDirection('ar')).toBe('rtl');
      expect(getDirection('he')).toBe('rtl');
      expect(getDirection('fa')).toBe('rtl');
    });

    it('should return ltr for LTR locales', () => {
      expect(getDirection('en')).toBe('ltr');
      expect(getDirection('de')).toBe('ltr');
      expect(getDirection('fr')).toBe('ltr');
      expect(getDirection('es')).toBe('ltr');
      expect(getDirection('it')).toBe('ltr');
    });

    it('should return rtl for RTL locale tags with region', () => {
      expect(getDirection('ar-EG')).toBe('rtl');
    });

    it('should return ltr for LTR locale tags with region', () => {
      expect(getDirection('de-AT')).toBe('ltr');
    });

    it('should return rtl for pseudo-rtl dev locale', () => {
      expect(getDirection('pseudo-rtl')).toBe('rtl');
    });

    it('should return ltr for pseudo dev locale', () => {
      expect(getDirection('pseudo')).toBe('ltr');
    });
  });

  describe('getBaseLanguage', () => {
    it('should extract base language from simple locale codes', () => {
      expect(getBaseLanguage('en')).toBe('en');
      expect(getBaseLanguage('de')).toBe('de');
      expect(getBaseLanguage('fr')).toBe('fr');
    });

    it('should extract base language from locale tags with region', () => {
      expect(getBaseLanguage('de-AT')).toBe('de');
      expect(getBaseLanguage('en-US')).toBe('en');
      expect(getBaseLanguage('fr-CA')).toBe('fr');
      expect(getBaseLanguage('es-MX')).toBe('es');
    });

    it('should convert to lowercase', () => {
      expect(getBaseLanguage('DE')).toBe('de');
      expect(getBaseLanguage('EN-US')).toBe('en');
    });

    it('should handle locale tags with script subtag', () => {
      expect(getBaseLanguage('zh-Hans')).toBe('zh');
    });

    it('should return empty string for empty input', () => {
      expect(getBaseLanguage('')).toBe('');
    });
  });

  describe('isSupportedLocale', () => {
    it('should return true for all SUPPORTED_LOCALES', () => {
      for (const locale of SUPPORTED_LOCALES) {
        expect(isSupportedLocale(locale)).toBe(true);
      }
    });

    it('should return true for supported locales as a type guard', () => {
      const value: string = 'de';
      if (isSupportedLocale(value)) {
        // TypeScript narrows to Locale here
        const _locale: 'en' | 'de' | 'fr' | 'es' | 'it' = value;
        expect(_locale).toBe('de');
      }
    });

    it('should return false for unsupported locales', () => {
      expect(isSupportedLocale('ar')).toBe(false);
      expect(isSupportedLocale('zh')).toBe(false);
      expect(isSupportedLocale('ja')).toBe(false);
      expect(isSupportedLocale('ko')).toBe(false);
      expect(isSupportedLocale('pt')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isSupportedLocale('')).toBe(false);
    });

    it('should return false for locale tags with region', () => {
      expect(isSupportedLocale('en-US')).toBe(false);
      expect(isSupportedLocale('de-AT')).toBe(false);
    });
  });

  describe('normalizeLocale', () => {
    it('should return the locale if it is a supported base language', () => {
      expect(normalizeLocale('en')).toBe('en');
      expect(normalizeLocale('de')).toBe('de');
      expect(normalizeLocale('fr')).toBe('fr');
      expect(normalizeLocale('es')).toBe('es');
      expect(normalizeLocale('it')).toBe('it');
    });

    it('should normalize locale tags by extracting base language', () => {
      expect(normalizeLocale('de-AT')).toBe('de');
      expect(normalizeLocale('en-US')).toBe('en');
      expect(normalizeLocale('fr-CA')).toBe('fr');
      expect(normalizeLocale('es-MX')).toBe('es');
      expect(normalizeLocale('it-IT')).toBe('it');
    });

    it('should fall back to DEFAULT_LOCALE for unsupported base languages', () => {
      expect(normalizeLocale('zh')).toBe(DEFAULT_LOCALE);
      expect(normalizeLocale('ja')).toBe(DEFAULT_LOCALE);
      expect(normalizeLocale('ar')).toBe(DEFAULT_LOCALE);
    });

    it('should fall back to DEFAULT_LOCALE for empty string', () => {
      expect(normalizeLocale('')).toBe(DEFAULT_LOCALE);
    });

    it('should handle uppercase input by normalizing via getBaseLanguage', () => {
      expect(normalizeLocale('DE')).toBe('de');
      expect(normalizeLocale('EN-US')).toBe('en');
    });

    it('should fall back to DEFAULT_LOCALE for completely unsupported locale tags', () => {
      expect(normalizeLocale('zh-Hans')).toBe(DEFAULT_LOCALE);
    });
  });

  describe('isSupportedLocaleDev', () => {
    it('should return true for all SUPPORTED_LOCALES', () => {
      for (const locale of SUPPORTED_LOCALES) {
        expect(isSupportedLocaleDev(locale)).toBe(true);
      }
    });

    it('should return true for dev-only locales', () => {
      expect(isSupportedLocaleDev('pseudo')).toBe(true);
      expect(isSupportedLocaleDev('pseudo-rtl')).toBe(true);
    });

    it('should return false for unsupported locales', () => {
      expect(isSupportedLocaleDev('ar')).toBe(false);
      expect(isSupportedLocaleDev('zh')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isSupportedLocaleDev('')).toBe(false);
    });

    it('should return true for all SUPPORTED_LOCALES_DEV', () => {
      for (const locale of SUPPORTED_LOCALES_DEV) {
        expect(isSupportedLocaleDev(locale)).toBe(true);
      }
    });
  });

  describe('normalizeLocaleDev', () => {
    it('should return production locales as-is', () => {
      expect(normalizeLocaleDev('en')).toBe('en');
      expect(normalizeLocaleDev('de')).toBe('de');
      expect(normalizeLocaleDev('fr')).toBe('fr');
      expect(normalizeLocaleDev('es')).toBe('es');
      expect(normalizeLocaleDev('it')).toBe('it');
    });

    it('should return dev-only locales as-is', () => {
      expect(normalizeLocaleDev('pseudo')).toBe('pseudo');
      expect(normalizeLocaleDev('pseudo-rtl')).toBe('pseudo-rtl');
    });

    it('should normalize locale tags by extracting base language', () => {
      expect(normalizeLocaleDev('de-AT')).toBe('de');
      expect(normalizeLocaleDev('en-US')).toBe('en');
    });

    it('should fall back to DEFAULT_LOCALE for unsupported locales', () => {
      expect(normalizeLocaleDev('zh')).toBe(DEFAULT_LOCALE);
      expect(normalizeLocaleDev('ja')).toBe(DEFAULT_LOCALE);
    });

    it('should not strip compound dev locale codes like pseudo-rtl to pseudo', () => {
      // This is critical: getBaseLanguage('pseudo-rtl') === 'pseudo',
      // but normalizeLocaleDev should return 'pseudo-rtl' intact.
      expect(normalizeLocaleDev('pseudo-rtl')).toBe('pseudo-rtl');
    });
  });
});
