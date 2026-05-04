import { useEffect, useCallback } from 'react';

import { logger } from '../utils/logger';

/**
 * Hook to prevent accidental browser tab/window closure when there are unsaved changes.
 * Displays a browser-native confirmation dialog when user attempts to close the tab
 * or navigate away from the page with unsaved changes.
 *
 * @param enabled - Whether the beforeunload protection is active
 * @param message - Custom message (note: modern browsers show generic messages for security)
 *
 * @example
 * ```tsx
 * // In a form component
 * const [isDirty, setIsDirty] = useState(false);
 *
 * // Protect against accidental tab closure
 * useBeforeUnload(isDirty, 'You have unsaved changes. Are you sure you want to leave?');
 *
 * return (
 *   <form>
 *     // ... form fields
 *   </form>
 * );
 * ```
 *
 * Best Practices:
 * - Use this hook in forms where data loss would be significant
 * - Combine with modal-based confirmation for in-app navigation
 * - Always provide clear visual indicators of unsaved state
 * - Test across different browsers (behavior varies slightly)
 *
 * Note: Modern browsers (Chrome, Firefox, Safari) display generic messages
 * for security reasons, ignoring custom messages. The hook still works
 * to prevent accidental closure, but the displayed message is browser-controlled.
 */
export const useBeforeUnload = (enabled: boolean, message?: string): void => {
  const handleBeforeUnload = useCallback(
    (event: BeforeUnloadEvent) => {
      if (!enabled) return;

      // Standard way to trigger the beforeunload dialog
      event.preventDefault();

      // For legacy browser support
      // Modern browsers ignore this message and show a generic one
      event.returnValue = message || '';
    },
    [enabled, message]
  );

  useEffect(() => {
    if (!enabled) return;

    // Add the event listener when protection is enabled
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup: remove listener when component unmounts or protection is disabled
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled, handleBeforeUnload]);
};

/**
 * Convenience hook that combines beforeunload protection with form dirty state.
 * Automatically manages the enabled state based on form dirtiness.
 *
 * @param isDirty - Whether the form has unsaved changes
 * @param options - Configuration options
 * @returns Object with manual enable/disable controls
 *
 * @example
 * ```tsx
 * const form = useForm({ defaultValues: { name: '' } });
 * const isDirty = form.formState.isDirty;
 *
 * useFormUnloadProtection(isDirty, {
 *   message: 'Your team changes will be lost.',
 *   debug: process.env.NODE_ENV === 'development'
 * });
 * ```
 */
interface UseFormUnloadProtectionOptions {
  /** Custom message for the confirmation dialog */
  message?: string;
  /** Enable debug logging in development */
  debug?: boolean;
}

export const useFormUnloadProtection = (
  isDirty: boolean,
  options: UseFormUnloadProtectionOptions = {}
): {
  /** Whether protection is currently active */
  isProtected: boolean;
} => {
  const { message, debug } = options;

  // Apply the beforeunload protection
  useBeforeUnload(isDirty, message);

  // Debug logging in development
  useEffect(() => {
    if (debug && isDirty) {
      logger.debug('[useFormUnloadProtection] Protection enabled - unsaved changes detected');
    }
  }, [isDirty, debug]);

  return {
    isProtected: isDirty,
  };
};

export default useBeforeUnload;
