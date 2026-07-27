#!/usr/bin/env node

/**
 * Glossary Compliance Check
 *
 * Validates that Scrum terminology is used consistently across all locale files.
 * Enforces Scrum.org directives where core terms must remain in English.
 *
 * Supports three glossary formats:
 * 1. String: "Scrum" - base term applies to all locales
 * 2. Object with _base: { "_base": "Increment", "es": "Incremento" } - base + locale overrides
 * 3. Legacy object: { "en": "Sprint", "de": "Sprint" } - backward compatibility
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GLOSSARY_PATH = join(process.cwd(), 'packages/shared/i18n/glossary.json');
const LOCALES_DIRS = [
  join(process.cwd(), 'packages/frontend/public/locales'),
  join(process.cwd(), 'packages/backend/src/locales'),
];

const BASE_LOCALE = 'en';
const TARGET_LOCALES = ['de', 'fr', 'es', 'it'];

/**
 * Normalize glossary term value to handle multiple formats.
 *
 * @param {string|object} termValue - The glossary term value
 * @param {string} locale - The target locale (e.g., 'de', 'fr')
 * @returns {string|null} The expected translation for the locale
 */
export function normalizeGlossaryTerm(termValue, locale) {
  // Format 1: String value (base term applies to all locales)
  if (typeof termValue === 'string') {
    return termValue;
  }

  // Format 2 & 3: Object value
  if (typeof termValue === 'object' && termValue !== null) {
    // Check for locale-specific override
    if (termValue[locale]) {
      return termValue[locale];
    }

    // Fall back to _base field (Format 2: { _base: "Increment", es: "Incremento" })
    if (termValue._base) {
      return termValue._base;
    }

    // Fall back to 'en' field (Format 3: legacy { en: "Sprint", de: "Sprint" })
    if (termValue.en) {
      return termValue.en;
    }
  }

  // No translation available
  return null;
}

/**
 * Check if a term appears as a standalone word in quoted JSON strings.
 * Uses word boundaries and exact case matching to prevent false positives.
 *
 * @param {string} term - The glossary term to search for
 * @param {string} content - The locale file content to search within
 * @returns {boolean} True if the term appears as a standalone word
 */
export function appearsAsStandaloneTerm(term, content) {
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordBoundaryRegex = new RegExp(`"([^"]*\\b${escapedTerm}\\b[^"]*)"`, 'g');
  return wordBoundaryRegex.test(content);
}

/**
 * Recursively compare JSON objects to find glossary violations.
 * Checks if values at the same key path match glossary expectations.
 *
 * @param {object} enObj - English locale JSON object
 * @param {object} localeObj - Target locale JSON object
 * @param {string} locale - Target locale code
 * @param {object} glossary - Parsed glossary object
 * @param {string} path - Current JSON key path
 * @returns {string[]} Array of violation messages
 */
function compareJsonValues(enObj, localeObj, locale, glossary, path = '') {
  const violations = [];

  for (const key in enObj) {
    const currentPath = path ? `${path}.${key}` : key;
    const enValue = enObj[key];
    const localeValue = localeObj[key];

    if (typeof enValue === 'string' && typeof localeValue === 'string') {
      // Check each glossary term against this value
      for (const [term, termValue] of Object.entries(glossary)) {
        if (term.startsWith('_')) continue; // Skip metadata

        const expectedTranslation = normalizeGlossaryTerm(termValue, locale);
        if (!expectedTranslation) continue;

        // Get base term for comparison
        const baseTerm = typeof termValue === 'string' ? termValue : (termValue._base || termValue.en);
        if (!baseTerm) continue;

        // Only check if the English value EXACTLY matches the glossary term
        // This allows phrase translations (e.g., "No Active Sprint" → "Kein aktiver Sprint")
        // We only enforce the glossary when the term appears standalone
        if (enValue === baseTerm || enValue === term) {
          // Check if locale value differs from expected translation
          if (localeValue !== expectedTranslation) {
            violations.push(
              `${currentPath}: "${localeValue}" → should be "${expectedTranslation}" (EN: "${enValue}")`
            );
          }
        }
      }
    } else if (typeof enValue === 'object' && typeof localeValue === 'object' && enValue !== null && localeValue !== null) {
      // Recursively check nested objects
      violations.push(...compareJsonValues(enValue, localeValue, locale, glossary, currentPath));
    }
  }

  return violations;
}

/**
 * Run the glossary compliance check against all locale directories.
 *
 * @param {object} glossary - The parsed glossary object
 * @param {string[]} localesDirs - Directories containing locale subdirectories
 * @param {string[]} targetLocales - Locales to check (e.g., ['de', 'fr', 'es', 'it'])
 * @returns {{ violations: number, details: string[] }} Check result
 */
export function checkGlossaryCompliance(glossary, localesDirs, targetLocales) {
  let violations = 0;
  const details = [];

  for (const localesDir of localesDirs) {
    if (!existsSync(localesDir)) continue;

    // Check English locale directory exists
    const enLocaleDir = join(localesDir, BASE_LOCALE);
    if (!existsSync(enLocaleDir)) continue;

    for (const locale of targetLocales) {
      const localeDir = join(localesDir, locale);
      if (!existsSync(localeDir)) continue;

      const files = readdirSync(localeDir).filter((f) => f.endsWith('.json'));

      for (const file of files) {
        const localeFilePath = join(localeDir, file);
        const enFilePath = join(enLocaleDir, file);

        if (!existsSync(enFilePath)) continue;

        try {
          const localeContent = readFileSync(localeFilePath, 'utf-8');
          const enContent = readFileSync(enFilePath, 'utf-8');

          const localeJson = JSON.parse(localeContent);
          const enJson = JSON.parse(enContent);

          // Compare JSON values to find glossary violations
          const fileViolations = compareJsonValues(enJson, localeJson, locale, glossary);

          for (const violation of fileViolations) {
            const message = `${locale}/${file}: ${violation}`;
            details.push(message);
            violations++;
          }
        } catch (parseError) {
          // Skip JSON parse errors (handled by i18n:check)
          if (parseError instanceof SyntaxError) {
            continue;
          }
          throw parseError;
        }
      }
    }
  }

  return { violations, details };
}

// ---------------------------------------------------------------------------
// Main execution (only when run directly, not when imported)
// ---------------------------------------------------------------------------
const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isMainModule) {
  if (!existsSync(GLOSSARY_PATH)) {
    console.log('⚠️  No glossary.json found at packages/shared/i18n/');
    process.exit(0);
  }

  const glossary = JSON.parse(readFileSync(GLOSSARY_PATH, 'utf-8'));
  const result = checkGlossaryCompliance(glossary, LOCALES_DIRS, TARGET_LOCALES);

  if (result.violations === 0) {
    console.log('✅ All glossary terms are used consistently');
  } else {
    for (const detail of result.details) {
      console.log(`⚠️  ${detail}`);
    }
    console.log(`\n⚠️  Found ${result.violations} glossary inconsistencies`);
  }
}