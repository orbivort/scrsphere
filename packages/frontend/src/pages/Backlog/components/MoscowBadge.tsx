/**
 * MoscowBadge Component
 *
 * A badge component for displaying MoSCoW priority labels.
 * Supports both full and compact display modes.
 *
 * @module pages/Backlog/components/MoscowBadge
 */

import { memo } from 'react';

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
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- runtime priority may be undefined despite type
  const config = MOSCOW_CONFIG[priority] ?? MOSCOW_CONFIG[MoSCoWPriority.COULD_HAVE];

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
      {compact ? config.shortLabel : config.label}
    </span>
  );
});

MoscowBadge.displayName = 'MoscowBadge';

export default MoscowBadge;
