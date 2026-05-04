import { useState, useEffect } from 'react';

import { apiService } from '../../../services';
import { logger } from '../../../utils/logger';

/**
 * Definition item structure for DoR/DoD checklists
 */
export interface DefinitionItem {
  id: string;
  label: string;
  description: string;
}

/**
 * Return type for useDefinitionOfReadyDone hook
 */
export interface UseDefinitionOfReadyDoneReturn {
  /** Definition of Ready items */
  dorItems: DefinitionItem[];
  /** Definition of Done items */
  dodItems: DefinitionItem[];
  /** Loading state for DoR */
  isLoadingDoR: boolean;
  /** Loading state for DoD */
  isLoadingDoD: boolean;
}

/**
 * Hook for fetching Definition of Ready and Definition of Done items
 *
 * Fetches both DoR and DoD from the API and transforms them into
 * a consistent format for use in validation modals.
 *
 * @param teamId - The current team ID
 * @returns Object containing dorItems, dodItems, and loading states
 *
 * @example
 * ```tsx
 * const { dorItems, dodItems, isLoadingDoR, isLoadingDoD } = useDefinitionOfReadyDone(teamId);
 * ```
 */
export const useDefinitionOfReadyDone = (
  teamId: string | undefined
): UseDefinitionOfReadyDoneReturn => {
  const [dorItems, setDorItems] = useState<DefinitionItem[]>([]);
  const [dodItems, setDodItems] = useState<DefinitionItem[]>([]);
  const [isLoadingDoR, setIsLoadingDoR] = useState(false);
  const [isLoadingDoD, setIsLoadingDoD] = useState(false);

  // Fetch Definition of Ready
  useEffect(() => {
    const fetchDoR = async () => {
      if (!teamId) return;

      setIsLoadingDoR(true);
      try {
        const response = await apiService.getDefinitionOfReady(teamId);
        if (response.success && response.data) {
          const items = response.data.items
            .filter((item) => item.isActive)
            .sort((a, b) => a.order - b.order)
            .map((item) => ({
              id: item.id,
              label: item.description,
              description: item.category || 'Required criterion',
            }));
          setDorItems(items);
        }
      } catch (error) {
        logger.error('Failed to fetch Definition of Ready', undefined, { error });
        // Fallback to empty array on error
        setDorItems([]);
      } finally {
        setIsLoadingDoR(false);
      }
    };
    fetchDoR();
  }, [teamId]);

  // Fetch Definition of Done
  useEffect(() => {
    const fetchDoD = async () => {
      if (!teamId) return;

      setIsLoadingDoD(true);
      try {
        const response = await apiService.getDefinitionOfDone(teamId);
        if (response.success && response.data) {
          const items = response.data.items
            .filter((item) => item.isActive)
            .sort((a, b) => a.order - b.order)
            .map((item) => ({
              id: item.id,
              label: item.description,
              description: item.category || 'Required criterion',
            }));
          setDodItems(items);
        }
      } catch (error) {
        logger.error('Failed to fetch Definition of Done', undefined, { error });
        // Fallback to empty array on error
        setDodItems([]);
      } finally {
        setIsLoadingDoD(false);
      }
    };
    fetchDoD();
  }, [teamId]);

  return {
    dorItems,
    dodItems,
    isLoadingDoR,
    isLoadingDoD,
  };
};
