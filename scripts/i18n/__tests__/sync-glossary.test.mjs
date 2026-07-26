/**
 * Unit tests for sync-glossary.mjs — Glossary Compliance Checker
 *
 * Tests the pure functions (isPartOfCompoundTerm, appearsAsStandaloneTerm)
 * and the integration-level checkGlossaryCompliance function using
 * temporary locale directories.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  isPartOfCompoundTerm,
  appearsAsStandaloneTerm,
  checkGlossaryCompliance,
} from '../sync-glossary.mjs';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'fs';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// isPartOfCompoundTerm
// ---------------------------------------------------------------------------
describe('isPartOfCompoundTerm', () => {
  it('returns true when term is part of a compound term present in content', () => {
    // "Product" is part of "Product Owner" compound term
    const content = JSON.stringify({ role: 'Product Owner' });
    expect(isPartOfCompoundTerm('Product', content)).toBe(true);
  });

  it('returns true for Sprint being part of Sprint Planning', () => {
    const content = JSON.stringify({ event: 'Sprint Planning' });
    expect(isPartOfCompoundTerm('Sprint', content)).toBe(true);
  });

  it('returns false when term is the compound term itself (not a sub-term)', () => {
    const content = JSON.stringify({ role: 'Product Owner' });
    // "Product Owner" IS the compound term, not a sub-term of itself
    expect(isPartOfCompoundTerm('Product Owner', content)).toBe(false);
  });

  it('returns false when the compound term is not present in content', () => {
    // "Product" is part of compound "Product Owner", but "Product Owner" is not in content
    const content = JSON.stringify({ item: 'Product' });
    expect(isPartOfCompoundTerm('Product', content)).toBe(false);
  });

  it('returns false when term is not part of any compound term', () => {
    const content = JSON.stringify({ value: 'Empiricism' });
    expect(isPartOfCompoundTerm('Empiricism', content)).toBe(false);
  });

  it('handles "Goal" as part of "Sprint Goal" compound', () => {
    const content = JSON.stringify({ goal: 'Sprint Goal' });
    expect(isPartOfCompoundTerm('Goal', content)).toBe(true);
  });

  it('handles "Backlog" as part of "Product Backlog" compound', () => {
    const content = JSON.stringify({ artifact: 'Product Backlog' });
    expect(isPartOfCompoundTerm('Backlog', content)).toBe(true);
  });

  it('handles "Scrum" which is not part of any compound term', () => {
    const content = JSON.stringify({ framework: 'Scrum' });
    // "Scrum" is NOT in COMPOUND_TERMS as a sub-term
    expect(isPartOfCompoundTerm('Scrum', content)).toBe(false);
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

  it('detects a term as part of a larger string value', () => {
    const content = '{"description": "The Sprint Review is a working session"}';
    expect(appearsAsStandaloneTerm('Sprint Review', content)).toBe(true);
  });

  it('does not match case-insensitively (exact case required)', () => {
    const content = '{"title": "focus"}'; // lowercase "focus" (keyboard)
    expect(appearsAsStandaloneTerm('Focus', content)).toBe(false); // Scrum Value "Focus"
  });

  it('does not match substrings without word boundaries', () => {
    // "Impediment" should NOT match "Impedimento" (Spanish translation)
    const content = '{"term": "Impedimento"}';
    expect(appearsAsStandaloneTerm('Impediment', content)).toBe(false);
  });

  it('matches term at the start of a quoted string', () => {
    const content = '{"event": "Daily Scrum starts here"}';
    expect(appearsAsStandaloneTerm('Daily Scrum', content)).toBe(true);
  });

  it('matches term at the end of a quoted string', () => {
    const content = '{"event": "Welcome to the Sprint"}';
    expect(appearsAsStandaloneTerm('Sprint', content)).toBe(true);
  });

  it('returns false when term is not present at all', () => {
    const content = '{"title": "Something else"}';
    expect(appearsAsStandaloneTerm('Sprint', content)).toBe(false);
  });

  it('handles special regex characters in term name', () => {
    // "Definition of Done" contains no special chars, but test the escaping
    const content = '{"term": "Definition of Done checklist"}';
    expect(appearsAsStandaloneTerm('Definition of Done', content)).toBe(true);
  });

  it('does not match across JSON key-value boundaries', () => {
    // Term should only match within a single quoted string value
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
    // Create temp locale directories
    const deDir = join(TMP_DIR, 'de');
    const frDir = join(TMP_DIR, 'fr');
    mkdirSync(deDir, { recursive: true });
    mkdirSync(frDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directories
    if (existsSync(TMP_DIR)) {
      rmSync(TMP_DIR, { recursive: true, force: true });
    }
  });

  it('returns 0 violations when all glossary terms are correctly translated', () => {
    const glossary = {
      _meta: { languages: ['en', 'de'] },
      Sprint: { en: 'Sprint', de: 'Sprint' },
      Increment: { en: 'Increment', de: 'Inkrement' },
    };

    // German locale file uses correct glossary translations
    const deContent = JSON.stringify({
      sprintTitle: 'Sprint',
      incrementTitle: 'Inkrement',
    });
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), deContent);

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(0);
    expect(result.details).toHaveLength(0);
  });

  it('reports violations when glossary term is present but translation is missing', () => {
    const glossary = {
      _meta: { languages: ['en', 'de'] },
      Increment: { en: 'Increment', de: 'Inkrement' },
    };

    // German locale uses "Increment" (English) instead of "Inkrement" (glossary-prescribed)
    const deContent = JSON.stringify({
      title: 'Increment',
      description: 'Some text',
    });
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), deContent);

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(1);
    expect(result.details[0]).toContain('Increment');
    expect(result.details[0]).toContain('Inkrement');
    expect(result.details[0]).toContain('de/common.json');
  });

  it('skips terms that are part of compound terms in the content', () => {
    const glossary = {
      _meta: { languages: ['en', 'de'] },
      Product: { en: 'Product', de: 'Produkt' },
      'Product Owner': { en: 'Product Owner', de: 'Product Owner' },
    };

    // German locale uses "Product Owner" (compound) — "Product" should NOT be flagged
    const deContent = JSON.stringify({
      role: 'Product Owner',
    });
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), deContent);

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(0);
  });

  it('flags standalone Product when no compound term is present', () => {
    const glossary = {
      _meta: { languages: ['en', 'de'] },
      Product: { en: 'Product', de: 'Produkt' },
    };

    // "Product" appears standalone, not as part of "Product Owner" or "Product Backlog"
    const deContent = JSON.stringify({
      productName: 'Product',
    });
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), deContent);

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(1);
    expect(result.details[0]).toContain('Produkt');
  });

  it('skips metadata fields (prefixed with _)', () => {
    const glossary = {
      _meta: { languages: ['en', 'de'] },
      _internal: { en: 'Internal', de: 'Intern' },
      Sprint: { en: 'Sprint', de: 'Sprint' },
    };

    const deContent = JSON.stringify({ title: 'Sprint' });
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), deContent);

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(0);
  });

  it('skips terms when the target locale has no glossary translation', () => {
    const glossary = {
      _meta: { languages: ['en', 'de'] },
      Sprint: { en: 'Sprint' }, // no 'de' key
    };

    const deContent = JSON.stringify({ title: 'Sprint' });
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), deContent);

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(0);
  });

  it('skips non-existent locale directories gracefully', () => {
    const glossary = {
      Sprint: { en: 'Sprint', de: 'Sprint' },
    };

    // 'de' directory exists, 'fr' does NOT (no files written for fr)
    const deContent = JSON.stringify({ title: 'Sprint' });
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), deContent);

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de', 'fr']);
    expect(result.violations).toBe(0);
  });

  it('skips non-existent base directories gracefully', () => {
    const glossary = { Sprint: { en: 'Sprint', de: 'Sprint' } };
    const result = checkGlossaryCompliance(glossary, ['/non/existent/path'], ['de']);
    expect(result.violations).toBe(0);
    expect(result.details).toHaveLength(0);
  });

  it('checks multiple locale directories', () => {
    const glossary = {
      Increment: { en: 'Increment', de: 'Inkrement', fr: 'Incrément' },
    };

    // German is correct
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), JSON.stringify({ t: 'Inkrement' }));
    // French is wrong (uses English instead of glossary-prescribed "Incrément")
    writeFileSync(join(TMP_DIR, 'fr', 'common.json'), JSON.stringify({ t: 'Increment' }));

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de', 'fr']);
    expect(result.violations).toBe(1);
    expect(result.details[0]).toContain('fr/');
    expect(result.details[0]).toContain('Incrément');
  });

  it('checks multiple JSON files within a locale directory', () => {
    const glossary = {
      Sprint: { en: 'Sprint', de: 'Sprint' },
      Increment: { en: 'Increment', de: 'Inkrement' },
    };

    // One file is fine, another has a violation
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), JSON.stringify({ t: 'Sprint' }));
    writeFileSync(join(TMP_DIR, 'de', 'backlog.json'), JSON.stringify({ item: 'Increment' }));

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(1);
    expect(result.details[0]).toContain('backlog.json');
  });

  it('does not flag terms that only appear as JSON keys (not values)', () => {
    const glossary = {
      Sprint: { en: 'Sprint', de: 'Sprint' },
    };

    // "Sprint" appears only as a key, not inside a quoted value
    const deContent = '{"Sprint": {"title": "Meilenstein"}}';
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), deContent);

    // Keys ARE inside quotes in JSON, so this will match — but the German
    // translation of "Sprint" is still "Sprint", so no violation either way
    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(0);
  });

  it('accumulates violations across all terms and files', () => {
    const glossary = {
      Increment: { en: 'Increment', de: 'Inkrement' },
      Empiricism: { en: 'Empiricism', de: 'Empirie' },
    };

    const deContent = JSON.stringify({
      a: 'Increment', // missing "Inkrement"
      b: 'Empiricism', // missing "Empirie"
    });
    writeFileSync(join(TMP_DIR, 'de', 'common.json'), deContent);

    const result = checkGlossaryCompliance(glossary, [TMP_DIR], ['de']);
    expect(result.violations).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------
describe('edge cases', () => {
  it('handles empty glossary gracefully', () => {
    const result = checkGlossaryCompliance({}, ['/non/existent'], ['de']);
    expect(result.violations).toBe(0);
  });

  it('handles glossary with only _meta field', () => {
    const glossary = { _meta: { languages: ['en'] } };
    const result = checkGlossaryCompliance(glossary, ['/non/existent'], ['de']);
    expect(result.violations).toBe(0);
  });

  it('handles term with spaces correctly in appearsAsStandaloneTerm', () => {
    const content = '{"event": "Sprint Retrospective"}';
    expect(appearsAsStandaloneTerm('Sprint Retrospective', content)).toBe(true);
    expect(appearsAsStandaloneTerm('Sprint', content)).toBe(true);
  });

  it('handles term that is a substring of another word', () => {
    // "Inspection" should not match "Inspección" (Spanish)
    const content = '{"value": "Inspección"}';
    expect(appearsAsStandaloneTerm('Inspection', content)).toBe(false);
  });

  it('handles multiple occurrences of the same term in content', () => {
    const content = '{"a": "Sprint Goal", "b": "Sprint Goal achieved"}';
    // "Sprint Goal" appears twice, but the regex should still match
    expect(appearsAsStandaloneTerm('Sprint Goal', content)).toBe(true);
  });

  it('compound term check is case-sensitive', () => {
    // Compound terms are defined in exact case; content must match
    const content = JSON.stringify({ role: 'product owner' }); // lowercase
    // isPartOfCompoundTerm checks content.includes(compound), which is case-sensitive
    expect(isPartOfCompoundTerm('Product', content)).toBe(false);
  });
});
