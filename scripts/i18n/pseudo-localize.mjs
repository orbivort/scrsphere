#!/usr/bin/env node

/**
 * Pseudo-localization Script
 *
 * Reads English locale JSON files and generates a "pseudo" locale with:
 * 1. Accent folding: a→à, e→é, i→í, o→ó, u→ú (and uppercase equivalents)
 * 2. ~30% length expansion by padding with repeated characters
 * 3. Bracket wrapping for visual detection: [Héllóóóó]
 *
 * Usage: node scripts/i18n/pseudo-localize.mjs
 */

import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const LOCALES_DIR = join(process.cwd(), 'packages/frontend/public/locales');
const SOURCE_LOCALE = 'en';
const TARGET_LOCALE = 'pseudo';

const ACCENT_MAP = {
  a: 'à',
  e: 'é',
  i: 'í',
  o: 'ó',
  u: 'ú',
  A: 'À',
  E: 'É',
  I: 'Í',
  O: 'Ó',
  U: 'Ú',
};

/**
 * Apply accent folding to a single character.
 */
function applyAccent(char) {
  return ACCENT_MAP[char] ?? char;
}

/**
 * Apply accent folding to an entire string.
 */
function foldAccents(str) {
  let result = '';
  for (const char of str) {
    result += applyAccent(char);
  }
  return result;
}

/**
 * Expand a string by ~30% by repeating some characters.
 * Only repeats alphabetic characters to preserve interpolation placeholders and punctuation.
 */
function expandString(str, ratio = 0.3) {
  const chars = [...str];
  const expansionCount = Math.max(1, Math.ceil(chars.length * ratio));
  let expanded = '';
  let expansionsApplied = 0;

  // Distribute expansions roughly evenly across alphabetic characters
  const alphaIndices = [];
  for (let i = 0; i < chars.length; i++) {
    if (/[a-zA-Zà-ÿÀ-Ÿ]/.test(chars[i])) {
      alphaIndices.push(i);
    }
  }

  if (alphaIndices.length === 0) {
    return str;
  }

  // Calculate how many extra characters to add per alphabetic position
  const extraPerAlpha = expansionCount / alphaIndices.length;

  const expansionMap = new Map();
  let remaining = expansionCount;
  for (let i = 0; i < alphaIndices.length; i++) {
    const extra = i === alphaIndices.length - 1
      ? remaining
      : Math.round(extraPerAlpha);
    expansionMap.set(alphaIndices[i], extra);
    remaining -= extra;
  }

  for (let i = 0; i < chars.length; i++) {
    expanded += chars[i];
    const extra = expansionMap.get(i) ?? 0;
    if (extra > 0) {
      expanded += chars[i].repeat(extra);
    }
  }

  return expanded;
}

/**
 * Pseudo-localize a single string value.
 * Preserves i18next interpolation placeholders like {{count}} and {{name}}.
 *
 * Steps:
 * 1. Split string on interpolation placeholders
 * 2. Apply accent folding to non-placeholder segments
 * 3. Apply ~30% expansion to non-placeholder segments
 * 4. Wrap the whole result in brackets
 */
function pseudoLocalizeValue(value) {
  if (typeof value !== 'string') {
    return value;
  }

  // Split on interpolation placeholders: {{variable}}
  const placeholderRegex = /(\{\{[^}]+\}\})/g;
  const segments = value.split(placeholderRegex);

  const processedSegments = segments.map((segment) => {
    if (placeholderRegex.test(segment)) {
      // Preserve interpolation placeholders as-is
      return segment;
    }
    // Apply accent folding then expansion
    const accented = foldAccents(segment);
    return expandString(accented);
  });

  // Reset regex lastIndex since we used test() in the loop
  placeholderRegex.lastIndex = 0;

  const result = processedSegments.join('');

  // Wrap in brackets for visual detection
  return `[${result}]`;
}

/**
 * Recursively transform all string values in a JSON object.
 */
function transformObject(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => transformObject(item));
  }

  if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = transformObject(value);
    }
    return result;
  }

  if (typeof obj === 'string') {
    return pseudoLocalizeValue(obj);
  }

  return obj;
}

// Main execution
console.log('Pseudo-localization\n====================');

const sourceDir = join(LOCALES_DIR, SOURCE_LOCALE);
const targetDir = join(LOCALES_DIR, TARGET_LOCALE);

if (!existsSync(sourceDir)) {
  console.error(`Source locale directory not found: ${sourceDir}`);
  process.exit(1);
}

// Create target directory if it doesn't exist
mkdirSync(targetDir, { recursive: true });

const jsonFiles = readdirSync(sourceDir).filter((f) => f.endsWith('.json'));

if (jsonFiles.length === 0) {
  console.warn('No JSON files found in source locale directory');
  process.exit(0);
}

let fileCount = 0;
let keyCount = 0;

for (const file of jsonFiles) {
  const sourcePath = join(sourceDir, file);
  const targetPath = join(targetDir, file);

  let sourceData;
  try {
    sourceData = JSON.parse(readFileSync(sourcePath, 'utf-8'));
  } catch (error) {
    console.error(`Failed to parse ${sourcePath}: ${error.message}`);
    process.exit(1);
  }

  const transformedData = transformObject(sourceData);
  keyCount += countStringValues(sourceData);

  writeFileSync(targetPath, JSON.stringify(transformedData, null, 2) + '\n', 'utf-8');
  fileCount++;
  console.log(`  ${SOURCE_LOCALE}/${file} → ${TARGET_LOCALE}/${file}`);
}

console.log(`\nDone: ${fileCount} files, ${keyCount} keys pseudo-localized to ${TARGET_LOCALE}/`);

/**
 * Count string values in a nested object.
 */
function countStringValues(obj) {
  let count = 0;
  if (Array.isArray(obj)) {
    for (const item of obj) {
      count += countStringValues(item);
    }
  } else if (obj !== null && typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      count += countStringValues(value);
    }
  } else if (typeof obj === 'string') {
    count = 1;
  }
  return count;
}
