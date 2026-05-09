import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../../services';
import { useTeamStore, useAuthStore } from '../../store';
import type { DailyUpdate, ApiResponse } from '../../types';
import { TeamMemberSelect } from '../../components/TeamMemberSelect/TeamMemberSelect';
import { LoadingState } from '../../components/common/Loading';
import { useModalFocus } from '../../hooks/useModalFocus';
import { queryKeys } from '../../hooks/queryKeys';
import {
  CheckCircleIcon,
  ClockIcon,
  AlertTriangleIcon,
  ChartIcon,
  SunIcon,
  EditIcon,
  TargetIcon,
  AlertCircleIcon,
  MessageCircleIcon,
  PlusIcon,
  XIcon,
  GridViewIcon as GridIcon,
  ListIcon,
  BellIcon,
  SaveIcon,
  CheckIcon,
  HourglassIcon,
  FlagIcon,
} from '../../components/common/Icons';
import { useFormDraft } from '../../hooks/useFormDraft';
import { CharacterCounter } from '../../components/common/Form/CharacterCounter';
import { Button } from '../../components/common/Button';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/common/ToastContainer';
import { EmptyState } from '../../components/EmptyState';
import { UnsavedChangesModal } from '../../components/common/Form/UnsavedChangesModal';

import styles from './DailyScrum.module.css';

const UPDATE_TEMPLATES = [
  {
    id: 'feature',
    label: 'Feature Development',
    yesterdayTemplate: 'Continued work on [feature name]:\n- ',
    todayTemplate: 'Continue development on [feature name]:\n- ',
  },
  {
    id: 'issuefix',
    label: 'Issue Fixing',
    yesterdayTemplate: 'Fixed issues:\n- ',
    todayTemplate: 'Continue fixing:\n- ',
  },
  {
    id: 'review',
    label: 'Review',
    yesterdayTemplate: 'Reviewed PRs:\n- ',
    todayTemplate: 'Continue reviewing:\n- ',
  },
  {
    id: 'meeting',
    label: 'Meetings',
    yesterdayTemplate: 'Attended meetings:\n- ',
    todayTemplate: 'Scheduled meetings:\n- ',
  },
];

interface TemplateSelectorProps {
  onSelectTemplate: (yesterdayTemplate: string, todayTemplate: string) => void;
  selectedTemplateId: string | null;
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  selectedTemplateId,
}) => {
  return (
    <div className={styles['template-selector']}>
      {UPDATE_TEMPLATES.map((template) => (
        <button
          key={template.id}
          type="button"
          className={`${styles['template-btn']} ${selectedTemplateId === template.id ? styles.active : ''}`}
          onClick={() => onSelectTemplate(template.yesterdayTemplate, template.todayTemplate)}
        >
          {template.label}
        </button>
      ))}
    </div>
  );
};

export const DailyScrum: React.FC = () => {
  const { currentTeam } = useTeamStore();
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const {
    toasts,
    success: showSuccessToast,
    error: showErrorToast,
    info: showInfoToast,
    removeToast,
  } = useToast();
  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [formData, setFormData] = useState({
    yesterdayWork: '',
    todayWork: '',
    impediment: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [failedSubmissionData, setFailedSubmissionData] = useState<typeof formData | null>(null);
  const [showRetryPrompt, setShowRetryPrompt] = useState(false);

  const {
    draft,
    hasDraft,
    saveDraft,
    clearDraft,
    showRestorePrompt,
    setShowRestorePrompt,
    lastSavedAt,
  } = useFormDraft({
    key: 'dailyscrum_draft_v1',
    initialData: formData,
    debounceMs: 1000,
    userId: currentUser?.id,
    dateKey: selectedDate,
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [expandedUpdate, setExpandedUpdate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'compact'>('card');
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [selectedUpdateForPromote, setSelectedUpdateForPromote] = useState<DailyUpdate | null>(
    null
  );
  const [promoteFormData, setPromoteFormData] = useState({
    title: '',
    description: '',
    ownerId: '',
    priority: 'Medium' as 'High' | 'Medium' | 'Low',
  });
  const [promoteFormErrors, setPromoteFormErrors] = useState<Record<string, string>>({});
  const hasAutoExpandedRef = useRef(false);
  const yesterdayWorkTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const hasScrolledToTopRef = useRef(false);
  const promoteModalTriggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (showUpdateForm && (formData.yesterdayWork || formData.todayWork || formData.impediment)) {
      saveDraft(formData);
    }
  }, [formData, showUpdateForm, saveDraft]);

  const handleRestoreDraft = useCallback(() => {
    if (draft) {
      setFormData(draft);
      setShowRestorePrompt(false);
    }
  }, [draft, setShowRestorePrompt]);

  const handleDismissRestorePrompt = useCallback(() => {
    setShowRestorePrompt(false);
    clearDraft();
  }, [setShowRestorePrompt, clearDraft]);

  // Check if promote form has unsaved changes
  const hasPromoteUnsavedChanges = useCallback((): boolean => {
    return (
      promoteFormData.title.trim().length > 0 ||
      promoteFormData.description.trim().length > 0 ||
      promoteFormData.ownerId !== '' ||
      promoteFormData.priority !== 'Medium'
    );
  }, [promoteFormData]);

  const handleClosePromoteModal = useCallback(() => {
    if (hasPromoteUnsavedChanges()) {
      setShowUnsavedModal(true);
    } else {
      setShowPromoteModal(false);
      setSelectedUpdateForPromote(null);
      setPromoteFormData({ title: '', description: '', ownerId: '', priority: 'Medium' });
      setPromoteFormErrors({});
    }
  }, [hasPromoteUnsavedChanges]);

  const handleUnsavedConfirm = useCallback(() => {
    setShowUnsavedModal(false);
    setShowPromoteModal(false);
    setSelectedUpdateForPromote(null);
    setPromoteFormData({ title: '', description: '', ownerId: '', priority: 'Medium' });
    setPromoteFormErrors({});
  }, []);

  const handleUnsavedCancel = useCallback(() => {
    setShowUnsavedModal(false);
  }, []);

  const { modalRef: promoteModalRef } = useModalFocus({
    isOpen: showPromoteModal,
    onClose: handleClosePromoteModal,
  });

  const teamId = currentTeam?.id;
  const teamMembers = currentTeam?.members ?? [];

  const { data: sprintData, isLoading: isSprintLoading } = useQuery({
    queryKey: ['activeSprint', teamId],
    queryFn: () => apiService.getActiveSprint(teamId ?? ''),
    enabled: !!teamId,
  });

  const sprint = sprintData?.data;

  const { data: updatesData, isLoading: isUpdatesLoading } = useQuery({
    queryKey: ['dailyUpdates', sprint?.id, selectedDate],
    queryFn: () => apiService.getDailyUpdates(sprint?.id ?? '', selectedDate),
    enabled: !!sprint?.id,
  });

  const isLoading = isSprintLoading || isUpdatesLoading;

  const { data: teamStatusData } = useQuery({
    queryKey: ['teamStatus', sprint?.id, selectedDate],
    queryFn: () => apiService.getTeamMembersWithUpdates(sprint?.id ?? '', selectedDate),
    enabled: !!sprint?.id,
  });

  const isNetworkError = (error: unknown): boolean => {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return (
        message.includes('network error') ||
        message.includes('failed to fetch') ||
        message.includes('networkerror') ||
        message.includes('timeout') ||
        message.includes('abort') ||
        !navigator.onLine
      );
    }
    return false;
  };

  const getErrorMessage = (error: unknown): string => {
    if (!navigator.onLine) {
      return 'You appear to be offline. Please check your internet connection and try again.';
    }
    if (isNetworkError(error)) {
      return 'A network error occurred. Please check your connection and try again.';
    }
    const axiosError = error as Error & {
      response?: { status: number; data?: { error?: { message: string } } };
    };
    if (axiosError.response?.status === 400 && axiosError.response.data?.error?.message) {
      return axiosError.response.data.error.message;
    }
    if (axiosError.response?.status === 401) {
      return 'Your session has expired. Please log in again.';
    }
    if (axiosError.response?.status === 403) {
      return 'You do not have permission to perform this action.';
    }
    if (axiosError.response?.status === 404) {
      return 'The requested resource was not found.';
    }
    if (axiosError.response?.status && axiosError.response.status >= 500) {
      return 'A server error occurred. Please try again later.';
    }
    return 'Failed to submit update. Please try again.';
  };

  const submitMutation = useMutation({
    mutationFn: (update: Partial<DailyUpdate>) =>
      apiService.createDailyUpdate(sprint?.id ?? '', update),
    onSuccess: () => {
      // Invalidate the specific daily updates query for the current sprint and date
      void queryClient.invalidateQueries({ queryKey: ['dailyUpdates', sprint?.id, selectedDate] });
      // Also invalidate team status queries
      void queryClient.invalidateQueries({ queryKey: ['teamStatus', sprint?.id, selectedDate] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.teamStatus.all });
      setShowUpdateForm(false);
      setFormData({ yesterdayWork: '', todayWork: '', impediment: '' });
      setFormErrors({});
      setSelectedTemplateId(null);
      setFailedSubmissionData(null);
      setShowRetryPrompt(false);
      clearDraft();
      showSuccessToast('Update submitted successfully!', 3000);
    },
    onError: (
      error: Error & { response?: { status: number; data?: { error?: { message: string } } } }
    ) => {
      setFailedSubmissionData(formData);
      setShowRetryPrompt(true);
      const errorMessage = getErrorMessage(error);
      showErrorToast(errorMessage, 5000);
    },
  });

  const handleRetrySubmit = () => {
    if (failedSubmissionData) {
      submitMutation.mutate(failedSubmissionData);
      setShowRetryPrompt(false);
    }
  };

  const handleDismissRetryPrompt = () => {
    setShowRetryPrompt(false);
  };

  const promoteImpedimentMutation = useMutation({
    mutationFn: ({
      dailyUpdateId,
      data,
    }: {
      dailyUpdateId: string;
      data: Parameters<typeof apiService.promoteToImpediment>[1];
    }) => apiService.promoteToImpediment(dailyUpdateId, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.dailyUpdate.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.impediment.all });
      setShowPromoteModal(false);
      setSelectedUpdateForPromote(null);
      setPromoteFormData({ title: '', description: '', ownerId: '', priority: 'Medium' });
      setPromoteFormErrors({});
      showSuccessToast('Impediment created successfully!', 3000);
    },
    onError: (
      error: Error & {
        response?: {
          status: number;
          data?: {
            error?: { message: string; details?: Array<{ field: string; message: string }> };
          };
        };
      }
    ) => {
      if (!navigator.onLine) {
        showErrorToast(
          'You appear to be offline. Please check your internet connection and try again.',
          5000
        );
        return;
      }
      if (isNetworkError(error)) {
        showErrorToast(
          'A network error occurred. Please check your connection and try again.',
          5000
        );
        return;
      }
      if (error.response?.data?.error?.details) {
        const errors: Record<string, string> = {};
        error.response.data.error.details.forEach((detail) => {
          errors[detail.field] = detail.message;
        });
        setPromoteFormErrors(errors);
      } else if (error.response?.data?.error?.message) {
        showErrorToast(error.response.data.error.message, 5000);
      } else if (error.response?.status === 401) {
        showErrorToast('Your session has expired. Please log in again.', 5000);
      } else if (error.response?.status === 403) {
        showErrorToast('You do not have permission to create impediments.', 5000);
      } else if (error.response?.status && error.response.status >= 500) {
        showErrorToast('A server error occurred. Please try again later.', 5000);
      } else {
        showErrorToast('Failed to create impediment. Please try again.', 5000);
      }
    },
  });

  const sendReminderMutation = useMutation({
    mutationFn: () => apiService.sendDailyUpdateReminder(sprint?.id ?? ''),
    onSuccess: (
      result: ApiResponse<{
        sentCount: number;
        totalPending: number;
        message: string;
        errors?: string[];
      }>
    ) => {
      if (result.data?.sentCount && result.data.sentCount > 0) {
        showSuccessToast(result.data.message, 3000);
      } else {
        showInfoToast(result.data?.message ?? 'No pending updates', 3000);
      }
    },
    onError: (error: Error) => {
      if (!navigator.onLine) {
        showErrorToast(
          'You appear to be offline. Please check your internet connection and try again.',
          5000
        );
        return;
      }
      if (isNetworkError(error)) {
        showErrorToast(
          'A network error occurred. Please check your connection and try again.',
          5000
        );
        return;
      }
      const axiosError = error as Error & { response?: { status: number } };
      if (axiosError.response?.status === 401) {
        showErrorToast('Your session has expired. Please log in again.', 5000);
      } else if (axiosError.response?.status === 403) {
        showErrorToast('You do not have permission to send reminders.', 5000);
      } else if (axiosError.response?.status && axiosError.response.status >= 500) {
        showErrorToast('A server error occurred. Please try again later.', 5000);
      } else {
        showErrorToast('Failed to send reminder. Please try again.', 5000);
      }
    },
  });

  const handleSendReminder = async () => {
    if (!sprint?.id) {
      return;
    }

    sendReminderMutation.mutate();
  };

  const validatePromoteForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!promoteFormData.title.trim()) {
      errors.title = 'Title is required';
    } else if (promoteFormData.title.trim().length < 3) {
      errors.title = 'Title must be at least 3 characters';
    }

    if (!promoteFormData.description.trim()) {
      errors.description = 'Description is required';
    } else if (promoteFormData.description.trim().length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    setPromoteFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSelectTemplate = (yesterdayTemplate: string, todayTemplate: string) => {
    const template = UPDATE_TEMPLATES.find((t) => t.yesterdayTemplate === yesterdayTemplate);
    if (template) {
      setSelectedTemplateId(template.id);
    }
    setFormData({
      ...formData,
      yesterdayWork: yesterdayTemplate,
      todayWork: todayTemplate,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitMutation.mutate(formData);
  };

  const handlePromoteImpediment = useCallback(
    (update: DailyUpdate, triggerElement?: HTMLElement) => {
      if (triggerElement) {
        promoteModalTriggerRef.current = triggerElement;
      }
      setSelectedUpdateForPromote(update);
      setPromoteFormData({
        title: update.impediment?.slice(0, 100) ?? '',
        description: update.impediment ?? '',
        ownerId: '',
        priority: 'Medium',
      });
      setPromoteFormErrors({});
      setShowPromoteModal(true);
    },
    []
  );

  const handlePromoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUpdateForPromote || !teamId) return;

    if (!validatePromoteForm()) return;

    promoteImpedimentMutation.mutate({
      dailyUpdateId: selectedUpdateForPromote.id,
      data: {
        title: promoteFormData.title,
        description: promoteFormData.description,
        ownerId: promoteFormData.ownerId || undefined,
        priority: promoteFormData.priority,
        teamId,
        sprintId: sprint?.id,
      },
    });
  };

  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayDate = () => formatLocalDate(new Date());
  const isToday = selectedDate === getTodayDate();
  const updates = useMemo(() => updatesData?.data ?? [], [updatesData?.data]);
  const pendingMembers = useMemo(
    () => teamStatusData?.data?.pending ?? [],
    [teamStatusData?.data?.pending]
  );

  const userHasSubmittedToday = useMemo(() => {
    if (!currentUser || !isToday) return false;
    return updates.some((update) => update.userId === currentUser.id);
  }, [updates, currentUser, isToday]);

  // Scroll to top on initial page load
  useEffect(() => {
    if (!hasScrolledToTopRef.current) {
      hasScrolledToTopRef.current = true;
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

  useEffect(() => {
    if (hasAutoExpandedRef.current) return;
    if (!isToday || !currentUser) return;

    if (!userHasSubmittedToday && !showUpdateForm) {
      hasAutoExpandedRef.current = true;
      setShowUpdateForm(true);
      // Delay focus to allow scroll-to-top to complete first
      setTimeout(() => {
        yesterdayWorkTextareaRef.current?.focus({ preventScroll: true });
      }, 150);
    }

    if (userHasSubmittedToday && showUpdateForm) {
      setShowUpdateForm(false);
    }
  }, [selectedDate, updates, currentUser, isToday, showUpdateForm, userHasSubmittedToday]);

  const stats = useMemo(() => {
    const totalMembers = currentTeam?.members?.length ?? 5;
    const submitted = updates.length;
    const impediments = updates.filter((u) => u.impediment && u.impediment !== 'None').length;
    const participation = totalMembers > 0 ? Math.round((submitted / totalMembers) * 100) : 0;

    return { totalMembers, submitted, impediments, participation };
  }, [updates, currentTeam?.members?.length]);

  const handleToggleExpand = useCallback((updateId: string) => {
    setExpandedUpdate((prev) => (prev === updateId ? null : updateId));
  }, []);

  const handleNavigateToImpediment = useCallback(
    (impedimentId: string) => {
      void navigate(`/impediments?id=${impedimentId}`);
    },
    [navigate]
  );

  const recentDates = useMemo(() => {
    const dates: { date: string; label: string; isToday: boolean }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push({
        date: formatLocalDate(d),
        label:
          i === 0
            ? 'Today'
            : i === 1
              ? 'Yesterday'
              : d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        isToday: i === 0,
      });
    }
    return dates;
  }, []);

  if (isLoading) {
    return (
      <div className={styles['daily-scrum']}>
        <div className={styles['daily-scrum-header']}>
          <div className={styles['header-left']}>
            <LoadingState
              variant="skeleton-text"
              lines={2}
              lastLineWidth="90%"
              label="Loading page header..."
            />
          </div>
          <div className={styles['header-right']}>
            <LoadingState
              variant="skeleton-text"
              lines={1}
              lastLineWidth="100%"
              label="Loading actions..."
            />
          </div>
        </div>

        <div className={styles['daily-scrum-stats-bar']}>
          <LoadingState
            variant="skeleton-card"
            cardVariant="stats"
            itemCount={4}
            label="Loading statistics..."
          />
        </div>

        <div className={styles['scrum-content']}>
          <div className={styles['updates-section']}>
            <div className={styles['section-header']}>
              <LoadingState
                variant="skeleton-text"
                lines={2}
                lastLineWidth="75%"
                label="Loading section header..."
              />
            </div>
            <div className={styles['updates-list-card']}>
              <LoadingState variant="skeleton-card" itemCount={3} label="Loading team updates..." />
            </div>
          </div>

          <div className={styles['sidebar-section']}>
            <div className={styles['pending-members-card']}>
              <LoadingState
                variant="skeleton-list"
                itemCount={2}
                label="Loading pending members..."
              />
            </div>

            <div className={styles['sprint-progress-card']}>
              <LoadingState
                variant="skeleton-card"
                itemCount={1}
                label="Loading sprint progress..."
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (!sprint) {
    return <EmptyState type="no-active-sprint" variant="full-page" />;
  }

  return (
    <>
      <div className={styles['daily-scrum']} data-testid="daily-scrum">
        <div className={styles['daily-scrum-header']}>
          <div className={styles['header-left']}>
            <h1 className={styles['page-title']}>
              <SunIcon size={28} />
              Daily Scrum
            </h1>
            <p className={styles['page-subtitle']}>
              {sprint.name} • Day {getSprintDay(sprint)}
            </p>
          </div>
          <div className={styles['header-right']}>
            <div className={styles['view-toggle']} role="group" aria-label="View mode">
              <button
                className={`${styles['toggle-btn']} ${viewMode === 'card' ? styles.active : ''}`}
                onClick={() => setViewMode('card')}
                aria-pressed={viewMode === 'card'}
              >
                <span className={styles['toggle-icon']} aria-hidden="true">
                  <GridIcon size={16} />
                </span>
                <span className={styles['toggle-label']}>Cards</span>
              </button>
              <button
                className={`${styles['toggle-btn']} ${viewMode === 'compact' ? styles.active : ''}`}
                onClick={() => setViewMode('compact')}
                aria-pressed={viewMode === 'compact'}
              >
                <span className={styles['toggle-icon']} aria-hidden="true">
                  <ListIcon size={16} />
                </span>
                <span className={styles['toggle-label']}>List</span>
              </button>
            </div>
            <div className={styles['date-picker-container']}>
              <label htmlFor="scrum-date" className={styles['visually-hidden']}>
                Select date for daily updates
              </label>
              <input
                type="date"
                id="scrum-date"
                className={styles['date-picker']}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={getTodayDate()}
                aria-label="Select date for daily updates"
              />
            </div>
            {isToday && !showUpdateForm && !userHasSubmittedToday && (
              <Button variant="primary" onClick={() => setShowUpdateForm(true)}>
                <PlusIcon size={16} />
                Submit Update
              </Button>
            )}
          </div>
        </div>

        <div className={styles['daily-scrum-sprint-goal-banner']}>
          <div className={styles['daily-scrum-sprint-goal-container']}>
            <div className={styles['daily-scrum-sprint-goal-icon']}>
              <TargetIcon size={28} />
            </div>
            <div className={styles['daily-scrum-sprint-goal-content']}>
              <span className={styles['daily-scrum-sprint-goal-label']}>Sprint Goal</span>
              {sprint.sprintGoal ? (
                <p className={styles['daily-scrum-sprint-goal-text']}>{sprint.sprintGoal}</p>
              ) : (
                <p
                  className={`${styles['daily-scrum-sprint-goal-text']} ${styles['daily-scrum-sprint-goal-empty']}`}
                >
                  No sprint goal defined.
                  <button
                    className={styles['daily-scrum-sprint-goal-link']}
                    onClick={() => navigate('/sprint-planning')}
                  >
                    Add one in Sprint Planning
                  </button>
                </p>
              )}
            </div>
            <div className={styles['daily-scrum-sprint-goal-progress']}>
              <div className={styles['daily-scrum-progress-ring']}>
                {/* eslint-disable-next-line icon-rules/no-inline-svg -- Progress ring visualization, not an icon */}
                <svg viewBox="0 0 36 36">
                  <path
                    className={styles['daily-scrum-progress-ring-bg']}
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={styles['daily-scrum-progress-ring-fill']}
                    strokeDasharray={`${(getSprintDay(sprint) / getTotalSprintDays(sprint)) * 100}, 100`}
                    d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className={styles['daily-scrum-progress-text']}>
                  {Math.round((getSprintDay(sprint) / getTotalSprintDays(sprint)) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles['quick-dates']}>
          {recentDates.map((d) => (
            <button
              key={d.date}
              className={`${styles['quick-date-btn']} ${selectedDate === d.date ? styles.active : ''} ${d.isToday ? styles.today : ''}`}
              onClick={() => setSelectedDate(d.date)}
              aria-current={selectedDate === d.date ? 'date' : undefined}
            >
              {d.label}
            </button>
          ))}
        </div>

        <div className={styles['daily-scrum-stats-bar']}>
          <div className={styles['daily-scrum-stat-item']}>
            <div className={`${styles['daily-scrum-stat-icon']} ${styles.submitted}`}>
              <CheckCircleIcon size={20} />
            </div>
            <div className={styles['daily-scrum-stat-content']}>
              <span className={styles['daily-scrum-stat-value']}>{stats.submitted}</span>
              <span className={styles['daily-scrum-stat-label']}>Submitted</span>
            </div>
          </div>
          <div className={styles['daily-scrum-stat-item']}>
            <div className={`${styles['daily-scrum-stat-icon']} ${styles.pending}`}>
              <ClockIcon size={20} />
            </div>
            <div className={styles['daily-scrum-stat-content']}>
              <span className={styles['daily-scrum-stat-value']}>{pendingMembers.length}</span>
              <span className={styles['daily-scrum-stat-label']}>Pending</span>
            </div>
          </div>
          <div className={styles['daily-scrum-stat-item']}>
            <div className={`${styles['daily-scrum-stat-icon']} ${styles.impediments}`}>
              <AlertTriangleIcon size={20} />
            </div>
            <div className={styles['daily-scrum-stat-content']}>
              <span className={styles['daily-scrum-stat-value']}>{stats.impediments}</span>
              <span className={styles['daily-scrum-stat-label']}>Impediments</span>
            </div>
          </div>
          <div className={`${styles['daily-scrum-stat-item']} ${styles.participation}`}>
            <div className={styles['daily-scrum-stat-icon']}>
              <ChartIcon size={20} />
            </div>
            <div className={styles['daily-scrum-stat-content']}>
              <span className={styles['daily-scrum-stat-value']}>{stats.participation}%</span>
              <span className={styles['daily-scrum-stat-label']}>Participation</span>
            </div>
            <div className={styles['participation-bar']}>
              <div
                className={styles['participation-fill']}
                style={{ width: `${stats.participation}%` }}
              />
            </div>
          </div>
        </div>

        <div className={styles['scrum-content']}>
          <div className={styles['updates-section']}>
            <div className={styles['section-header']}>
              <h2 className={styles['section-title']}>
                <EditIcon size={20} />
                Team Updates
                <span className={styles['update-count']}>{updates.length}</span>
              </h2>
              <span className={styles['date-display']}>
                {new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>

            {showUpdateForm && isToday && !userHasSubmittedToday && (
              <div className={styles['update-form-card']}>
                <div className={styles['form-header']}>
                  <h3>
                    <EditIcon size={18} />
                    Your Daily Update
                  </h3>
                  <button
                    className={styles['close-button']}
                    onClick={() => setShowUpdateForm(false)}
                    aria-label="Close form"
                  >
                    <XIcon size={20} />
                  </button>
                </div>

                {showRestorePrompt && hasDraft && (
                  <div className={styles['draft-restore-banner']}>
                    <div className={styles['draft-restore-content']}>
                      <span className={styles['draft-restore-icon']}>
                        <SaveIcon size={20} />
                      </span>
                      <div className={styles['draft-restore-text']}>
                        <strong>Unsaved Draft Found</strong>
                        <p>Would you like to restore your previous draft?</p>
                      </div>
                    </div>
                    <div className={styles['draft-restore-actions']}>
                      <button
                        type="button"
                        className={`${styles.button} ${styles['button-secondary']}`}
                        onClick={handleDismissRestorePrompt}
                      >
                        <XIcon size={16} />
                        Discard
                      </button>
                      <button
                        type="button"
                        className={`${styles.button} ${styles['button-primary']}`}
                        onClick={handleRestoreDraft}
                      >
                        <SaveIcon size={16} />
                        Restore Draft
                      </button>
                    </div>
                  </div>
                )}

                {showRetryPrompt && failedSubmissionData && (
                  <div className={styles['retry-banner']}>
                    <div className={styles['retry-banner-content']}>
                      <span className={styles['retry-banner-icon']}>
                        <AlertCircleIcon size={20} />
                      </span>
                      <div className={styles['retry-banner-text']}>
                        <strong>Submission Failed</strong>
                        <p>Your update could not be submitted. Your data has been preserved.</p>
                      </div>
                    </div>
                    <div className={styles['retry-banner-actions']}>
                      <button
                        type="button"
                        className={`${styles.button} ${styles['button-secondary']}`}
                        onClick={handleDismissRetryPrompt}
                      >
                        <XIcon size={16} />
                        Dismiss
                      </button>
                      <button
                        type="button"
                        className={`${styles.button} ${styles['button-primary']}`}
                        onClick={handleRetrySubmit}
                        disabled={submitMutation.isPending}
                      >
                        <CheckIcon size={16} />
                        {submitMutation.isPending ? 'Retrying...' : 'Retry Submission'}
                      </button>
                    </div>
                  </div>
                )}

                <TemplateSelector
                  onSelectTemplate={handleSelectTemplate}
                  selectedTemplateId={selectedTemplateId}
                />
                <form onSubmit={handleSubmit} className={styles['daily-update-form']}>
                  <div
                    className={`${styles['form-group']} ${formErrors.yesterdayWork ? styles['has-error'] : ''} ${formData.yesterdayWork.length > 900 ? styles['has-warning'] : ''}`}
                  >
                    <label htmlFor="yesterday-work">
                      What did you do yesterday to help team meet the sprint goal?
                    </label>
                    <textarea
                      ref={yesterdayWorkTextareaRef}
                      id="yesterday-work"
                      name="yesterday-work"
                      rows={3}
                      maxLength={1000}
                      placeholder="Describe what you accomplished yesterday..."
                      value={formData.yesterdayWork}
                      onChange={(e) => {
                        setFormData({ ...formData, yesterdayWork: e.target.value });
                        if (formErrors.yesterdayWork) {
                          setFormErrors({ ...formErrors, yesterdayWork: '' });
                        }
                      }}
                      aria-describedby={
                        formErrors.yesterdayWork
                          ? 'yesterday-work-error yesterday-work-count'
                          : 'yesterday-work-count'
                      }
                      aria-invalid={!!formErrors.yesterdayWork}
                      required
                    />
                    <div className={styles['textarea-footer']}>
                      {formErrors.yesterdayWork && (
                        <span
                          id="yesterday-work-error"
                          className={styles['error-message']}
                          role="alert"
                        >
                          {formErrors.yesterdayWork}
                        </span>
                      )}
                      <CharacterCounter
                        id="yesterday-work-count"
                        current={formData.yesterdayWork.length}
                        max={1000}
                      />
                    </div>
                  </div>
                  <div
                    className={`${styles['form-group']} ${formErrors.todayWork ? styles['has-error'] : ''} ${formData.todayWork.length > 900 ? styles['has-warning'] : ''}`}
                  >
                    <label htmlFor="today-work">
                      What will you do today to help team meet the sprint goal?
                    </label>
                    <textarea
                      id="today-work"
                      name="today-work"
                      rows={3}
                      maxLength={1000}
                      placeholder="Describe what you plan to work on today..."
                      value={formData.todayWork}
                      onChange={(e) => {
                        setFormData({ ...formData, todayWork: e.target.value });
                        if (formErrors.todayWork) {
                          setFormErrors({ ...formErrors, todayWork: '' });
                        }
                      }}
                      aria-describedby={
                        formErrors.todayWork
                          ? 'today-work-error today-work-count'
                          : 'today-work-count'
                      }
                      aria-invalid={!!formErrors.todayWork}
                      required
                    />
                    <div className={styles['textarea-footer']}>
                      {formErrors.todayWork && (
                        <span
                          id="today-work-error"
                          className={styles['error-message']}
                          role="alert"
                        >
                          {formErrors.todayWork}
                        </span>
                      )}
                      <CharacterCounter
                        id="today-work-count"
                        current={formData.todayWork.length}
                        max={1000}
                      />
                    </div>
                  </div>
                  <div
                    className={`${styles['form-group']} ${formData.impediment.length > 900 ? styles['has-warning'] : ''}`}
                  >
                    <label htmlFor="impediment">Any impediments? (optional)</label>
                    <textarea
                      id="impediment"
                      name="impediment"
                      rows={2}
                      maxLength={1000}
                      placeholder="Describe any blockers or impediments..."
                      value={formData.impediment}
                      onChange={(e) => setFormData({ ...formData, impediment: e.target.value })}
                      aria-describedby={
                        formData.impediment && formData.impediment !== 'None'
                          ? 'impediment-hint impediment-count'
                          : 'impediment-count'
                      }
                    />
                    <div className={styles['textarea-footer']}>
                      {formData.impediment && formData.impediment !== 'None' && (
                        <div id="impediment-hint" className={styles['impediment-hint']}>
                          This impediment will be tracked and can be promoted to a formal impediment
                          record
                        </div>
                      )}
                      <CharacterCounter
                        id="impediment-count"
                        current={formData.impediment.length}
                        max={1000}
                      />
                    </div>
                  </div>
                  <div className={styles['form-actions']}>
                    <div className={styles['draft-indicator']}>
                      {lastSavedAt && (
                        <span className={styles['draft-saved-text']}>
                          <CheckIcon size={14} />
                          Draft saved {formatTimeSince(lastSavedAt)}
                        </span>
                      )}
                    </div>
                    <div className={styles['form-buttons']}>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowUpdateForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="primary" loading={submitMutation.isPending}>
                        <CheckIcon size={16} />
                        Submit Update
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {updates.length > 0 ? (
              <div
                className={`${styles['updates-list-card']} ${styles[`updates-list-${viewMode}`]}`}
              >
                {updates.map((update) => (
                  <UpdateCard
                    key={update.id}
                    update={update}
                    viewMode={viewMode}
                    isExpanded={expandedUpdate === update.id}
                    onToggleExpand={() => handleToggleExpand(update.id)}
                    onPromoteImpediment={handlePromoteImpediment}
                    onNavigateToImpediment={handleNavigateToImpediment}
                  />
                ))}
              </div>
            ) : (
              <div className={styles['no-updates']}>
                <div className={styles['empty-state']}>
                  <span className={styles['empty-icon']}>
                    <MessageCircleIcon size={48} />
                  </span>
                  <h3>No Updates Yet</h3>
                  <p>
                    {isToday
                      ? 'Be the first to submit your daily update!'
                      : 'No team updates for this date.'}
                  </p>
                  {isToday && !showUpdateForm && !userHasSubmittedToday && (
                    <Button variant="primary" onClick={() => setShowUpdateForm(true)}>
                      <PlusIcon size={16} />
                      Submit Update
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className={styles['sidebar-section']}>
            {pendingMembers.length > 0 && (
              <div className={`${styles['pending-members-card']} ${styles['pending-highlight']}`}>
                <h3 className={styles['card-title']}>
                  <span className={styles.icon}>
                    <HourglassIcon size={20} />
                  </span>
                  Waiting for Updates
                  <span className={styles.count}>{pendingMembers.length}</span>
                </h3>
                <div className={styles['pending-list']}>
                  {pendingMembers.map((member) => (
                    <div key={member.userId} className={styles['pending-member']}>
                      <div className={styles['member-avatar']}>
                        {member.userName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                      <span className={styles['member-name']}>{member.userName}</span>
                    </div>
                  ))}
                </div>
                <Button
                  variant="secondary"
                  className={styles['full-width']}
                  onClick={handleSendReminder}
                  disabled={pendingMembers.length === 0}
                  loading={sendReminderMutation.isPending}
                >
                  <BellIcon size={16} />
                  Send Reminder
                </Button>
              </div>
            )}

            {stats.impediments > 0 && (
              <div className={styles['impediments-summary-card']}>
                <h3 className={styles['card-title']}>
                  <span className={styles.icon}>
                    <AlertCircleIcon size={20} />
                  </span>
                  Active Impediments
                  <span className={styles.count}>{stats.impediments}</span>
                </h3>
                <div className={styles['impediment-list']}>
                  {updates
                    .filter((u) => u.impediment && u.impediment !== 'None')
                    .slice(0, 3)
                    .map((update) => (
                      <div key={update.id} className={styles['impediment-item']}>
                        <div className={styles['impediment-header']}>
                          <span className={styles.reporter}>
                            {update.user?.firstName} {update.user?.lastName}
                          </span>
                          {update.impedimentRecord?.id && (
                            <span
                              className={styles['tracked-badge']}
                              title="Tracked as formal impediment"
                            >
                              <CheckIcon size={12} />
                              Tracked
                            </span>
                          )}
                        </div>
                        <p className={styles['impediment-text']}>{update.impediment}</p>
                        {update.impedimentRecord?.id ? (
                          <Button
                            variant="link"
                            onClick={() =>
                              navigate(`/impediments?id=${update.impedimentRecord?.id}`)
                            }
                          >
                            View Details
                          </Button>
                        ) : (
                          <Button variant="link" onClick={() => handlePromoteImpediment(update)}>
                            <AlertCircleIcon size={14} />
                            Track as Impediment
                          </Button>
                        )}
                      </div>
                    ))}
                </div>
                {stats.impediments > 3 && (
                  <Button variant="link" onClick={() => navigate('/impediments')}>
                    View all {stats.impediments} impediments
                  </Button>
                )}
              </div>
            )}

            <div className={styles['sprint-progress-card']}>
              <h3 className={styles['card-title']}>
                <span className={styles.icon}>
                  <FlagIcon size={20} />
                </span>
                Sprint Progress
              </h3>
              <div className={styles['sprint-info']}>
                <span className={styles['sprint-name']}>{sprint.name}</span>
                <span className={styles['sprint-dates']}>
                  {new Date(sprint.startDate).toLocaleDateString()} -{' '}
                  {new Date(sprint.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className={styles['sprint-days']}>
                <span className={styles['days-label']}>
                  Day {getSprintDay(sprint)} of {getTotalSprintDays(sprint)}
                </span>
                <div className={styles['days-bar']}>
                  <div
                    className={styles['days-fill']}
                    style={{
                      width: `${(getSprintDay(sprint) / getTotalSprintDays(sprint)) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <Button variant="link" onClick={() => navigate('/sprint')}>
                View Sprint Board
              </Button>
            </div>
          </div>
        </div>

        {showPromoteModal && selectedUpdateForPromote && (
          <div
            className={styles['modal-overlay']}
            onClick={handleClosePromoteModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="promote-modal-title"
          >
            <div
              ref={promoteModalRef}
              className={`${styles.modal} ${styles['promote-modal']}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles['modal-header']}>
                <h2 id="promote-modal-title">
                  <AlertCircleIcon size={20} />
                  Create Impediment from Daily Update
                </h2>
                <button className={styles['modal-close']} onClick={handleClosePromoteModal}>
                  <XIcon size={24} />
                </button>
              </div>
              <div className={styles['modal-body']}>
                <div className={styles['source-context']}>
                  <div className={styles['context-label']}>From Daily Update by:</div>
                  <div className={styles['context-value']}>
                    {selectedUpdateForPromote.user?.firstName}{' '}
                    {selectedUpdateForPromote.user?.lastName}
                  </div>
                  <div className={styles['context-label']}>Original Impediment Text:</div>
                  <div className={styles['context-text']}>
                    {selectedUpdateForPromote.impediment}
                  </div>
                </div>
                <form onSubmit={handlePromoteSubmit} className={styles['promote-form']}>
                  <div className={styles['form-group']}>
                    <label>
                      Title <span className={styles['required-indicator']}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Brief title for the impediment"
                      value={promoteFormData.title}
                      onChange={(e) => {
                        setPromoteFormData({ ...promoteFormData, title: e.target.value });
                        if (promoteFormErrors.title) {
                          setPromoteFormErrors({ ...promoteFormErrors, title: '' });
                        }
                      }}
                      className={promoteFormErrors.title ? styles.error : ''}
                      required
                    />
                    {promoteFormErrors.title && (
                      <span className={styles['error-message']}>{promoteFormErrors.title}</span>
                    )}
                  </div>
                  <div className={styles['form-group']}>
                    <label>
                      Description <span className={styles['required-indicator']}>*</span>
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Detailed description of the impediment"
                      value={promoteFormData.description}
                      onChange={(e) => {
                        setPromoteFormData({ ...promoteFormData, description: e.target.value });
                        if (promoteFormErrors.description) {
                          setPromoteFormErrors({ ...promoteFormErrors, description: '' });
                        }
                      }}
                      className={promoteFormErrors.description ? styles.error : ''}
                      required
                    />
                    {promoteFormErrors.description && (
                      <span className={styles['error-message']}>
                        {promoteFormErrors.description}
                      </span>
                    )}
                  </div>
                  <div className={styles['form-row']}>
                    <TeamMemberSelect
                      value={promoteFormData.ownerId}
                      onChange={(value) =>
                        setPromoteFormData({ ...promoteFormData, ownerId: value })
                      }
                      teamMembers={teamMembers}
                      disabled={promoteImpedimentMutation.isPending}
                    />
                    <div className={styles['form-group']}>
                      <label>Priority</label>
                      <select
                        value={promoteFormData.priority}
                        onChange={(e) =>
                          setPromoteFormData({
                            ...promoteFormData,
                            priority: e.target.value as 'High' | 'Medium' | 'Low',
                          })
                        }
                        disabled={promoteImpedimentMutation.isPending}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>
                </form>
              </div>
              <div className={styles['modal-footer']}>
                <Button variant="secondary" onClick={handleClosePromoteModal}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePromoteSubmit}
                  disabled={!promoteFormData.title.trim() || !promoteFormData.description.trim()}
                  loading={promoteImpedimentMutation.isPending}
                >
                  <AlertCircleIcon size={16} />
                  Create Impediment
                </Button>
              </div>
            </div>
          </div>
        )}

        <UnsavedChangesModal
          isOpen={showUnsavedModal}
          onConfirm={handleUnsavedConfirm}
          onCancel={handleUnsavedCancel}
          title="Unsaved Changes"
          message="You have unsaved changes in the impediment form. Are you sure you want to discard them?"
        />

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </>
  );
};

interface UpdateCardProps {
  update: DailyUpdate;
  viewMode: 'card' | 'compact';
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPromoteImpediment: (update: DailyUpdate, triggerElement?: HTMLElement) => void;
  onNavigateToImpediment: (impedimentId: string) => void;
}

const UpdateCard: React.FC<UpdateCardProps> = React.memo(
  ({
    update,
    viewMode,
    isExpanded,
    onToggleExpand,
    onPromoteImpediment,
    onNavigateToImpediment,
  }) => {
    const hasImpediment = update.impediment && update.impediment !== 'None';
    const hasTrackedImpediment = !!update.impedimentRecord?.id;

    const getImpedimentStatusBadge = () => {
      if (!hasTrackedImpediment) return null;

      const status = update.impedimentRecord?.status;
      const statusColors: Record<string, { bg: string; color: string }> = {
        OPEN: { bg: 'var(--color-error-100)', color: 'var(--color-error-600)' },
        IN_PROGRESS: { bg: 'var(--color-warning-100)', color: 'var(--color-warning-600)' },
        RESOLVED: { bg: 'var(--color-success-100)', color: 'var(--color-success-600)' },
        CLOSED: { bg: 'var(--color-gray-100)', color: 'var(--color-gray-600)' },
      };

      const statusLabels: Record<string, string> = {
        OPEN: 'Open',
        IN_PROGRESS: 'In Progress',
        RESOLVED: 'Resolved',
        CLOSED: 'Closed',
      };

      const style =
        statusColors[status ?? 'OPEN'] ?? (statusColors['OPEN'] as { bg: string; color: string });

      return (
        <span
          className={styles['impediment-status-badge']}
          style={{ backgroundColor: style.bg, color: style.color }}
          title={`Impediment status: ${statusLabels[status ?? 'OPEN']}`}
        >
          {statusLabels[status ?? 'OPEN']}
        </span>
      );
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onToggleExpand();
      }
    };

    if (viewMode === 'compact') {
      return (
        <div
          className={`${styles['update-card-compact']} ${hasImpediment ? styles['has-impediment'] : ''} ${hasTrackedImpediment ? styles['has-tracked-impediment'] : ''}`}
          onClick={onToggleExpand}
          tabIndex={0}
          role="button"
          aria-expanded={isExpanded}
          onKeyDown={handleKeyDown}
          aria-label={`${update.user?.firstName} ${update.user?.lastName}'s daily update. ${isExpanded ? 'Click to collapse' : 'Click to expand'}.`}
        >
          <div className={styles['compact-header']}>
            <div className={styles['user-avatar']}>
              {update.user?.firstName.charAt(0)}
              {update.user?.lastName.charAt(0)}
            </div>
            <div className={styles['user-info']}>
              <span className={styles['user-name']}>
                {update.user?.firstName} {update.user?.lastName}
              </span>
              <span className={styles['update-time']}>
                {new Date(update.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            {hasImpediment && (
              <span
                className={styles['impediment-badge']}
                title={hasTrackedImpediment ? 'Tracked impediment' : 'Untracked impediment'}
              >
                <AlertCircleIcon size={16} />
              </span>
            )}
            {getImpedimentStatusBadge()}
          </div>
          {isExpanded && (
            <div className={styles['compact-details']}>
              <div className={styles['detail-section']}>
                <strong>Yesterday:</strong> {update.yesterdayWork}
              </div>
              <div className={styles['detail-section']}>
                <strong>Today:</strong> {update.todayWork}
              </div>
              {hasImpediment && (
                <div className={`${styles['detail-section']} ${styles.impediment}`}>
                  <strong>Impediment:</strong> {update.impediment}
                  <div className={styles['impediment-actions']}>
                    {hasTrackedImpediment ? (
                      <Button
                        variant="link"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToImpediment(update.impedimentRecord?.id ?? '');
                        }}
                      >
                        View Impediment
                      </Button>
                    ) : (
                      <Button
                        variant="link"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPromoteImpediment(update, e.currentTarget);
                        }}
                      >
                        <AlertCircleIcon size={14} />
                        Track as Impediment
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        className={`${styles['update-card']} ${hasImpediment ? styles['has-impediment'] : ''} ${hasTrackedImpediment ? styles['has-tracked-impediment'] : ''}`}
      >
        <div className={styles['update-header']}>
          <div className={styles['user-info']}>
            <div className={styles['user-avatar']}>
              {update.user?.firstName.charAt(0)}
              {update.user?.lastName.charAt(0)}
            </div>
            <div>
              <div className={styles['user-name']}>
                {update.user?.firstName} {update.user?.lastName}
              </div>
              <div className={styles['update-time']}>
                {new Date(update.createdAt).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </div>
          </div>
          <div className={styles['header-badges']}>
            {getImpedimentStatusBadge()}
            {hasImpediment && (
              <div
                className={styles['impediment-indicator']}
                title={hasTrackedImpediment ? 'Tracked impediment' : 'Untracked impediment'}
              >
                <AlertCircleIcon size={16} />
              </div>
            )}
          </div>
        </div>
        <div className={styles['update-body']}>
          <div className={styles['update-section']}>
            <div className={styles['section-label']}>
              <span className={styles['label-icon']}>
                <EditIcon size={12} />
              </span>
              Yesterday
            </div>
            <p>{update.yesterdayWork}</p>
          </div>
          <div className={styles['update-section']}>
            <div className={styles['section-label']}>
              <span className={styles['label-icon']}>
                <TargetIcon size={12} />
              </span>
              Today
            </div>
            <p>{update.todayWork}</p>
          </div>
          {hasImpediment && (
            <div className={`${styles['update-section']} ${styles.impediment}`}>
              <div className={styles['section-label']}>
                <span className={styles['label-icon']}>
                  <AlertCircleIcon size={12} />
                </span>
                Impediment
                {hasTrackedImpediment && <span className={styles['tracked-label']}>(Tracked)</span>}
              </div>
              <p>{update.impediment}</p>
              <div className={styles['impediment-actions']}>
                {hasTrackedImpediment ? (
                  <Button
                    variant="link"
                    onClick={() => onNavigateToImpediment(update.impedimentRecord?.id ?? '')}
                  >
                    View Impediment Details
                  </Button>
                ) : (
                  <Button
                    variant="link"
                    onClick={(e) => onPromoteImpediment(update, e.currentTarget)}
                  >
                    <AlertCircleIcon size={14} />
                    Track as Formal Impediment
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

UpdateCard.displayName = 'UpdateCard';

function countWeekdaysBetween(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function getSprintDay(sprint: { startDate: string; endDate: string }): number {
  const start = new Date(sprint.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  if (today < start) {
    return 1;
  }

  return Math.max(1, countWeekdaysBetween(start, today));
}

function getTotalSprintDays(sprint: { startDate: string; endDate: string }): number {
  const start = new Date(sprint.startDate);
  const end = new Date(sprint.endDate);
  return countWeekdaysBetween(start, end);
}

function formatTimeSince(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return 'just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default DailyScrum;
