import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';

import { useI18nStore } from '@/i18n/useI18nStore';
import { DEFAULT_LOCALE, type Locale } from '@scrumooth/shared';

describe('useI18nStore', () => {
  beforeEach(() => {
    // Reset the store to default state before each test
    act(() => {
      useI18nStore.setState({ locale: DEFAULT_LOCALE });
    });

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('default state', () => {
    it('should have default locale set to "en"', () => {
      const state = useI18nStore.getState();
      expect(state.locale).toBe('en');
    });
  });

  describe('setLocale()', () => {
    it('should update locale', () => {
      act(() => {
        useI18nStore.getState().setLocale('de');
      });

      expect(useI18nStore.getState().locale).toBe('de');
    });

    it('should update locale to each supported locale', () => {
      const locales: Locale[] = ['en', 'de', 'fr', 'es', 'it'];
      for (const locale of locales) {
        act(() => {
          useI18nStore.getState().setLocale(locale);
        });

        expect(useI18nStore.getState().locale).toBe(locale);
      }
    });

    it('should update locale from de to fr', () => {
      act(() => {
        useI18nStore.getState().setLocale('de');
      });
      expect(useI18nStore.getState().locale).toBe('de');

      act(() => {
        useI18nStore.getState().setLocale('fr');
      });
      expect(useI18nStore.getState().locale).toBe('fr');
    });
  });

  describe('persistence', () => {
    it('should persist locale to localStorage', () => {
      act(() => {
        useI18nStore.getState().setLocale('es');
      });

      // The persist middleware stores data under the name 'scrumooth.locale'
      const stored = localStorage.getItem('scrumooth.locale');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.locale).toBe('es');
    });

    it('should persist default locale', () => {
      // Trigger a write by setting locale
      act(() => {
        useI18nStore.getState().setLocale(DEFAULT_LOCALE);
      });

      const stored = localStorage.getItem('scrumooth.locale');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.state.locale).toBe(DEFAULT_LOCALE);
    });
  });
});
