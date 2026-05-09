import { useEffect, useRef } from 'react';

/**
 * Focus Trap Hook - WCAG 2.1 compliant keyboard navigation
 *
 * Traps focus within a modal when active, cycling through focusable elements.
 * This ensures keyboard users cannot navigate outside the modal while it's open,
 * which is a WCAG 2.1 accessibility requirement for modal dialogs.
 *
 * @param isActive - Whether the focus trap should be active (typically when modal is open)
 * @param modalRef - React ref object pointing to the modal container element
 * @returns A ref to the previously focused element (for restoration purposes)
 *
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null);
 * useFocusTrap(showModal, modalRef);
 *
 * return (
 *   <div ref={modalRef} role="dialog" aria-modal="true">
 *     <button data-modal-close>Close</button>
 *     <input type="text" />
 *   </div>
 * );
 * ```
 */
export const useFocusTrap = (
  isActive: boolean,
  modalRef: React.RefObject<HTMLElement | null>
): React.MutableRefObject<HTMLElement | null> => {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive && modalRef.current) {
      // Store the previously focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;

      /**
       * Get all focusable elements within the modal
       * Filters out disabled elements and hidden elements
       */
      const getFocusableElements = (): HTMLElement[] => {
        if (!modalRef.current) return [];
        return Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
      };

      // Focus the first focusable element (usually the close button)
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        // Focus the close button if it exists, otherwise first element
        const closeButton = modalRef.current.querySelector(
          '[data-modal-close]'
        ) as HTMLElement | null;
        if (closeButton) {
          closeButton.focus();
        } else {
          focusableElements[0]?.focus();
        }
      }

      /**
       * Handle Tab key navigation within the modal
       * Cycles focus from last element to first (and vice versa)
       */
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        // Shift + Tab: Move backwards
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: Move forwards
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      /**
       * Handle Escape key to close modal
       * Dispatches a custom event that parent components can listen to
       */
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          // Dispatch custom event for modal close
          const closeEvent = new CustomEvent('modalCloseRequest', { bubbles: true });
          modalRef.current?.dispatchEvent(closeEvent);
        }
      };

      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', handleEscape);

      // Cleanup function
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keydown', handleEscape);
        // Restore focus when modal closes
        previouslyFocusedElement.current?.focus();
      };
    }
    return undefined;
  }, [isActive, modalRef]);

  return previouslyFocusedElement;
};
