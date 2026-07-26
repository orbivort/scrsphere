#!/usr/bin/env node

/**
 * i18n Completeness Report
 *
 * Generates a coverage report per locale/namespace showing
 * the percentage of translated keys relative to the en baseline.
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const LOCALES_DIRS = [
  { label: 'Frontend', path: join(process.cwd(), 'packages/frontend/public/locales') },
  { label: 'Backend', path: join(process.cwd(), 'packages/backend/src/locales') },
];

const BASE_LOCALE = 'en';
const TARGET_LOCALES = ['de', 'fr', 'es', 'it'];

const args = process.argv.slice(2);
const minCoverageIndex = args.indexOf('--min-coverage');
const minCoverage = minCoverageIndex !== -1 ? parseInt(args[minCoverageIndex + 1], 10) : 0;

// Aggregate coverage across all locale dirs for threshold check
const localeCoverage = {};
for (const locale of TARGET_LOCALES) {
  localeCoverage[locale] = { totalKeys: 0, translatedKeys: 0 };
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

for (const { label, path: localesDir } of LOCALES_DIRS) {
  if (!existsSync(localesDir)) continue;

  console.log(`\n${label} i18n Completeness Report`);
  console.log('='.repeat(40));

  const enDir = join(localesDir, BASE_LOCALE);
  if (!existsSync(enDir)) continue;

  const namespaces = readdirSync(enDir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace('.json', ''));

  for (const locale of TARGET_LOCALES) {
    console.log(`\nLocale: ${locale}`);
    let totalKeys = 0;
    let translatedKeys = 0;

    for (const ns of namespaces) {
      const enPath = join(enDir, `${ns}.json`);
      const targetPath = join(localesDir, locale, `${ns}.json`);

      const enData = JSON.parse(readFileSync(enPath, 'utf-8'));
      const enKeys = getKeys(enData);
      totalKeys += enKeys.length;

      if (!existsSync(targetPath)) {
        console.log(`  ${ns.padEnd(20)} 0/${enKeys.length} (0%)  ← file missing`);
        continue;
      }

      const targetData = JSON.parse(readFileSync(targetPath, 'utf-8'));
      const targetKeys = new Set(getKeys(targetData));
      const present = enKeys.filter((k) => targetKeys.has(k)).length;
      translatedKeys += present;

      const pct = Math.round((present / enKeys.length) * 100);
      const marker = pct < 100 ? ` ← ${enKeys.length - present} missing` : '';
      console.log(`  ${ns.padEnd(20)} ${present}/${enKeys.length} (${pct}%)${marker}`);
    }

    const overallPct = totalKeys > 0 ? Math.round((translatedKeys / totalKeys) * 100) : 0;
    console.log(`  ${'Overall'.padEnd(20)} ${translatedKeys}/${totalKeys} (${overallPct}%)`);

    // Aggregate for threshold check
    localeCoverage[locale].totalKeys += totalKeys;
    localeCoverage[locale].translatedKeys += translatedKeys;
  }
}

if (minCoverage > 0) {
  console.log('\n📊 Coverage Threshold Check');
  console.log('='.repeat(40));

  const belowThreshold = [];
  for (const [locale, { totalKeys, translatedKeys }] of Object.entries(localeCoverage)) {
    const coverage = totalKeys > 0 ? (translatedKeys / totalKeys) * 100 : 0;
    if (coverage < minCoverage) {
      belowThreshold.push(`  ❌ ${locale}: ${coverage.toFixed(1)}% (below ${minCoverage}%)`);
    }
  }

  if (belowThreshold.length > 0) {
    console.error(`\n❌ Coverage threshold not met:\n${belowThreshold.join('\n')}`);
    process.exit(1);
  } else {
    console.log(`\n✅ All locales meet the ${minCoverage}% coverage threshold.`);
  }
}
