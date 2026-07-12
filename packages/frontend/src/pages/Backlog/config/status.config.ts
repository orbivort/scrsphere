import { ItemStatus } from '../../../types';

/**
 * Generic translation function type that accepts any string key
 * This is used to avoid TypeScript strict key checking issues
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TranslateFunction = (key: string) => any;

/**
 * Status Configuration
 * Defines visual styling, icons, and descriptions for each backlog item status
 */
export const getStatusConfig = (
  t: TranslateFunction
): Record<
  ItemStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    description: string;
  }
> => ({
  [ItemStatus.NEW]: {
    label: t('status.new'),
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db',
    icon: 'M12 4v16m8-8H4',
    description: t('status.newDesc'),
  },
  [ItemStatus.REFINED]: {
    label: t('status.refined'),
    color: '#92400e',
    bgColor: '#fef3c7',
    borderColor: '#fcd34d',
    icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    description: t('status.refinedDesc'),
  },
  [ItemStatus.READY]: {
    label: t('status.ready'),
    color: '#065f46',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    description: t('status.readyDesc'),
  },
  [ItemStatus.IN_PROGRESS]: {
    label: t('status.inProgress'),
    color: '#1e40af',
    bgColor: '#dbeafe',
    borderColor: '#93c5fd',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    description: t('status.inProgressDesc'),
  },
  [ItemStatus.DONE]: {
    label: t('status.done'),
    color: '#065f46',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    icon: 'M5 13l4 4L19 7',
    description: t('status.doneDesc'),
  },
});

/**
 * @deprecated Use getStatusConfig(t) instead for i18n support
 * Static status config for backwards compatibility
 */
export const STATUS_CONFIG = getStatusConfig((key: string) => key);
