/**
 * Backlog configuration constants
 */
export const BACKLOG_CONFIG = {
  /**
   * Maximum number of backlog items allowed per product goal
   * Set to 0 to disable the limit
   */
  MAX_ITEMS_PER_GOAL: parseInt(process.env.BACKLOG_MAX_ITEMS_PER_GOAL ?? '200', 10),
} as const;

/**
 * Check if backlog limit is enabled
 */
export function isBacklogLimitEnabled(): boolean {
  return BACKLOG_CONFIG.MAX_ITEMS_PER_GOAL > 0;
}
