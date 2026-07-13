/**
 * Vitest global setup file.
 * Runs before all tests and initializes shared resources.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export async function setup() {
  // Initialize i18n globally for all tests using the default i18n export
  // This ensures that all components using useTranslation() will get this instance

  const { DEFAULT_LOCALE, SUPPORTED_LOCALES } = await import('@scrumooth/shared');

  // Get the locale resources from testConfig
  const testConfig = await import('./i18n/testConfig');
  await testConfig.initTestI18n();
  const testInstance = testConfig.getTestI18nInstance();

  // Initialize the default i18n export with the same configuration
  // This makes it available to components that don't use I18nextProvider
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next);
    await i18n.init({
      resources: testInstance.options.resources,
      lng: DEFAULT_LOCALE,
      fallbackLng: DEFAULT_LOCALE,
      supportedLngs: [...SUPPORTED_LOCALES],
      ns: testInstance.options.ns,
      defaultNS: 'common',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
      returnNull: false,
      returnEmptyString: false,
    });
  }
}

export function teardown() {
  // Cleanup if needed
}
