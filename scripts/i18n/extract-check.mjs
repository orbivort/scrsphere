#!/usr/bin/env node

/**
 * i18n AST Extraction Check
 *
 * Runs i18next-cli to extract translation keys from source code into a temp
 * directory, then compares those keys against the checked-in locale files.
 * Reports any keys that exist in source code but are missing from the locale
 * files. Exits with code 1 if any keys are missing — suitable for CI.
 *
 * This is the AST-based complement to the heuristic-based `i18n:extract` script.
 */

import { readFileSync, readdirSync, existsSync, rmSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT_DIR = process.cwd();
const FRONTEND_DIR = join(ROOT_DIR, 'packages/frontend');
const EXTRACTED_DIR = join(FRONTEND_DIR, 'temp/i18n-extracted/en');
const CHECKED_IN_DIR = join(FRONTEND_DIR, 'public/locales/en');

/**
 * Flatten a nested JSON object into dot-separated key paths.
 * e.g. { a: { b: 'value' } } => ['a.b']
 */
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

/**
 * Read and parse a JSON file, returning null on failure.
 */
function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch {
    console.error(`  Failed to read/parse: ${filePath}`);
    return null;
  }
}

/**
 * Recursively remove a directory, with retries for Windows file-locking issues.
 */
function cleanupDir(dirPath) {
  if (!existsSync(dirPath)) return;
  try {
    rmSync(dirPath, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
  } catch {
    // Non-critical: temp dir cleanup is best-effort
    // The temp/ directory is in .gitignore so it won't be committed
  }
}

console.log('i18n AST Extraction Check');
console.log('=========================\n');

// Step 1: Run AST extraction
console.log('Step 1: Running i18next-cli extract to temp directory...');
try {
  execSync('npx i18next-cli extract --config i18next.config.ts --quiet', {
    cwd: FRONTEND_DIR,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
} catch (error) {
  // i18next-cli may exit with non-zero if files were updated, which is fine here
  // We only care about the output files
  if (!existsSync(EXTRACTED_DIR)) {
    console.error('ERROR: Extraction failed and output directory was not created.');
    console.error(String(error.stdout || ''));
    console.error(String(error.stderr || ''));
    process.exit(1);
  }
}

if (!existsSync(EXTRACTED_DIR)) {
  console.error('ERROR: Extraction output directory not found:', EXTRACTED_DIR);
  process.exit(1);
}

// Step 2: Read extracted namespace files
console.log('Step 2: Comparing extracted keys against checked-in locale files...\n');

const extractedFiles = readdirSync(EXTRACTED_DIR).filter((f) => f.endsWith('.json'));

if (extractedFiles.length === 0) {
  console.log('No translation keys extracted from source code.');
  cleanupDir(join(FRONTEND_DIR, 'temp'));
  process.exit(0);
}

let totalMissing = 0;
const missingDetails = [];

for (const file of extractedFiles) {
  const ns = file.replace('.json', '');
  const extractedPath = join(EXTRACTED_DIR, file);
  const checkedInPath = join(CHECKED_IN_DIR, file);

  const extractedData = readJson(extractedPath);
  if (!extractedData) continue;

  const extractedKeys = new Set(getKeys(extractedData));

  // If the checked-in file doesn't exist for this namespace, all keys are missing
  if (!existsSync(checkedInPath)) {
    const missing = [...extractedKeys];
    if (missing.length > 0) {
      totalMissing += missing.length;
      missingDetails.push({ ns, missing, reason: 'namespace file missing' });
    }
    continue;
  }

  const checkedInData = readJson(checkedInPath);
  if (!checkedInData) continue;

  const checkedInKeys = new Set(getKeys(checkedInData));

  // Find keys in extracted but not in checked-in
  const missing = [...extractedKeys].filter((k) => !checkedInKeys.has(k));
  if (missing.length > 0) {
    totalMissing += missing.length;
    missingDetails.push({ ns, missing, reason: 'keys missing from locale file' });
  }
}

// Step 3: Report results
if (totalMissing === 0) {
  console.log('All extracted keys are present in the checked-in locale files.');
} else {
  console.log(`Found ${totalMissing} key(s) in source code but missing from locale files:\n`);
  for (const { ns, missing, reason } of missingDetails) {
    console.log(`  [${ns}] (${reason}):`);
    for (const key of missing) {
      console.log(`    - ${key}`);
    }
  }
}

// Clean up temp directory
console.log('\nCleaning up temp extraction directory...');
cleanupDir(join(FRONTEND_DIR, 'temp'));

// Exit code
if (totalMissing > 0) {
  console.log(`\nFAILED: ${totalMissing} missing key(s) detected.`);
  console.log('Run `pnpm run i18n:extract:ast` to update the locale files, then sync to other locales.');
  process.exit(1);
}

console.log('\nPASSED: No missing keys.');
process.exit(0);
