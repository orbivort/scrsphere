/**
 * LiveAnnouncer - A component for managing ARIA live regions for screen reader announcements
 *
 * This component provides a React Context-based approach to screen reader announcements,
 * wrapping the ScreenReaderAnnouncer utility for use throughout the application.
 */

import React, { createContext, useContext, useEffect, useRef, useCallback, useMemo } from 'react';

import {
  type ScreenReaderAnnouncer,
  createAnnouncer,
  type AnnouncerPriority,
  type AnnouncerConfig,
} from '../../utils/announcer';

// Types
export type { AnnouncerPriority, AnnouncerConfig };

/**
 * Context value interface for the announcer
 */
export interface AnnouncerContextValue {
  /** Announce a message to screen readers */
  announce: (message: string, priority?: AnnouncerPriority) => void;
  /** The underlying announcer instance (for advanced use cases) */
  announcer: ScreenReaderAnnouncer | null;
}

/**
 * Props for the AnnouncerProvider component
 */
export interface AnnouncerProviderProps {
  /** Child components */
  children: React.ReactNode;
  /** Configuration options for the announcer */
  config?: AnnouncerConfig;
}

/**
 * Props for the LiveAnnouncer component
 */
export interface LiveAnnouncerProps {
  /** Configuration options for the announcer */
  config?: AnnouncerConfig;
  /** Whether to create separate live regions for polite and assertive announcements */
  separateRegions?: boolean;
}

// Create the context with a default undefined value
const AnnouncerContext = createContext<AnnouncerContextValue | undefined>(undefined);

/**
 * Custom hook to access the announcer context
 *
 * @returns The announcer context value with the announce function
 * @throws Error if used outside of AnnouncerProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { announce } = useAnnouncement();
 *
 *   const handleClick = () => {
 *     announce('Button clicked', 'polite');
 *   };
 *
 *   return <button onClick={handleClick}>Click me</button>;
 * }
 * ```
 */
export function useAnnouncement(): AnnouncerContextValue {
  const context = useContext(AnnouncerContext);

  if (context === undefined) {
    throw new Error('useAnnouncement must be used within an AnnouncerProvider');
  }

  return context;
}

/**
 * AnnouncerProvider - Provides the announcer context to child components
 *
 * This component should be placed at the root of your application to enable
 * screen reader announcements throughout the component tree.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AnnouncerProvider config={{ delayBetweenAnnouncements: 150 }}>
 *       <YourApp />
 *     </AnnouncerProvider>
 *   );
 * }
 * ```
 */
export function AnnouncerProvider({
  children,
  config,
}: AnnouncerProviderProps): React.ReactElement {
  const announcerRef = useRef<ScreenReaderAnnouncer | null>(null);

  // Create the announcer on mount
  useEffect(() => {
    announcerRef.current = createAnnouncer(config);
    announcerRef.current.createLiveRegion();

    // Cleanup on unmount
    return () => {
      if (announcerRef.current) {
        announcerRef.current.destroyLiveRegion();
        announcerRef.current = null;
      }
    };
  }, [config]);

  // Memoized announce function
  const announce = useCallback((message: string, priority: AnnouncerPriority = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.announce(message, priority);
    }
  }, []);

  // Memoized context value
  const contextValue = useMemo<AnnouncerContextValue>(
    () => ({
      announce,
      announcer: announcerRef.current,
    }),
    [announce]
  );

  return <AnnouncerContext.Provider value={contextValue}>{children}</AnnouncerContext.Provider>;
}

/**
 * LiveAnnouncer - A standalone component that creates live regions for screen readers
 *
 * This component can be used when you want to create live regions without using
 * the context provider pattern. It creates and manages the live regions directly.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <>
 *       <LiveAnnouncer />
 *       <YourApp />
 *     </>
 *   );
 * }
 * ```
 */
export function LiveAnnouncer({
  config,
  separateRegions = false,
}: LiveAnnouncerProps): React.ReactElement {
  const politeRegionRef = useRef<HTMLDivElement>(null);
  const assertiveRegionRef = useRef<HTMLDivElement>(null);
  const announcerRef = useRef<ScreenReaderAnnouncer | null>(null);

  useEffect(() => {
    if (separateRegions) {
      // Create separate live regions for polite and assertive announcements
      // This approach uses DOM elements directly rather than the utility
      // The regions are managed via refs and rendered in JSX
      return;
    }

    // Use the ScreenReaderAnnouncer utility
    announcerRef.current = createAnnouncer(config);
    announcerRef.current.createLiveRegion();

    return () => {
      if (announcerRef.current) {
        announcerRef.current.destroyLiveRegion();
        announcerRef.current = null;
      }
    };
  }, [config, separateRegions]);

  if (!separateRegions) {
    // The ScreenReaderAnnouncer utility manages the live region
    return <></>;
  }

  // Render separate live regions
  return (
    <>
      <div
        ref={politeRegionRef}
        id="sr-announcer-polite"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div
        ref={assertiveRegionRef}
        id="sr-announcer-assertive"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      />
    </>
  );
}

/**
 * Hook to announce messages with a specific priority
 *
 * This is a convenience hook that returns just the announce function,
 * useful when you don't need access to the full announcer instance.
 *
 * @returns The announce function
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const announce = useAnnounce();
 *
 *   const handleSuccess = () => {
 *     announce('Operation completed successfully');
 *   };
 *
 *   const handleError = () => {
 *     announce('An error occurred', 'assertive');
 *   };
 *
 *   return (
 *     <>
 *       <button onClick={handleSuccess}>Success</button>
 *       <button onClick={handleError}>Error</button>
 *     </>
 *   );
 * }
 * ```
 */
export function useAnnounce(): (message: string, priority?: AnnouncerPriority) => void {
  const { announce } = useAnnouncement();
  return announce;
}

// Export the context for advanced use cases
export { AnnouncerContext };
