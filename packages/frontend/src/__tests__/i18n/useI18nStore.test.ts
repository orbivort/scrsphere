import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from '@testing-library/react';

import { useI18nStore, syncLocaleFromUser } from '@/i18n/useI18nStore';
import { DEFAULT_LOCALE, type Locale, type LocaleCookieOptions } from '@scrumooth/shared';

// Toggleable flag so we can exercise both the secure and non-secure
// locale cookie branches inside setLocale().
let mockCookieSecure = false;

vi.mock('@scrumooth/shared', async (importOriginal) => {
  const actual = (await importOriginal()) as {
    getLocaleCookieOptions: (
      runtime: 'node' | 'browser',
      isProduction?: boolean
    ) => LocaleCookieOptions;
  };
  return {
    ...actual,
    getLocaleCookieOptions: vi.fn((runtime: 'browser') => ({
      ...actual.getLocaleCookieOptions(runtime),
      secure: mockCookieSecure,
    })),
  };
});

describe('useI18nStore', () => {
  beforeEach(() => {
    // Reset the store to default state before each test
    act(() => {
      useI18nStore.setState({ locale: DEFAULT_LOCALE });
    });

    mockCookieSecure = false;

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
      const locales: Locale[] = ['en', 'de', 'fr', 'it', 'es'];
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

  describe('syncLocaleFromUser()', () => {
    it('should set locale when it differs from the current locale', () => {
      expect(useI18nStore.getState().locale).toBe(DEFAULT_LOCALE);

      act(() => {
        syncLocaleFromUser('de');
      });

      expect(useI18nStore.getState().locale).toBe('de');
    });

    it('should not change locale when it already matches', () => {
      act(() => {
        useI18nStore.getState().setLocale('fr');
      });

      // Calling with the same locale should be a no-op (does not call setLocale).
      act(() => {
        syncLocaleFromUser('fr');
      });

      expect(useI18nStore.getState().locale).toBe('fr');
    });
  });

  describe('locale cookie', () => {
    it('should write a cookie without Secure attribute on HTTP contexts', () => {
      mockCookieSecure = false;
      act(() => {
        useI18nStore.getState().setLocale('es');
      });

      expect(document.cookie).toContain('scrumooth_locale=es');
      expect(document.cookie).not.toContain('Secure');
    });

    it('should include Secure attribute on HTTPS contexts', () => {
      mockCookieSecure = true;
      let writtenCookie = '';
      const cookieSetter = vi
        .spyOn(Document.prototype, 'cookie', 'set')
        .mockImplementation((value: string) => {
          writtenCookie = value;
        });

      try {
        act(() => {
          useI18nStore.getState().setLocale('fr');
        });
      } finally {
        cookieSetter.mockRestore();
      }

      expect(writtenCookie).toContain('scrumooth_locale=fr');
      expect(writtenCookie).toContain('Secure');
    });
  });
});
