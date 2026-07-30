/**
 * MoscowBadge Component
 *
 * A badge component for displaying MoSCoW priority labels.
 * Supports both full and compact display modes.
 *
 * @module pages/Backlog/components/MoscowBadge
 */

import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { MoSCoWPriority } from '../../../types';
import { MOSCOW_CONFIG } from '../config/moscow.config';

import styles from './MoscowBadge.module.css';

/**
 * Props for the MoscowBadge component
 */
export interface MoscowBadgeProps {
  /** The MoSCoW priority to display */
  priority: MoSCoWPriority;
  /** Whether to use compact display mode */
  compact?: boolean;
}

/**
 * Helper function to get translation key for MoSCoW priority
 */
const getMoscowTranslationKey = (
  priority: MoSCoWPriority,
  compact: boolean
):
  | 'moscow.mustHave'
  | 'moscow.mustShort'
  | 'moscow.shouldHave'
  | 'moscow.shouldShort'
  | 'moscow.couldHave'
  | 'moscow.couldShort'
  | 'moscow.wontHave'
  | 'moscow.wontShort' => {
  const keyMap: Record<
    MoSCoWPriority,
    {
      full: 'moscow.mustHave' | 'moscow.shouldHave' | 'moscow.couldHave' | 'moscow.wontHave';
      short: 'moscow.mustShort' | 'moscow.shouldShort' | 'moscow.couldShort' | 'moscow.wontShort';
    }
  > = {
    [MoSCoWPriority.MUST_HAVE]: { full: 'moscow.mustHave', short: 'moscow.mustShort' },
    [MoSCoWPriority.SHOULD_HAVE]: {
      full: 'moscow.shouldHave',
      short: 'moscow.shouldShort',
    },
    [MoSCoWPriority.COULD_HAVE]: { full: 'moscow.couldHave', short: 'moscow.couldShort' },
    [MoSCoWPriority.WONT_HAVE]: { full: 'moscow.wontHave', short: 'moscow.wontShort' },
  };
  return compact ? keyMap[priority].short : keyMap[priority].full;
};

/**
 * MoscowBadge Component
 *
 * Renders a styled badge showing the MoSCoW priority level.
 * Uses color coding from the MOSCOW_CONFIG for visual distinction.
 *
 * @param props - Component props
 * @returns The rendered MoscowBadge component
 *
 * @example
 * ```tsx
 * // Full badge
 * <MoscowBadge priority={MoSCoWPriority.MUST_HAVE} />
 *
 * // Compact badge
 * <MoscowBadge priority={MoSCoWPriority.SHOULD_HAVE} compact />
 * ```
 */
export const MoscowBadge = memo<MoscowBadgeProps>(({ priority, compact = false }) => {
  const { t } = useTranslation('backlog');

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime priority may be undefined despite type
  const effectivePriority = priority ?? MoSCoWPriority.COULD_HAVE;
  const config = MOSCOW_CONFIG[effectivePriority];
  const translationKey = getMoscowTranslationKey(effectivePriority, compact);

  return (
    <span
      className={`${styles['moscow-badge']} ${compact ? styles.compact : ''}`}
      style={
        {
          '--badge-color': config.color,
          '--badge-bg': config.bgColor,
        } as React.CSSProperties
      }
    >
      {t(translationKey)}
    </span>
  );
});

MoscowBadge.displayName = 'MoscowBadge';

export default MoscowBadge;
