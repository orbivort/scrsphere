// Product Goals Management Page

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiService } from '../../services';
import { useTeamStore } from '../../store';
import { useApiError } from '../../hooks/useApiError';
import { useFormDraft } from '../../hooks/useFormDraft';
import { queryKeys } from '../../hooks/queryKeys';
import { logger } from '../../utils/logger';
import {
  ItemStatus,
  type ProductGoal,
  type ProductBacklogItem,
  type StatusChangeHistoryItem,
} from '../../types';
// Form components are now imported and used within ProductGoalModal
import type { StatusConfig } from '../../components/StatusSelector';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../../components/common/ToastContainer';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/common/Loading';

import { StatusChangeModal } from './components/StatusChangeModal';
import {
  ProductGoalModal,
  type FormData,
  type FormErrors,
  type TouchedFields,
} from './components/ProductGoalModal';
import styles from './ProductGoals.module.css';

import {
  TargetIcon,
  CloseIcon,
  AlertTriangleIcon,
  TrashIcon,
  AlertCircleIcon,
  GridViewIcon,
  PlusIcon,
  SearchIcon,
  ShieldIcon,
  EditIcon,
  MenuIcon,
} from '@/components/common/Icons';

// Form field validation types are imported from ProductGoalModal component

const INITIAL_FORM_DATA: FormData = {
  title: '',
  description: '',
  targetDate: '',
  successMetrics: '',
  status: 'new',
  strategicAlignment: '',
};

// Product Goal Status Configuration
const PRODUCT_GOAL_STATUSES = ['new', 'active', 'completed', 'abandoned'] as const;
type ProductGoalStatus = (typeof PRODUCT_GOAL_STATUSES)[number];

const PRODUCT_GOAL_STATUS_CONFIG: Record<ProductGoalStatus, StatusConfig> = {
  new: {
    label: 'New',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db',
    icon: 'M12 4v16m8-8H4',
    description: 'Goal is newly created and not yet started',
  },
  active: {
    label: 'Active',
    color: '#2563eb',
    bgColor: '#dbeafe',
    borderColor: '#93c5fd',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    description: 'Goal is currently being worked on',
  },
  completed: {
    label: 'Completed',
    color: '#059669',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    icon: 'M5 13l4 4L19 7',
    description: 'Goal has been successfully achieved',
  },
  abandoned: {
    label: 'Abandoned',
    color: '#dc2626',
    bgColor: '#fee2e2',
    borderColor: '#fca5a5',
    icon: 'M6 18L18 6M6 6l12 12',
    description: 'Goal has been discontinued',
  },
};

export const ProductGoalsPage: React.FC = () => {
  const { currentTeam } = useTeamStore();
  const queryClient = useQueryClient();
  const { handleError } = useApiError();
  const teamId = currentTeam?.id;

  // State for modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showStatusChangeModal, setShowStatusChangeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<ProductGoal | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductGoalStatus | 'all'>('all');

  // Toast notifications
  const { toasts, success, error: showErrorToast, removeToast } = useToast();

  // Error states for different contexts
  const [pageErrorMessage, setPageErrorMessage] = useState<string | null>(null);
  const [modalErrorMessage, setModalErrorMessage] = useState<string | null>(null);
  const [statusChangeError, setStatusChangeError] = useState<string | null>(null);
  const [statusChangeValidationMessage, setStatusChangeValidationMessage] = useState<string | null>(
    null
  );

  // Status history state
  const [statusHistory, setStatusHistory] = useState<StatusChangeHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  // Store original form data for edit mode to detect unsaved changes
  const [originalFormData, setOriginalFormData] = useState<FormData | null>(null);

  // Form validation state
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<TouchedFields>({
    title: false,
    description: false,
    targetDate: false,
    successMetrics: false,
  });

  // Calculate form progress percentage
  const formProgressPercentage = useMemo(() => {
    let progress = 0;
    const fieldValues = [
      formData.title.trim(),
      formData.description.trim(),
      formData.targetDate,
      formData.successMetrics.trim(),
    ];

    fieldValues.forEach((value) => {
      if (value) progress += 25;
    });

    return progress;
  }, [formData]);

  // Form draft auto-save
  const {
    hasDraft,
    showRestorePrompt,
    setShowRestorePrompt,
    saveDraft,
    loadDraft,
    clearDraft,
    lastSavedAt,
  } = useFormDraft<FormData>({
    key: `product-goal-${teamId ?? 'no-team'}`,
    initialData: INITIAL_FORM_DATA,
    debounceMs: 1500,
  });

  // Fetch product goals
  const { data: goalsData, isLoading } = useQuery({
    queryKey: queryKeys.productGoal.list({ teamId }),
    queryFn: () => apiService.getProductGoals(teamId ?? ''),
    enabled: !!teamId,
  });

  // Fetch backlog items for progress calculation
  const { data: backlogData } = useQuery({
    queryKey: ['productBacklog', teamId],
    queryFn: () => apiService.getProductBacklog(teamId ?? ''),
    enabled: !!teamId,
  });

  // Define handleCloseModal to reset form state
  const handleCloseModal = useCallback(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedGoal(null);
    setModalErrorMessage(null);
    setFormData(INITIAL_FORM_DATA);
    setOriginalFormData(null);
    // Reset validation state
    setFormErrors({});
    setTouchedFields({
      title: false,
      description: false,
      targetDate: false,
      successMetrics: false,
    });
  }, []);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (goal: Partial<ProductGoal>) => apiService.createProductGoal(goal),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productGoal.lists() });

      // Show success toast
      success('Product goal created successfully!');

      // Clear localStorage draft with verification
      const clearResult = clearDraft();
      if (!clearResult.success) {
        logger.warn('LocalStorage cleanup warning', undefined, { error: clearResult.error });
      }

      setShowCreateModal(false);
      setSelectedGoal(null);
      setModalErrorMessage(null);
      setFormData(INITIAL_FORM_DATA);
      setFormErrors({});
      setTouchedFields({
        title: false,
        description: false,
        targetDate: false,
        successMetrics: false,
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      const userMessage = handleError(
        error,
        `Failed to create product goal: ${err.response?.data?.error?.message}`
      );
      setModalErrorMessage(userMessage);
      showErrorToast(userMessage);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ProductGoal> }) =>
      apiService.updateProductGoal(id, updates),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productGoal.lists() });

      // Show success toast
      success('Product goal updated successfully!');

      // Clear localStorage draft with verification
      const clearResult = clearDraft();
      if (!clearResult.success) {
        logger.warn('LocalStorage cleanup warning', undefined, { error: clearResult.error });
      }

      setShowEditModal(false);
      setSelectedGoal(null);
      setModalErrorMessage(null);
      setFormData(INITIAL_FORM_DATA);
      setFormErrors({});
      setTouchedFields({
        title: false,
        description: false,
        targetDate: false,
        successMetrics: false,
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      const userMessage = handleError(
        error,
        `Failed to update product goal: ${err.response?.data?.error?.message}`
      );
      setModalErrorMessage(userMessage);
      showErrorToast(userMessage);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteProductGoal(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productGoal.lists() });

      // Show success toast
      success('Product goal deleted successfully!');

      setPageErrorMessage(null);
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      const userMessage = handleError(
        error,
        `Failed to delete product goal: ${err.response?.data?.error?.message}`
      );
      setPageErrorMessage(userMessage);
      showErrorToast(userMessage);
    },
  });

  // Status change mutation
  const statusChangeMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductGoal['status'] }) =>
      apiService.updateProductGoal(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.productGoal.lists() });
      setShowStatusChangeModal(false);
      setStatusChangeError(null);
      setStatusChangeValidationMessage(null);

      // Show success toast
      success('Status updated successfully!');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      const userMessage = handleError(
        error,
        `Failed to change status: ${err.response?.data?.error?.message}`
      );
      setStatusChangeError(userMessage);
      showErrorToast(userMessage);
    },
  });

  // Auto-save draft when form data changes
  useEffect(() => {
    if (showCreateModal) {
      saveDraft(formData);
    }
  }, [formData, showCreateModal, saveDraft]);

  const handleOpenCreate = () => {
    setModalErrorMessage(null);
    setFormData(INITIAL_FORM_DATA);
    setTouchedFields({
      title: false,
      description: false,
      targetDate: false,
      successMetrics: false,
    });
    setShowCreateModal(true);
  };

  const handleOpenEdit = (goal: ProductGoal) => {
    if (!canEditGoal(goal)) {
      setPageErrorMessage(
        `Cannot edit product goal with status "${goal.status.toLowerCase()}". Completed and abandoned goals cannot be edited.`
      );
      return;
    }
    setModalErrorMessage(null);
    setSelectedGoal(goal);
    const editFormData: FormData = {
      title: goal.title,
      description: goal.description ?? '',
      targetDate: goal.targetDate ? (goal.targetDate.split('T')[0] ?? '') : '',
      successMetrics: goal.successMetrics ?? '',
      status: goal.status.toLowerCase() as ProductGoal['status'],
      strategicAlignment: goal.strategicAlignment ?? '',
    };
    setFormData(editFormData);
    // Store original data to detect unsaved changes
    setOriginalFormData(editFormData);
    setTouchedFields({
      title: false,
      description: false,
      targetDate: false,
      successMetrics: false,
    });
    setShowEditModal(true);
  };

  const handleRestoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setFormData(draft);
    }
    setShowRestorePrompt(false);
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setShowRestorePrompt(false);
  };

  // Status change handlers
  const handleOpenStatusChange = async (goal: ProductGoal) => {
    setSelectedGoal(goal);
    setStatusChangeError(null);
    setStatusChangeValidationMessage(null);
    setHistoryError(null);
    setShowStatusChangeModal(true);

    // Fetch status history
    setIsHistoryLoading(true);
    try {
      const response = await apiService.getProductGoalStatusHistory(goal.id);
      if (response.success && response.data) {
        setStatusHistory(response.data);
      } else {
        setHistoryError('Failed to load status history');
        setStatusHistory([]);
      }
    } catch (error) {
      logger.error('Failed to fetch status history', undefined, { error });
      setHistoryError('Failed to load status history');
      setStatusHistory([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleCloseStatusChange = () => {
    if (!statusChangeMutation.isPending) {
      setShowStatusChangeModal(false);
      setStatusChangeError(null);
      setStatusChangeValidationMessage(null);
      setStatusHistory([]);
      setHistoryError(null);
    }
  };

  const handleStatusChange = async (newStatus: ProductGoalStatus) => {
    if (!selectedGoal) return;

    setStatusChangeError(null);
    setStatusChangeValidationMessage(null);

    // Check if trying to activate when another goal is already active
    if (newStatus === 'active' && hasActiveGoal(selectedGoal.id)) {
      setStatusChangeError(
        'There is already an active product goal for this team. Please complete or abandon the current active goal first.'
      );
      return;
    }

    // Check if trying to complete with incomplete backlog items
    if (newStatus === 'completed') {
      const { canComplete, incompleteItems } = canMarkAsCompleted(selectedGoal.id);
      if (!canComplete) {
        setStatusChangeError(getIncompleteItemsMessage(incompleteItems));
        return;
      }
    }

    // Check if goal has associated items when abandoning
    if (newStatus === 'abandoned' && hasAssociatedBacklogItems(selectedGoal.id)) {
      const itemCount = getAssociatedBacklogItemCount(selectedGoal.id);
      setStatusChangeValidationMessage(
        `Note: This goal has ${itemCount} associated backlog item${itemCount > 1 ? 's' : ''}. Abandoning this goal will not affect those items.`
      );
    }

    // Execute status change
    statusChangeMutation.mutate(
      { id: selectedGoal.id, status: newStatus.toUpperCase() as ProductGoal['status'] },
      {
        onSuccess: () => {
          // Update the selected goal in state to reflect the change
          setSelectedGoal((prev) =>
            prev ? { ...prev, status: newStatus.toUpperCase() as ProductGoal['status'] } : null
          );
        },
      }
    );
  };

  // Validation function for individual fields
  const validateField = useCallback(
    (fieldName: keyof FormData, value: string): string | undefined => {
      switch (fieldName) {
        case 'title':
          if (!value || value.trim() === '') {
            return 'Please enter a goal title. This helps your team quickly identify the objective.';
          }
          if (value.trim().length < 3) {
            return `Title is too short (${value.trim().length}/3 characters). Try being more specific about what you want to achieve.`;
          }
          if (value.trim().length > 100) {
            return `Title is too long (${value.trim().length}/100 characters). Consider making it more concise for better readability.`;
          }
          return undefined;
        case 'description':
          if (!value || value.trim() === '') {
            return 'Description is required to help your team understand the goal context.';
          }
          if (value.trim().length < 10) {
            return `Description is too short (${value.trim().length}/10 characters). Please provide more context about the goal.`;
          }
          if (value.trim().length > 1000) {
            return `Description must not exceed 1000 characters (currently ${value.trim().length}).`;
          }
          return undefined;
        case 'targetDate': {
          if (!value || value.trim() === '') {
            return 'Target date is required to track goal progress and timeline.';
          }
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          // Check if date is unreasonably far in future
          const oneYearFromNow = new Date();
          oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
          if (selectedDate > oneYearFromNow) {
            return 'Target date is more than 1 year away. Consider breaking this into smaller milestones.';
          }
          return undefined;
        }
        case 'successMetrics': {
          if (!value || value.trim() === '') {
            return 'Success metrics are required to measure goal achievement.';
          }
          if (value.trim().length < 5) {
            return `Success metrics are too short (${value.trim().length}/5 characters). Please define measurable criteria.`;
          }
          if (value.trim().length > 500) {
            return `Success metrics must not exceed 500 characters (currently ${value.trim().length}).`;
          }
          return undefined;
        }
        default:
          return undefined;
      }
    },
    []
  );

  // Validate all form fields
  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};

    const titleError = validateField('title', formData.title);
    if (titleError) errors.title = titleError;

    const descriptionError = validateField('description', formData.description);
    if (descriptionError) errors.description = descriptionError;

    const targetDateError = validateField('targetDate', formData.targetDate);
    if (targetDateError) errors.targetDate = targetDateError;

    const successMetricsError = validateField('successMetrics', formData.successMetrics);
    if (successMetricsError) errors.successMetrics = successMetricsError;

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, validateField]);

  // Check if form is valid for submit button state
  const isFormValid = useMemo(() => {
    const errors: FormErrors = {};

    const titleError = validateField('title', formData.title);
    if (titleError) errors.title = titleError;

    const descriptionError = validateField('description', formData.description);
    if (descriptionError) errors.description = descriptionError;

    const targetDateError = validateField('targetDate', formData.targetDate);
    if (targetDateError) errors.targetDate = targetDateError;

    const successMetricsError = validateField('successMetrics', formData.successMetrics);
    if (successMetricsError) errors.successMetrics = successMetricsError;

    return Object.keys(errors).length === 0;
  }, [formData, validateField]);

  // Handle field change with validation
  const handleFieldChange = (fieldName: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldName]: value }));

    // Validate field if it has been touched
    if (touchedFields[fieldName as keyof TouchedFields]) {
      const error = validateField(fieldName, value);
      setFormErrors((prev) => ({
        ...prev,
        [fieldName]: error,
      }));
    }
  };

  // Handle field blur to mark as touched and validate
  const handleFieldBlur = (fieldName: keyof FormData, value: string) => {
    setTouchedFields((prev) => ({ ...prev, [fieldName]: true }));
    const error = validateField(fieldName, value);
    setFormErrors((prev) => ({
      ...prev,
      [fieldName]: error,
    }));
  };

  const handleDelete = (goal: ProductGoal) => {
    if (!canDeleteGoal(goal)) {
      setPageErrorMessage(
        `Cannot delete product goal with status "${goal.status.toLowerCase()}". Only goals with "new" or "abandoned" status can be deleted.`
      );
      return;
    }

    if (hasAssociatedBacklogItems(goal.id)) {
      const itemCount = getAssociatedBacklogItemCount(goal.id);
      setPageErrorMessage(
        `Cannot delete product goal "${goal.title}" because it has ${itemCount} associated backlog item${itemCount > 1 ? 's' : ''}. Please remove or reassign the backlog items before deleting this goal.`
      );
      return;
    }

    setShowDeleteConfirm(goal.id);
  };

  const handleDeleteConfirm = () => {
    if (showDeleteConfirm) {
      deleteMutation.mutate(showDeleteConfirm);
      setShowDeleteConfirm(null);
    }
  };

  const hasActiveGoal = (excludeGoalId?: string): boolean => {
    const goals = goalsData?.data ?? [];
    return goals.some(
      (goal: ProductGoal) =>
        goal.status.toLowerCase() === 'active' && (!excludeGoalId || goal.id !== excludeGoalId)
    );
  };

  const canDeleteGoal = (goal: ProductGoal): boolean => {
    const status = goal.status.toLowerCase();
    return status !== 'active' && status !== 'completed';
  };

  const canEditGoal = (goal: ProductGoal): boolean => {
    const status = goal.status.toLowerCase();
    return status !== 'completed' && status !== 'abandoned';
  };

  const hasAssociatedBacklogItems = (goalId: string): boolean => {
    const goalItems =
      backlogData?.data.filter((item: ProductBacklogItem) => item.goalId === goalId) ?? [];
    return goalItems.length > 0;
  };

  const getAssociatedBacklogItemCount = (goalId: string): number => {
    const goalItems =
      backlogData?.data.filter((item: ProductBacklogItem) => item.goalId === goalId) ?? [];
    return goalItems.length;
  };

  const canMarkAsCompleted = (
    goalId: string
  ): { canComplete: boolean; incompleteItems: ProductBacklogItem[] } => {
    const goalItems =
      backlogData?.data.filter((item: ProductBacklogItem) => item.goalId === goalId) ?? [];
    const incompleteItems = goalItems.filter(
      (item: ProductBacklogItem) => item.status !== ItemStatus.DONE
    );
    return {
      canComplete: incompleteItems.length === 0 && goalItems.length > 0,
      incompleteItems,
    };
  };

  const getIncompleteItemsMessage = (incompleteItems: ProductBacklogItem[]): string => {
    if (incompleteItems.length === 0) {
      return 'Cannot mark goal as Completed: No backlog items are associated with this goal.';
    }
    const itemNames = incompleteItems
      .slice(0, 3)
      .map((item) => `"${item.title}"`)
      .join(', ');
    const moreCount = incompleteItems.length > 3 ? ` and ${incompleteItems.length - 3} more` : '';
    return `Cannot mark goal as Completed. The following backlog items are not done: ${itemNames}${moreCount}. All backlog items must have "DONE" status before completing the goal.`;
  };

  const handleSubmit = () => {
    if (!teamId) {
      setModalErrorMessage('Team ID is required. Please select a team first.');
      return;
    }

    // Mark all fields as touched for validation display
    setTouchedFields({
      title: true,
      description: true,
      targetDate: true,
      successMetrics: true,
    });

    // Validate all fields before submission
    if (!validateForm()) {
      setModalErrorMessage('Please fill in all required fields correctly before submitting.');
      return;
    }

    // Note: Status changes are handled exclusively through the Status Change Button
    // The edit form only updates non-status fields (title, description, etc.)
    // The status is preserved from the selectedGoal and not modified here

    const goalData: Partial<ProductGoal> = {
      teamId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      targetDate: formData.targetDate ? new Date(formData.targetDate).toISOString() : undefined,
      successMetrics: formData.successMetrics.trim(),
      // Status is intentionally NOT included here - use Status Change Button for status changes
      ...(formData.strategicAlignment ? { strategicAlignment: formData.strategicAlignment } : {}),
    };

    if (showEditModal && selectedGoal) {
      updateMutation.mutate({ id: selectedGoal.id, updates: goalData });
    } else {
      createMutation.mutate(goalData);
    }
  };

  // Memoized progress calculation for all goals
  const goalProgressMap = useMemo(() => {
    const progressMap: Record<
      string,
      {
        progress: number;
        totalPoints: number;
        completedPoints: number;
        itemCount: number;
        completedCount: number;
      }
    > = {};

    if (!backlogData?.data) {
      return progressMap;
    }

    const backlogItems = backlogData.data;

    backlogItems.forEach((item: ProductBacklogItem) => {
      if (!item.goalId) return;

      let goalProgress = progressMap[item.goalId];
      if (!goalProgress) {
        goalProgress = {
          progress: 0,
          totalPoints: 0,
          completedPoints: 0,
          itemCount: 0,
          completedCount: 0,
        };
        progressMap[item.goalId] = goalProgress;
      }

      goalProgress.itemCount++;
      goalProgress.totalPoints += item.storyPoints ?? 0;

      if (item.status === ItemStatus.DONE) {
        goalProgress.completedCount++;
        goalProgress.completedPoints += item.storyPoints ?? 0;
      }
    });

    Object.keys(progressMap).forEach((goalId) => {
      const goalProgress = progressMap[goalId];
      if (goalProgress) {
        const { totalPoints, completedPoints } = goalProgress;
        goalProgress.progress =
          totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0;
      }
    });

    return progressMap;
  }, [backlogData?.data]);

  // Calculate progress for each goal
  const calculateProgress = (goalId: string) => {
    return (
      goalProgressMap[goalId] ?? {
        progress: 0,
        totalPoints: 0,
        completedPoints: 0,
        itemCount: 0,
        completedCount: 0,
      }
    );
  };

  // Calculate days remaining
  const calculateDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const today = new Date();
    return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const goals = useMemo(() => goalsData?.data ?? [], [goalsData]);

  const filteredGoals = useMemo(() => {
    let filtered = [...goals];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (goal) =>
          (goal.title.toLowerCase().includes(query) ||
            goal.description?.toLowerCase().includes(query)) ??
          goal.successMetrics?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(
        (goal) => goal.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Sort by status priority
    const statusPriority: Record<string, number> = {
      ACTIVE: 1,
      active: 1,
      NEW: 2,
      new: 2,
      COMPLETED: 3,
      completed: 3,
      ABANDONED: 4,
      abandoned: 4,
    };

    return filtered.sort((a, b) => {
      const priorityA = statusPriority[a.status] ?? 5;
      const priorityB = statusPriority[b.status] ?? 5;
      return priorityA - priorityB;
    });
  }, [goals, searchQuery, statusFilter]);

  // Strategic alignment options
  const strategicOptions = [
    { value: '', label: 'Select a strategic objective...' },
    { value: 'growth', label: '🚀 Growth & Acquisition' },
    { value: 'retention', label: '💎 Retention & Engagement' },
    { value: 'revenue', label: '💰 Revenue Optimization' },
    { value: 'tech', label: '⚙️ Technical Excellence' },
    { value: 'ux', label: '✨ User Experience' },
  ];

  if (isLoading) {
    return <LoadingState variant="page" label="Loading Product Goals..." />;
  }

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  return (
    <>
      <div className={styles['product-goals-page']} data-testid="product-goals" tabIndex={-1}>
        {pageErrorMessage && (
          <div className={styles['error-banner']}>
            <div className={styles['error-content']}>
              <span className={styles['error-icon']}>
                <AlertCircleIcon size={18} />
              </span>
              <span className={styles['error-text']}>{pageErrorMessage}</span>
              <button
                className={styles['error-close']}
                onClick={() => setPageErrorMessage(null)}
                aria-label="Close error message"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <header className={styles['goals-header']}>
          <div className={styles['header-left']}>
            <h1 className={styles['page-title']}>
              <span className={styles['page-title-icon']}>
                <TargetIcon />
              </span>
              Product Goals
              <span className={styles['item-count']}>{filteredGoals.length} goals</span>
            </h1>
            <p className={styles['page-subtitle']}>
              Define and track objectives to guide product development
            </p>
          </div>
          <div className={styles['header-right']}>
            <div className={styles['view-toggle']}>
              <button
                className={`${styles['toggle-button']} ${viewMode === 'grid' ? styles.active : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <span className={styles['toggle-icon']}>
                  <GridViewIcon size={14} />
                </span>{' '}
                Grid
              </button>
              <button
                className={`${styles['toggle-button']} ${viewMode === 'table' ? styles.active : ''}`}
                onClick={() => setViewMode('table')}
              >
                <span className={styles['toggle-icon']}>
                  <MenuIcon size={14} />
                </span>{' '}
                Table
              </button>
            </div>
            <button
              className={`${styles.button} ${styles['button-primary']}`}
              onClick={handleOpenCreate}
            >
              <PlusIcon size={14} strokeWidth={2.5} />
              New Goal
            </button>
          </div>
        </header>

        {/* Search and Filter Bar - Hidden when no goals exist and no filters applied */}
        {!(goals.length === 0 && !searchQuery && statusFilter === 'all') && (
          <div className={styles['search-filter-bar']}>
            <div className={styles['search-input-wrapper']}>
              <span className={styles['search-icon']}>
                <SearchIcon size={16} />
              </span>
              <input
                type="text"
                className={styles['search-input']}
                placeholder="Search goals by title, description, or metrics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search product goals"
              />
              {searchQuery && (
                <button
                  className={styles['clear-search']}
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            <div className={styles['status-filter']} role="group" aria-label="Filter by status">
              <button
                className={`${styles['filter-button']} ${styles.all} ${statusFilter === 'all' ? styles.active : ''}`}
                onClick={() => setStatusFilter('all')}
                aria-pressed={statusFilter === 'all'}
              >
                ALL
              </button>
              <button
                className={`${styles['filter-button']} ${statusFilter === 'active' ? styles.active : ''}`}
                onClick={() => setStatusFilter('active')}
                aria-pressed={statusFilter === 'active'}
              >
                ACTIVE
              </button>
              <button
                className={`${styles['filter-button']} ${statusFilter === 'new' ? styles.active : ''}`}
                onClick={() => setStatusFilter('new')}
                aria-pressed={statusFilter === 'new'}
              >
                NEW
              </button>
              <button
                className={`${styles['filter-button']} ${statusFilter === 'completed' ? styles.active : ''}`}
                onClick={() => setStatusFilter('completed')}
                aria-pressed={statusFilter === 'completed'}
              >
                COMPLETED
              </button>
              <button
                className={`${styles['filter-button']} ${statusFilter === 'abandoned' ? styles.active : ''}`}
                onClick={() => setStatusFilter('abandoned')}
                aria-pressed={statusFilter === 'abandoned'}
              >
                ABANDONED
              </button>
            </div>

            <span className={styles['results-count']}>
              {filteredGoals.length} of {goals.length} goals
            </span>
          </div>
        )}

        {/* Goals Display */}
        {filteredGoals.length === 0 ? (
          <div className={styles['empty-state']}>
            <span className={styles['empty-icon']}>
              {searchQuery || statusFilter !== 'all' ? (
                <SearchIcon size={40} strokeWidth={1.5} />
              ) : (
                <TargetIcon size={40} strokeWidth={1.5} />
              )}
            </span>
            <h3>
              {searchQuery || statusFilter !== 'all'
                ? 'No Goals Match Your Criteria'
                : 'No Goals Yet'}
            </h3>
            <p>
              {searchQuery || statusFilter !== 'all'
                ? "Try adjusting your search or filter settings to find what you're looking for."
                : "Create your first product goal to start tracking your team's objectives."}
            </p>
            {searchQuery || statusFilter !== 'all' ? (
              <button
                className={`${styles.button} ${styles['button-secondary']}`}
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                }}
              >
                <CloseIcon size={16} />
                Clear Filters
              </button>
            ) : (
              <button
                className={`${styles.button} ${styles['button-primary']}`}
                onClick={handleOpenCreate}
              >
                <PlusIcon size={16} />
                Create First Goal
              </button>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className={styles['goals-grid']}>
            {filteredGoals.map((goal) => {
              const { progress, totalPoints, completedPoints, itemCount, completedCount } =
                calculateProgress(goal.id);
              const daysRemaining = goal.targetDate
                ? calculateDaysRemaining(goal.targetDate)
                : null;

              const statusClass = goal.status.toLowerCase();

              return (
                <div key={goal.id} className={`${styles['goal-card']} ${styles[statusClass]}`}>
                  <div className={styles['goal-card-header']}>
                    <div className={styles['goal-status-indicator']}>
                      <span className={`${styles['status-dot']} ${styles[statusClass]}`} />
                      <span className={styles['status-text']}>{goal.status}</span>
                    </div>
                    <div className={styles['goal-actions']}>
                      <button
                        className={styles['action-btn']}
                        onClick={() => handleOpenStatusChange(goal)}
                        title={canEditGoal(goal) ? 'Change status' : 'View status history'}
                        aria-label={
                          canEditGoal(goal)
                            ? `Change status for goal: ${goal.title}`
                            : `View status history for goal: ${goal.title}`
                        }
                      >
                        <ShieldIcon size={16} />
                      </button>
                      <button
                        className={styles['action-btn']}
                        onClick={() => handleOpenEdit(goal)}
                        title={
                          canEditGoal(goal) ? 'Edit' : 'Cannot edit completed or abandoned goals'
                        }
                        aria-label={
                          canEditGoal(goal)
                            ? `Edit goal: ${goal.title}`
                            : `Cannot edit ${goal.title}: ${goal.status.toLowerCase()} goals cannot be edited`
                        }
                        disabled={!canEditGoal(goal)}
                      >
                        <EditIcon size={14} />
                      </button>
                      <button
                        className={`${styles['action-btn']} ${styles.delete}`}
                        onClick={() => handleDelete(goal)}
                        title={
                          !canDeleteGoal(goal)
                            ? 'Cannot delete active or completed goals'
                            : hasAssociatedBacklogItems(goal.id)
                              ? 'Cannot delete: has associated backlog items'
                              : 'Delete'
                        }
                        aria-label={
                          !canDeleteGoal(goal)
                            ? `Cannot delete ${goal.title}: ${goal.status.toLowerCase()} goals cannot be deleted`
                            : hasAssociatedBacklogItems(goal.id)
                              ? `Cannot delete ${goal.title}: has associated backlog items`
                              : `Delete goal: ${goal.title}`
                        }
                        disabled={!canDeleteGoal(goal) || hasAssociatedBacklogItems(goal.id)}
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className={styles['goal-title']}>{goal.title}</h3>
                  <p className={styles['goal-description']}>
                    {goal.description ?? 'No description'}
                  </p>

                  <div className={styles['goal-progress-section']}>
                    <div className={styles['progress-header']}>
                      <span>Progress</span>
                      <span className={styles['progress-value']}>{progress}%</span>
                    </div>
                    <div className={styles['progress-bar']}>
                      <div className={styles['progress-fill']} style={{ width: `${progress}%` }} />
                    </div>
                    <div className={styles['progress-details']}>
                      <span>
                        {completedCount}/{itemCount} items
                      </span>
                      <span>
                        {completedPoints}/{totalPoints} pts
                      </span>
                    </div>
                  </div>

                  {goal.targetDate && (
                    <div className={styles['goal-deadline']}>
                      <span className={styles['deadline-label']}>Target Date</span>
                      <span
                        className={`${styles['deadline-value']} ${daysRemaining !== null && daysRemaining < 0 ? styles.overdue : daysRemaining !== null && daysRemaining < 30 ? styles.urgent : ''}`}
                      >
                        {new Date(goal.targetDate).toLocaleDateString()}
                        {daysRemaining !== null && (
                          <span className={styles['days-remaining']}>
                            (
                            {daysRemaining < 0
                              ? `${Math.abs(daysRemaining)}d overdue`
                              : `${daysRemaining}d left`}
                            )
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {goal.successMetrics && (
                    <div className={styles['goal-metrics']}>
                      <span className={styles['metrics-label']}>Success Metrics</span>
                      <p className={styles['metrics-text']}>{goal.successMetrics}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles['goals-table-view']}>
            <div className={styles['goals-table-wrapper']}>
              <table className={styles['goals-table']}>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Progress</th>
                    <th>Target Date</th>
                    <th>Items</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGoals.map((goal) => {
                    const { progress, itemCount } = calculateProgress(goal.id);
                    const daysRemaining = goal.targetDate
                      ? calculateDaysRemaining(goal.targetDate)
                      : null;
                    const tableStatusClass = goal.status.toLowerCase();

                    return (
                      <tr key={goal.id}>
                        <td>
                          <div className={styles['table-title']}>
                            <strong>{goal.title}</strong>
                            {goal.description && (
                              <p className={styles['table-description']}>{goal.description}</p>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles['status-badge']} ${styles[tableStatusClass]}`}>
                            {goal.status}
                          </span>
                        </td>
                        <td>
                          <div className={styles['table-progress']}>
                            <div className={styles['progress-bar-mini']}>
                              <div
                                className={styles['progress-fill']}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span>{progress}%</span>
                          </div>
                        </td>
                        <td>
                          {goal.targetDate ? (
                            <div>
                              <div>{new Date(goal.targetDate).toLocaleDateString()}</div>
                              {daysRemaining !== null && (
                                <small className={daysRemaining < 0 ? styles.overdue : ''}>
                                  {daysRemaining < 0
                                    ? `${Math.abs(daysRemaining)}d overdue`
                                    : `${daysRemaining}d left`}
                                </small>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td>{itemCount}</td>
                        <td>
                          <div className={styles['table-actions']}>
                            <button
                              className={styles['btn-icon']}
                              onClick={() => handleOpenStatusChange(goal)}
                              title={canEditGoal(goal) ? 'Change status' : 'View status history'}
                              aria-label={
                                canEditGoal(goal)
                                  ? `Change status for goal: ${goal.title}`
                                  : `View status history for goal: ${goal.title}`
                              }
                            >
                              <ShieldIcon size={16} />
                            </button>
                            <button
                              className={styles['btn-icon']}
                              onClick={() => handleOpenEdit(goal)}
                              title={
                                canEditGoal(goal)
                                  ? 'Edit'
                                  : 'Cannot edit completed or abandoned goals'
                              }
                              aria-label={
                                canEditGoal(goal)
                                  ? `Edit goal: ${goal.title}`
                                  : `Cannot edit ${goal.title}: ${goal.status.toLowerCase()} goals cannot be edited`
                              }
                              disabled={!canEditGoal(goal)}
                            >
                              <EditIcon size={14} />
                            </button>
                            <button
                              className={`${styles['btn-icon']} ${styles.delete}`}
                              onClick={() => handleDelete(goal)}
                              title={
                                !canDeleteGoal(goal)
                                  ? 'Cannot delete active or completed goals'
                                  : hasAssociatedBacklogItems(goal.id)
                                    ? 'Cannot delete: has associated backlog items'
                                    : 'Delete'
                              }
                              aria-label={
                                !canDeleteGoal(goal)
                                  ? `Cannot delete ${goal.title}: ${goal.status.toLowerCase()} goals cannot be deleted`
                                  : hasAssociatedBacklogItems(goal.id)
                                    ? `Cannot delete ${goal.title}: has associated backlog items`
                                    : `Delete goal: ${goal.title}`
                              }
                              disabled={!canDeleteGoal(goal) || hasAssociatedBacklogItems(goal.id)}
                            >
                              <TrashIcon size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Create/Edit Modal */}
        <ProductGoalModal
          isOpen={showCreateModal || showEditModal}
          mode={showEditModal ? 'edit' : 'create'}
          formData={formData}
          formErrors={formErrors}
          touchedFields={touchedFields}
          formProgressPercentage={formProgressPercentage}
          isFormValid={isFormValid}
          modalErrorMessage={modalErrorMessage}
          isSubmitting={createMutation.isPending || updateMutation.isPending}
          hasDraft={hasDraft}
          showRestorePrompt={showRestorePrompt}
          lastSavedAt={lastSavedAt}
          strategicOptions={strategicOptions}
          hasUnsavedChanges={
            showEditModal
              ? Object.entries(formData).some(
                  ([key, value]) =>
                    value !==
                    (originalFormData?.[key as keyof FormData] ??
                      INITIAL_FORM_DATA[key as keyof FormData])
                )
              : Object.entries(formData).some(
                  ([key, value]) => value !== INITIAL_FORM_DATA[key as keyof FormData]
                )
          }
          onClose={handleCloseModal}
          onFieldChange={handleFieldChange}
          onFieldBlur={handleFieldBlur}
          onSubmit={handleSubmit}
          onRestoreDraft={handleRestoreDraft}
          onDiscardDraft={handleDiscardDraft}
          onClearDraft={clearDraft}
          onClearError={() => setModalErrorMessage(null)}
        />

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm &&
          (() => {
            const goalToDelete = filteredGoals.find(
              (goal: ProductGoal) => goal.id === showDeleteConfirm
            );
            return (
              <div className={styles['modal-overlay']}>
                <div
                  className={`${styles.modal} ${styles['delete-confirm-modal']}`}
                  onClick={(e) => e.stopPropagation()}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="delete-modal-title"
                >
                  {/* Decorative gradient orb - danger theme */}
                  <div className={styles['gradient-orb-danger']} aria-hidden="true" />

                  {/* Modal Header */}
                  <header className={styles['modal-header']}>
                    <div className={styles['header-content']}>
                      <div className={styles['icon-wrapper-danger']} aria-hidden="true">
                        <AlertTriangleIcon size={24} />
                      </div>
                      <h2 id="delete-modal-title" className={styles['modal-title']}>
                        Delete Goal
                      </h2>
                      <p className={styles['modal-subtitle']}>
                        This action is permanent and cannot be undone
                      </p>
                    </div>
                    <button
                      className={styles['modal-close']}
                      onClick={() => setShowDeleteConfirm(null)}
                      aria-label="Close modal"
                      type="button"
                    >
                      <CloseIcon size={18} />
                    </button>
                  </header>

                  {/* Modal Body */}
                  <div className={styles['modal-body']}>
                    {/* Warning Card */}
                    <div className={styles['warning-card']}>
                      <div className={styles['warning-header']}>
                        <span className={styles['warning-icon-large']} aria-hidden="true">
                          <AlertTriangleIcon size={24} />
                        </span>
                        <div className={styles['warning-title-group']}>
                          <h3 className={styles['warning-title']}>Action Warning</h3>
                          <p className={styles['warning-subtitle']}>
                            Goal:{' '}
                            <strong>&ldquo;{goalToDelete?.title ?? 'Unknown Goal'}&rdquo;</strong>
                          </p>
                        </div>
                      </div>

                      <div className={styles['warning-content']}>
                        <p className={styles['delete-warning-text']}>
                          You are about to permanently delete this product goal. This action{' '}
                          <strong>cannot be undone</strong>.
                        </p>

                        {goalToDelete && (
                          <div className={styles['impact-alert']}>
                            <span className={styles['impact-icon']} aria-hidden="true">
                              <TargetIcon size={24} />
                            </span>
                            <span className={styles['impact-text']}>
                              Status:{' '}
                              <strong
                                className={`${styles['status-badge']} ${styles[goalToDelete.status.toLowerCase()]}`}
                              >
                                {goalToDelete.status}
                              </strong>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <footer className={styles['modal-footer']}>
                    <button
                      type="button"
                      className={`${styles.button} ${styles['button-secondary']}`}
                      onClick={() => setShowDeleteConfirm(null)}
                      disabled={deleteMutation.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className={`${styles.button} ${styles['button-danger']}`}
                      onClick={handleDeleteConfirm}
                      disabled={deleteMutation.isPending}
                      aria-busy={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <>
                          <span className={styles['button-spinner']} aria-hidden="true" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <TrashIcon size={16} />
                          Delete Goal
                        </>
                      )}
                    </button>
                  </footer>
                </div>
              </div>
            );
          })()}

        {/* Status Change Modal */}
        {selectedGoal && (
          <StatusChangeModal
            isOpen={showStatusChangeModal}
            onClose={handleCloseStatusChange}
            onStatusChange={handleStatusChange}
            entityTitle={selectedGoal.title}
            entityType="goal"
            currentStatus={selectedGoal.status.toLowerCase() as ProductGoalStatus}
            statuses={[...PRODUCT_GOAL_STATUSES]}
            statusConfig={PRODUCT_GOAL_STATUS_CONFIG}
            statusHistory={statusHistory}
            isLoading={statusChangeMutation.isPending}
            isHistoryLoading={isHistoryLoading}
            error={statusChangeError ?? historyError}
            validationMessage={statusChangeValidationMessage}
            isViewOnly={!canEditGoal(selectedGoal)}
          />
        )}

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </div>
    </>
  );
};
