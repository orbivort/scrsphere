import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('avatar', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  describe('generateAvatarUrl', () => {
    it('should return empty string when no avatar service URL is configured', async () => {
      vi.stubEnv('VITE_AVATAR_SERVICE_URL', undefined);
      const { generateAvatarUrl } = await import('./avatar');

      const result = generateAvatarUrl('test-user-123');

      expect(result).toBe('');
    });

    it('should generate URL with encoded seed when service URL is configured', async () => {
      vi.stubEnv('VITE_AVATAR_SERVICE_URL', 'https://example.com/avatar');
      const { generateAvatarUrl } = await import('./avatar');

      const seed = 'user@example.com';
      const result = generateAvatarUrl(seed);

      expect(result).toBe('https://example.com/avatar?seed=user%40example.com');
    });

    it('should handle empty seed', async () => {
      vi.stubEnv('VITE_AVATAR_SERVICE_URL', undefined);
      const { generateAvatarUrl } = await import('./avatar');

      const result = generateAvatarUrl('');

      expect(result).toBe('');
    });
  });

  describe('getAvatarServiceUrl', () => {
    it('should return empty string when no avatar service URL is configured', async () => {
      vi.stubEnv('VITE_AVATAR_SERVICE_URL', undefined);
      const { getAvatarServiceUrl } = await import('./avatar');

      expect(getAvatarServiceUrl()).toBe('');
    });
  });
});
