import { describe, it, expect } from 'vitest';

import { validateLabels } from './labelUtils';

describe('labelUtils', () => {
  describe('validateLabels', () => {
    describe('Valid Labels', () => {
      it('should return empty array for valid labels', () => {
        const result = validateLabels('frontend, backend, api');
        expect(result).toEqual([]);
      });

      it('should accept labels with hyphens and underscores', () => {
        const result = validateLabels('front-end, back_end, api_v2');
        expect(result).toEqual([]);
      });

      it('should accept labels with numbers', () => {
        const result = validateLabels('v2, api3, service1');
        expect(result).toEqual([]);
      });

      it('should accept labels with spaces', () => {
        const result = validateLabels('front end, back end');
        expect(result).toEqual([]);
      });

      it('should return empty array for empty string', () => {
        const result = validateLabels('');
        expect(result).toEqual([]);
      });

      it('should return empty array for single valid label', () => {
        const result = validateLabels('frontend');
        expect(result).toEqual([]);
      });
    });

    describe('Empty Labels', () => {
      it('should handle labels with empty segments between commas', () => {
        const result = validateLabels('frontend,,backend');
        expect(result).toEqual([]);
      });

      it('should handle multiple empty segments', () => {
        const result = validateLabels('a,,b,,c');
        expect(result).toEqual([]);
      });
    });

    describe('Label Length', () => {
      it('should detect labels exceeding 30 characters', () => {
        const longLabel = 'a'.repeat(31);
        const result = validateLabels(longLabel);
        expect(result.some((e) => e.includes('exceeds 30 character limit'))).toBe(true);
      });

      it('should accept labels at exactly 30 characters', () => {
        const validLabel = 'a'.repeat(30);
        const result = validateLabels(validLabel);
        expect(result).toEqual([]);
      });
    });

    describe('Invalid Characters', () => {
      it('should detect special characters', () => {
        const result = validateLabels('frontend@');
        expect(result.some((e) => e.includes('invalid characters'))).toBe(true);
      });

      it('should detect multiple invalid characters', () => {
        const result = validateLabels('test@#$');
        expect(result.some((e) => e.includes('invalid characters'))).toBe(true);
      });

      it('should accept only valid characters', () => {
        const result = validateLabels('abc-123_XYZ test');
        expect(result).toEqual([]);
      });
    });

    describe('Duplicate Labels', () => {
      it('should detect duplicate labels (case-insensitive)', () => {
        const result = validateLabels('frontend, Frontend, FRONTEND');
        expect(result).toContain('Duplicate labels detected. Each label should be unique.');
      });

      it('should accept unique labels', () => {
        const result = validateLabels('frontend, backend, api');
        expect(result).not.toContain('Duplicate labels detected. Each label should be unique.');
      });
    });

    describe('Maximum Labels', () => {
      it('should detect when exceeding 10 labels', () => {
        const labels = Array.from({ length: 11 }, (_, i) => `label${i}`).join(', ');
        const result = validateLabels(labels);
        expect(result.some((e) => e.includes('Too many labels'))).toBe(true);
      });

      it('should accept exactly 10 labels', () => {
        const labels = Array.from({ length: 10 }, (_, i) => `label${i}`).join(', ');
        const result = validateLabels(labels);
        expect(result).toEqual([]);
      });
    });

    describe('Multiple Errors', () => {
      it('should return multiple errors for multiple issues', () => {
        const result = validateLabels(`test@, test@, ${'a'.repeat(31)}`);
        expect(result.length).toBeGreaterThan(1);
      });
    });

    describe('Edge Cases', () => {
      it('should handle whitespace-only labels', () => {
        const result = validateLabels('   ,   ');
        expect(result).toEqual([]);
      });

      it('should trim labels automatically', () => {
        const result = validateLabels('  frontend  ,  backend  ');
        expect(result).toEqual([]);
      });
    });
  });
});
