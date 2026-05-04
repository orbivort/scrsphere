import { ItemStatus } from '../../../types';

/**
 * Status Configuration
 * Defines visual styling, icons, and descriptions for each backlog item status
 */
export const STATUS_CONFIG: Record<
  ItemStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    description: string;
  }
> = {
  [ItemStatus.NEW]: {
    label: 'New',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db',
    icon: 'M12 4v16m8-8H4',
    description: 'Newly created item',
  },
  [ItemStatus.REFINED]: {
    label: 'Refined',
    color: '#92400e',
    bgColor: '#fef3c7',
    borderColor: '#fcd34d',
    icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    description: 'Requirements clarified',
  },
  [ItemStatus.READY]: {
    label: 'Ready',
    color: '#065f46',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    description: 'Ready for sprint',
  },
  [ItemStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#1e40af',
    bgColor: '#dbeafe',
    borderColor: '#93c5fd',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    description: 'Currently being worked on',
  },
  [ItemStatus.DONE]: {
    label: 'Done',
    color: '#065f46',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    icon: 'M5 13l4 4L19 7',
    description: 'Completed',
  },
};
