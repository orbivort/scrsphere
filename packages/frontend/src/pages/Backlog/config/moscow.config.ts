import { MoSCoWPriority } from '../../../types';

/**
 * MoSCoW Priority Configuration
 * Defines visual styling, descriptions, and urgency levels for each priority
 *
 * Design Philosophy:
 * - Soft, muted colors that support rather than distract from content
 * - Pastel backgrounds with subtle borders for visual grouping
 * - Balanced color palette using design tokens for consistency
 * - Accessibility compliant (WCAG 2.2 AA)
 */
export const MOSCOW_CONFIG: Record<
  MoSCoWPriority,
  {
    label: string;
    shortLabel: string;
    color: string;
    bgColor: string;
    gradientFrom: string;
    gradientTo: string;
    borderColor: string;
    description: string;
    icon: string;
    urgency: number;
  }
> = {
  [MoSCoWPriority.MUST_HAVE]: {
    label: 'Must Have',
    shortLabel: 'Must',
    /* Soft coral-red - urgent but not aggressive */
    color: '#c2410c',
    bgColor: '#fff7ed',
    gradientFrom: '#fff7ed',
    gradientTo: '#ffedd5',
    borderColor: '#fdba74',
    description: 'Critical for delivery - Non-negotiable',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    urgency: 4,
  },
  [MoSCoWPriority.SHOULD_HAVE]: {
    label: 'Should Have',
    shortLabel: 'Should',
    /* Warm amber - important but approachable */
    color: '#b45309',
    bgColor: '#fffbeb',
    gradientFrom: '#fffbeb',
    gradientTo: '#fef3c7',
    borderColor: '#fcd34d',
    description: 'Important but not vital - High priority',
    icon: 'M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    urgency: 3,
  },
  [MoSCoWPriority.COULD_HAVE]: {
    label: 'Could Have',
    shortLabel: 'Could',
    /* Soft teal-blue - calm and optional */
    color: '#0e7490',
    bgColor: '#ecfeff',
    gradientFrom: '#ecfeff',
    gradientTo: '#cffafe',
    borderColor: '#5eead4',
    description: 'Desirable if possible - Nice to have',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    urgency: 2,
  },
  [MoSCoWPriority.WONT_HAVE]: {
    label: "Won't Have",
    shortLabel: "Won't",
    /* Neutral slate - understated and clear */
    color: '#475569',
    bgColor: '#f8fafc',
    gradientFrom: '#f8fafc',
    gradientTo: '#f1f5f9',
    borderColor: '#cbd5e1',
    description: 'Not in this release - Out of scope',
    icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636',
    urgency: 1,
  },
};

/**
 * Default business value mapping for MoSCoW priorities
 * Used to auto-populate business value when priority changes
 */
export const MOSCOW_TO_BUSINESS_VALUE: Record<MoSCoWPriority, number> = {
  [MoSCoWPriority.MUST_HAVE]: 13,
  [MoSCoWPriority.SHOULD_HAVE]: 5,
  [MoSCoWPriority.COULD_HAVE]: 3,
  [MoSCoWPriority.WONT_HAVE]: 1,
};
