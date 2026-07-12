import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { apiService } from '../../services';
import { useTeamStore } from '../../store';
import {
  IncrementStatus,
  DeliveryMethod,
  type SprintReview as SprintReviewType,
  type StakeholderFeedback,
  type ReviewAttendee,
  type ProductBacklogItem,
  type BacklogAdjustment,
} from '../../types';
import { useModalFocus } from '../../hooks/useModalFocus';
import { useMutationErrorHandler } from '../../hooks/useMutationErrorHandler';
import { queryKeys } from '../../hooks/queryKeys';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/common/Loading';
import {
  FileTextIcon,
  AlertTriangleIcon,
  CheckIcon,
  XIcon,
  ArrowLeftIcon,
  TargetIcon,
  TrendingUpIcon,
  EditIcon,
  TrashIcon,
  ClockIcon,
  PackageIcon,
  MessageSquareIcon,
  UsersIcon,
  PlusIcon,
  RefreshCwIcon,
  ListIcon,
  CircleIcon,
  ScissorsIcon,
  InfoIcon,
  RocketIcon,
  UserIcon,
} from '../../components/common/Icons';

import styles from './SprintReview.module.css';
import { AddFeedbackModal } from './AddFeedbackModal';
import { AddBacklogAdjustmentModal } from './AddBacklogAdjustmentModal';
import { CreateSprintReviewModal } from './CreateSprintReviewModal';

import { AttendeesSection, type AttendeeFormData } from '@/components/AttendeesSection';

const mapTeamRoleToAttendeeRole = (role?: string): string => {
  const roleMap: Record<string, string> = {
    product_owner: 'product_owner',
    scrum_master: 'scrum_master',
    developer: 'developer',
    team_member: 'developer',
  };
  return roleMap[role?.toLowerCase() ?? ''] ?? 'stakeholder';
};

type SectionType = 'overview' | 'increment' | 'feedback' | 'adjustments';
type FeedbackCategory = 'positive' | 'negative' | 'suggestion' | 'question';
type AdjustmentAction = 'add' | 'modify' | 'remove' | 'reorder' | 'split';

interface FeedbackFormData {
  authorName: string;
  content: string;
  category: FeedbackCategory;
  actionRequired: boolean;
  relatedPbiId?: string;
  ownerId?: string;
}

interface AdjustmentFormData {
  action: AdjustmentAction;
  description: string;
  reason: string;
  pbiId?: string;
  ownerId: string;
}

const initialFeedbackForm: FeedbackFormData = {
  authorName: '',
  content: '',
  category: 'positive',
  actionRequired: false,
};

const initialAdjustmentForm: AdjustmentFormData = {
  action: 'add',
  description: '',
  reason: '',
  ownerId: '',
};

// Tab IDs for section navigation
const SECTION_TAB_IDS: SectionType[] = ['overview', 'increment', 'feedback', 'adjustments'];

// Pure helper functions moved outside component
const getCategoryColor = (category: string): { bg: string; text: string } => {
  switch (category) {
    case 'positive':
      return { bg: '#D1FAE5', text: '#065F46' };
    case 'negative':
      return { bg: '#FEE2E2', text: '#991B1B' };
    case 'suggestion':
      return { bg: '#DBEAFE', text: '#1E40AF' };
    case 'question':
      return { bg: '#FEF3C7', text: '#92400E' };
    default:
      return { bg: '#DBEAFE', text: '#1E40AF' };
  }
};

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    positive: '👍',
    negative: '👎',
    suggestion: '💡',
    question: '❓',
  };
  return icons[category] ?? '💬';
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

// Helper component for hint text
const BacklogHint: React.FC<{ message: string }> = ({ message }) => (
  <div className={styles['backlog-hint']}>
    <span className={styles['hint-icon']}>
      <InfoIcon size={16} />
    </span>
    <span className={styles['hint-text']}>{message}</span>
  </div>
);

export const SprintReview: React.FC = () => {
  const { t } = useTranslation('sprint-review');
  const { sprintId: urlSprintId } = useParams<{ sprintId: string }>();
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const { currentTeam } = useTeamStore();
  const queryClient = useQueryClient();
  const { handleMutationError } = useMutationErrorHandler();

  const SECTION_TABS: { id: SectionType; label: string }[] = useMemo(
    () => [
      { id: 'overview', label: t('tabs.overview') },
      { id: 'increment', label: t('tabs.increment') },
      { id: 'feedback', label: t('tabs.feedback') },
      { id: 'adjustments', label: t('tabs.backlogAdjustments') },
    ],
    [t]
  );

  const [sprintId, setSprintId] = useState<string | undefined>(urlSprintId);
  const [activeSection, setActiveSection] = useState<SectionType>('overview');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showAdjustmentForm, setShowAdjustmentForm] = useState(false);
  const [showCreateReviewModal, setShowCreateReviewModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isReviewCompleted, setIsReviewCompleted] = useState(false);
  const [showCompleteConfirmation, setShowCompleteConfirmation] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [feedbackForm, setFeedbackForm] = useState<FeedbackFormData>(initialFeedbackForm);
  const [adjustmentForm, setAdjustmentForm] = useState<AdjustmentFormData>(initialAdjustmentForm);
  const [createReviewData, setCreateReviewData] = useState({
    reviewDate: new Date().toISOString().split('T')[0],
    summary: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const teamId = currentTeam?.id;

  const { data: activeSprintData, isLoading: isLoadingActiveSprint } = useQuery({
    queryKey: ['active-sprint', teamId],
    queryFn: () => {
      if (!teamId) throw new Error('Team ID is required');
      return apiService.getActiveSprint(teamId);
    },
    enabled: !!teamId && !sprintId,
  });

  const { data: allSprintsData } = useQuery({
    queryKey: ['sprints', teamId],
    queryFn: () => {
      if (!teamId) throw new Error('Team ID is required');
      return apiService.getSprints(teamId);
    },
    enabled: !!teamId,
  });

  useEffect(() => {
    if (activeSprintData?.data && !sprintId) {
      setSprintId(activeSprintData.data.id);
      setSearchParams({ sprintId: activeSprintData.data.id });
    }
  }, [activeSprintData, sprintId, setSearchParams]);

  useEffect(() => {
    if (urlSprintId && urlSprintId !== sprintId) {
      setSprintId(urlSprintId);
    }
  }, [urlSprintId, sprintId]);

  const { data: sprintData, isLoading: isLoadingSprint } = useQuery({
    queryKey: ['sprint', sprintId],
    queryFn: () => apiService.getSprint(sprintId ?? ''),
    enabled: !!sprintId,
  });

  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    isError: isReviewsError,
    error: reviewsError,
  } = useQuery({
    queryKey: ['sprint-reviews', teamId, sprintId],
    queryFn: () => {
      if (!teamId || !sprintId) throw new Error('Team ID and Sprint ID are required');
      return apiService.getSprintReviews(teamId, sprintId);
    },
    enabled: !!teamId && !!sprintId,
  });

  const { data: incrementsData } = useQuery({
    queryKey: ['increments', teamId, sprintId],
    queryFn: () => {
      if (!teamId || !sprintId) throw new Error('Team ID and Sprint ID are required');
      return apiService.getIncrements(teamId, sprintId);
    },
    enabled: !!teamId && !!sprintId,
  });

  const { data: sprintBacklogItems } = useQuery({
    queryKey: ['sprint-backlog-pbis', sprintId],
    queryFn: () => apiService.getSprintBacklogPBIs(sprintId ?? ''),
    enabled: !!sprintId,
  });

  const sprint = sprintData?.data;
  const review = useMemo(() => {
    const reviews = reviewsData?.data ?? [];
    return reviews.find((r) => r.sprintId === sprintId);
  }, [reviewsData, sprintId]);

  useEffect(() => {
    if (review?.status === 'completed') {
      setIsReviewCompleted(true);
    }
  }, [review?.status]);

  const increment = useMemo(() => {
    const increments = incrementsData?.data ?? [];
    return increments.find(
      (inc) => inc.status === IncrementStatus.DELIVERED || inc.status === IncrementStatus.VERIFIED
    );
  }, [incrementsData]);

  const sprintDuration = useMemo(() => {
    if (!sprint) return { days: 0, weeks: 0, workingDays: 0 };
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);

    let workingDays = 0;
    const current = new Date(start);
    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return {
      days: diffDays,
      weeks: Math.round((workingDays / 5) * 10) / 10,
      workingDays,
    };
  }, [sprint]);

  const teamMembers = useMemo(() => {
    if (!currentTeam?.members) return [];
    return currentTeam.members;
  }, [currentTeam]);

  const sprintStats = useMemo(() => {
    const pbis = sprintBacklogItems?.data ?? [];
    const committedStoryPoints = pbis.reduce(
      (sum: number, pbi: ProductBacklogItem) => sum + (pbi.storyPoints ?? 0),
      0
    );
    const completedStoryPoints = pbis
      .filter((pbi: ProductBacklogItem) => pbi.status === 'DONE')
      .reduce((sum: number, pbi: ProductBacklogItem) => sum + (pbi.storyPoints ?? 0), 0);
    const completionRate =
      committedStoryPoints > 0
        ? Math.round((completedStoryPoints / committedStoryPoints) * 100)
        : 0;

    return {
      committedStoryPoints,
      completedStoryPoints,
      completionRate,
    };
  }, [sprintBacklogItems]);

  const createReviewMutation = useMutation({
    mutationFn: (data: {
      sprintId: string;
      teamId: string;
      reviewDate: string;
      summary?: string;
    }) =>
      apiService.createSprintReview({
        sprintId: data.sprintId,
        teamId: data.teamId,
        reviewDate: data.reviewDate,
        summary: data.summary,
        incrementId: increment?.id,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintReview.all });
      setShowCreateReviewModal(false);
      setCreateReviewData({ reviewDate: new Date().toISOString().split('T')[0], summary: '' });
    },
    onError: (error: unknown) => {
      handleMutationError(error, {
        operationName: 'create sprint review',
        setFormErrors,
      });
    },
  });

  const addFeedbackMutation = useMutation({
    mutationFn: (feedback: Partial<StakeholderFeedback>) =>
      apiService.addStakeholderFeedback(review?.id ?? '', feedback),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintReview.all });
      setShowFeedbackForm(false);
      setFeedbackForm(initialFeedbackForm);
    },
    onError: (error: unknown) => {
      handleMutationError(error, {
        operationName: 'add stakeholder feedback',
        setFormErrors,
      });
    },
  });

  const updateReviewMutation = useMutation({
    mutationFn: (updates: Partial<SprintReviewType>) => {
      return apiService.updateSprintReview(review?.id ?? '', updates);
    },
    onMutate: async (updates) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.sprintReview.byTeamAndSprint(teamId, sprintId),
      });
      const previousReviews = queryClient.getQueryData(
        queryKeys.sprintReview.byTeamAndSprint(teamId, sprintId)
      );

      if (updates.status === 'completed') {
        setIsReviewCompleted(true);
      }

      queryClient.setQueryData(
        queryKeys.sprintReview.byTeamAndSprint(teamId, sprintId),
        (old: { data?: SprintReviewType[] } | undefined) => {
          if (!old?.data) return old;
          return {
            ...old,
            data: old.data.map((r: SprintReviewType) =>
              r.id === review?.id ? { ...r, ...updates } : r
            ),
          };
        }
      );

      return { previousReviews };
    },
    onSuccess: (data, variables) => {
      if (data.data?.status === 'completed') {
        setIsReviewCompleted(true);
      }
      void queryClient.invalidateQueries({
        queryKey: queryKeys.sprintReview.byTeamAndSprint(teamId, sprintId),
      });
      if (variables.status === 'completed') {
        setShowSuccessModal(true);
      }
    },
    onError: (_error, _variables, context) => {
      if (context?.previousReviews) {
        queryClient.setQueryData(
          queryKeys.sprintReview.byTeamAndSprint(teamId, sprintId),
          context.previousReviews
        );
      }
    },
  });

  const addMutation = useMutation({
    mutationFn: (data: { name: string; email?: string; role: string; attended: boolean }) =>
      apiService.addAttendee(review?.id ?? '', data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintReview.all });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ attendeeId, attended }: { attendeeId: string; attended: boolean }) =>
      apiService.updateAttendee(attendeeId, { attended }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintReview.all });
    },
  });

  // Focus trap hook for success modal
  const successModalFocus = useModalFocus({
    isOpen: showSuccessModal,
    onClose: () => setShowSuccessModal(false),
  });

  // Validation functions wrapped in useCallback
  const validateFeedbackForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!feedbackForm.authorName.trim()) {
      errors.authorName = t('addFeedbackModal.authorName').replace(' *', '');
    }
    if (!feedbackForm.content.trim()) {
      errors.content = t('addFeedbackModal.feedback').replace(' *', '');
    }
    if (feedbackForm.actionRequired && !feedbackForm.ownerId) {
      errors.ownerId = t('addFeedbackModal.owner').replace(' *', '');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [
    t,
    feedbackForm.authorName,
    feedbackForm.content,
    feedbackForm.actionRequired,
    feedbackForm.ownerId,
  ]);

  const validateAdjustmentForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};
    if (!adjustmentForm.description.trim()) {
      errors.description = t('addAdjustmentModal.description').replace(' *', '');
    }
    if (!adjustmentForm.reason.trim()) {
      errors.reason = t('addAdjustmentModal.reason').replace(' *', '');
    }
    if (!adjustmentForm.ownerId) {
      errors.ownerId = t('addAdjustmentModal.owner').replace(' *', '');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [t, adjustmentForm.description, adjustmentForm.reason, adjustmentForm.ownerId]);

  // Event handlers wrapped in useCallback
  const handleAddFeedback = useCallback(() => {
    if (!validateFeedbackForm()) return;
    addFeedbackMutation.mutate({
      ...feedbackForm,
      reviewId: review?.id,
    });
  }, [validateFeedbackForm, feedbackForm, review?.id, addFeedbackMutation]);

  const handleAddAdjustment = useCallback(() => {
    if (!validateAdjustmentForm()) return;

    const newAdjustment: Partial<BacklogAdjustment> = {
      action: adjustmentForm.action as BacklogAdjustment['action'],
      description: adjustmentForm.description,
      reason: adjustmentForm.reason,
      implemented: false,
      ownerId: adjustmentForm.ownerId,
    };

    if (adjustmentForm.pbiId && adjustmentForm.pbiId.trim() !== '') {
      newAdjustment.pbiId = adjustmentForm.pbiId;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const existingAdjustments = (review?.backlogAdjustments ?? []).map((adj) => {
      const sanitized: Partial<BacklogAdjustment> = {
        action: adj.action,
        description: adj.description,
        reason: adj.reason,
        implemented: adj.implemented,
      };
      if (adj.pbiId) sanitized.pbiId = adj.pbiId;
      if (adj.id && uuidRegex.test(adj.id)) sanitized.id = adj.id;
      return sanitized;
    });

    updateReviewMutation.mutate(
      {
        backlogAdjustments: [...existingAdjustments, newAdjustment] as BacklogAdjustment[],
      },
      {
        onSuccess: () => {
          setShowAdjustmentForm(false);
          setAdjustmentForm(initialAdjustmentForm);
        },
      }
    );
  }, [validateAdjustmentForm, adjustmentForm, review?.backlogAdjustments, updateReviewMutation]);

  const handleCreateReview = useCallback(() => {
    setFormErrors({});

    if (!sprintId) {
      setFormErrors({ sprintId: t('createModal.failed') });
      return;
    }
    if (!createReviewData.reviewDate) {
      setFormErrors({ reviewDate: t('createModal.reviewDate').replace(' *', '') });
      return;
    }

    if (!increment) {
      setFormErrors({
        increment: t('createModal.incrementRequiredWarning'),
      });
      return;
    }

    createReviewMutation.mutate({
      sprintId,
      teamId: teamId ?? '',
      reviewDate: createReviewData.reviewDate,
      summary: createReviewData.summary,
    });
  }, [sprintId, createReviewData, increment, teamId, createReviewMutation, t]);

  const handleCompleteReview = useCallback(() => {
    if (!review?.id) {
      return;
    }
    if (updateReviewMutation.isPending) return;

    const errors: string[] = [];

    const attendeesList = review.attendees;
    if (attendeesList.length === 0) {
      errors.push(t('completeReview.confirmationModal.validationAttendees'));
    }

    const attendedCount = attendeesList.filter((a) => a.attended).length;
    if (attendeesList.length > 0 && attendedCount === 0) {
      errors.push(t('completeReview.confirmationModal.validationAttended'));
    }

    const markedMemberNames = new Set(
      attendeesList.map((a: ReviewAttendee) => a.name.toLowerCase())
    );
    const markedMemberEmails = new Set(
      attendeesList.map((a: ReviewAttendee) => a.email?.toLowerCase()).filter(Boolean)
    );

    const unmarkedTeamMembers = teamMembers.filter((member) => {
      const memberName = `${member.user?.firstName} ${member.user?.lastName}`.toLowerCase();
      const memberEmail = member.user?.email.toLowerCase();
      return (
        !markedMemberNames.has(memberName) && (!memberEmail || !markedMemberEmails.has(memberEmail))
      );
    });

    if (unmarkedTeamMembers.length > 0) {
      const unmarkedNames = unmarkedTeamMembers
        .slice(0, 3)
        .map((m) => `${m.user?.firstName} ${m.user?.lastName}`)
        .join(', ');
      const remaining =
        unmarkedTeamMembers.length > 3 ? ` and ${unmarkedTeamMembers.length - 3} more` : '';
      errors.push(
        t('completeReview.confirmationModal.validationTeamMembers', {
          names: unmarkedNames,
          remaining,
        })
      );
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowCompleteConfirmation(true);
      return;
    }

    setValidationErrors([]);
    setShowCompleteConfirmation(true);
  }, [review, teamMembers, updateReviewMutation.isPending, t]);

  const confirmCompleteReview = useCallback(() => {
    if (validationErrors.length > 0) {
      setShowCompleteConfirmation(false);
      return;
    }
    const updateData = {
      summary: review?.summary ?? t('completeReview.defaultSummary'),
      status: 'completed',
    };
    updateReviewMutation.mutate(updateData);
    setShowCompleteConfirmation(false);
  }, [updateReviewMutation, validationErrors, review?.summary, t]);

  const cancelCompleteReview = useCallback(() => {
    setShowCompleteConfirmation(false);
    setValidationErrors([]);
  }, []);

  // Tab keyboard navigation handler
  const handleTabKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const tabs = SECTION_TAB_IDS;
      const currentIndex = tabs.indexOf(activeSection);

      switch (e.key) {
        case 'ArrowRight': {
          const nextTab = tabs[(currentIndex + 1) % tabs.length];
          if (nextTab) setActiveSection(nextTab);
          break;
        }
        case 'ArrowLeft': {
          const prevTab = tabs[(currentIndex - 1 + tabs.length) % tabs.length];
          if (prevTab) setActiveSection(prevTab);
          break;
        }
        case 'Home':
          setActiveSection(tabs[0] ?? 'overview');
          break;
        case 'End':
          setActiveSection(tabs[tabs.length - 1] ?? 'overview');
          break;
      }
    },
    [activeSection]
  );

  const isLoading = isLoadingSprint || isLoadingReviews;

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (!sprintId) {
    return (
      <div className={styles['sprint-review-page']} data-testid="sprint-review">
        <div className={styles['review-header']}>
          <div className={styles['header-left']}>
            <button className={styles['back-button']} onClick={() => navigate('/sprint-review')}>
              <ArrowLeftIcon /> {t('backToReviews')}
            </button>
            <h1 className={styles['page-title']}>
              <FileTextIcon /> {t('title')}
            </h1>
          </div>
        </div>

        <div className={styles['active-sprint-selector']}>
          <h3>{t('selectSprint')}</h3>
          {isLoadingActiveSprint ? (
            <LoadingState variant="spinner" label={t('findingActiveSprint')} />
          ) : (
            <>
              {activeSprintData?.data ? (
                <div className={styles['active-sprint-card']}>
                  <div className={styles['sprint-card-header']}>
                    <span className={`${styles['sprint-status-badge']} ${styles['status-active']}`}>
                      <ClockIcon /> {t('activeSprint')}
                    </span>
                    <h4>{activeSprintData.data.name}</h4>
                  </div>
                  <div className={styles['sprint-card-details']}>
                    <div className={styles['detail-item']}>
                      <span className={styles['detail-label']}>{t('detailLabels.status')}</span>
                      <span className={styles['detail-value']}>
                        {activeSprintData.data.status.toUpperCase()}
                      </span>
                    </div>
                    <div className={styles['detail-item']}>
                      <span className={styles['detail-label']}>{t('detailLabels.startDate')}</span>
                      <span className={styles['detail-value']}>
                        {formatDate(activeSprintData.data.startDate)}
                      </span>
                    </div>
                    <div className={styles['detail-item']}>
                      <span className={styles['detail-label']}>{t('detailLabels.endDate')}</span>
                      <span className={styles['detail-value']}>
                        {formatDate(activeSprintData.data.endDate)}
                      </span>
                    </div>
                    {activeSprintData.data.sprintGoal && (
                      <div className={`${styles['detail-item']} ${styles['full-width']}`}>
                        <span className={styles['detail-label']}>
                          {t('detailLabels.sprintGoal')}
                        </span>
                        <span className={styles['detail-value']}>
                          {activeSprintData.data.sprintGoal}
                        </span>
                      </div>
                    )}
                  </div>
                  <button
                    className={`${styles.button} ${styles['button-primary']}`}
                    onClick={() => {
                      if (activeSprintData.data) {
                        setSprintId(activeSprintData.data.id);
                        setSearchParams({ sprintId: activeSprintData.data.id });
                      }
                    }}
                  >
                    {t('reviewThisSprint')}
                  </button>
                </div>
              ) : (
                <div className={styles['no-active-sprint']}>
                  <p>{t('noActiveSprint')}</p>
                  {allSprintsData?.data && allSprintsData.data.length > 0 && (
                    <div className={styles['sprint-list']}>
                      <h4>{t('availableSprints')}</h4>
                      {allSprintsData.data.map((s) => (
                        <div key={s.id} className={styles['sprint-item']}>
                          <div className={styles['sprint-item-info']}>
                            <span
                              className={`${styles['sprint-status-badge']} ${styles[s.status]}`}
                            >
                              {s.status.toUpperCase()}
                            </span>
                            <span className={styles['sprint-name']}>{s.name}</span>
                          </div>
                          <button
                            className={`${styles.button} ${styles['button-secondary']}`}
                            onClick={() => {
                              setSprintId(s.id);
                              setSearchParams({ sprintId: s.id });
                            }}
                          >
                            {t('select')}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingState variant="spinner" label={t('loading')} />;
  }

  if (isReviewsError) {
    return (
      <div className={styles['review-loading']}>
        <div className={styles['error-icon']}>
          <AlertTriangleIcon />
        </div>
        <p>{t('error.failedToLoad')}</p>
        <p className={styles['error-details']}>
          {reviewsError instanceof Error ? reviewsError.message : t('error.unknown')}
        </p>
        <button
          className={`${styles.button} ${styles['button-primary']}`}
          onClick={() => navigate('/sprint-review')}
          style={{ marginTop: '16px' }}
        >
          {t('backToReviews')}
        </button>
      </div>
    );
  }

  if (!review) {
    return (
      <div className={styles['sprint-review-page']}>
        <div className={styles['review-header']}>
          <div className={styles['header-left']}>
            <button className={styles['back-button']} onClick={() => navigate('/sprint-review')}>
              <ArrowLeftIcon /> {t('backToReviews')}
            </button>
            <h1 className={styles['page-title']}>
              <FileTextIcon /> {t('title')}
            </h1>
            <p className={styles['review-date']}>{sprint?.name ?? `Sprint ${sprintId}`}</p>
          </div>
        </div>

        <div className={styles['empty-state-container']}>
          <div className={styles['empty-state']}>
            <div className={styles['empty-icon']}>
              <FileTextIcon />
            </div>
            <h3>{t('noReview.title')}</h3>
            <p>{t('noReview.message')}</p>
            {!increment && (
              <div className={styles['increment-notice']}>
                <span className={styles['notice-icon']}>
                  <PackageIcon />
                </span>
                <div className={styles['notice-content']}>
                  <strong>{t('noReview.incrementRequired')}</strong>
                  <p>{t('noReview.incrementRequiredNotice')}</p>
                </div>
              </div>
            )}
            <div className={styles['empty-state-actions']}>
              {!increment && (
                <button
                  className={`${styles.button} ${styles['button-secondary']}`}
                  onClick={() => navigate('/increments')}
                >
                  {t('noReview.createIncrement')}
                </button>
              )}
              <button
                className={`${styles.button} ${styles['button-primary']}`}
                onClick={() => setShowCreateReviewModal(true)}
                disabled={!increment}
              >
                <FileTextIcon size={16} />
                {t('noReview.createSprintReview')}
              </button>
            </div>
          </div>
        </div>

        <CreateSprintReviewModal
          isOpen={showCreateReviewModal}
          onClose={() => {
            setShowCreateReviewModal(false);
            setFormErrors({});
          }}
          onSubmit={handleCreateReview}
          createReviewData={createReviewData}
          setCreateReviewData={setCreateReviewData}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          isPending={createReviewMutation.isPending}
          isError={createReviewMutation.isError}
          error={createReviewMutation.error as Error | null}
          hasIncrement={!!increment}
        />
      </div>
    );
  }

  return (
    <div className={styles['sprint-review-page']}>
      <div className={styles['review-header']}>
        <div className={styles['header-left']}>
          <button className={styles['back-button']} onClick={() => navigate('/sprint-review')}>
            <ArrowLeftIcon /> {t('backToReviews')}
          </button>
          <h1 className={styles['page-title']}>
            <FileTextIcon /> {t('title')}
          </h1>
          <p className={styles['review-date']}>{formatDate(review.reviewDate)}</p>
        </div>
        <div className={styles['header-actions']}>
          <span className={styles['attendee-count']}>
            {review.attendees.filter((a) => a.attended).length} / {review.attendees.length}{' '}
            {t('overview.attendees')}
          </span>
        </div>
      </div>

      <div className={styles['section-tabs']} role="tablist" aria-label={t('ariaLabels.sections')}>
        {SECTION_TABS.map((tab) => (
          <button
            key={tab.id}
            id={`${tab.id}-tab`}
            role="tab"
            aria-selected={activeSection === tab.id}
            aria-controls={`${tab.id}-panel`}
            tabIndex={activeSection === tab.id ? 0 : -1}
            className={`${styles['section-tab']} ${activeSection === tab.id ? styles.active : ''}`}
            onClick={() => setActiveSection(tab.id)}
            onKeyDown={handleTabKeyDown}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <main id="main-content" className={styles['review-content']}>
        {activeSection === 'overview' && (
          <div
            id="overview-panel"
            role="tabpanel"
            aria-labelledby="overview-tab"
            className={`${styles.section} ${styles['overview-section']}`}
          >
            <div className={styles['sprint-header-compact']}>
              <div className={styles['sprint-title-row']}>
                <h2 className={styles['sprint-name']}>{sprint?.name ?? t('unknownSprint')}</h2>
                <span
                  className={`${styles['sprint-status-badge']} ${styles[`status-${sprint?.status ?? 'unknown'}`] ?? ''}`}
                >
                  {sprint?.status === 'completed' ? <CheckIcon /> : <CircleIcon fill />}{' '}
                  {t(`list.statusLabels.${sprint?.status ?? 'unknown'}` as never)}
                </span>
              </div>
              <div className={styles['sprint-meta-row']}>
                <span className={styles['meta-item']}>
                  <span className={styles['meta-label']}>{t('overview.duration')}</span>
                  <span className={styles['meta-value']}>
                    {sprintDuration.workingDays} {t('overview.workingDays')}
                  </span>
                </span>
                <span className={styles['meta-separator']}>•</span>
                <span className={styles['meta-item']}>
                  <span className={styles['meta-label']}>{t('overview.period')}</span>
                  <span className={styles['meta-value']}>
                    {sprint?.startDate ? formatDate(sprint.startDate) : t('overview.notSet')} —{' '}
                    {sprint?.endDate ? formatDate(sprint.endDate) : t('overview.notSet')}
                  </span>
                </span>
              </div>
            </div>

            <div className={styles['overview-grid']}>
              <div className={`${styles['overview-card']} ${styles['sprint-goal-card']}`}>
                <h3>
                  <TargetIcon /> {t('overview.sprintGoal')}
                </h3>
                <p className={styles['sprint-goal-text']}>
                  {sprint?.sprintGoal ?? t('overview.noSprintGoal')}
                </p>
              </div>

              <div className={styles['overview-card']}>
                <h3>
                  <TrendingUpIcon /> {t('overview.sprintMetrics')}
                </h3>
                <div className={styles['stats-list']}>
                  <div className={styles['stat-row']}>
                    <span>{t('overview.storyPointsCommitted')}</span>
                    <strong>{sprintStats.committedStoryPoints}</strong>
                  </div>
                  <div className={styles['stat-row']}>
                    <span>{t('overview.storyPointsCompleted')}</span>
                    <strong className={styles.success}>{sprintStats.completedStoryPoints}</strong>
                  </div>
                  <div className={styles['stat-row']}>
                    <span>{t('overview.completionRate')}</span>
                    <strong className={styles.success}>{sprintStats.completionRate}%</strong>
                  </div>
                </div>
              </div>

              <div className={`${styles['overview-card']} ${styles['full-width']}`}>
                <h3>
                  <FileTextIcon /> {t('overview.reviewSummary')}
                </h3>
                <p>{review.summary ?? t('overview.noSummary')}</p>
              </div>
            </div>

            <AttendeesSection
              entityId={review.id || ''}
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- sprintId is guaranteed to be defined after the guard at line 653
              sprintId={sprintId!}
              attendees={review.attendees}
              teamMembers={teamMembers}
              isCompleted={isReviewCompleted}
              apiConfig={{
                addAttendee: (data: AttendeeFormData) =>
                  apiService.addAttendee(review.id || '', {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    attended: data.attended,
                  }),
                updateAttendee: (id: string, data: AttendeeFormData) =>
                  apiService.updateAttendee(id, {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    attended: data.attended,
                  }),
                deleteAttendee: (id: string) => apiService.deleteAttendee(id),
              }}
              queryKey={['sprint-reviews', teamId, sprintId]}
              defaultRole="stakeholder"
              onToggleAttendance={(attendeeId, attended) => {
                updateMutation.mutate({ attendeeId, attended });
              }}
              onAddTeamMember={(member, attended) => {
                addMutation.mutate({
                  name: `${member.user?.firstName ?? ''} ${member.user?.lastName ?? ''}`.trim(),
                  email: member.user?.email,
                  role: mapTeamRoleToAttendeeRole(member.role),
                  attended,
                });
              }}
              isAdding={addMutation.isPending}
              isUpdating={updateMutation.isPending}
            />
          </div>
        )}

        {activeSection === 'increment' && (
          <div
            id="increment-panel"
            role="tabpanel"
            aria-labelledby="increment-tab"
            className={`${styles.section} ${styles['increment-section']}`}
          >
            {increment ? (
              <div className={styles['increment-presentation']}>
                <div className={styles['increment-header']}>
                  <h3>
                    <PackageIcon /> {t('increment.title')}
                  </h3>
                  <span className={styles['increment-name']}>{increment.name}</span>
                </div>
                <p className={styles['increment-description']}>
                  {increment.description ?? t('increment.noDescription')}
                </p>

                <div className={styles['included-items']}>
                  <h4>{t('increment.includedPbis')}</h4>
                  <div className={styles['pbi-list']}>
                    {increment.pbis?.length === 0 ? (
                      <p className={styles['no-data']}>{t('increment.noPbis')}</p>
                    ) : (
                      increment.pbis?.map((pbi, index) => (
                        <div key={pbi.id || `pbi-${index}`} className={styles['pbi-card']}>
                          <span className={styles['pbi-title']}>{pbi.title}</span>
                          <span className={styles['pbi-points']}>{pbi.storyPoints ?? 0} pts</span>
                          <span className={`${styles['pbi-status']} ${styles.done}`}>
                            <CheckIcon /> {t('increment.done')}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className={styles['dod-verification']}>
                  <h4>{t('increment.dodVerification')}</h4>
                  <div className={styles['dod-status']}>
                    <span className={styles['dod-icon']}>
                      <CheckIcon />
                    </span>
                    <span>{t('increment.dodAllVerified')}</span>
                  </div>
                </div>

                <div className={styles['increment-stats']}>
                  <div className={styles['stat-item']}>
                    <span className={styles['stat-label']}>{t('increment.totalStoryPoints')}</span>
                    <span className={styles['stat-value']}>{increment.totalStoryPoints || 0}</span>
                  </div>
                  <div className={styles['stat-item']}>
                    <span className={styles['stat-label']}>{t('increment.deliveryMethod')}</span>
                    <span className={styles['stat-value']}>
                      {increment.deliveryMethod?.toLowerCase() ===
                      DeliveryMethod.SPRINT_REVIEW.toLowerCase() ? (
                        t('increment.sprintReviewDelivery')
                      ) : (
                        <>
                          <RocketIcon size={14} /> {t('increment.earlyReleaseDelivery')}
                        </>
                      )}
                    </span>
                  </div>
                  <div className={styles['stat-item']}>
                    <span className={styles['stat-label']}>{t('increment.deliveredAt')}</span>
                    <span className={styles['stat-value']}>
                      {increment.deliveredAt
                        ? formatDate(increment.deliveredAt)
                        : t('increment.notDelivered')}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles['empty-state-container']}>
                <div className={styles['empty-state']}>
                  <div className={styles['empty-icon']}>
                    <PackageIcon />
                  </div>
                  <h3>{t('increment.noIncrement')}</h3>
                  <p>{t('increment.noIncrementDescription')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'feedback' && (
          <div
            id="feedback-panel"
            role="tabpanel"
            aria-labelledby="feedback-tab"
            className={`${styles.section} ${styles['feedback-section']}`}
          >
            <div className={styles['section-header']}>
              <h3>
                <MessageSquareIcon /> {t('feedback.title')}
              </h3>
              <button
                className={`${styles.button} ${styles['button-primary']}`}
                onClick={() => setShowFeedbackForm(true)}
                disabled={isReviewCompleted}
                aria-disabled={isReviewCompleted}
                aria-label={
                  isReviewCompleted
                    ? `${t('feedback.addFeedback')} - disabled`
                    : t('feedback.addFeedback')
                }
                title={
                  isReviewCompleted ? t('completeReview.confirmationModal.cannotCompleteTitle') : ''
                }
              >
                <PlusIcon /> {t('feedback.addFeedback')}
              </button>
            </div>

            <div className={styles['feedback-list']}>
              {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- review data may be partial despite type */}
              {(review.feedback ?? []).length === 0 ? (
                <div className={styles['empty-feedback']}>
                  <p>{t('feedback.empty')}</p>
                </div>
              ) : (
                review.feedback.map((feedback, index) => {
                  const categoryColor = getCategoryColor(feedback.category);
                  return (
                    <div
                      key={feedback.id || `feedback-${index}`}
                      className={styles['feedback-card']}
                    >
                      <div className={styles['feedback-header']}>
                        <span
                          className={styles['feedback-category']}
                          style={{ backgroundColor: categoryColor.bg, color: categoryColor.text }}
                        >
                          {getCategoryIcon(feedback.category)} {feedback.category}
                        </span>
                        {feedback.actionRequired && !feedback.actionTaken && (
                          <span className={styles['action-required']}>
                            <AlertTriangleIcon /> {t('feedback.actionRequired')}
                          </span>
                        )}
                        {feedback.actionRequired && feedback.actionTaken && (
                          <span className={styles['action-taken']}>
                            <CheckIcon /> {t('feedback.actionTaken')}
                          </span>
                        )}
                      </div>
                      <p className={styles['feedback-content']}>{feedback.content}</p>
                      <span className={styles['feedback-author']}>
                        <UserIcon size={14} /> {feedback.authorName}
                      </span>
                      {feedback.actionRequired && !feedback.actionTaken && (
                        <BacklogHint message={t('feedback.backlogHint')} />
                      )}
                      {feedback.actionRequired && feedback.owner && (
                        <div className={styles['feedback-owner']}>
                          <span className={styles['owner-label']}>
                            <UsersIcon /> {t('feedback.owner')}
                          </span>
                          <span className={styles['owner-name']}>
                            {feedback.owner.firstName} {feedback.owner.lastName}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeSection === 'adjustments' && (
          <div
            id="adjustments-panel"
            role="tabpanel"
            aria-labelledby="adjustments-tab"
            className={`${styles.section} ${styles['adjustments-section']}`}
          >
            <div className={styles['section-header']}>
              <div>
                <h3>
                  <ListIcon /> {t('adjustments.title')}
                </h3>
                <p className={styles['section-subtitle']}>{t('adjustments.description')}</p>
              </div>
              <button
                className={`${styles.button} ${styles['button-primary']}`}
                onClick={() => setShowAdjustmentForm(true)}
                disabled={isReviewCompleted}
                aria-disabled={isReviewCompleted}
                aria-label={
                  isReviewCompleted
                    ? t('adjustments.addAdjustmentDisabled')
                    : t('adjustments.addAdjustment')
                }
                title={isReviewCompleted ? t('adjustments.cannotAddAdjustmentTitle') : ''}
              >
                <PlusIcon /> {t('adjustments.addAdjustment')}
              </button>
            </div>

            <div className={styles['adjustments-list']}>
              {/* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- review data may be partial despite type */}
              {(review.backlogAdjustments ?? []).length === 0 ? (
                <div className={styles['empty-adjustments']}>
                  <p>{t('adjustments.empty')}</p>
                </div>
              ) : (
                review.backlogAdjustments.map((adjustment, index) => (
                  <div
                    key={adjustment.id || `adj-${index}`}
                    className={`${styles['adjustment-card']} ${styles[adjustment.action]} ${adjustment.implemented ? styles.implemented : ''}`}
                  >
                    <div className={styles['adjustment-header']}>
                      <span className={styles['action-badge']}>
                        {adjustment.action === 'add' && (
                          <>
                            <PlusIcon /> {t('adjustments.actionTypes.add')}
                          </>
                        )}
                        {adjustment.action === 'modify' && (
                          <>
                            <EditIcon /> {t('adjustments.actionTypes.modify')}
                          </>
                        )}
                        {adjustment.action === 'remove' && (
                          <>
                            <TrashIcon /> {t('adjustments.actionTypes.remove')}
                          </>
                        )}
                        {adjustment.action === 'reorder' && (
                          <>
                            <RefreshCwIcon /> {t('adjustments.actionTypes.reorder')}
                          </>
                        )}
                        {adjustment.action === 'split' && (
                          <>
                            <ScissorsIcon /> {t('adjustments.actionTypes.split')}
                          </>
                        )}
                      </span>
                      <span
                        className={`${styles['status-badge']} ${adjustment.implemented ? styles.implemented : styles.pending}`}
                      >
                        {adjustment.implemented ? (
                          <>
                            <CheckIcon /> {t('adjustments.status.implemented')}
                          </>
                        ) : (
                          <>
                            <ClockIcon /> {t('adjustments.status.pending')}
                          </>
                        )}
                      </span>
                    </div>
                    <p className={styles['adjustment-description']}>{adjustment.description}</p>
                    <div className={styles['adjustment-reason']}>
                      <strong>{t('adjustments.reason')}</strong> {adjustment.reason}
                    </div>
                    {!adjustment.implemented && (
                      <BacklogHint message={t('adjustments.backlogHint')} />
                    )}
                    {adjustment.owner && (
                      <div className={styles['adjustment-owner']}>
                        <span className={styles['owner-label']}>
                          <UsersIcon /> {t('adjustments.owner')}
                        </span>
                        <span className={styles['owner-name']}>
                          {adjustment.owner.firstName} {adjustment.owner.lastName}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      <AddFeedbackModal
        isOpen={showFeedbackForm}
        onClose={() => {
          setShowFeedbackForm(false);
          setFormErrors({});
        }}
        onSubmit={handleAddFeedback}
        teamMembers={currentTeam.members}
        sprintBacklogItems={sprintBacklogItems}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        feedbackForm={feedbackForm}
        setFeedbackForm={setFeedbackForm}
        isPending={addFeedbackMutation.isPending}
      />

      <AddBacklogAdjustmentModal
        isOpen={showAdjustmentForm}
        onClose={() => {
          setShowAdjustmentForm(false);
          setFormErrors({});
        }}
        onSubmit={handleAddAdjustment}
        teamMembers={currentTeam.members}
        sprintBacklogItems={sprintBacklogItems}
        formErrors={formErrors}
        setFormErrors={setFormErrors}
        adjustmentForm={adjustmentForm}
        setAdjustmentForm={setAdjustmentForm}
        isPending={updateReviewMutation.isPending}
      />

      <div className={styles['review-actions']}>
        <button
          className={`${styles.button} ${styles['button-primary']} ${updateReviewMutation.isPending || review.status === 'completed' || isReviewCompleted ? styles['button-disabled'] : ''}`}
          onClick={handleCompleteReview}
          disabled={
            updateReviewMutation.isPending || review.status === 'completed' || isReviewCompleted
          }
          type="button"
        >
          {review.status === 'completed' || isReviewCompleted ? (
            <>
              <CheckIcon size={16} /> {t('completeReview.badge')}
            </>
          ) : updateReviewMutation.isPending ? (
            t('completeReview.completing')
          ) : (
            <>
              <CheckIcon size={16} /> {t('completeReview.button')}
            </>
          )}
        </button>
        {updateReviewMutation.isError && (
          <div className={styles['review-action-error']}>
            {t('completeReview.failed')}
            {updateReviewMutation.error instanceof Error && (
              <div className={styles['error-details']}>
                Error: {updateReviewMutation.error.message}
              </div>
            )}
          </div>
        )}
      </div>

      {showSuccessModal && (
        <div
          ref={successModalFocus.modalRef}
          className={styles['modal-overlay']}
          role="dialog"
          aria-modal="true"
          aria-labelledby="success-modal-title"
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles['modal-header']}>
              <h3 id="success-modal-title">{t('completeReview.successModal.title')}</h3>
              <button
                className={styles['close-button']}
                onClick={() => setShowSuccessModal(false)}
                aria-label={t('completeReview.confirmationModal.closeDialog')}
                type="button"
              >
                <XIcon />
              </button>
            </div>
            <div className={styles['modal-content']}>
              <div className={styles['success-message']}>
                <div className={styles['success-icon']}>
                  <CheckIcon />
                </div>
                <p>{t('completeReview.successModal.message')}</p>
              </div>
            </div>
            <div className={styles['modal-actions']}>
              <button
                className={`${styles.button} ${styles['button-primary']}`}
                onClick={() => setShowSuccessModal(false)}
              >
                {t('completeReview.successModal.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompleteConfirmation && (
        <div
          className={styles['modal-overlay']}
          role="dialog"
          aria-modal="true"
          aria-labelledby="complete-modal-title"
        >
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles['modal-header']}>
              <div className={styles['modal-header-content']}>
                <div className={styles['modal-icon-wrapper']}>
                  {validationErrors.length > 0 ? <AlertTriangleIcon /> : <CheckIcon />}
                </div>
                <h3 id="complete-modal-title">
                  {validationErrors.length > 0
                    ? t('completeReview.confirmationModal.cannotCompleteTitle')
                    : t('completeReview.confirmationModal.completeTitle')}
                </h3>
                <p className={styles['modal-subtitle']}>
                  {validationErrors.length > 0
                    ? t('completeReview.confirmationModal.cannotCompleteSubtitle')
                    : t('completeReview.confirmationModal.completeSubtitle')}
                </p>
              </div>
              <button
                className={styles['close-button']}
                onClick={cancelCompleteReview}
                aria-label={t('completeReview.confirmationModal.closeDialog')}
                type="button"
              >
                <XIcon />
              </button>
            </div>
            <div className={styles['modal-content']}>
              {validationErrors.length > 0 ? (
                <ul className={styles['validation-errors-list']}>
                  {validationErrors.map((error, index) => (
                    <li key={index} className={styles['validation-error-item']}>
                      <AlertTriangleIcon className={styles['error-icon']} />
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles['confirm-message']}>
                  {t('completeReview.confirmationModal.confirmation')}
                </p>
              )}
            </div>
            <div className={styles['modal-actions']}>
              {validationErrors.length > 0 ? (
                <button
                  className={`${styles.button} ${styles['button-primary']}`}
                  onClick={cancelCompleteReview}
                  type="button"
                >
                  <CheckIcon /> {t('completeReview.confirmationModal.gotIt')}
                </button>
              ) : (
                <>
                  <button
                    className={`${styles.button} ${styles['button-secondary']}`}
                    onClick={cancelCompleteReview}
                    type="button"
                  >
                    {t('completeReview.confirmationModal.cancel')}
                  </button>
                  <button
                    className={`${styles.button} ${styles['button-primary']}`}
                    onClick={confirmCompleteReview}
                    disabled={updateReviewMutation.isPending}
                    type="button"
                  >
                    {updateReviewMutation.isPending ? (
                      t('completeReview.completing')
                    ) : (
                      <>
                        <CheckIcon /> {t('completeReview.confirmationModal.complete')}
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
