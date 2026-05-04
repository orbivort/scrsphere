/**
 * LiveAnnouncer exports
 *
 * This module exports the LiveAnnouncer component, context provider, and hooks
 * for managing screen reader announcements throughout the application.
 */

// Components
export { LiveAnnouncer, AnnouncerProvider } from './LiveAnnouncer';

// Hooks
export { useAnnouncement, useAnnounce } from './LiveAnnouncer';

// Context (for advanced use cases)
export { AnnouncerContext } from './LiveAnnouncer';

// Types
export type {
  AnnouncerPriority,
  AnnouncerConfig,
  AnnouncerContextValue,
  AnnouncerProviderProps,
  LiveAnnouncerProps,
} from './LiveAnnouncer';
