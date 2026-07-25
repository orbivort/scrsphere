import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { generateAvatarUrl, getAvatarServiceUrl } from './avatar';

describe('avatar', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generateAvatarUrl', () => {
    it('should generate avatar URL with encoded seed', () => {
      const seed = 'test-user-123';
      const result = generateAvatarUrl(seed);

      expect(result).toContain('https://api.dicebear.com/7.x/avataaars/svg');
      expect(result).toContain('seed=test-user-123');
    });

    it('should encode special characters in seed', () => {
      const seed = 'user@example.com';
      const result = generateAvatarUrl(seed);

      expect(result).toContain('seed=user%40example.com');
    });

    it('should encode spaces in seed', () => {
      const seed = 'user name';
      const result = generateAvatarUrl(seed);

      expect(result).toContain('seed=user%20name');
    });

    it('should handle empty seed', () => {
      const seed = '';
      const result = generateAvatarUrl(seed);

      expect(result).toContain('seed=');
    });
  });

  describe('getAvatarServiceUrl', () => {
    it('should return default avatar service URL', () => {
      const result = getAvatarServiceUrl();

      expect(result).toBe('https://api.dicebear.com/7.x/avataaars/svg');
    });
  });
});
