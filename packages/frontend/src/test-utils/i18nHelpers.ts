/**
 * i18n-aware test helpers for verifying translated content.
 *
 * These utilities allow tests to assert against i18n translation keys
 * rather than hardcoded English text, making tests resilient to locale
 * changes and ensuring correct i18n integration.
 */
import { screen } from '@testing-library/react';
import { type Locale } from '@scrumooth/shared';

import { getTestI18nInstance, getTranslationForKey } from '../i18n/testConfig';

/**
 * Get the translated text for a key in the current test locale.
 * Falls back to the key itself if i18n is not initialized.
 */
export function t(key: string, options?: Record<string, unknown>): string {
  try {
    const instance = getTestI18nInstance();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- i18next's t() has complex overloaded types
    return (instance.t as (key: string, options?: any) => string)(key, options);
  } catch {
    // If test i18n is not initialized, return the key
    return key;
  }
}

/**
 * Get the translated text for a key in a specific locale,
 * without changing the active test locale.
 */
export function tInLocale(key: string, locale: Locale, options?: Record<string, unknown>): string {
  return getTranslationForKey(key, locale, options);
}

/**
 * Assert that an element with the given text (resolved from i18n key) is in the document.
 * Uses the current test locale to resolve the translation.
 *
 * @example
 * expectI18nText('common:nav.dashboard').toBeInTheDocument();
 */
export function expectI18nText(key: string, options?: Record<string, unknown>): string {
  return t(key, options);
}

/**
 * Build a regex or string matcher for getByText / findByText that matches
 * the translated value of an i18n key.
 *
 * @example
 * screen.getByText(i18nMatcher('common:nav.dashboard'))
 */
export function i18nMatcher(key: string, options?: Record<string, unknown>): string {
  return t(key, options);
}

/**
 * Build matchers for all supported locales for a given key.
 * Useful for locale-specific parameterized tests.
 *
 * @example
 * const matchers = i18nMatchersForAllLocales('common:save');
 * // { en: 'Save', de: 'Speichern', fr: 'Enregistrer', es: 'Guardar', it: 'Salva' }
 */
export function i18nMatchersForAllLocales(
  key: string,
  locales: Locale[],
  options?: Record<string, unknown>
): Record<Locale, string> {
  const result = {} as Record<Locale, string>;
  for (const locale of locales) {
    result[locale] = tInLocale(key, locale, options);
  }
  return result;
}

/**
 * Find an element by its i18n-translated text content.
 * Resolves the key using the current test locale and searches for the element.
 */
export function getByI18nText(key: string, options?: Record<string, unknown>): HTMLElement {
  return screen.getByText(t(key, options));
}

/**
 * Find all elements by their i18n-translated text content.
 */
export function getAllByI18nText(key: string, options?: Record<string, unknown>): HTMLElement[] {
  return screen.getAllByText(t(key, options));
}

/**
 * Query for an element by its i18n-translated text content (returns null if not found).
 */
export function queryByI18nText(
  key: string,
  options?: Record<string, unknown>
): HTMLElement | null {
  return screen.queryByText(t(key, options));
}

/**
 * Find a button by its i18n-translated accessible name.
 */
export function getByI18nRole(
  role: string,
  key: string,
  options?: Record<string, unknown>
): HTMLElement {
  return screen.getByRole(role as 'button', { name: t(key, options) });
}

/**
 * Find an element by i18n-translated label text.
 */
export function getByI18nLabelText(key: string, options?: Record<string, unknown>): HTMLElement {
  return screen.getByLabelText(t(key, options));
}

/**
 * Find an element by i18n-translated placeholder text.
 */
export function getByI18nPlaceholderText(
  key: string,
  options?: Record<string, unknown>
): HTMLElement {
  return screen.getByPlaceholderText(t(key, options));
}

/**
 * Create a test helper bound to a specific locale for parameterized locale tests.
 */
export function createLocaleTestHelper(locale: Locale) {
  return {
    /** Get translated text in this locale */
    t: (key: string, options?: Record<string, unknown>) => tInLocale(key, locale, options),
    /** Get an element by translated text in this locale */
    getByText: (key: string, options?: Record<string, unknown>) =>
      screen.getByText(tInLocale(key, locale, options)),
    /** Query for an element by translated text in this locale */
    queryByText: (key: string, options?: Record<string, unknown>) =>
      screen.queryByText(tInLocale(key, locale, options)),
    /** Get element by translated label in this locale */
    getByLabelText: (key: string, options?: Record<string, unknown>) =>
      screen.getByLabelText(tInLocale(key, locale, options)),
    /** Get element by translated role name in this locale */
    getByRole: (role: string, key: string, options?: Record<string, unknown>) =>
      screen.getByRole(role as 'button', { name: tInLocale(key, locale, options) }),
    /** The locale being tested */
    locale,
  };
}

export type LocaleTestHelper = ReturnType<typeof createLocaleTestHelper>;
