import i18n, { type TFunction } from 'i18next';
import { initReactI18next } from 'react-i18next';
import HttpBackend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@scrumooth/shared';

// Bundled default locale + common namespace (avoids flash of untranslated text)
import enCommon from '../locales/en/common.json';

export const i18nInstance = i18n.use(HttpBackend).use(LanguageDetector).use(initReactI18next);

export function initI18n(initialLocale?: Locale): Promise<TFunction> {
  return i18nInstance.init({
    resources: {
      en: { common: enCommon },
    },
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [...SUPPORTED_LOCALES],
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
    partialBundledLanguages: true,

    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },

    detection: {
      order: ['cookie', 'localStorage', 'navigator'],
      lookupCookie: 'scrumooth_locale',
      lookupLocalStorage: 'scrumooth.locale',
      caches: ['localStorage'],
    },

    interpolation: {
      escapeValue: false, // React escapes by default
    },

    react: {
      useSuspense: true,
      bindI18n: 'languageChanged loaded',
    },

    returnNull: false,
    returnEmptyString: false,
    saveMissing: true,
    missingKeyHandler: (lngs, ns, key) => {
      if (import.meta.env.DEV) {
        console.warn(`[i18n] Missing key: ${lngs.join(',')}:${ns}:${key}`);
      }
    },

    lng: initialLocale,
  });
}
