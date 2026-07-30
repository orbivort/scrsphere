import { test, expect } from '../fixtures';
import AxeBuilder from '@axe-core/playwright';

/**
 * i18n Accessibility E2E Tests
 *
 * Verifies accessibility compliance across all supported locales on the login page.
 * For each locale the test:
 * 1. Navigates to the login page
 * 2. Switches locale via cookie + localStorage (Zustand persist)
 * 3. Waits for i18n to apply (document.documentElement.lang matches)
 * 4. Runs axe-core accessibility scan
 * 5. Asserts no violations related to lang or dir attributes
 * 6. Asserts document.documentElement.lang starts with the correct locale code
 *
 * Run with: pnpm run test:e2e -- --grep @a11y
 */

const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'it', 'es'] as const;

type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/**
 * Switches the application locale by setting the Zustand-persisted locale value
 * in localStorage and the scrumooth_locale cookie, then reloading the page.
 * On reload the I18nProvider reads the cookie via i18next-browser-languagedetector
 * and applies the new locale.
 */
async function switchLocale(
  page: import('@playwright/test').Page,
  locale: SupportedLocale
): Promise<void> {
  await page.evaluate((loc) => {
    localStorage.setItem(
      'scrumooth.locale',
      JSON.stringify({ state: { locale: loc }, version: 0 })
    );

    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 1);
    document.cookie = `scrumooth_locale=${loc}; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
  }, locale);

  await page.reload({ waitUntil: 'domcontentloaded' });

  // Wait for the I18nProvider to apply the new locale after hydration
  await expect(async () => {
    const currentLang = await page.evaluate(() => document.documentElement.lang);
    expect(currentLang).toMatch(new RegExp(`^${locale}`));
  }).toPass({ timeout: 15_000 });
}

/**
 * Runs an axe-core accessibility scan and returns violations filtered to
 * lang and dir attribute rules.
 */
async function getA11yViolations(
  page: import('@playwright/test').Page
): Promise<import('axe-core').Result[]> {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.filter(
    (violation) => violation.id.includes('lang') || violation.id.includes('dir')
  );
}

test.describe('i18n Accessibility @a11y', () => {
  for (const locale of SUPPORTED_LOCALES) {
    test(`login page has correct lang attribute and no lang/dir a11y violations for locale "${locale}"`, async ({
      page,
    }) => {
      await test.step('Navigate to login page', async () => {
        await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30_000 });
      });

      await test.step(`Switch locale to ${locale}`, async () => {
        await switchLocale(page, locale);
      });

      await test.step(`Assert document.documentElement.lang starts with "${locale}"`, async () => {
        const lang = await page.evaluate(() => document.documentElement.lang);
        expect(lang).toMatch(new RegExp(`^${locale}`));
      });

      await test.step('Run axe-core accessibility scan for lang/dir violations', async () => {
        const violations = await getA11yViolations(page);

        if (violations.length > 0) {
          const details = violations
            .map((v) => `${v.id}: ${v.description} (${v.nodes.length} nodes)`)
            .join('; ');
          throw new Error(`Accessibility violations found: ${details}`);
        }

        expect(violations).toHaveLength(0);
      });
    });
  }
});
