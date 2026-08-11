// Scrum Master Facilitation Dashboard
// Aggregates Scrum event compliance, impediment health, DoD adherence, Sprint
// Goal achievement, retrospective action items, and Scrum Values health.
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useTeamContext } from '../../contexts/TeamContext';
import { smDashboardService, healthCheckService } from '../../services';
import { LoadingState } from '../../components/common/Loading';
import { ScrumValuesBanner } from '../../components/common/ScrumValuesBanner';
import { HealthCheckSurvey } from '../../components/common/HealthCheckSurvey';
import { ShieldIcon } from '../../components/common/Icons';

import { DoDTrendChart } from './DoDTrendChart';
import { ScrumValuesRadar } from './ScrumValuesRadar';
import { HealthCheckTrendChart } from './HealthCheckTrendChart';
import styles from './SmDashboard.module.css';

const SmDashboardContent: React.FC = () => {
  const { t } = useTranslation(['scrum-master-dashboard', 'common']);
  const { currentTeam } = useTeamContext();
  const queryClient = useQueryClient();
  const [showSurvey, setShowSurvey] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['sm-dashboard', currentTeam?.id],
    queryFn: () => {
      if (!currentTeam?.id) {
        throw new Error('No current team');
      }
      return smDashboardService.getDashboard(currentTeam.id);
    },
    enabled: !!currentTeam?.id,
    retry: 1,
  });

  const { data: healthTrendData } = useQuery({
    queryKey: ['health-check-trend', currentTeam?.id],
    queryFn: () => {
      if (!currentTeam?.id) {
        throw new Error('No current team');
      }
      return healthCheckService.getTrend(currentTeam.id);
    },
    enabled: !!currentTeam?.id,
  });

  const createHealthCheckMutation = useMutation({
    mutationFn: () => {
      if (!currentTeam?.id) {
        throw new Error('No current team');
      }
      return healthCheckService.createHealthCheck(currentTeam.id);
    },
    onSuccess: (res) => {
      setShowSurvey(true);
      void queryClient.invalidateQueries({ queryKey: ['sm-dashboard', currentTeam?.id] });
      return res;
    },
  });

  if (isLoading) {
    return <LoadingState variant="page" label={t('common:loading')} />;
  }

  if (isError) {
    const message = error instanceof Error ? error.message : '';
    return (
      <p className={styles.empty}>
        {t('smDashboard.loadError')}
        {message ? `: ${message}` : ''}
      </p>
    );
  }

  if (!data?.data) {
    return <p className={styles.empty}>{t('smDashboard.noData')}</p>;
  }

  const dashboard = data.data;

  return (
    <div className={styles.container}>
      <ScrumValuesBanner />

      <div className={styles.section}>
        <h2 className={styles['section-title']}>{t('smDashboard.eventCompliance')}</h2>
        {dashboard.eventCompliance.length === 0 ? (
          <p className={styles.empty}>{t('common:noData')}</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('common:name')}</th>
                <th>{t('smDashboard.completedEvents')}</th>
                <th>{t('smDashboard.dailyScrumCount')}</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.eventCompliance.map((event) => {
                const completed =
                  (event.sprintPlanningCompleted ? 1 : 0) +
                  (event.sprintReviewCompleted ? 1 : 0) +
                  (event.retrospectiveCompleted ? 1 : 0);
                return (
                  <tr key={event.sprintId}>
                    <td>{event.sprintName}</td>
                    <td>{completed}/3</td>
                    <td>
                      {event.dailyScrumHeld}/{event.dailyScrumExpected}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className={styles.grid}>
        <div className={styles.section}>
          <h2 className={styles['section-title']}>{t('smDashboard.impedimentMetrics')}</h2>
          <div className={styles['stat-grid']}>
            <div className={styles.stat}>
              <span className={styles['stat-value']}>{dashboard.impedimentMetrics.open}</span>
              <span className={styles['stat-label']}>{t('common:open')}</span>
            </div>
            <div className={styles.stat}>
              <span className={styles['stat-value']}>
                {dashboard.impedimentMetrics.averageResolutionDays}
              </span>
              <span className={styles['stat-label']}>{t('smDashboard.avgResolutionDays')}</span>
            </div>
          </div>
          {dashboard.impedimentMetrics.aging.length > 0 && (
            <ul className={styles.list}>
              {dashboard.impedimentMetrics.aging.slice(0, 5).map((imp) => (
                <li key={imp.id} className={styles['list-item']}>
                  <span className={styles['item-text']}>{imp.title}</span>
                  <span
                    className={`${styles['age-tag']} ${imp.atRisk ? styles['at-risk'] : styles.ok}`}
                  >
                    {imp.ageDays}d {imp.atRisk ? `· ${t('smDashboard.atRisk')}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.section}>
          <h2 className={styles['section-title']}>{t('smDashboard.dodCompliance')}</h2>
          <DoDTrendChart data={dashboard.dodComplianceTrend} />
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.section}>
          <h2 className={styles['section-title']}>{t('smDashboard.sprintGoalAchievement')}</h2>
          <div className={styles.stat}>
            <span className={styles['stat-value']}>
              {dashboard.sprintGoalAchievement.achievementRate}%
            </span>
            <span className={styles['stat-label']}>{t('smDashboard.achievementRate')}</span>
          </div>
        </div>

        <div className={styles.section}>
          <h2 className={styles['section-title']}>{t('smDashboard.actionItemCompletion')}</h2>
          <div className={styles.stat}>
            <span className={styles['stat-value']}>
              {dashboard.actionItemCompletion.completionRate}%
            </span>
            <span className={styles['stat-label']}>{t('smDashboard.completionRate')}</span>
          </div>
          {dashboard.actionItemCompletion.overdue > 0 && (
            <p className={styles.warning}>
              {dashboard.actionItemCompletion.overdue} {t('smDashboard.atRisk')}
            </p>
          )}
        </div>

        <div className={styles.section}>
          <div className={styles['section-header']}>
            <h2 className={styles['section-title']}>{t('smDashboard.healthCheck')}</h2>
            <button
              type="button"
              className={styles['run-survey-button']}
              onClick={() => createHealthCheckMutation.mutate()}
              disabled={createHealthCheckMutation.isPending}
            >
              {t('healthCheck.createNew')}
            </button>
          </div>

          {showSurvey && currentTeam?.id && dashboard.healthCheck && (
            <HealthCheckSurvey
              teamId={currentTeam.id}
              healthCheckId={dashboard.healthCheck.healthCheckId}
            />
          )}

          {dashboard.healthCheck?.results.length ? (
            <>
              <div className={styles.stat}>
                <span className={styles['stat-value']}>
                  {dashboard.healthCheck.overallAverage}/5
                </span>
                <span className={styles['stat-label']}>{t('smDashboard.overallHealth')}</span>
              </div>
              <div className={styles.radar}>
                <ScrumValuesRadar results={dashboard.healthCheck.results} />
              </div>
              {healthTrendData?.data && healthTrendData.data.length >= 2 && (
                <div className={styles.radar}>
                  <HealthCheckTrendChart data={healthTrendData.data} />
                </div>
              )}
            </>
          ) : (
            <p className={styles.empty}>{t('healthCheck.noHealthCheck')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export const SmDashboard: React.FC = () => {
  const { t } = useTranslation(['scrum-master-dashboard', 'common']);
  return (
    <div className={styles.page}>
      <a href="#main-content" className={styles['skip-link']}>
        {t('common:loading')}
      </a>
      <header className={styles['page-header']}>
        <div className={styles['header-content']}>
          <h1 className={styles['page-title']}>
            <span className={styles['page-title-icon']}>
              <ShieldIcon size={24} aria-hidden="true" />
            </span>
            {t('smDashboard.title')}
          </h1>
          <p className={styles['page-subtitle']}>{t('smDashboard.subtitle')}</p>
        </div>
      </header>
      <main id="main-content" className={styles.main} tabIndex={-1}>
        <SmDashboardContent />
      </main>
    </div>
  );
};

export default SmDashboard;
