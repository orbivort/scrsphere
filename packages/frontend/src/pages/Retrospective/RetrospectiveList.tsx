import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../../services';
import { useTeamStore, useAuthStore } from '../../store';
import { logger } from '../../utils/logger';
import {
  SprintStatus,
  RetrospectiveStatus,
  type Sprint,
  type SprintRetrospective,
} from '../../types';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/common/Loading';
import { queryKeys } from '../../hooks/queryKeys';

import styles from './RetrospectiveList.module.css';

import {
  CheckCircleIcon,
  CalendarIcon,
  MessageSquareIcon,
  CheckSquareIcon,
  PlayIcon,
  FileTextIcon,
  CheckIcon,
  SearchIcon,
  EyeIcon,
  PlusIcon,
} from '@/components/common/Icons';

interface SprintWithRetro extends Sprint {
  retrospective?: SprintRetrospective;
}

export const RetrospectiveList: React.FC = () => {
  const navigate = useNavigate();
  const { currentTeam } = useTeamStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const teamId = currentTeam?.id;
  const [creatingSprintId, setCreatingSprintId] = useState<string | null>(null);

  const { data: sprintsData, isLoading: isLoadingSprints } = useQuery({
    queryKey: ['sprints', teamId],
    queryFn: () => apiService.getSprints(teamId ?? ''),
    enabled: !!teamId,
  });

  const { data: retrospectivesData } = useQuery({
    queryKey: ['retrospectives', teamId],
    queryFn: () => apiService.getRetrospectives(teamId ?? ''),
    enabled: !!teamId,
  });

  const sprints = useMemo(() => sprintsData?.data ?? [], [sprintsData]);
  const retrospectives = useMemo(() => retrospectivesData?.data ?? [], [retrospectivesData]);

  const normalizeStatus = (status: string): SprintStatus => {
    return status.toLowerCase() as SprintStatus;
  };

  const completedSprints = useMemo((): SprintWithRetro[] => {
    return sprints
      .filter((sprint) => normalizeStatus(sprint.status) === SprintStatus.COMPLETED)
      .map((sprint) => {
        const sprintRetro = retrospectives.find((r) => r.sprintId === sprint.id);

        return {
          ...sprint,
          retrospective: sprintRetro,
        };
      })
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
  }, [sprints, retrospectives]);

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}, ${end.getFullYear()}`;
  };

  const getStatusConfig = (status: string): { label: string; className: string } => {
    const normalizedStatus = normalizeStatus(status);
    switch (normalizedStatus) {
      case SprintStatus.ACTIVE:
        return {
          label: 'Active',
          className: styles['status-active'] ?? '',
        };
      case SprintStatus.COMPLETED:
        return {
          label: 'Completed',
          className: styles['status-completed'] ?? '',
        };
      case SprintStatus.PLANNED:
        return {
          label: 'Planned',
          className: styles['status-planned'] ?? '',
        };
      case SprintStatus.CANCELLED:
        return {
          label: 'Cancelled',
          className: styles['status-cancelled'] ?? '',
        };
      default:
        return {
          label: 'Planned',
          className: styles['status-planned'] ?? '',
        };
    }
  };

  const getRetroStatusConfig = (sprint: SprintWithRetro) => {
    if (sprint.retrospective) {
      const retroStatus = sprint.retrospective.status;

      if (retroStatus === RetrospectiveStatus.COMPLETED) {
        return {
          label: 'Retrospective Completed',
          className: styles['retro-completed'],
          canView: true,
          hasRetro: true,
          status: RetrospectiveStatus.COMPLETED,
          icon: CheckIcon,
        };
      }

      if (retroStatus === RetrospectiveStatus.IN_PROGRESS) {
        return {
          label: 'Retrospective In Progress',
          className: styles['retro-in-progress'],
          canView: true,
          hasRetro: true,
          status: RetrospectiveStatus.IN_PROGRESS,
          icon: PlayIcon,
        };
      }

      return {
        label: 'Retrospective Draft',
        className: styles['retro-draft'],
        canView: true,
        hasRetro: true,
        status: RetrospectiveStatus.DRAFT,
        icon: FileTextIcon,
      };
    }

    return {
      label: 'Ready for Retrospective',
      className: styles['retro-ready'],
      canView: true,
      hasRetro: false,
      status: null,
      icon: PlayIcon,
    };
  };

  const createRetroMutation = useMutation({
    mutationFn: (sprintId: string) => {
      if (!teamId || !user?.id) {
        throw new Error('Team or user not available');
      }
      return apiService.createRetrospective({
        sprintId,
        teamId,
        retroDate: new Date().toISOString().split('T')[0],
        facilitatorId: user.id,
        isAnonymous: false,
      });
    },
    onSuccess: (_, sprintId) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.allByTeam(teamId) });
      void navigate(`/retrospective/${sprintId}`);
    },
    onError: (error) => {
      logger.error('Failed to create retrospective', undefined, { error });
      setCreatingSprintId(null);
    },
  });

  const handleViewRetro = (sprintId: string, hasRetro: boolean) => {
    if (hasRetro) {
      void navigate(`/retrospective/${sprintId}`);
    } else {
      setCreatingSprintId(sprintId);
      createRetroMutation.mutate(sprintId);
    }
  };

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (isLoadingSprints) {
    return (
      <div className={styles['page-container']}>
        <LoadingState variant="page" label="Loading retrospectives..." />
      </div>
    );
  }

  return (
    <div className={styles['page-container']} data-testid="retrospective-list">
      <header className={styles['page-header']}>
        <div className={styles['header-content']}>
          <h1 className={styles['page-title']}>
            <span className={styles['page-title-icon']}>
              <SearchIcon size={24} />
            </span>
            Sprint Retrospectives
          </h1>
          <p className={styles['page-subtitle']}>
            Reflect on completed sprints, identify improvements, and track action items
          </p>
        </div>
        <div className={styles['header-stats']}>
          <div className={styles['stat-item']}>
            <span className={styles['stat-value']}>{completedSprints.length}</span>
            <span className={styles['stat-label']}>
              Completed Sprint{completedSprints.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className={styles['stat-item']}>
            <span className={styles['stat-value']}>
              {
                completedSprints.filter(
                  (s) => s.retrospective?.status === RetrospectiveStatus.COMPLETED
                ).length
              }
            </span>
            <span className={styles['stat-label']}>Reviewed</span>
          </div>
        </div>
      </header>

      {completedSprints.length === 0 ? (
        <EmptyState type="no-completed-sprint" variant="default" />
      ) : (
        <div className={styles.content}>
          <section className={styles.section}>
            <h2 className={styles['section-title']}>
              <CheckCircleIcon className={styles['section-icon']} />
              Completed Sprints
            </h2>
            <div className={styles['sprint-grid']}>
              {completedSprints.map((sprint) => {
                const statusConfig = getStatusConfig(sprint.status);
                const retroConfig = getRetroStatusConfig(sprint);
                const RetroIcon = retroConfig.icon;

                return (
                  <article key={sprint.id} className={styles['sprint-card']}>
                    <div className={styles['card-header']}>
                      <div className={styles['sprint-name']}>{sprint.name}</div>
                      <span className={`${styles['status-badge']} ${statusConfig.className}`}>
                        <span className={styles['status-badge-icon']} />
                        {statusConfig.label}
                      </span>
                    </div>

                    <div className={styles['card-date']}>
                      <CalendarIcon className={styles['card-date-icon']} />
                      {formatDateRange(sprint.startDate, sprint.endDate)}
                    </div>

                    {sprint.sprintGoal && (
                      <div className={styles['sprint-goal']}>
                        <span className={styles['goal-label']}>Goal:</span>
                        <span className={styles['goal-text']}>{sprint.sprintGoal}</span>
                      </div>
                    )}

                    {sprint.retrospective && (
                      <div className={styles['retro-details']}>
                        <div className={styles['retro-meta']}>
                          <span className={styles['retro-meta-item']}>
                            <CalendarIcon className={styles['retro-meta-icon']} />
                            {new Date(sprint.retrospective.retroDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                          <span className={styles['retro-meta-item']}>
                            <MessageSquareIcon className={styles['retro-meta-icon']} />
                            {sprint.retrospective.items.length || 0} items
                          </span>
                          <span className={styles['retro-meta-item']}>
                            <CheckSquareIcon className={styles['retro-meta-icon']} />
                            {sprint.retrospective.actionItems.length || 0} actions
                          </span>
                        </div>
                      </div>
                    )}

                    <div className={styles['card-footer']}>
                      <div className={`${styles['retro-status']} ${retroConfig.className}`}>
                        <RetroIcon className={styles['retro-icon']} />
                        <span>{retroConfig.label}</span>
                      </div>

                      <div className={styles['card-actions']}>
                        <button
                          className={styles['view-button']}
                          onClick={() => handleViewRetro(sprint.id, !!sprint.retrospective)}
                          disabled={creatingSprintId === sprint.id && createRetroMutation.isPending}
                        >
                          {creatingSprintId === sprint.id && createRetroMutation.isPending ? (
                            'Creating...'
                          ) : sprint.retrospective ? (
                            <>
                              <EyeIcon size={16} /> View Retrospective
                            </>
                          ) : (
                            <>
                              <PlusIcon size={16} /> Create Retrospective
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
