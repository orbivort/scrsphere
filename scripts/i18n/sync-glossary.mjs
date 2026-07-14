#!/usr/bin/env node

/**
 * Glossary Compliance Check
 *
 * Verifies that glossary terms are used consistently across locale files.
 * Handles compound terms (e.g., "Product Owner") that should not be partially translated.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const GLOSSARY_PATH = join(process.cwd(), 'packages/shared/i18n/glossary.json');
const LOCALES_DIRS = [
  join(process.cwd(), 'packages/frontend/public/locales'),
  join(process.cwd(), 'packages/backend/src/locales'),
];

const BASE_LOCALE = 'en';
const TARGET_LOCALES = ['de', 'fr', 'es', 'it'];

// Compound Scrum terms that contain shorter glossary terms but should stay as-is
// These are NOT false positives - the compound term is the canonical form
const COMPOUND_TERMS = [
  'Product Owner',
  'Product Backlog',
  'Product Goal',
  'Sprint Goal',
  'Sprint Backlog',
  'Sprint Planning',
  'Sprint Review',
  'Sprint Retrospective',
  'Daily Scrum',
  'Definition of Done',
  'Burndown Chart',
  'Story Points',
  'Product Backlog Refinement',
];

// Check if a term is part of a compound term that should not trigger a warning
function isPartOfCompoundTerm(term, content) {
  for (const compound of COMPOUND_TERMS) {
    // If the compound term exists and contains this term as a substring
    if (compound.includes(term) && compound !== term) {
      // Check if the compound exists anywhere in the content
      if (content.includes(compound)) {
        return true;
      }
    }
  }
  return false;
}

// Check if term appears as a standalone word (with word boundaries and exact case)
// This prevents false positives from:
// 1. Substring matches like "Impediment" in "Impedimento"
// 2. Case mismatches like "Focus" (Scrum Value) vs "focus" (keyboard focus)
function appearsAsStandaloneTerm(term, content) {
  // Create a regex that matches the term with word boundaries and exact case
  const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const wordBoundaryRegex = new RegExp(`"([^"]*\\b${escapedTerm}\\b[^"]*)"`, 'g');
  return wordBoundaryRegex.test(content);
}

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
        // Skip metadata fields (prefixed with _)
        if (term.startsWith('_')) continue;

        const expectedTranslation = translations[locale];
        if (!expectedTranslation) continue;

        // Skip compound term parts - if this term is part of a larger compound that exists,
        // don't flag it (e.g., "Product" in "Product Owner")
        if (isPartOfCompoundTerm(term, content)) {
          continue;
        }

        // Check if the glossary term appears as a standalone word (not just a substring)
        if (appearsAsStandaloneTerm(term, content)) {
          // Check if the expected translation also appears
          if (!content.includes(expectedTranslation)) {
            console.log(`⚠️  ${locale}/${file}: "${term}" — expected "${expectedTranslation}" per glossary`);
            violations++;
          }
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