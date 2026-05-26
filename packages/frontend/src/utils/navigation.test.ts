import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('navigation utilities', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    delete (window as Record<string, unknown>).location;
    window.location = {
      ...originalLocation,
      href: '',
      pathname: '/',
    } as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
    vi.resetModules();
  });

  describe('getFullPath', () => {
    it('returns path as-is when base path is "/"', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/');
      const { getFullPath } = await import('./navigation');
      expect(getFullPath('/login')).toBe('/login');
      expect(getFullPath('/dashboard')).toBe('/dashboard');
      expect(getFullPath('/settings/team')).toBe('/settings/team');
    });

    it('prepends base path when VITE_BASE_PATH is "/scrsphere/"', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/scrsphere/');
      const { getFullPath } = await import('./navigation');
      expect(getFullPath('/login')).toBe('/scrsphere/login');
      expect(getFullPath('/dashboard')).toBe('/scrsphere/dashboard');
      expect(getFullPath('/settings/team')).toBe('/scrsphere/settings/team');
    });

    it('handles paths without leading slash', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/scrsphere/');
      const { getFullPath } = await import('./navigation');
      expect(getFullPath('login')).toBe('/scrsphere/login');
      expect(getFullPath('dashboard')).toBe('/scrsphere/dashboard');
    });

    it('handles base path without trailing slash', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/scrsphere');
      const { getFullPath } = await import('./navigation');
      expect(getFullPath('/login')).toBe('/scrsphere/login');
      expect(getFullPath('/dashboard')).toBe('/scrsphere/dashboard');
    });

    it('handles nested base path', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/app/v1/');
      const { getFullPath } = await import('./navigation');
      expect(getFullPath('/login')).toBe('/app/v1/login');
      expect(getFullPath('/dashboard')).toBe('/app/v1/dashboard');
    });

    it('defaults to "/" when VITE_BASE_PATH is undefined', async () => {
      vi.stubEnv('VITE_BASE_PATH', undefined);
      const { getFullPath } = await import('./navigation');
      expect(getFullPath('/login')).toBe('/login');
    });
  });

  describe('navigateTo', () => {
    it('sets window.location.href with base path', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/scrsphere/');
      const { navigateTo } = await import('./navigation');
      navigateTo('/login');
      expect(window.location.href).toBe('/scrsphere/login');
    });

    it('sets window.location.href without base path when "/"', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/');
      const { navigateTo } = await import('./navigation');
      navigateTo('/dashboard');
      expect(window.location.href).toBe('/dashboard');
    });

    it('handles various paths', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/scrsphere/');
      const { navigateTo } = await import('./navigation');

      navigateTo('/login');
      expect(window.location.href).toBe('/scrsphere/login');

      navigateTo('/settings/team-management');
      expect(window.location.href).toBe('/scrsphere/settings/team-management');

      navigateTo('/sprint/123');
      expect(window.location.href).toBe('/scrsphere/sprint/123');
    });
  });

  describe('getRouterBasename', () => {
    it('returns "/" when VITE_BASE_PATH is "/"', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/');
      const { getRouterBasename } = await import('./navigation');
      expect(getRouterBasename()).toBe('/');
    });

    it('returns "/scrsphere" when VITE_BASE_PATH is "/scrsphere/"', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/scrsphere/');
      const { getRouterBasename } = await import('./navigation');
      expect(getRouterBasename()).toBe('/scrsphere');
    });

    it('returns "/scrsphere" when VITE_BASE_PATH is "/scrsphere" (no trailing slash)', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/scrsphere');
      const { getRouterBasename } = await import('./navigation');
      expect(getRouterBasename()).toBe('/scrsphere');
    });

    it('returns "/" when VITE_BASE_PATH is undefined', async () => {
      vi.stubEnv('VITE_BASE_PATH', undefined);
      const { getRouterBasename } = await import('./navigation');
      expect(getRouterBasename()).toBe('/');
    });

    it('handles nested base paths', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/app/v1/');
      const { getRouterBasename } = await import('./navigation');
      expect(getRouterBasename()).toBe('/app/v1');
    });
  });

  describe('getCurrentPath', () => {
    it('returns pathname as-is when base path is "/"', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/');
      const { getCurrentPath } = await import('./navigation');

      Object.defineProperty(window, 'location', {
        value: { pathname: '/login' },
        writable: true,
      });

      expect(getCurrentPath()).toBe('/login');
    });

    it('strips base path from pathname', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/scrsphere/');
      const { getCurrentPath } = await import('./navigation');

      Object.defineProperty(window, 'location', {
        value: { pathname: '/scrsphere/login' },
        writable: true,
      });

      expect(getCurrentPath()).toBe('/login');
    });

    it('strips base path from nested paths', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/scrsphere/');
      const { getCurrentPath } = await import('./navigation');

      Object.defineProperty(window, 'location', {
        value: { pathname: '/scrsphere/settings/team-management' },
        writable: true,
      });

      expect(getCurrentPath()).toBe('/settings/team-management');
    });

    it('returns "/" when pathname equals base path', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/scrsphere/');
      const { getCurrentPath } = await import('./navigation');

      Object.defineProperty(window, 'location', {
        value: { pathname: '/scrsphere' },
        writable: true,
      });

      expect(getCurrentPath()).toBe('/');
    });

    it('returns pathname as-is when it does not start with base path', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/scrsphere/');
      const { getCurrentPath } = await import('./navigation');

      Object.defineProperty(window, 'location', {
        value: { pathname: '/other-app/login' },
        writable: true,
      });

      expect(getCurrentPath()).toBe('/other-app/login');
    });

    it('handles root path correctly', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/');
      const { getCurrentPath } = await import('./navigation');

      Object.defineProperty(window, 'location', {
        value: { pathname: '/' },
        writable: true,
      });

      expect(getCurrentPath()).toBe('/');
    });
  });

  describe('integration scenarios', () => {
    it('GitHub Pages deployment scenario', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/scrsphere/');
      const { getFullPath, getCurrentPath, getRouterBasename, navigateTo } =
        await import('./navigation');

      expect(getRouterBasename()).toBe('/scrsphere');

      expect(getFullPath('/login')).toBe('/scrsphere/login');
      expect(getFullPath('/dashboard')).toBe('/scrsphere/dashboard');

      Object.defineProperty(window, 'location', {
        value: { pathname: '/scrsphere/login', href: '' },
        writable: true,
      });
      expect(getCurrentPath()).toBe('/login');

      navigateTo('/dashboard');
      expect(window.location.href).toBe('/scrsphere/dashboard');
    });

    it('local development scenario', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/');
      const { getFullPath, getCurrentPath, getRouterBasename, navigateTo } =
        await import('./navigation');

      expect(getRouterBasename()).toBe('/');

      expect(getFullPath('/login')).toBe('/login');
      expect(getFullPath('/dashboard')).toBe('/dashboard');

      Object.defineProperty(window, 'location', {
        value: { pathname: '/login', href: '' },
        writable: true,
      });
      expect(getCurrentPath()).toBe('/login');

      navigateTo('/dashboard');
      expect(window.location.href).toBe('/dashboard');
    });

    it('custom domain deployment scenario', async () => {
      vi.stubEnv('VITE_BASE_PATH', '/');
      const { getFullPath, getCurrentPath, getRouterBasename, navigateTo } =
        await import('./navigation');

      expect(getRouterBasename()).toBe('/');

      expect(getFullPath('/login')).toBe('/login');
      expect(getFullPath('/dashboard')).toBe('/dashboard');

      Object.defineProperty(window, 'location', {
        value: { pathname: '/dashboard', href: '' },
        writable: true,
      });
      expect(getCurrentPath()).toBe('/dashboard');

      navigateTo('/settings/team');
      expect(window.location.href).toBe('/settings/team');
    });
  });
});
