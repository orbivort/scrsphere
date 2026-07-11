export * from './time.js';
export * from './validation.js';

export const WORKFLOW_STATES = {
  PRODUCT_BACKLOG_ITEM: {
    NEW: 'NEW',
    REFINED: 'REFINED',
    READY: 'READY',
    IN_PROGRESS: 'IN_PROGRESS',
    DONE: 'DONE',
  },
  TASK: {
    TODO: 'TODO',
    IN_PROGRESS: 'IN_PROGRESS',
    DONE: 'DONE',
  },
  SPRINT: {
    PLANNED: 'PLANNED',
    ACTIVE: 'ACTIVE',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
} as const;

export const NOTIFICATION_TYPES = {
  SPRINT_STARTED: 'SPRINT_STARTED',
  SPRINT_ENDED: 'SPRINT_ENDED',
  TASK_ASSIGNED: 'TASK_ASSIGNED',
  MENTION: 'MENTION',
  IMPEDIMENT_CREATED: 'IMPEDIMENT_CREATED',
  IMPEDIMENT_RESOLVED: 'IMPEDIMENT_RESOLVED',
} as const;

export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export const SUPPORTED_LOCALES = ['en', 'de', 'fr', 'es', 'it'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  it: 'Italiano',
};

export const LOCALE_CURRENCIES: Record<Locale, string> = {
  en: 'EUR',
  de: 'EUR',
  fr: 'EUR',
  es: 'EUR',
  it: 'EUR',
};
