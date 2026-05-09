import React, { useMemo, useCallback, useEffect, useState, useRef, lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { apiService } from '../../services';
import { useTeamStore, useAuthStore } from '../../store';
import { useApiError } from '../../hooks';
import {
  ImpedimentStatus,
  type Task,
  type Sprint,
  type DailyUpdate,
  type Impediment,
} from '../../types';
import { ProgressBar } from '../../components/common/Page/ProgressBar';
import {
  WarningIcon,
  RefreshIcon,
  CalendarIcon,
  CheckmarkIcon,
  ChartIcon,
  GoalIcon,
  ArrowRightIcon,
  SunIcon,
  PlusIcon,
  ImpedimentIcon,
  RunnerIcon,
  DashboardIcon,
} from '../../components/common/Icons';
import { ToastContainer } from '../../components/common/ToastContainer';
import { useToast } from '../../hooks/useToast';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/common/Loading';

import { BurndownInsight, type BurndownStatus } from './components/BurndownInsight';
import { TaskList, DailyUpdateList, ImpedimentList } from './components';
import {
  MAX_DISPLAY_ITEMS,
  STALE_TIME_SHORT,
  STALE_TIME_LONG,
  TOAST_AUTO_DISMISS_DURATION,
  REFRESH_ANNOUNCEMENT_DELAY,
} from './constants';
import styles from './Dashboard.module.css';

// Lazy load the BurndownChart component to reduce initial bundle size
const BurndownChart = lazy(() =>
  import('./components/BurndownChart').then((module) => ({
    default: module.BurndownChart,
  }))
);

/**
 * Task 4.4: Format a date as relative time (e.g., "2 minutes ago")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

interface SprintStats {
  progress: number;
  daysRemaining: number;
  completedTasks: number;
  totalTasks: number;
}

interface BurndownData {
  dates: string[];
  ideal: number[];
  actual: number[];
}

export const Dashboard: React.FC = () => {
  const { currentTeam } = useTeamStore();
  const { user, isAuthenticated } = useAuthStore();
  const { handleError } = useApiError();
  const navigate = useNavigate();

  const teamId = currentTeam?.id;
  const currentUserId = user?.id;

  // Ref to track if scroll to top has been performed
  const hasScrolledToTopRef = useRef(false);

  // State for refresh announcement (Task 2.3)
  const [refreshAnnouncement, setRefreshAnnouncement] = useState('');

  // Toast notifications
  const { toasts, success: showSuccessToast, removeToast } = useToast();

  // Task 4.3: State for refresh loading indicator
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Task 4.4: State for data freshness timestamp
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Memoize today's date to prevent unnecessary re-renders (Task 2.6)
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // All useQuery hooks must be called before any early returns
  const {
    data: sprintData,
    isLoading: sprintLoading,
    error: sprintError,
    refetch: refetchSprint,
  } = useQuery({
    queryKey: ['activeSprint', teamId],
    queryFn: () => {
      if (!teamId) throw new Error('Team ID is required');
      return apiService.getActiveSprint(teamId);
    },
    enabled: !!teamId && isAuthenticated,
    staleTime: STALE_TIME_SHORT,
    retry: 2,
  });

  const { data: burndownData, error: burndownError } = useQuery({
    queryKey: ['burndown', sprintData?.data?.id],
    queryFn: () => apiService.getBurndownData(sprintData?.data?.id ?? ''),
    enabled: !!sprintData?.data?.id && isAuthenticated,
    staleTime: STALE_TIME_LONG,
    retry: 1,
  });

  const {
    data: dailyUpdatesData,
    isLoading: dailyUpdatesLoading,
    error: dailyUpdatesError,
    refetch: refetchDailyUpdates,
  } = useQuery({
    queryKey: ['dailyUpdates', sprintData?.data?.id, today],
    queryFn: () => apiService.getDailyUpdates(sprintData?.data?.id ?? '', today),
    enabled: !!sprintData?.data?.id && isAuthenticated,
    staleTime: STALE_TIME_SHORT,
    retry: 1,
  });

  const {
    data: impedimentsData,
    isLoading: impedimentsLoading,
    error: impedimentsError,
    refetch: refetchImpediments,
  } = useQuery({
    queryKey: ['impediments', teamId],
    queryFn: () => {
      if (!teamId) throw new Error('Team ID is required');
      return apiService.getImpediments(teamId);
    },
    enabled: !!teamId && isAuthenticated,
    staleTime: STALE_TIME_SHORT,
    retry: 1,
  });

  // Authentication redirect useEffect - must be after all hooks
  useEffect(() => {
    if (!isAuthenticated) {
      void navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Scroll to top on initial page load
  useEffect(() => {
    if (!hasScrolledToTopRef.current) {
      hasScrolledToTopRef.current = true;
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  const sprintStats = useMemo((): SprintStats => {
    if (!sprintData?.data) {
      return { progress: 0, daysRemaining: 0, completedTasks: 0, totalTasks: 0 };
    }

    const sprint = sprintData.data;
    const tasks = sprint.tasks ?? [];
    const completedTasks = tasks.filter((t: Task) => t.status === 'DONE').length;
    const totalTasks = tasks.length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const daysRemaining = Math.max(
      0,
      Math.ceil((new Date(sprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    );

    return { progress, daysRemaining, completedTasks, totalTasks };
  }, [sprintData]);

  // Task 3.4: Calculate burndown insight status and percentage
  const burndownInsight = useMemo((): {
    status: BurndownStatus;
    percentage: number;
    message: string;
  } | null => {
    if (!burndownData?.data) return null;

    const { ideal, actual } = burndownData.data;
    if (!ideal.length || !actual.length) return null;

    const lastIdeal = ideal[ideal.length - 1] ?? 0;
    const lastActual = actual[actual.length - 1] ?? 0;
    const startPoints = ideal[0] ?? 0;

    // Calculate percentage difference
    // Positive = ahead (actual < ideal), Negative = behind (actual > ideal)
    const diff = lastIdeal - lastActual;
    const percentageDiff = startPoints > 0 ? Math.round((diff / startPoints) * 100) : 0;

    // Determine status based on difference
    // diff <= 0: Behind (actual > ideal)
    // diff <= 10% of ideal: On track
    // diff > 10%: Ahead
    const tenPercentOfIdeal = lastIdeal * 0.1;

    let status: BurndownStatus;
    let message: string;

    if (diff > tenPercentOfIdeal) {
      status = 'ahead';
      message = 'Team is burning down faster than planned. Great progress!';
    } else if (diff >= 0) {
      status = 'on-track';
      message = 'Team is progressing according to the sprint plan.';
    } else {
      status = 'behind';
      message = 'Team has more work remaining than planned. Consider adjusting scope.';
    }

    return { status, percentage: percentageDiff, message };
  }, [burndownData]);

  // Task 2.6: Include slice inside useMemo to prevent new references
  // Task 3.3: Sort tasks by status priority: IN_PROGRESS > TODO > DONE
  const myTasks = useMemo(() => {
    if (!sprintData?.data?.tasks) return [];

    const statusPriority: Record<string, number> = {
      IN_PROGRESS: 1,
      TODO: 2,
      DONE: 3,
    };

    return sprintData.data.tasks
      .filter((t: Task) => t.assigneeId === currentUserId)
      .sort((a: Task, b: Task) => {
        const priorityA = statusPriority[a.status] ?? 5;
        const priorityB = statusPriority[b.status] ?? 5;
        return priorityA - priorityB;
      })
      .slice(0, MAX_DISPLAY_ITEMS);
  }, [sprintData, currentUserId]);

  // Task 2.6: Include slice inside useMemo to prevent new references
  const dailyUpdates = useMemo((): DailyUpdate[] => {
    if (!dailyUpdatesData?.data) return [];
    return dailyUpdatesData.data.slice(0, MAX_DISPLAY_ITEMS);
  }, [dailyUpdatesData]);

  // Task 2.6: Include slice inside useMemo to prevent new references
  const openImpediments = useMemo((): Impediment[] => {
    if (!impedimentsData?.data) return [];
    return impedimentsData.data
      .filter(
        (imp: Impediment) =>
          imp.status === ImpedimentStatus.OPEN || imp.status === ImpedimentStatus.IN_PROGRESS
      )
      .slice(0, MAX_DISPLAY_ITEMS);
  }, [impedimentsData]);

  // Check if current user has submitted daily scrum today
  const hasSubmittedDailyScrum = useMemo(() => {
    if (!dailyUpdatesData?.data || !currentUserId) return false;
    return dailyUpdatesData.data.some((update: DailyUpdate) => update.userId === currentUserId);
  }, [dailyUpdatesData, currentUserId]);

  // Task 3.1: Handle task click - navigate to sprint board with task highlighted
  const handleTaskClick = useCallback(
    (taskId: string) => {
      void navigate(`/sprint?task=${taskId}`);
    },
    [navigate]
  );

  // Task 3.2: Handle impediment click - navigate to impediments page
  const handleImpedimentClick = useCallback(
    (impedimentId: string) => {
      void navigate(`/impediments?id=${impedimentId}`);
    },
    [navigate]
  );

  // Task 2.3: Update handleRefresh to announce completion
  // Task 3.7: Show toast notification on refresh
  // Task 4.3: Add loading state during refresh
  // Task 4.4: Update lastUpdated timestamp
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refetchSprint();
      setLastUpdated(new Date());
      // Announce refresh completion after a short delay
      setTimeout(() => {
        setRefreshAnnouncement('Dashboard data refreshed successfully');
        showSuccessToast('Dashboard data refreshed successfully');
        // Clear announcement after timeout
        setTimeout(() => {
          setRefreshAnnouncement('');
        }, TOAST_AUTO_DISMISS_DURATION);
      }, REFRESH_ANNOUNCEMENT_DELAY);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchSprint, showSuccessToast]);

  // Early return for unauthenticated users - must be after all hooks
  if (!isAuthenticated || !currentUserId) {
    return <LoadingState variant="page" label="Loading user context..." />;
  }

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (sprintLoading) {
    return <LoadingState variant="page" label="Loading dashboard..." />;
  }

  if (sprintError) {
    return (
      <div className={styles['dashboard-error']} role="alert" aria-live="assertive">
        <div className={styles['error-state']}>
          <span className={styles['error-icon']} aria-hidden="true">
            <WarningIcon size={64} />
          </span>
          <h2>Failed to Load Dashboard</h2>
          <p>{handleError(sprintError, 'Unable to load sprint data. Please try again.')}</p>
          <button
            type="button"
            onClick={handleRefresh}
            className={`button ${styles['button-primary']}`}
            aria-label="Retry loading dashboard"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const sprint: Sprint | undefined = sprintData?.data;

  return (
    <>
      {/* Task 2.3: Visually hidden aria-live region for announcements */}
      <div
        id="refresh-announcement"
        className={styles['visually-hidden']}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {refreshAnnouncement}
      </div>

      <div
        id="main-content"
        className={styles.dashboard}
        role="main"
        aria-label="Dashboard"
        tabIndex={-1}
        data-testid="dashboard"
      >
        <header className={styles['dashboard-header']}>
          <div className={styles['header-content']}>
            <h1 className={styles['page-title']}>
              <span className={styles['page-title-icon']}>
                <DashboardIcon size={24} aria-hidden="true" />
              </span>
              Dashboard
            </h1>
            <p className={styles['page-subtitle']}>
              Welcome back! Here's an overview of your active sprint.
            </p>
          </div>
          <div className={styles['header-actions']}>
            {/* Task 4.4: Display last updated timestamp */}
            {lastUpdated && (
              <span className={styles['last-updated']}>
                Last updated: {formatRelativeTime(lastUpdated)}
              </span>
            )}
            <button
              type="button"
              onClick={handleRefresh}
              className={`${styles['refresh-button']} ${isRefreshing ? styles.refreshing : ''}`}
              aria-label={isRefreshing ? 'Refreshing dashboard data...' : 'Refresh dashboard data'}
              disabled={isRefreshing}
            >
              <RefreshIcon
                size={16}
                aria-hidden="true"
                className={isRefreshing ? styles['icon-spin'] : undefined}
              />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        {sprint ? (
          <section
            className={styles['sprint-summary-grid']}
            aria-labelledby="sprint-summary-heading"
          >
            <article className={`${styles['sprint-card']} ${styles['animate-fade-in-up']}`}>
              <div className={styles['sprint-card-header']}>
                <h2 id="sprint-summary-heading">
                  <RunnerIcon size={20} aria-hidden="true" />
                  <span>{sprint.name}</span>
                </h2>
                <span
                  className={`${styles['sprint-status']} ${styles[sprint.status]}`}
                  aria-label={`Sprint status: ${sprint.status}`}
                >
                  {sprint.status}
                </span>
              </div>
              <div className={styles['sprint-card-body']}>
                {/* Task 4.11: Fixed invalid aria-label usage - using visually hidden text instead */}
                <div className={styles['sprint-stat']}>
                  <span className={styles['stat-icon']} aria-hidden="true">
                    <CalendarIcon size={32} />
                  </span>
                  <div className={styles['stat-content']}>
                    <div className={styles['stat-value']}>
                      {sprintStats.daysRemaining}
                      <span className={styles['visually-hidden']}> days remaining</span>
                    </div>
                    <div className={styles['stat-label']}>Days Remaining</div>
                  </div>
                </div>
                <div className={styles['sprint-stat']}>
                  <span className={styles['stat-icon']} aria-hidden="true">
                    <CheckmarkIcon size={32} />
                  </span>
                  <div className={styles['stat-content']}>
                    <div className={styles['stat-value']}>
                      {sprintStats.progress}%
                      <span className={styles['visually-hidden']}> completed</span>
                    </div>
                    <div className={styles['stat-label']}>Completed</div>
                  </div>
                </div>
                <div className={styles['sprint-stat']}>
                  <span className={styles['stat-icon']} aria-hidden="true">
                    <ChartIcon size={32} />
                  </span>
                  <div className={styles['stat-content']}>
                    <div className={styles['stat-value']}>
                      {sprintStats.completedTasks}
                      <span className={styles['visually-hidden']}> tasks done</span>
                    </div>
                    <div className={styles['stat-label']}>Tasks Done</div>
                  </div>
                </div>
              </div>
              {/* Sprint Progress Bar */}
              <div className={styles['sprint-progress-section']}>
                <div className={styles['progress-header']}>
                  <span className={styles['progress-label']}>Sprint Progress</span>
                  <span className={styles['progress-detail']}>
                    {sprintStats.completedTasks} of {sprintStats.totalTasks} tasks
                  </span>
                </div>
                <ProgressBar
                  value={sprintStats.progress}
                  label={`Sprint completion: ${sprintStats.progress}%`}
                  size="medium"
                  variant={
                    sprintStats.progress >= 70
                      ? 'success'
                      : sprintStats.progress >= 40
                        ? 'primary'
                        : 'warning'
                  }
                />
              </div>
              <div className={styles['sprint-card-footer']}>
                <Link to="/sprint" className={styles['button-link']} aria-label="View Sprint Board">
                  View Sprint Board
                  <ArrowRightIcon size={16} aria-hidden="true" />
                </Link>
              </div>
            </article>

            <article
              className={`${styles['sprint-goal-card']} ${styles['animate-fade-in-up']} ${styles['stagger-1']}`}
              aria-labelledby="sprint-goal-heading"
            >
              <div className={styles['sprint-goal-header']}>
                <h2 id="sprint-goal-heading">
                  <GoalIcon size={20} aria-hidden="true" />
                  Sprint Goal
                </h2>
              </div>
              <div className={styles['sprint-goal-body']}>
                <p>{sprint.sprintGoal ?? 'No Sprint Goal defined yet.'}</p>
              </div>
            </article>
          </section>
        ) : (
          <EmptyState type="no-active-sprint" variant="default" />
        )}

        {sprint && burndownData && !burndownError && (
          <section
            className={`${styles['chart-section']} ${styles['animate-fade-in']} ${styles['stagger-1']}`}
            aria-labelledby="burndown-chart-heading"
          >
            <h2 id="burndown-chart-heading" className={styles['visually-hidden']}>
              Sprint Burndown Chart
            </h2>
            <div className={styles['chart-container']}>
              <Suspense
                fallback={<LoadingState variant="skeleton-chart" label="Loading burndown chart" />}
              >
                <BurndownChart data={burndownData.data as BurndownData | undefined} />
              </Suspense>
            </div>
            {/* Task 3.4: Burndown insight indicator */}
            {burndownInsight && (
              <BurndownInsight
                status={burndownInsight.status}
                percentage={burndownInsight.percentage}
                message={burndownInsight.message}
                size="prominent"
              />
            )}

            {/* Visible chart legend */}
            <div className={styles['chart-legend']}>
              <div className={styles['legend-item']}>
                <span className={`${styles['legend-line']} ${styles['legend-ideal']}`} />
                <span className={styles['legend-label']}>Ideal Burndown</span>
              </div>
              <div className={styles['legend-item']}>
                <span className={`${styles['legend-line']} ${styles['legend-actual']}`} />
                <span className={styles['legend-label']}>Actual Progress</span>
              </div>
            </div>
          </section>
        )}

        {burndownError && (
          <section className={styles['chart-section']}>
            <div className={styles['chart-error']} role="alert">
              <p>Unable to load burndown chart. {handleError(burndownError)}</p>
            </div>
          </section>
        )}

        <section className={styles['dashboard-grid']} aria-labelledby="dashboard-details-heading">
          <h2 id="dashboard-details-heading" className={styles['visually-hidden']}>
            Dashboard Details
          </h2>

          <article
            className={`${styles['dashboard-card']} ${styles['animate-fade-in-up']} ${styles['stagger-2']}`}
          >
            <div className={styles['card-header']}>
              <h3>My Tasks</h3>
              <Link to="/sprint" className={styles['view-all-link']} aria-label="View all my tasks">
                View All
              </Link>
            </div>
            <div className={styles['card-body']}>
              <TaskList
                tasks={myTasks}
                emptyMessage="No tasks assigned to you yet."
                onTaskClick={handleTaskClick}
              />
            </div>
          </article>

          <article
            className={`${styles['dashboard-card']} ${styles['animate-fade-in-up']} ${styles['stagger-3']}`}
          >
            <div className={styles['card-header']}>
              <div className={styles['card-header-title']}>
                <h3>Team Updates</h3>
                {!dailyUpdatesLoading && (
                  <span
                    className={`${styles['submission-badge']} ${hasSubmittedDailyScrum ? styles.submitted : styles['not-submitted']}`}
                    role="status"
                    aria-live="polite"
                  >
                    {hasSubmittedDailyScrum ? (
                      <>
                        <span className={styles['badge-icon']} aria-hidden="true">
                          ✓
                        </span>
                        <span className={styles['badge-text']}>Submitted</span>
                      </>
                    ) : (
                      <span className={styles['badge-text']}>Not submitted</span>
                    )}
                  </span>
                )}
              </div>
              <Link
                to="/daily-scrum"
                className={styles['view-all-link']}
                aria-label="View all team updates"
              >
                View All
              </Link>
            </div>
            <div className={styles['card-body']}>
              {dailyUpdatesLoading ? (
                <LoadingState variant="skeleton-list" itemCount={3} label="Loading team updates" />
              ) : dailyUpdatesError ? (
                <div className={styles['card-error']} role="alert">
                  <p>Unable to load updates. {handleError(dailyUpdatesError)}</p>
                  {/* Task 3.5: Retry button for Team Updates card */}
                  <button
                    type="button"
                    onClick={() => refetchDailyUpdates()}
                    className={styles['retry-button']}
                    aria-label="Retry loading team updates"
                  >
                    <RefreshIcon size={14} aria-hidden="true" />
                    Retry
                  </button>
                </div>
              ) : (
                <DailyUpdateList
                  updates={dailyUpdates}
                  emptyMessage="No daily updates for today yet."
                  showSubmitButton
                />
              )}
            </div>
          </article>

          <article
            className={`${styles['dashboard-card']} ${styles['animate-fade-in-up']} ${styles['stagger-4']}`}
          >
            <div className={styles['card-header']}>
              <h3>Open Impediments</h3>
              <Link
                to="/impediments"
                className={styles['view-all-link']}
                aria-label="View all open impediments"
              >
                View All
              </Link>
            </div>
            <div className={styles['card-body']}>
              {impedimentsLoading ? (
                <LoadingState variant="skeleton-list" itemCount={3} label="Loading impediments" />
              ) : impedimentsError ? (
                <div className={styles['card-error']} role="alert">
                  <p>Unable to load impediments. {handleError(impedimentsError)}</p>
                  {/* Task 3.5: Retry button for Open Impediments card */}
                  <button
                    type="button"
                    onClick={() => refetchImpediments()}
                    className={styles['retry-button']}
                    aria-label="Retry loading impediments"
                  >
                    <RefreshIcon size={14} aria-hidden="true" />
                    Retry
                  </button>
                </div>
              ) : (
                <ImpedimentList
                  impediments={openImpediments}
                  emptyMessage="No open impediments. Great job!"
                  onImpedimentClick={handleImpedimentClick}
                />
              )}
            </div>
          </article>
        </section>

        <section
          className={`${styles['quick-actions']} ${styles['animate-fade-in-up']} ${styles['stagger-5']}`}
          aria-labelledby="quick-actions-heading"
        >
          <h3 id="quick-actions-heading">Quick Actions</h3>
          <nav className={styles['quick-actions-grid']} aria-label="Quick action shortcuts">
            <Link
              to="/daily-scrum"
              className={`${styles['quick-action-button']} ${hasSubmittedDailyScrum ? styles.submitted : ''}`}
              aria-label={
                hasSubmittedDailyScrum
                  ? 'View or update your daily scrum'
                  : 'Submit your daily scrum update'
              }
            >
              <span className={styles['action-icon']} aria-hidden="true">
                {hasSubmittedDailyScrum ? <CheckmarkIcon size={32} /> : <SunIcon size={32} />}
              </span>
              <span className={styles['action-label']}>
                {hasSubmittedDailyScrum ? 'Update Daily Scrum' : 'Submit Daily Scrum'}
              </span>
              {hasSubmittedDailyScrum && (
                <span className={styles['submitted-indicator']} aria-hidden="true">
                  Submitted
                </span>
              )}
            </Link>
            <Link
              to="/backlog"
              className={styles['quick-action-button']}
              aria-label="Create a new backlog item"
            >
              <span className={styles['action-icon']} aria-hidden="true">
                <PlusIcon size={32} />
              </span>
              <span className={styles['action-label']}>Create Backlog Item</span>
            </Link>
            <Link
              to="/impediments"
              className={styles['quick-action-button']}
              aria-label="Report a new impediment"
            >
              <span className={styles['action-icon']} aria-hidden="true">
                <ImpedimentIcon size={32} />
              </span>
              <span className={styles['action-label']}>Report Impediment</span>
            </Link>
          </nav>
        </section>
      </div>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </>
  );
};

export default Dashboard;
