#!/usr/bin/env node

/**
 * i18n Validation Script
 *
 * Validates:
 * 1. All JSON files are valid JSON
 * 2. All en/ keys exist in other locales (or in .i18nignore)
 * 3. No extra keys in non-en locales (stale translations)
 * 4. No empty string values
 * 5. Interpolation placeholders match between en and translations
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs';
import { join, relative } from 'path';

const LOCALES_DIR_FRONTEND = join(process.cwd(), 'packages/frontend/public/locales');
const LOCALES_DIR_BACKEND = join(process.cwd(), 'packages/backend/src/locales');
const I18NIGNORE_PATH = join(process.cwd(), '.i18nignore');

const BASE_LOCALE = 'en';
const TARGET_LOCALES = ['de', 'fr', 'es', 'it'];

let hasErrors = false;
let hasWarnings = false;

function loadI18nignore() {
  if (!existsSync(I18NIGNORE_PATH)) return new Set();
  const content = readFileSync(I18NIGNORE_PATH, 'utf-8');
  return new Set(
    content.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  );
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (error) {
    console.error(`❌ Invalid JSON: ${filePath}`);
    console.error(`   ${error.message}`);
    hasErrors = true;
    return null;
  }
}

function getKeys(obj, prefix = '') {
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...getKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function getInterpolationPlaceholders(value) {
  if (typeof value !== 'string') return [];
  const matches = value.match(/\{\{(\w+)\}\}/g);
  return matches ? matches.map((m) => m.replace(/\{\{|\}\}/g, '')) : [];
}

function validateLocaleDir(localesDir, label) {
  if (!existsSync(localesDir)) {
    console.log(`⏭️  Skipping ${label}: directory not found`);
    return;
  }

  console.log(`\n📦 Validating ${label}...`);

  const ignoreSet = loadI18nignore();
  const enDir = join(localesDir, BASE_LOCALE);

  if (!existsSync(enDir)) {
    console.error(`❌ Base locale directory not found: ${enDir}`);
    hasErrors = true;
    return;
  }

  const namespaces = readdirSync(enDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));

  for (const ns of namespaces) {
    const enPath = join(enDir, `${ns}.json`);
    const enData = readJson(enPath);
    if (!enData) continue;

    const enKeys = getKeys(enData);

    // Check for empty values in en
    for (const key of enKeys) {
      const value = key.split('.').reduce((o, k) => o?.[k], enData);
      if (value === '') {
        console.error(`❌ Empty value in ${BASE_LOCALE}/${ns}.json: ${key}`);
        hasErrors = true;
      }
    }

    // Check target locales
    for (const locale of TARGET_LOCALES) {
      const targetPath = join(localesDir, locale, `${ns}.json`);
      if (!existsSync(targetPath)) {
        console.warn(`⚠️  Missing file: ${locale}/${ns}.json`);
        hasWarnings = true;
        continue;
      }

      const targetData = readJson(targetPath);
      if (!targetData) continue;

      const targetKeys = new Set(getKeys(targetData));

      // Missing keys
      for (const key of enKeys) {
        const fullKey = `${locale}/${ns}:${key}`;
        if (!targetKeys.has(key) && !ignoreSet.has(fullKey) && !ignoreSet.has(key)) {
          console.warn(`⚠️  Missing key in ${locale}/${ns}.json: ${key}`);
          hasWarnings = true;
        }
      }

      // Extra keys (stale translations)
      for (const key of targetKeys) {
        if (!enKeys.includes(key)) {
          console.warn(`⚠️  Extra key in ${locale}/${ns}.json: ${key} (not in en)`);
          hasWarnings = true;
        }
      }

      // Check interpolation placeholders
      for (const key of enKeys) {
        const enValue = key.split('.').reduce((o, k) => o?.[k], enData);
        const targetValue = key.split('.').reduce((o, k) => o?.[k], targetData);

        if (typeof enValue === 'string' && typeof targetValue === 'string') {
          const enPlaceholders = getInterpolationPlaceholders(enValue);
          const targetPlaceholders = getInterpolationPlaceholders(targetValue);

          for (const p of enPlaceholders) {
            if (!targetPlaceholders.includes(p)) {
              console.warn(`⚠️  Missing placeholder {{${p}}} in ${locale}/${ns}.json: ${key}`);
              hasWarnings = true;
            }
          }
        }
      }
    }
  }
}

// Run validation
console.log('🔍 i18n Validation\n===================');
validateLocaleDir(LOCALES_DIR_FRONTEND, 'Frontend locales');
validateLocaleDir(LOCALES_DIR_BACKEND, 'Backend locales');

if (hasErrors) {
  console.log('\n❌ Validation failed with errors');
  process.exit(1);
}

if (hasWarnings) {
  console.log('\n⚠️  Validation passed with warnings');
  process.exit(0);
}

console.log('\n✅ All validations passed');
process.exit(0);
