#!/usr/bin/env node

/**
 * Glossary Compliance Check
 *
 * Verifies that glossary terms are used consistently across locale files.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const GLOSSARY_PATH = join(process.cwd(), 'packages/shared/i18n/glossary.json');
const LOCALES_DIRS = [
  join(process.cwd(), 'packages/frontend/src/locales'),
  join(process.cwd(), 'packages/backend/src/locales'),
];

const BASE_LOCALE = 'en';
const TARGET_LOCALES = ['de', 'fr', 'es', 'it'];

if (!existsSync(GLOSSARY_PATH)) {
  console.log('⚠️  No glossary.json found at packages/shared/i18n/');
  process.exit(0);
}

const glossary = JSON.parse(readFileSync(GLOSSARY_PATH, 'utf-8'));
let violations = 0;

for (const localesDir of LOCALES_DIRS) {
  if (!existsSync(localesDir)) continue;

  for (const locale of TARGET_LOCALES) {
    const localeDir = join(localesDir, locale);
    if (!existsSync(localeDir)) continue;

    const files = readdirSync(localeDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
      const content = readFileSync(join(localeDir, file), 'utf-8');

      for (const [term, translations] of Object.entries(glossary)) {
        const expectedTranslation = translations[locale];
        if (!expectedTranslation) continue;

        // Check if the glossary term appears in a non-standard translation
        if (content.includes(term) && !content.includes(expectedTranslation)) {
          console.log(`⚠️  ${locale}/${file}: "${term}" — expected "${expectedTranslation}" per glossary`);
          violations++;
        }
      }
    }
  }
}

if (violations === 0) {
  console.log('✅ All glossary terms are used consistently');
} else {
  console.log(`\n⚠️  Found ${violations} glossary inconsistencies`);
}
