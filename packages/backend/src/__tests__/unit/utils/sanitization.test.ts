import { describe, it, expect, vi } from 'vitest';
import { sanitizeString, sanitizedStringSchema, sanitizeBody } from '../../../utils/sanitization';

describe('Sanitization Utility', () => {
  describe('sanitizeString', () => {
    it('should remove HTML tags from string', () => {
      const input = '<script>alert("XSS")</script>Hello World';
      const result = sanitizeString(input);

      expect(result).toBe('Hello World');
    });

    it('should remove all HTML attributes', () => {
      const input = '<div onclick="alert(1)">Content</div>';
      const result = sanitizeString(input);

      expect(result).toBe('Content');
    });

    it('should handle plain text without modification', () => {
      const input = 'Hello World';
      const result = sanitizeString(input);

      expect(result).toBe('Hello World');
    });

    it('should handle empty string', () => {
      const result = sanitizeString('');

      expect(result).toBe('');
    });

    it('should handle empty string', () => {
      const result = sanitizeString('');
      expect(result).toBe('');
    });

    it('should remove nested HTML tags', () => {
      const input = '<div><p><script>malicious()</script>Content</p></div>';
      const result = sanitizeString(input);

      expect(result).toBe('Content');
    });

    it('should handle multiple script tags', () => {
      const input = '<script>evil()</script>Safe text<script>more_evil()</script>';
      const result = sanitizeString(input);

      expect(result).toBe('Safe text');
    });
  });

  describe('sanitizedStringSchema', () => {
    it('should sanitize string through Zod schema', () => {
      const result = sanitizedStringSchema.parse('<script>alert(1)</script>Hello');

      expect(result).toBe('Hello');
    });

    it('should handle plain strings', () => {
      const result = sanitizedStringSchema.parse('Hello World');

      expect(result).toBe('Hello World');
    });

    it('should reject non-string inputs', () => {
      expect(() => sanitizedStringSchema.parse(123)).toThrow();
      expect(() => sanitizedStringSchema.parse(null)).toThrow();
      expect(() => sanitizedStringSchema.parse(undefined)).toThrow();
    });
  });

  describe('sanitizeBody middleware', () => {
    it('should sanitize all string fields in request body', () => {
      const req = {
        body: {
          name: '<script>alert(1)</script>John',
          description: '<b>Bold</b> text',
          count: 123,
        },
      } as any;

      const res = {} as any;
      const next = vi.fn();

      const middleware = sanitizeBody();
      middleware(req, res, next);

      expect(req.body.name).toBe('John');
      expect(req.body.description).toBe('Bold text');
      expect(req.body.count).toBe(123);
      expect(next).toHaveBeenCalled();
    });

    it('should handle nested objects', () => {
      const req = {
        body: {
          user: {
            name: '<script>evil()</script>Alice',
          },
        },
      } as any;

      const res = {} as any;
      const next = vi.fn();

      const middleware = sanitizeBody();
      middleware(req, res, next);

      expect(req.body.user.name).toBe('<script>evil()</script>Alice');
      expect(next).toHaveBeenCalled();
    });

    it('should handle empty body', () => {
      const req = { body: {} } as any;
      const res = {} as any;
      const next = vi.fn();

      const middleware = sanitizeBody();
      middleware(req, res, next);

      expect(req.body).toEqual({});
      expect(next).toHaveBeenCalled();
    });

    it('should handle null body', () => {
      const req = { body: null } as any;
      const res = {} as any;
      const next = vi.fn();

      const middleware = sanitizeBody();
      middleware(req, res, next);

      expect(req.body).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it('should preserve arrays', () => {
      const req = {
        body: {
          tags: ['<script>bad()</script>tag1', 'tag2'],
        },
      } as any;

      const res = {} as any;
      const next = vi.fn();

      const middleware = sanitizeBody();
      middleware(req, res, next);

      expect(req.body.tags).toEqual(['<script>bad()</script>tag1', 'tag2']);
      expect(next).toHaveBeenCalled();
    });
  });
});
