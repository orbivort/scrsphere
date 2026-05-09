import React, { lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiService } from '../../services';
import { useTeamStore } from '../../store';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/common/Loading';
import {
  ReportsIcon,
  ZapIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  SmileIcon,
  CalendarIcon,
  LightbulbIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  InfoIcon,
  WarningIcon,
  XCircleIcon,
  CheckIcon,
} from '../../components/common/Icons';

import styles from './Reports.module.css';

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
              Reports
            </h1>
            <p className={styles['page-subtitle']}>Track team performance and sprint metrics</p>
          </div>
        </header>
        <main id="main-content" className={styles.content} tabIndex={-1}>
          <div className={styles['error-state']} role="alert" aria-live="assertive">
            <div className={styles['error-icon']} aria-hidden="true">
              <AlertTriangleIcon size={64} />
            </div>
            <h2>Error Loading Reports</h2>
            <p>Unable to load report data. Please try again later.</p>
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
        Skip to main content
      </a>
      <header className={styles['reports-header']}>
        <div className={styles['header-content']}>
          <h1 className={styles['page-title']}>
            <ReportsIcon size={32} aria-hidden="true" />
            Reports
          </h1>
          <p className={styles['page-subtitle']}>Track team performance and sprint metrics</p>
        </div>
      </header>

      <main id="main-content" className={styles.content} tabIndex={-1}>
        <div className={styles['chart-section']}>
          <div className={`${styles['chart-card']} ${styles['animate-fade-in-up']}`}>
            {isVelocityLoading ? (
              <LoadingState variant="skeleton-chart" label="Loading velocity chart..." />
            ) : (
              <div className={styles['chart-container']}>
                <Suspense
                  fallback={
                    <LoadingState variant="skeleton-chart" label="Loading velocity chart..." />
                  }
                >
                  <VelocityChart data={velocityData?.data as VelocityData | undefined} />
                </Suspense>
              </div>
            )}
          </div>
        </div>

        <div className={styles['metrics-grid']}>
          {isMetricsLoading ? (
            <LoadingState
              variant="skeleton-card"
              cardVariant="stats"
              itemCount={4}
              label="Loading metrics..."
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
                  <h3>Average Velocity</h3>
                </div>
                <div className={styles['metric-value']}>
                  {metrics?.averageVelocity.toFixed(1) ?? '—'}
                </div>
                <div className={styles['metric-label']}>Story Points per Sprint</div>
                <div
                  className={`${styles['metric-trend']} ${getTrendClass(metrics?.velocityTrend ?? 0)}`}
                >
                  <span className={styles['trend-icon']}>
                    {getTrendIcon(metrics?.velocityTrend ?? 0)}
                  </span>
                  <span>{formatTrend(metrics?.velocityTrend ?? 0)}</span> from last sprint
                </div>
              </div>

              <div
                className={`${styles['metric-card']} ${styles['animate-fade-in-up']} ${styles['stagger-2']}`}
              >
                <div className={styles['metric-header']}>
                  <span className={styles['metric-icon']} aria-hidden="true">
                    <CheckCircleIcon size={16} />
                  </span>
                  <h3>Sprint Success Rate</h3>
                </div>
                <div className={styles['metric-value']}>{metrics?.successRate ?? 0}%</div>
                <div className={styles['metric-label']}>Sprint Goals Met</div>
                <div
                  className={`${styles['metric-trend']} ${getTrendClass(metrics?.successRateTrend ?? 0)}`}
                >
                  <span className={styles['trend-icon']}>
                    {getTrendIcon(metrics?.successRateTrend ?? 0)}
                  </span>
                  <span>{formatTrend(metrics?.successRateTrend ?? 0)}</span> from last month
                </div>
              </div>

              <div
                className={`${styles['metric-card']} ${styles['animate-fade-in-up']} ${styles['stagger-3']}`}
              >
                <div className={styles['metric-header']}>
                  <span className={styles['metric-icon']} aria-hidden="true">
                    <AlertTriangleIcon size={16} />
                  </span>
                  <h3>Impediments</h3>
                </div>
                <div className={styles['metric-value']}>
                  {metrics?.impediments.resolved ?? 0} / {metrics?.impediments.total ?? 0}
                </div>
                <div className={styles['metric-label']}>Resolved</div>
                <div className={`${styles['metric-trend']} ${styles.neutral}`}>
                  <span>
                    {(metrics?.impediments.total ?? 0) - (metrics?.impediments.resolved ?? 0)}
                  </span>{' '}
                  open impediment
                  {(metrics?.impediments.total ?? 0) - (metrics?.impediments.resolved ?? 0) !== 1
                    ? 's'
                    : ''}
                </div>
              </div>

              <div
                className={`${styles['metric-card']} ${styles['animate-fade-in-up']} ${styles['stagger-4']}`}
              >
                <div className={styles['metric-header']}>
                  <span className={styles['metric-icon']} aria-hidden="true">
                    <SmileIcon size={16} />
                  </span>
                  <h3>Team Satisfaction</h3>
                </div>
                <div className={styles['metric-value']}>
                  {metrics?.teamSatisfaction.rating.toFixed(1) ?? '—'} / 5
                </div>
                <div className={styles['metric-label']}>Average Rating</div>
                <div
                  className={`${styles['metric-trend']} ${getTrendClass(metrics?.teamSatisfaction.trend ?? 0)}`}
                >
                  <span className={styles['trend-icon']}>
                    {getTrendIcon(metrics?.teamSatisfaction.trend ?? 0)}
                  </span>
                  <span>
                    {metrics?.teamSatisfaction.trend && metrics.teamSatisfaction.trend > 0
                      ? `↑ ${metrics.teamSatisfaction.trend.toFixed(1)}`
                      : metrics?.teamSatisfaction.trend && metrics.teamSatisfaction.trend < 0
                        ? `↓ ${Math.abs(metrics.teamSatisfaction.trend).toFixed(1)}`
                        : '—'}
                  </span>{' '}
                  from last sprint
                </div>
              </div>
            </>
          )}
        </div>

        <div className={`${styles['sprint-history']} ${styles['animate-fade-in-up']}`}>
          <div className={styles['sprint-history-header']}>
            <CalendarIcon size={20} aria-hidden="true" />
            <h3>Sprint History</h3>
          </div>
          {isHistoryLoading ? (
            <LoadingState variant="skeleton-list" itemCount={3} label="Loading sprint history..." />
          ) : sprintHistory.length === 0 ? (
            <div className={styles['empty-history']}>
              <p>No sprint history available.</p>
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
                    <span className={getStatusBadgeClass(sprint.status)}>{sprint.status}</span>
                  </div>
                  <div className={styles['history-stats']}>
                    <div className={styles.stat}>
                      <span className={styles.label}>Planned</span>
                      <span className={styles.value}>{sprint.plannedPoints} pts</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.label}>Completed</span>
                      <span className={styles.value}>{sprint.completedPoints} pts</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.label}>Team Members</span>
                      <span className={styles.value}>{sprint.teamMembers}</span>
                    </div>
                    <div className={styles.stat}>
                      <span className={styles.label}>Impediments</span>
                      <span className={styles.value}>{sprint.impediments}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${styles['insights-section']} ${styles['animate-fade-in-up']}`}>
          <div className={styles['insights-header']}>
            <LightbulbIcon size={20} aria-hidden="true" />
            <h3>Key Insights</h3>
          </div>
          {isInsightsLoading ? (
            <LoadingState variant="skeleton-list" itemCount={3} label="Loading insights..." />
          ) : insights.length === 0 ? (
            <div className={styles['empty-insights']}>
              <p>No insights available yet. Complete more sprints to generate insights.</p>
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
