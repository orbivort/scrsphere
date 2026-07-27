/**
 * Unit tests for sync-glossary.mjs — Glossary Compliance Checker
 *
 * Tests the core functions and the integration-level checkGlossaryCompliance function.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  normalizeGlossaryTerm,
  appearsAsStandaloneTerm,
  checkGlossaryCompliance,
} from '../sync-glossary.mjs';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// normalizeGlossaryTerm
// ---------------------------------------------------------------------------
describe('normalizeGlossaryTerm', () => {
  it('returns string value directly (Format 1: base term)', () => {
    expect(normalizeGlossaryTerm('Scrum', 'de')).toBe('Scrum');
    expect(normalizeGlossaryTerm('Scrum', 'fr')).toBe('Scrum');
    expect(normalizeGlossaryTerm('Sprint', 'es')).toBe('Sprint');
  });

  it('returns locale-specific override from object (Format 2: _base + overrides)', () => {
    const termValue = { _base: 'Increment', es: 'Incremento' };
    expect(normalizeGlossaryTerm(termValue, 'es')).toBe('Incremento');
  });

  it('returns _base when locale has no override (Format 2)', () => {
    const termValue = { _base: 'Increment', es: 'Incremento' };
    expect(normalizeGlossaryTerm(termValue, 'de')).toBe('Increment');
    expect(normalizeGlossaryTerm(termValue, 'fr')).toBe('Increment');
  });

  it('returns locale-specific value from legacy object (Format 3: backward compatibility)', () => {
    const termValue = { en: 'Sprint', de: 'Sprint', fr: 'Sprint' };
    expect(normalizeGlossaryTerm(termValue, 'de')).toBe('Sprint');
    expect(normalizeGlossaryTerm(termValue, 'fr')).toBe('Sprint');
  });

  it('falls back to en field when locale not in legacy object (Format 3)', () => {
    const termValue = { en: 'Sprint', de: 'Sprint' };
    expect(normalizeGlossaryTerm(termValue, 'es')).toBe('Sprint');
  });

  it('returns null for invalid term values', () => {
    expect(normalizeGlossaryTerm(null, 'de')).toBe(null);
    expect(normalizeGlossaryTerm(undefined, 'de')).toBe(null);
    expect(normalizeGlossaryTerm({}, 'de')).toBe(null);
    expect(normalizeGlossaryTerm({ randomField: 'value' }, 'de')).toBe(null);
  });

  it('prioritizes locale-specific override over _base and en', () => {
    const termValue = {
      en: 'English',
      de: 'Deutsch',
      _base: 'Base',
      es: 'Español',
    };
    expect(normalizeGlossaryTerm(termValue, 'de')).toBe('Deutsch');
    expect(normalizeGlossaryTerm(termValue, 'es')).toBe('Español');
    expect(normalizeGlossaryTerm(termValue, 'fr')).toBe('Base');
  });

  it('handles empty object with _base', () => {
    const termValue = { _base: 'Test' };
    expect(normalizeGlossaryTerm(termValue, 'de')).toBe('Test');
  });
});

// ---------------------------------------------------------------------------
// appearsAsStandaloneTerm
// ---------------------------------------------------------------------------
describe('appearsAsStandaloneTerm', () => {
  it('detects a term inside a JSON string value', () => {
    const content = '{"title": "Sprint Review"}';
    expect(appearsAsStandaloneTerm('Sprint Review', content)).toBe(true);
  });

  it('does not match case-insensitively (exact case required)', () => {
    const content = '{"title": "focus"}';
    expect(appearsAsStandaloneTerm('Focus', content)).toBe(false);
  });

  it('does not match substrings without word boundaries', () => {
    const content = '{"term": "Impedimento"}';
    expect(appearsAsStandaloneTerm('Impediment', content)).toBe(false);
  });

  it('returns false when term is not present at all', () => {
    const content = '{"title": "Something else"}';
    expect(appearsAsStandaloneTerm('Sprint', content)).toBe(false);
  });

  it('handles special regex characters in term name', () => {
    const content = '{"term": "Definition of Done checklist"}';
    expect(appearsAsStandaloneTerm('Definition of Done', content)).toBe(true);
  });

  it('does not match across JSON key-value boundaries', () => {
    const content = '{"key1": "Sprint", "key2": "Review"}';
    expect(appearsAsStandaloneTerm('Sprint Review', content)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// checkGlossaryCompliance — Integration tests with temp directories
// ---------------------------------------------------------------------------
describe('checkGlossaryCompliance', () => {
  const TMP_DIR = join(process.cwd(), 'temp', 'glossary-test-locales');

  beforeEach(() => {
    const enDir = join(TMP_DIR, 'en');
    const deDir = join(TMP_DIR, 'de');
    const esDir = join(TMP_DIR, 'es');
    mkdirSync(enDir, { recursive: true });
    mkdirSync(deDir, { recursive: true });
    mkdirSync(esDir, { recursive: true });
  });

  afterEach(() => {
    if (existsSync(TMP_DIR)) {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
  });

  it('returns 0 violations when all glossary terms are correct', () => {
    const glossary = {
      _meta: { languages: ['en', 'de'] },
      Sprint: 'Sprint',
    };

    // English and German both use "Sprint"
    writeFileSync(join(TMP_DIR, 'en', 'common.json'), JSON.stringify({ title: 'Sprint' }));
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), JSON.stringify({ title: 'Sprint' }));

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(0);
  });

  it('detects violation when German uses translation instead of base term', () => {
    const glossary = {
      _meta: { languages: ['en', 'de'] },
      'Product Goal': 'Product Goal',
    };

    writeFileSync(join(TMP_DIR, 'en', 'common.json'), JSON.stringify({ nav: { productGoals: 'Product Goal' } }));
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), JSON.stringify({ nav: { productGoals: 'Produkt-Ziel' } }));

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(1);
    expect(result.details[0]).toContain('Produkt-Ziel');
    expect(result.details[0]).toContain('Product Goal');
  });

  it('handles object with _base and locale overrides', () => {
    const glossary = {
      _meta: { languages: ['en', 'de', 'es'] },
      Increment: {
        _base: 'Increment',
        es: 'Incremento',
      },
    };

    // German uses base term
    writeFileSync(join(TMP_DIR, 'en', 'common.json'), JSON.stringify({ t: 'Increment' }));
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), JSON.stringify({ t: 'Increment' }));
    // Spanish uses locale override
    writeFileSync(join(TMP_DIR, 'es', 'common.json'), JSON.stringify({ t: 'Incremento' }));

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de', 'es']);
    expect(result.violations).toBe(0);
  });

  it('flags violation when locale file uses base instead of override', () => {
    const glossary = {
      _meta: { languages: ['en', 'es'] },
      Increment: {
        _base: 'Increment',
        es: 'Incremento',
      },
    };

    writeFileSync(join(TMP_DIR, 'en', 'common.json'), JSON.stringify({ t: 'Increment' }));
    // Spanish file uses "Increment" (base) instead of "Incremento" (override)
    writeFileSync(join(TMP_DIR, 'es', 'common.json'), JSON.stringify({ t: 'Increment' }));

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['es']);
    expect(result.violations).toBe(1);
    expect(result.details[0]).toContain('Incremento');
  });

  it('supports mixed glossary format (string + object)', () => {
    const glossary = {
      _meta: { languages: ['en', 'de', 'es'] },
      Sprint: 'Sprint',
      Increment: {
        _base: 'Increment',
        es: 'Incremento',
      },
    };

    writeFileSync(join(TMP_DIR, 'en', 'common.json'), JSON.stringify({ sprint: 'Sprint', inc: 'Increment' }));
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), JSON.stringify({ sprint: 'Sprint', inc: 'Increment' }));
    writeFileSync(join(TMP_DIR, 'es', 'common.json'), JSON.stringify({ sprint: 'Sprint', inc: 'Incremento' }));

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de', 'es']);
    expect(result.violations).toBe(0);
  });

  it('backward compatible with legacy object format', () => {
    const glossary = {
      _meta: { languages: ['en', 'de'] },
      Sprint: { en: 'Sprint', de: 'Sprint' },
    };

    writeFileSync(join(TMP_DIR, 'en', 'common.json'), JSON.stringify({ title: 'Sprint' }));
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), JSON.stringify({ title: 'Sprint' }));

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(0);
  });

  it('handles nested JSON objects', () => {
    const glossary = {
      _meta: { languages: ['en', 'de'] },
      'Product Goal': 'Product Goal',
    };

    writeFileSync(
      join(TMP_DIR, 'en', 'common.json'),
      JSON.stringify({ nav: { productGoals: 'Product Goal' } })
    );
    writeFileSync(
      join(TMP_DIR, 'de', 'common.json'),
      JSON.stringify({ nav: { productGoals: 'Produkt-Ziel' } })
    );

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(1);
    expect(result.details[0]).toContain('nav.productGoals');
  });

  it('skips metadata fields', () => {
    const glossary = {
      _meta: { languages: ['en', 'de'] },
      _internal: 'Internal',
      Sprint: 'Sprint',
    };

    writeFileSync(join(TMP_DIR, 'en', 'common.json'), JSON.stringify({ title: 'Sprint' }));
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), JSON.stringify({ title: 'Sprint' }));

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(0);
  });

  it('skips non-existent directories gracefully', () => {
    const glossary = { Sprint: 'Sprint' };
    const result = checkGlossaryCompliance(glossary, ['/non/existent/path'], ['de']);
    expect(result.violations).toBe(0);
  });
});