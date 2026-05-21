/**
 * Backlog configuration constants
 */
export const BACKLOG_CONFIG = {
  /**
   * Maximum items per fetch request (pagination)
   */
  FETCH_LIMIT: parseInt(import.meta.env.VITE_BACKLOG_ITEM_LIMIT ?? '100', 10),

  /**
   * Maximum items allowed per product goal (capacity limit)
   * Set to 0 to disable the limit
   */
  MAX_ITEMS_PER_GOAL: parseInt(import.meta.env.VITE_BACKLOG_MAX_ITEMS_PER_GOAL ?? '200', 10),
} as const;

/**
 * Check if backlog limit is enabled
 */
export function isBacklogLimitEnabled(): boolean {
  return BACKLOG_CONFIG.MAX_ITEMS_PER_GOAL > 0;
}
