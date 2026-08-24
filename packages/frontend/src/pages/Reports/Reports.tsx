import React, { lazy, Suspense, useMemo } from 'react';
import { Link } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { formatLocaleDate } from '@scrumooth/shared';

import { apiService } from '../../services';
import { useTeamStore } from '../../store';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/common/Loading';
import {
  ReportsIcon,
  ZapIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  CalendarIcon,
  LightbulbIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  InfoIcon,
  WarningIcon,
  XCircleIcon,
  CheckIcon,
  TargetIcon,
  ArrowRightIcon,
} from '../../components/common/Icons';

import styles from './Reports.module.css';

import { useI18nStore } from '@/i18n/useI18nStore';

// Lazy load the VelocityChart component to reduce initial bundle size
const VelocityChart = lazy(() =>
  import('./components/VelocityChart').then((module) => ({
    default: module.VelocityChart,
  }))
);

interface VelocityData {
  sprints: string[];
  planned: number[];
  completed: number[];
}

export const Reports: React.FC = () => {
  const { t } = useTranslation('reports');
  const { locale } = useI18nStore();
  const { currentTeam } = useTeamStore();
  const teamId = currentTeam?.id;

  const {
    data: velocityData,
    isLoading: isVelocityLoading,
    error: velocityError,
  } = useQuery({
    queryKey: ['velocity', teamId],
    queryFn: () => apiService.getVelocityData(teamId ?? ''),
    enabled: !!teamId,
  });

  const { data: metricsData, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['metrics', teamId],
    queryFn: () => apiService.getTeamMetrics(teamId ?? ''),
    enabled: !!teamId,
  });

  const { data: sprintHistoryData, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['sprint-history', teamId],
    queryFn: () => apiService.getSprintHistory(teamId ?? ''),
    enabled: !!teamId,
  });

  const { data: insightsData, isLoading: isInsightsLoading } = useQuery({
    queryKey: ['insights', teamId],
    queryFn: () => apiService.getInsights(teamId ?? ''),
    enabled: !!teamId,
  });

  const { data: productGoalsData } = useQuery({
    queryKey: ['product-goals', teamId],
    queryFn: () => apiService.getProductGoals(teamId ?? ''),
    enabled: !!teamId,
  });

  const { data: definitionData } = useQuery({
    queryKey: ['dod', teamId],
    queryFn: () => apiService.getDefinitionOfDone(teamId ?? ''),
    enabled: !!teamId,
  });

  const activeProductGoal = useMemo(() => {
    const goals = productGoalsData?.data ?? [];
    return goals.find((goal) => goal.status.toUpperCase() === 'ACTIVE');
  }, [productGoalsData]);

  const formatDate = (dateString: string) => {
    return formatLocaleDate(dateString, locale);
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETED':
        return `${styles['status-badge']} ${styles.completed}`;
      case 'ACTIVE':
        return `${styles['status-badge']} ${styles.active}`;
      default:
        return `${styles['status-badge']} ${styles.planned}`;
    }
  };

  const getTrendClass = (trend: number) => {
    if (trend > 0) return styles.positive;
    if (trend < 0) return styles.negative;
    return styles.neutral;
  };

  const formatTrend = (trend: number) => {
    if (trend > 0) return `↑ ${trend}%`;
    if (trend < 0) return `↓ ${Math.abs(trend)}%`;
    return '—';
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUpIcon size={14} />;
    if (trend < 0) return <TrendingDownIcon size={14} />;
    return <MinusIcon size={14} />;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <CheckIcon size={20} />;
      case 'warning':
        return <WarningIcon size={20} />;
      case 'negative':
        return <XCircleIcon size={20} />;
      default:
        return <InfoIcon size={20} />;
    }
  };

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (velocityError) {
    return (
      <div className={styles.reports}>
        <header className={styles['reports-header']}>
          <div className={styles['header-content']}>
            <h1 className={styles['page-title']}>
              <ReportsIcon size={32} aria-hidden="true" />
              {t('title')}
            </h1>
            <p className={styles['page-subtitle']}>{t('subtitle')}</p>
          </div>
        </header>
        <main id="main-content" className={styles.content} tabIndex={-1}>
          <div className={styles['error-state']} role="alert" aria-live="assertive">
            <div className={styles['error-icon']} aria-hidden="true">
              <AlertTriangleIcon size={64} />
            </div>
            <h2>{t('error.title')}</h2>
            <p>{t('error.message')}</p>
          </div>
        </main>
      </div>
    );
  }

  const metrics = metricsData?.data;
  const sprintHistory = sprintHistoryData?.data ?? [];
  const insights = insightsData?.data ?? [];

  return (
    <div className={styles.reports} data-testid="reports">
      <a href="#main-content" className={styles['skip-link']}>
        {t('skipToMainContent')}
      </a>
      <header className={styles['reports-header']}>
        <div className={styles['header-content']}>
          <h1 className={styles['page-title']}>
            <ReportsIcon size={32} aria-hidden="true" />
            {t('title')}
          </h1>
          <p className={styles['page-subtitle']}>{t('subtitle')}</p>
        </div>
      </header>

      <main id="main-content" className={styles.content} tabIndex={-1}>
        <div className={styles['chart-section']}>
          <div className={`${styles['chart-card']} ${styles['animate-fade-in-up']}`}>
            {isVelocityLoading ? (
              <LoadingState variant="skeleton-chart" label={t('loading.velocityChart')} />
            ) : (
              <div className={styles['chart-container']}>
                <Suspense
                  fallback={
                    <LoadingState variant="skeleton-chart" label={t('loading.velocityChart')} />
                  }
                >
                  <VelocityChart data={velocityData?.data as VelocityData | undefined} />
                </Suspense>
              </div>
            )}
          </div>
        </div>

        <div className={styles['artifact-banner']}>
          <div className={`${styles['artifact-card']} ${styles.goal}`}>
            <div className={styles['artifact-header']}>
              <TargetIcon size={18} aria-hidden="true" />
              <h3>{t('productGoal.title')}</h3>
            </div>
            {activeProductGoal ? (
              <>
                <h4 className={styles['artifact-title']}>{activeProductGoal.title}</h4>
                {activeProductGoal.description ? (
                  <p className={styles['artifact-description']}>{activeProductGoal.description}</p>
                ) : null}
                <Link to="/product-goals" className={styles['artifact-link']}>
                  {t('productGoal.viewLink')}
                  <ArrowRightIcon size={14} aria-hidden="true" />
                </Link>
              </>
            ) : (
              <p className={styles['artifact-description']}>{t('productGoal.empty')}</p>
            )}
          </div>

          <div className={`${styles['artifact-card']} ${styles.dod}`}>
            <div className={`${styles['artifact-header']} ${styles.dod}`}>
              <CheckCircleIcon size={18} aria-hidden="true" />
              <h3>{t('dod.title')}</h3>
            </div>
            {definitionData?.data && definitionData.data.items.length > 0 ? (
              <ul className={styles['dod-items']}>
                {definitionData.data.items
                  .filter((item) => item.isActive)
                  .slice(0, 4)
                  .map((item) => (
                    <li key={item.id} className={styles['dod-item']}>
                      <CheckIcon size={14} aria-hidden="true" />
                      <span>{item.description}</span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className={styles['artifact-description']}>{t('dod.empty')}</p>
            )}
          </div>
        </div>

        <div className={styles['metrics-grid']}>
          {isMetricsLoading ? (
            <LoadingState
              variant="skeleton-card"
              cardVariant="stats"
              itemCount={3}
              label={t('loading.metrics')}
            />
          ) : (
            <>
              <div
                className={`${styles['metric-card']} ${styles['animate-fade-in-up']} ${styles['stagger-1']}`}
              >
                <div className={styles['metric-header']}>
                  <span className={styles['metric-icon']} aria-hidden="true">
                    <ZapIcon size={16} />
                  </span>
                  <h3>{t('metrics.avgVelocity.title')}</h3>
                </div>
                <div className={styles['metric-value']}>
                  {metrics?.averageVelocity.toFixed(1) ?? '—'}
                </div>
                <div className={styles['metric-label']}>{t('metrics.avgVelocity.unit')}</div>
                <div
                  className={`${styles['metric-trend']} ${getTrendClass(metrics?.velocityTrend ?? 0)}`}
                >
                  <span className={styles['trend-icon']}>
                    {getTrendIcon(metrics?.velocityTrend ?? 0)}
                  </span>
                  <span>{formatTrend(metrics?.velocityTrend ?? 0)}</span>{' '}
                  {t('metrics.avgVelocity.fromLastSprint')}
                </div>
              </div>

              <div
                className={`${styles['metric-card']} ${styles['animate-fade-in-up']} ${styles['stagger-2']}`}
              >
                <div className={styles['metric-header']}>
                  <span className={styles['metric-icon']} aria-hidden="true">
                    <CheckCircleIcon size={16} />
                  </span>
                  <h3>{t('metrics.completionRate.title')}</h3>
                </div>
                <div className={styles['metric-value']}>{metrics?.completionRate ?? 0}%</div>
                <div className={styles['metric-label']}>{t('metrics.completionRate.unit')}</div>
              </div>

              <div
                className={`${styles['metric-card']} ${styles['animate-fade-in-up']} ${styles['stagger-3']}`}
              >
                <div className={styles['metric-header']}>
                  <span className={styles['metric-icon']} aria-hidden="true">
                    <AlertTriangleIcon size={16} />
                  </span>
                  <h3>{t('metrics.impediments.title')}</h3>
                </div>
                <div className={styles['metric-value']}>
                  {metrics?.impediments.resolved ?? 0} / {metrics?.impediments.total ?? 0}
                </div>
                <div className={styles['metric-label']}>{t('metrics.impediments.resolved')}</div>
                <div className={`${styles['metric-trend']} ${styles.neutral}`}>
                  <span>
                    {(metrics?.impediments.total ?? 0) - (metrics?.impediments.resolved ?? 0)}
                  </span>{' '}
                  {t('metrics.impediments.openCount')}
                </div>
              </div>
            </>
          )}
        </div>

        <div className={`${styles['sprint-history']} ${styles['animate-fade-in-up']}`}>
          <div className={styles['sprint-history-header']}>
            <CalendarIcon size={20} aria-hidden="true" />
            <h3>{t('sprintHistory.title')}</h3>
          </div>
          {isHistoryLoading ? (
            <LoadingState
              variant="skeleton-list"
              itemCount={3}
              label={t('loading.sprintHistory')}
            />
          ) : sprintHistory.length === 0 ? (
            <div className={styles['empty-history']}>
              <p>{t('sprintHistory.empty')}</p>
            </div>
          ) : (
            <div className={styles['history-list']}>
              {sprintHistory.map((sprint) => (
                <div
                  key={sprint.id}
                  className={`${styles['history-item']} ${sprint.status === 'ACTIVE' ? styles.active : ''}`}
                >
                  <div className={styles['history-header']}>
                    <div className={styles['sprint-info']}>
                      <h4>{sprint.name}</h4>
                      <span className={styles['sprint-date']}>
                        <CalendarIcon size={12} aria-hidden="true" />
                        {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                      </span>
                    </div>
                    <span className={getStatusBadgeClass(sprint.status)}>
                      {t(`sprintStatusLabels.${sprint.status}` as never)}
                    </span>
                  </div>
                  <div className={styles['history-stats']}>
                    <div className={styles.stat}>
                      <span className={styles.label}>{t('sprintHistory.stats.planned')}</span>
                      <span className={styles.value}>
                        {sprint.plannedPoints} {t('pts')}
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.label}>{t('sprintHistory.stats.completed')}</span>
                      <span className={styles.value}>
                        {sprint.completedPoints} {t('pts')}
                      </span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.label}>{t('sprintHistory.stats.teamMembers')}</span>
                      <span className={styles.value}>{sprint.teamMembers}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.label}>{t('sprintHistory.stats.impediments')}</span>
                      <span className={styles.value}>{sprint.impediments}</span>
                    </div>
                  </div>
                  {sprint.sprintGoal ? (
                    <div className={styles['sprint-goal']}>
                      <span className={styles['sprint-goal-label']}>
                        {t('sprintHistory.sprintGoalLabel')}
                      </span>
                      {sprint.sprintGoal}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${styles['insights-section']} ${styles['animate-fade-in-up']}`}>
          <div className={styles['insights-header']}>
            <LightbulbIcon size={20} aria-hidden="true" />
            <h3>{t('insights.title')}</h3>
          </div>
          {isInsightsLoading ? (
            <LoadingState variant="skeleton-list" itemCount={3} label={t('loading.insights')} />
          ) : insights.length === 0 ? (
            <div className={styles['empty-insights']}>
              <p>{t('insights.empty')}</p>
            </div>
          ) : (
            <div className={styles['insights-list']}>
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={`${styles['insight-item']} ${styles[insight.type]}`}
                >
                  <span className={styles['insight-icon']}>{getInsightIcon(insight.type)}</span>
                  <div className={styles['insight-content']}>
                    <h4>{insight.title}</h4>
                    <p>{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
