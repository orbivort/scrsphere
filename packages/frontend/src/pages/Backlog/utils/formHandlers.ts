import { MoSCoWPriority } from '../../../types';

/**
 * Handles keyboard navigation for MoSCoW priority selection
 *
 * This function provides keyboard accessibility for MoSCoW priority buttons,
 * allowing users to navigate between priorities using arrow keys, Home, and End keys.
 *
 * Supported keys:
 * - ArrowRight/ArrowDown: Move to next priority
 * - ArrowLeft/ArrowUp: Move to previous priority
 * - Home: Jump to first priority (MUST_HAVE)
 * - End: Jump to last priority (WONT_HAVE)
 *
 * @param e - Keyboard event
 * @param currentIndex - Current priority index (0-3)
 * @param onPriorityChange - Callback function to update priority
 *
 * @example
 * ```typescript
 * <button
 *   onKeyDown={(e) => handleMoscowKeyDown(e, 0, handlePriorityChange)}
 * >
 *   Must Have
 * </button>
 * ```
 */
export const handleMoscowKeyDown = (
  e: React.KeyboardEvent,
  currentIndex: number,
  onPriorityChange: (priority: MoSCoWPriority) => void
): void => {
  const priorities = Object.values(MoSCoWPriority);
  let newIndex: number;

  switch (e.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      e.preventDefault();
      newIndex = (currentIndex + 1) % priorities.length;
      {
        const priority = priorities[newIndex];
        if (priority) onPriorityChange(priority as MoSCoWPriority);
      }
      break;
    case 'ArrowLeft':
    case 'ArrowUp':
      e.preventDefault();
      newIndex = (currentIndex - 1 + priorities.length) % priorities.length;
      {
        const priority = priorities[newIndex];
        if (priority) onPriorityChange(priority as MoSCoWPriority);
      }
      break;
    case 'Home':
      e.preventDefault();
      {
        const priority = priorities[0];
        if (priority) onPriorityChange(priority as MoSCoWPriority);
      }
      break;
    case 'End':
      e.preventDefault();
      {
        const priority = priorities[priorities.length - 1];
        if (priority) onPriorityChange(priority as MoSCoWPriority);
      }
      break;
    default:
      break;
  }
};

/**
 * Gets the index of a MoSCoW priority
 *
 * @param priority - MoSCoW priority value
 * @returns Index of the priority (0-3)
 *
 * @example
 * ```typescript
 * const index = getMoscowPriorityIndex(MoSCoWPriority.MUST_HAVE);
 * // Returns: 0
 * ```
 */
export const getMoscowPriorityIndex = (priority: MoSCoWPriority): number => {
  const priorities = Object.values(MoSCoWPriority);
  return priorities.indexOf(priority);
};

/**
 * Gets the next MoSCoW priority in the sequence
 *
 * @param currentPriority - Current priority
 * @returns Next priority in the sequence
 *
 * @example
 * ```typescript
 * const next = getNextMoscowPriority(MoSCoWPriority.MUST_HAVE);
 * // Returns: MoSCoWPriority.SHOULD_HAVE
 * ```
 */
export const getNextMoscowPriority = (currentPriority: MoSCoWPriority): MoSCoWPriority => {
  const priorities = Object.values(MoSCoWPriority);
  const currentIndex = priorities.indexOf(currentPriority);
  const nextIndex = (currentIndex + 1) % priorities.length;
  return priorities[nextIndex] as MoSCoWPriority;
};

/**
 * Gets the previous MoSCoW priority in the sequence
 *
 * @param currentPriority - Current priority
 * @returns Previous priority in the sequence
 *
 * @example
 * ```typescript
 * const prev = getPreviousMoscowPriority(MoSCoWPriority.SHOULD_HAVE);
 * // Returns: MoSCoWPriority.MUST_HAVE
 * ```
 */
export const getPreviousMoscowPriority = (currentPriority: MoSCoWPriority): MoSCoWPriority => {
  const priorities = Object.values(MoSCoWPriority);
  const currentIndex = priorities.indexOf(currentPriority);
  const prevIndex = (currentIndex - 1 + priorities.length) % priorities.length;
  return priorities[prevIndex] as MoSCoWPriority;
};
