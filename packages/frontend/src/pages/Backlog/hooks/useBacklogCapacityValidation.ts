import { useCallback } from 'react';

import { productBacklogService } from '../../../services/domain/productBacklog.service';
import { BACKLOG_CONFIG, isBacklogLimitEnabled } from '../../../config/backlog.config';

export interface CapacityValidationResult {
  isValid: boolean;
  currentCount?: number;
  maxLimit?: number;
  availableSlots?: number;
  error?: string;
}

/**
 * Hook for validating backlog capacity before creating items
 */
export const useBacklogCapacityValidation = () => {
  const validateCapacity = useCallback(
    async (goalId: string | undefined, itemsToAdd: number): Promise<CapacityValidationResult> => {
      // Skip validation if limit is disabled
      if (!isBacklogLimitEnabled()) {
        return { isValid: true };
      }

      // Skip validation if no goal specified
      if (!goalId) {
        return { isValid: true };
      }

      try {
        const currentCount = await productBacklogService.getBacklogItemCountByGoal(goalId);
        const maxLimit = BACKLOG_CONFIG.MAX_ITEMS_PER_GOAL;
        const availableSlots = Math.max(0, maxLimit - currentCount);

        if (currentCount + itemsToAdd > maxLimit) {
          return {
            isValid: false,
            currentCount,
            maxLimit,
            availableSlots,
            error:
              `Cannot add ${itemsToAdd} items. ` +
              `This goal already has ${currentCount} items ` +
              `(maximum: ${maxLimit}). ` +
              `Available slots: ${availableSlots}`,
          };
        }

        return {
          isValid: true,
          currentCount,
          maxLimit,
          availableSlots,
        };
      } catch (error) {
        // On error, allow the operation (fail open)
        console.error('Failed to validate backlog capacity:', error);
        return { isValid: true };
      }
    },
    []
  );

  const validateBulkImport = useCallback(
    async (items: Array<{ goalId?: string }>): Promise<CapacityValidationResult> => {
      // Skip validation if limit is disabled
      if (!isBacklogLimitEnabled()) {
        return { isValid: true };
      }

      // Group items by goalId
      const itemsByGoal = new Map<string | undefined, number>();
      for (const item of items) {
        const count = itemsByGoal.get(item.goalId) ?? 0;
        itemsByGoal.set(item.goalId, count + 1);
      }

      // Validate each goal
      for (const [goalId, newItems] of itemsByGoal) {
        const result = await validateCapacity(goalId, newItems);
        if (!result.isValid) {
          return result;
        }
      }

      return { isValid: true };
    },
    [validateCapacity]
  );

  return {
    validateCapacity,
    validateBulkImport,
    isLimitEnabled: isBacklogLimitEnabled(),
    maxItemsPerGoal: BACKLOG_CONFIG.MAX_ITEMS_PER_GOAL,
  };
};
