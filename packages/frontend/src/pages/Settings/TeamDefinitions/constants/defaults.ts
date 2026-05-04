import type { DoDItem, DoRItem } from '../../../../types';

export const DEFAULT_DOD_ITEMS: DoDItem[] = [
  {
    id: 'dod-default-1',
    description: 'Code is peer-reviewed and approved',
    category: 'review',
    isActive: true,
    order: 0,
  },
  {
    id: 'dod-default-2',
    description: 'Unit tests written and passing (minimum 80% coverage)',
    category: 'testing',
    isActive: true,
    order: 1,
  },
  {
    id: 'dod-default-3',
    description: 'Integration tests passing',
    category: 'testing',
    isActive: true,
    order: 2,
  },
  {
    id: 'dod-default-4',
    description: 'Code is properly documented',
    category: 'documentation',
    isActive: true,
    order: 3,
  },
  {
    id: 'dod-default-5',
    description: 'No critical or high-severity bugs',
    category: 'quality',
    isActive: true,
    order: 4,
  },
];

export const DEFAULT_DOR_ITEMS: DoRItem[] = [
  {
    id: 'dor-default-1',
    description: 'User story clearly written',
    category: 'clarity',
    isActive: true,
    order: 0,
  },
  {
    id: 'dor-default-2',
    description: 'Acceptance criteria defined',
    category: 'acceptance',
    isActive: true,
    order: 1,
  },
  {
    id: 'dor-default-3',
    description: 'Story points estimated',
    category: 'estimation',
    isActive: true,
    order: 2,
  },
  {
    id: 'dor-default-4',
    description: 'Dependencies identified',
    category: 'dependencies',
    isActive: true,
    order: 3,
  },
];
