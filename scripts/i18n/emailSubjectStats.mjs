#!/usr/bin/env node

/**
 * Email Subject Length Check
 *
 * Flags localized email subjects that exceed the RFC 5322 recommended
 * 78-character limit or the hard 998-character limit.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const LOCALES_DIR = join(process.cwd(), 'packages/backend/src/locales');
const RECOMMENDED_LIMIT = 78;
const HARD_LIMIT = 998;
const LOCALES = ['en', 'de', 'fr', 'it', 'es'];

if (!existsSync(LOCALES_DIR)) {
  console.log('⏭️  Backend locales directory not found');
  process.exit(0);
}

let violations = 0;

for (const locale of LOCALES) {
  const emailsPath = join(LOCALES_DIR, locale, 'emails.json');
  if (!existsSync(emailsPath)) continue;

  const emails = JSON.parse(readFileSync(emailsPath, 'utf-8'));

  for (const [template, data] of Object.entries(emails)) {
    if (typeof data === 'object' && data !== null) {
      const subject = data.subject;
      if (typeof subject === 'string') {
        // Approximate length without interpolation placeholders
        const approxLength = subject.replace(/\{\{[^}]+\}\}/g, 'X'.repeat(10)).length;

        if (approxLength > HARD_LIMIT) {
          console.error(`❌ ${locale}/${template}.subject exceeds hard limit (${approxLength} > ${HARD_LIMIT}): "${subject}"`);
          violations++;
        } else if (approxLength > RECOMMENDED_LIMIT) {
          console.warn(`⚠️  ${locale}/${template}.subject exceeds recommended limit (${approxLength} > ${RECOMMENDED_LIMIT}): "${subject}"`);
          violations++;
        }
      }
    }
  }
}

if (violations === 0) {
  console.log('✅ All email subjects are within length limits');
} else {
  console.log(`\n⚠️  Found ${violations} subject length issues`);
}
