import { ItemStatus, type ProductBacklogItem } from '../../../types';

/**
 * Valid status transitions for backlog items
 *
 * This map defines the allowed workflow transitions for backlog items.
 * Each status maps to an array of statuses that can be transitioned to.
 */
export const VALID_TRANSITIONS: Record<ItemStatus, ItemStatus[]> = {
  [ItemStatus.NEW]: [ItemStatus.REFINED],
  [ItemStatus.REFINED]: [ItemStatus.READY, ItemStatus.NEW],
  [ItemStatus.READY]: [ItemStatus.IN_PROGRESS, ItemStatus.REFINED],
  [ItemStatus.IN_PROGRESS]: [ItemStatus.DONE, ItemStatus.READY],
  [ItemStatus.DONE]: [],
};

/**
 * Validation type for status transitions
 */
export type ValidationType = 'ready' | 'done';

/**
 * Gets automatic validation checks for a status transition
 *
 * This function returns a set of validation checks that should be automatically
 * populated based on the item's current state when transitioning to READY or DONE status.
 *
 * For READY status (Definition of Ready checks):
 * - dor_1: Title and description are present
 * - dor_2: Acceptance criteria are defined
 * - dor_3: Story points are estimated
 * - dor_4: Business value is assigned
 * - dor_5: Manual check (not auto-populated)
 * - dor_6: Manual check (not auto-populated)
 *
 * For DONE status (Definition of Done checks):
 * - dod_1: Acceptance criteria are present
 * - dod_2: Manual check (not auto-populated)
 * - dod_3: Manual check (not auto-populated)
 * - dod_4: Manual check (not auto-populated)
 * - dod_5: Manual check (not auto-populated)
 * - dod_6: Manual check (not auto-populated)
 *
 * @param item - The backlog item being validated
 * @param type - The type of validation ('ready' or 'done')
 * @returns Record of check IDs to their auto-populated values
 *
 * @example
 * ```typescript
 * const checks = getAutoValidationChecks(item, 'ready');
 * // Returns: { dor_1: true, dor_2: true, dor_3: false, ... }
 * ```
 */
export const getAutoValidationChecks = (
  item: ProductBacklogItem,
  type: ValidationType
): Record<string, boolean> => {
  if (type === 'ready') {
    return {
      dor_1: !!(item.title && item.description),
      dor_2: !!item.acceptanceCriteria,
      dor_3: !!item.storyPoints,
      dor_4: !!item.businessValue,
      dor_5: false,
      dor_6: false,
    };
  } else {
    return {
      dod_1: !!item.acceptanceCriteria,
      dod_2: false,
      dod_3: false,
      dod_4: false,
      dod_5: false,
      dod_6: false,
    };
  }
};

/**
 * Checks if a status transition is allowed
 *
 * @param currentStatus - Current status of the item
 * @param targetStatus - Target status to transition to
 * @returns True if the transition is allowed, false otherwise
 *
 * @example
 * ```typescript
 * const canTransition = isTransitionAllowed(ItemStatus.NEW, ItemStatus.REFINED);
 * // Returns: true
 * ```
 */
export const isTransitionAllowed = (
  currentStatus: ItemStatus,
  targetStatus: ItemStatus
): boolean => {
  return VALID_TRANSITIONS[currentStatus].includes(targetStatus);
};

/**
 * Gets all allowed target statuses for a given current status
 *
 * @param currentStatus - Current status of the item
 * @returns Array of allowed target statuses
 *
 * @example
 * ```typescript
 * const allowedStatuses = getAllowedTransitions(ItemStatus.NEW);
 * // Returns: [ItemStatus.REFINED]
 * ```
 */
export const getAllowedTransitions = (currentStatus: ItemStatus): ItemStatus[] => {
  return VALID_TRANSITIONS[currentStatus];
};

/**
 * Gets a human-readable label for a status
 *
 * @param status - Item status
 * @returns Human-readable status label
 *
 * @example
 * ```typescript
 * const label = getStatusLabel(ItemStatus.IN_PROGRESS);
 * // Returns: 'IN PROGRESS'
 * ```
 */
export const getStatusLabel = (status: ItemStatus): string => {
  return status.replace('_', ' ');
};
