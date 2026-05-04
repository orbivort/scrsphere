import { useState, useEffect } from 'react';

/**
 * Hook to detect if the viewport is at or below a given breakpoint.
 * @param breakpoint - Maximum width (in pixels) to consider "mobile". Default: 768.
 */
export function useResponsive(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth <= breakpoint);
    };

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);

  return isMobile;
}
