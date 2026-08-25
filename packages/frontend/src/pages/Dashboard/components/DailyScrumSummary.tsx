import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { DailyScrum } from '../../../types';
import {
  CheckCircleIcon,
  ClockIcon,
  FlagIcon,
  RefreshIcon,
  SunIcon,
  UsersIcon,
} from '../../../components/common/Icons';

import styles from './DailyScrumSummary.module.css';

interface DailyScrumSummaryProps {
  dailyScrum: DailyScrum | null;
  /**
   * Developers on the team who have not yet joined today's Daily Scrum.
   * The Daily Scrum is a Developers-only event (Scrum Guide), so only
   * Developers are listed as "not yet joined".
   */
  nonParticipants: Array<{ userId: string; userName: string }>;
}

/**
 * Renders today's team-level Daily Scrum Inspect & Adapt record on the
 * Dashboard. Unlike the legacy per-developer updates, the Daily Scrum is a
 * single shared record for the whole team, authored by the Developers.
 */
const DailyScrumSummary: React.FC<DailyScrumSummaryProps> = memo(
  ({ dailyScrum, nonParticipants }) => {
    const { t } = useTranslation('dashboard');

    if (!dailyScrum) {
      return (
        <div className={styles['empty-list']} role="status">
          <span className={styles['empty-icon']} aria-hidden="true">
            <SunIcon size={24} />
          </span>
          <p>{t('dailyScrumSummary.notStarted')}</p>
        </div>
      );
    }

    const participantCount = dailyScrum.participants.length;

    return (
      <div className={styles['summary']}>
        {/* Team participation status */}
        <div className={styles['participation-row']}>
          <span className={styles['participation-item']}>
            <UsersIcon size={14} aria-hidden="true" />
            {t('dailyScrumSummary.participants', { count: participantCount })}
          </span>
          {nonParticipants.length > 0 && (
            <span className={styles['participation-item']}>
              <ClockIcon size={14} aria-hidden="true" />
              {t('dailyScrumSummary.notYetJoined', { count: nonParticipants.length })}
            </span>
          )}
        </div>

        {dailyScrum.planForNextDay && (
          <div className={styles['section']}>
            <div className={styles['section-label']}>
              <FlagIcon size={12} aria-hidden="true" />
              {t('dailyScrumSummary.planForNextDay')}
            </div>
            <p className={styles['section-content']}>{dailyScrum.planForNextDay}</p>
          </div>
        )}

        {dailyScrum.progressNotes && (
          <div className={styles['section']}>
            <div className={styles['section-label']}>
              <CheckCircleIcon size={12} aria-hidden="true" />
              {t('dailyScrumSummary.progress')}
            </div>
            <p className={styles['section-content']}>{dailyScrum.progressNotes}</p>
          </div>
        )}

        {dailyScrum.adaptationsNotes && (
          <div className={styles['section']}>
            <div className={styles['section-label']}>
              <RefreshIcon size={12} aria-hidden="true" />
              {t('dailyScrumSummary.adaptations')}
            </div>
            <p className={styles['section-content']}>{dailyScrum.adaptationsNotes}</p>
          </div>
        )}
      </div>
    );
  }
);

DailyScrumSummary.displayName = 'DailyScrumSummary';

export { DailyScrumSummary };
export type { DailyScrumSummaryProps };
