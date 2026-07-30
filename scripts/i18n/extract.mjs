#!/usr/bin/env node

/**
 * i18n Extraction Helper
 *
 * Scans .tsx/.ts files for likely-translatable hardcoded strings.
 * This is a heuristic tool — it reports potential strings but does not modify files.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, relative } from 'path';

const SCAN_DIRS = [
  join(process.cwd(), 'packages/frontend/src'),
  join(process.cwd(), 'packages/backend/src'),
];

const EXCLUDE_PATTERNS = /(?:\/locales\/|\/__tests__\/|\/__mocks__\/|\.test\.|\.spec\.|\/e2e\/)/;
const JSX_TEXT_PATTERN = />\s*([A-Z][a-zA-Z\s,.'!?-]+)\s*</g;
const PLACEHOLDER_PATTERN = /placeholder=["']([^"']+)["']/g;
const ARIA_LABEL_PATTERN = /aria-label=["']([^"']+)["']/g;
const TITLE_PATTERN = /\btitle=["']([^"']+)["']/g;
const TOAST_PATTERN = /toast\.(success|error|info|warn)\(["']([^"']+)["']/g;
const LABEL_PATTERN = /\blabel:\s*["']([A-Z][^"']+)["']/g;

const findings = [];

function scanFile(filePath) {
  const relPath = relative(process.cwd(), filePath);
  if (EXCLUDE_PATTERNS.test(relPath)) return;

  const content = readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    // Skip lines already using t()
    if (line.includes('t(') || line.includes('useTranslation')) return;

    let match;
    const lineNum = index + 1;

    // JSX text nodes
    while ((match = JSX_TEXT_PATTERN.exec(line)) !== null) {
      const text = match[1].trim();
      if (text.length > 2 && !/^[A-Z_]+$/.test(text)) {
        findings.push({
          file: relPath,
          line: lineNum,
          type: 'JSX text',
          text,
        });
      }
    }

    // Placeholder attributes
    while ((match = PLACEHOLDER_PATTERN.exec(line)) !== null) {
      findings.push({
        file: relPath,
        line: lineNum,
        type: 'placeholder',
        text: match[1],
      });
    }

    // aria-label attributes
    while ((match = ARIA_LABEL_PATTERN.exec(line)) !== null) {
      findings.push({
        file: relPath,
        line: lineNum,
        type: 'aria-label',
        text: match[1],
      });
    }
  });
}

function walkDir(dir) {
  if (!statSync(dir, { throwIfNoEntry: false })) return;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      scanFile(fullPath);
    }
  }
}

console.log('🔎 i18n String Extraction\n=========================');

for (const dir of SCAN_DIRS) {
  walkDir(dir);
}

if (findings.length === 0) {
  console.log('No hardcoded strings found.');
} else {
  console.log(`\nFound ${findings.length} potential hardcoded strings:\n`);
  for (const f of findings.slice(0, 50)) {
    console.log(`${f.file}:${f.line} [${f.type}] "${f.text}"`);
  }
  if (findings.length > 50) {
    console.log(`\n... and ${findings.length - 50} more`);
  }
}
