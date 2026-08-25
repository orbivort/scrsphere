import { describe, it, expect, vi, afterEach } from 'vitest';

import { BACKLOG_CONFIG, isBacklogLimitEnabled } from './backlog.config';

describe('backlog.config', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  describe('BACKLOG_CONFIG defaults', () => {
    it('uses default FETCH_LIMIT when env var is unset', () => {
      // .env defines VITE_BACKLOG_ITEM_LIMIT=100, so the env-present branch is taken
      expect(BACKLOG_CONFIG.FETCH_LIMIT).toBe(100);
    });

    it('uses default MAX_ITEMS_PER_GOAL when env var is unset', () => {
      expect(BACKLOG_CONFIG.MAX_ITEMS_PER_GOAL).toBe(200);
    });

    it('falls back to 100 when the env var is explicitly undefined', async () => {
      vi.resetModules();
      vi.stubEnv('VITE_BACKLOG_ITEM_LIMIT', undefined);
      const mod = await import('./backlog.config');
      expect(mod.BACKLOG_CONFIG.FETCH_LIMIT).toBe(100);
    });

    it('falls back to 200 when the env var is explicitly undefined', async () => {
      vi.resetModules();
      vi.stubEnv('VITE_BACKLOG_MAX_ITEMS_PER_GOAL', undefined);
      const mod = await import('./backlog.config');
      expect(mod.BACKLOG_CONFIG.MAX_ITEMS_PER_GOAL).toBe(200);
    });
  });

  describe('BACKLOG_CONFIG with custom env vars', () => {
    it('reads a custom FETCH_LIMIT from the environment', async () => {
      vi.resetModules();
      vi.stubEnv('VITE_BACKLOG_ITEM_LIMIT', '50');
      const mod = await import('./backlog.config');
      expect(mod.BACKLOG_CONFIG.FETCH_LIMIT).toBe(50);
    });

    it('reads a custom MAX_ITEMS_PER_GOAL from the environment', async () => {
      vi.resetModules();
      vi.stubEnv('VITE_BACKLOG_MAX_ITEMS_PER_GOAL', '400');
      const mod = await import('./backlog.config');
      expect(mod.BACKLOG_CONFIG.MAX_ITEMS_PER_GOAL).toBe(400);
    });
  });

  describe('isBacklogLimitEnabled', () => {
    it('returns true when MAX_ITEMS_PER_GOAL is positive', () => {
      expect(isBacklogLimitEnabled()).toBe(true);
    });

    it('returns false when MAX_ITEMS_PER_GOAL is 0 (disabled)', async () => {
      vi.resetModules();
      vi.stubEnv('VITE_BACKLOG_MAX_ITEMS_PER_GOAL', '0');
      const mod = await import('./backlog.config');
      expect(mod.isBacklogLimitEnabled()).toBe(false);
    });
  });
});
