#!/usr/bin/env node

/**
 * Locale JSON Key Sorter
 *
 * Recursively sorts JSON keys alphabetically in all locale files.
 * Only writes back if content changed (avoids unnecessary file touches).
 *
 * Usage: node scripts/i18n/sort.mjs
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const LOCALES_DIRS = [
  join(process.cwd(), 'packages/frontend/public/locales'),
  join(process.cwd(), 'packages/backend/src/locales'),
];

/**
 * Recursively sort object keys alphabetically.
 */
function sortObjectKeys(obj) {
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return obj;
  }

  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = sortObjectKeys(obj[key]);
  }
  return sorted;
}

let filesProcessed = 0;
let filesChanged = 0;

for (const localesDir of LOCALES_DIRS) {
  if (!statSync(localesDir, { throwIfNoEntry: false })) {
    console.log(`⏭️  Skipping non-existent directory: ${localesDir}`);
    continue;
  }

  for (const locale of readdirSync(localesDir)) {
    const localeDir = join(localesDir, locale);
    if (!statSync(localeDir).isDirectory()) continue;

    for (const file of readdirSync(localeDir)) {
      if (extname(file) !== '.json') continue;

      const filePath = join(localeDir, file);
      const content = readFileSync(filePath, 'utf8');
      const original = JSON.parse(content);
      const sorted = sortObjectKeys(original);
      const formatted = JSON.stringify(sorted, null, 2) + '\n';

      filesProcessed++;

      if (formatted !== content) {
        writeFileSync(filePath, formatted, 'utf8');
        filesChanged++;
        console.log(`  ✏️  Sorted: ${filePath}`);
      }
    }
  }
}

console.log(`\n📊 Processed ${filesProcessed} files, changed ${filesChanged}.`);
