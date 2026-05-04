import { useState, useEffect, type RefObject } from 'react';

/**
 * Hook to detect whether a scrollable element currently has a visible scrollbar.
 * @param ref - Ref to the scrollable element.
 * @param enabled - Whether detection is active. Useful for disabling when collapsed, etc.
 */
export function useScrollbarDetection(
  ref: RefObject<HTMLElement | null>,
  enabled: boolean
): boolean {
  const [hasScrollbar, setHasScrollbar] = useState(false);

  useEffect(() => {
    if (!enabled || !ref.current) {
      setHasScrollbar(false);
      return;
    }

    const checkScrollbar = () => {
      if (ref.current) {
        const { scrollHeight, clientHeight } = ref.current;
        setHasScrollbar(scrollHeight > clientHeight);
      }
    };

    checkScrollbar();
    window.addEventListener('resize', checkScrollbar);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(checkScrollbar);
      resizeObserver.observe(ref.current);
    }

    return () => {
      window.removeEventListener('resize', checkScrollbar);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [ref, enabled]);

  return hasScrollbar;
}
