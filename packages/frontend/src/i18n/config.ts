import i18n, { type TFunction } from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import 'intl-pluralrules';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@scrumooth/shared';

// All locale JSON files are served from public/locales/ and fetched at runtime
// via i18next-http-backend. This keeps the main bundle lean and avoids
// duplicating locale files between src/ and public/.
export const i18nInstance = i18n.use(HttpBackend).use(LanguageDetector).use(initReactI18next);

export function initI18n(): Promise<TFunction> {
  return i18nInstance.init({
    // All locales fetched on demand from public/locales/{lng}/{ns}.json
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    // Auto-detect language: cookie → navigator → default
    // NOTE: We intentionally exclude localStorage from detection because:
    // - Zustand persist uses localStorage key 'scrumooth.locale' with JSON format
    // - i18next LanguageDetector expects plain string format
    // - This collision causes i18next to overwrite and break Zustand's persisted state
    // - Cookie (set by Zustand's setLocale) is sufficient for detection
    detection: {
      order: ['cookie', 'navigator'],
      lookupCookie: 'scrumooth_locale',
      caches: ['cookie'],
    },

    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',

    ns: [
      'common',
      'auth',
      'dashboard',
      'backlog',
      'sprint',
      'daily-scrum',
      'impediments',
      'increments',
      'sprint-review',
      'retrospective',
      'reports',
      'team',
      'settings',
      'notifications',
      'errors',
      'validation',
    ],
    defaultNS: 'common',

    interpolation: {
      escapeValue: false, // React escapes by default
    },

    react: {
      useSuspense: true,
    },

    returnNull: false,
    returnEmptyString: false,
    saveMissing: true,
    missingKeyHandler: (lngs, ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing key: ${lngs.join(',')}:${ns}:${key}`);
      }
    },
    parseMissingKeyHandler: (key) => key,
  });
}
