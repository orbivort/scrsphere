import { type Locale } from 'date-fns';
import { enUS, de, es, fr, it } from 'date-fns/locale';

const localeMap: Record<string, Locale> = {
  en: enUS,
  de,
  es,
  fr,
  it,
};

/**
 * Get date-fns locale based on i18n language code
 * @param language - i18n language code (e.g., 'en', 'de', 'es', 'fr', 'it')
 * @returns date-fns Locale object
 */
export function getDateLocale(language: string): Locale {
  // Extract the base language code (e.g., 'en' from 'en-US')
  const baseLanguage = language.split('-')[0]?.toLowerCase() ?? 'en';
  return localeMap[baseLanguage] ?? enUS;
}
