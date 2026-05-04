import type React from 'react';

export interface CategoryConfig {
  value: string;
  label: string;
  icon: string;
  color: {
    backgroundColor: string;
    color: string;
  };
}

export const DOD_CATEGORIES: CategoryConfig[] = [
  {
    value: 'quality',
    label: 'Quality',
    icon: '✓',
    color: {
      backgroundColor: '#D1FAE5',
      color: '#065F46',
    },
  },
  {
    value: 'testing',
    label: 'Testing',
    icon: '🧪',
    color: {
      backgroundColor: '#DBEAFE',
      color: '#1E40AF',
    },
  },
  {
    value: 'documentation',
    label: 'Documentation',
    icon: '📄',
    color: {
      backgroundColor: '#FEF3C7',
      color: '#92400E',
    },
  },
  {
    value: 'deployment',
    label: 'Deployment',
    icon: '🚀',
    color: {
      backgroundColor: '#FCE7F3',
      color: '#9D174D',
    },
  },
  {
    value: 'review',
    label: 'Review',
    icon: '👀',
    color: {
      backgroundColor: '#E0E7FF',
      color: '#3730A3',
    },
  },
];

export const DOR_CATEGORIES: CategoryConfig[] = [
  {
    value: 'clarity',
    label: 'Clarity',
    icon: '📝',
    color: {
      backgroundColor: '#E0F2FE',
      color: '#0369A1',
    },
  },
  {
    value: 'acceptance',
    label: 'Acceptance',
    icon: '✓',
    color: {
      backgroundColor: '#D1FAE5',
      color: '#065F46',
    },
  },
  {
    value: 'estimation',
    label: 'Estimation',
    icon: '📊',
    color: {
      backgroundColor: '#FEE2E2',
      color: '#991B1B',
    },
  },
  {
    value: 'dependencies',
    label: 'Dependencies',
    icon: '🔗',
    color: {
      backgroundColor: '#FEF3C7',
      color: '#92400E',
    },
  },
  {
    value: 'technical',
    label: 'Technical',
    icon: '⚙️',
    color: {
      backgroundColor: '#E5E7EB',
      color: '#374151',
    },
  },
  {
    value: 'value',
    label: 'Value',
    icon: '💎',
    color: {
      backgroundColor: '#FCE7F3',
      color: '#9D174D',
    },
  },
];

export function getCategoryColor(
  category: string,
  categories: CategoryConfig[]
): React.CSSProperties {
  const found = categories.find((c) => c.value === category);
  if (found) {
    return found.color;
  }
  return {
    backgroundColor: '#F3F4F6',
    color: '#374151',
  };
}
