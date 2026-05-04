/* eslint-disable icon-rules/no-inline-svg -- TODO: Migrate inline SVGs to shared icon components */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';

import { apiService } from '../../services';
import { useTeamStore, useAuthStore } from '../../store';
import { logger } from '../../utils/logger';
import {
  RetrospectiveCategory,
  RetrospectiveStatus,
  type RetrospectiveItem,
  type RetroActionItem,
  type RetroAttendee,
  type SprintRetrospective as SprintRetrospectiveType,
  type ProductBacklogItem,
  type Task,
  type ApiResponse,
  ItemStatus,
  TaskStatus,
} from '../../types';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/common/Loading/LoadingState';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { queryKeys } from '../../hooks/queryKeys';
import { TOAST_SUCCESS_DURATION } from '../../utils/constants';
import { InfoIcon, PlusIcon, SaveIcon } from '../../components/common/Icons';

import styles from './Retrospective.module.css';
import { CreateActionItemModal } from './CreateActionItemModal';

import { AttendeesSection, type AttendeeFormData } from '@/components/AttendeesSection';

const BacklogHint: React.FC = () => (
  <div className={styles['backlog-hint']}>
    <InfoIcon className={styles['hint-icon']} />
    <span className={styles['hint-text']}>
      This item will be present in the Product Backlog page for action.
    </span>
  </div>
);

const mapTeamRoleToAttendeeRole = (role?: string): string => {
  const roleMap: Record<string, string> = {
    product_owner: 'product_owner',
    scrum_master: 'scrum_master',
    developer: 'developer',
    team_member: 'developer',
  };
  return roleMap[role?.toLowerCase() || ''] || 'stakeholder';
};

export const SprintRetrospective: React.FC = () => {
  const { sprintId } = useParams<{ sprintId: string }>();
  const navigate = useNavigate();
  const { currentTeam } = useTeamStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [activeCategory, setActiveCategory] = useState<RetrospectiveCategory>(
    RetrospectiveCategory.WENT_WELL
  );

  const [uiState, setUiState] = useState({
    showAddItem: false,
    showActionForm: false,
    showSummaryForm: false,
    showSuccessModal: false,
    showCompleteConfirmation: false,
  });

  const [editState, setEditState] = useState({
    editingItemId: null as string | null,
    editContent: '',
    isEditingSummary: false,
  });

  const [formState, setFormState] = useState({
    newItemContent: '',
    newActionItem: {
      title: '',
      description: '',
      ownerId: '',
      dueDate: '',
      status: 'PENDING' as const,
    },
    summaryContent: '',
  });

  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    show: boolean;
    itemId: string | null;
    itemContent: string;
  }>({
    show: false,
    itemId: null,
    itemContent: '',
  });
  const [deleteActionConfirmation, setDeleteActionConfirmation] = useState<{
    show: boolean;
    actionItemId: string | null;
    actionItemTitle: string;
  }>({
    show: false,
    actionItemId: null,
    actionItemTitle: '',
  });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [actionFormErrors, setActionFormErrors] = useState<{
    title?: string;
    ownerId?: string;
    dueDate?: string;
  }>({});
  const [actionFormTouched, setActionFormTouched] = useState<{
    title: boolean;
    ownerId: boolean;
    dueDate: boolean;
  }>({ title: false, ownerId: false, dueDate: false });

  const teamId = currentTeam?.id;

  const notificationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    notificationTimeoutRef.current = setTimeout(
      () => setNotification(null),
      TOAST_SUCCESS_DURATION
    );
  }, []);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const handleError = useCallback(
    (error: unknown, defaultMessage: string) => {
      let message = defaultMessage;

      if (error instanceof Error) {
        message = error.message;

        if (error.message.includes('Network Error') || error.message.includes('fetch')) {
          message = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('404')) {
          message = 'Resource not found. It may have been deleted.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
          message = 'You are not authorized to perform this action.';
        } else if (error.message.includes('500')) {
          message = 'Server error. Please try again later.';
        } else if (error.message.includes('400')) {
          message = 'Invalid request. Please check your input and try again.';
        }

        const axiosError = error as any;
        if (axiosError.response?.data?.error?.details) {
          const details = axiosError.response.data.error.details as Array<{
            field: string;
            message: string;
          }>;
          const firstError = details[0];
          if (firstError) {
            message = `${firstError.field ? `${firstError.field}: ` : ''}${firstError.message}`;
          }
        } else if (axiosError.response?.data?.error?.message) {
          message = axiosError.response.data.error.message;
        }
      }

      showNotification('error', message);
      if (import.meta.env.DEV) {
        logger.error('Error', undefined, { error });
      }
    },
    [showNotification]
  );

  const handleSuccess = useCallback(
    (message: string) => {
      showNotification('success', message);
    },
    [showNotification]
  );

  const { data: teamData, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => apiService.getTeam(teamId!),
    enabled: !!teamId,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  const teamMembers = useMemo(() => {
    if (!teamData?.data?.members) return [];
    return teamData.data.members
      .filter((member) => member.user)
      .map((member) => ({
        id: member.userId,
        name: member.user ? `${member.user.firstName} ${member.user.lastName}` : member.userId,
        user: member.user
          ? {
              id: member.user.id,
              firstName: member.user.firstName,
              lastName: member.user.lastName,
              email: member.user.email,
            }
          : undefined,
        role: member.role,
      }));
  }, [teamData]);

  const { data: sprintData } = useQuery({
    queryKey: ['sprint', sprintId],
    queryFn: () => apiService.getSprint(sprintId || ''),
    enabled: !!sprintId,
  });

  const sprint = sprintData?.data;

  const {
    data: retroData,
    isLoading,
    error: fetchError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.retrospective.bySprint(sprintId),
    queryFn: async () => {
      if (!sprintId) {
        throw new Error('No sprintId provided');
      }

      const result = await apiService.getRetrospectiveBySprintId(sprintId);
      return result;
    },
    enabled: !!sprintId,
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        if (
          error.message.includes('404') ||
          error.message.includes('401') ||
          error.message.includes('403')
        ) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  useEffect(() => {
    if (fetchError) {
      handleError(fetchError, 'Failed to load retrospective data. Please refresh the page.');
    }
  }, [fetchError, handleError]);

  const addItemMutation = useMutation({
    mutationFn: (item: Partial<RetrospectiveItem>) =>
      apiService.addRetrospectiveItem(retrospective?.id || '', item),
    onMutate: () => {
      setUiState((prev) => ({ ...prev, showAddItem: false }));
      setFormState((prev) => ({ ...prev, newItemContent: '' }));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.bySprint(sprintId) });
      handleSuccess('Item added successfully');
    },
    onError: (error) => {
      setUiState((prev) => ({ ...prev, showAddItem: true }));
      handleError(error, 'Failed to add item');
    },
  });

  const voteMutation = useMutation({
    mutationFn: (itemId: string) =>
      apiService.voteRetrospectiveItem(retrospective?.id || '', itemId),
    onMutate: async (itemId: string) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.retrospective.bySprint(sprintId) });

      // Snapshot previous value for rollback
      const previousData = queryClient.getQueryData(queryKeys.retrospective.bySprint(sprintId));

      // Optimistically update the cache
      queryClient.setQueryData(
        queryKeys.retrospective.bySprint(sprintId),
        (old: ApiResponse<SprintRetrospectiveType> | undefined) => {
          if (!old?.data?.items) return old;

          return {
            ...old,
            data: {
              ...old.data,
              items: old.data.items.map((item: RetrospectiveItem) => {
                if (item.id === itemId && user?.id) {
                  return {
                    ...item,
                    votes: item.votes + 1,
                    votedBy: [...(item.votedBy || []), user.id],
                  };
                }
                return item;
              }),
            },
          };
        }
      );

      return { previousData };
    },
    onError: (error, _itemId, context) => {
      // Rollback to previous value on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.retrospective.bySprint(sprintId), context.previousData);
      }
      handleError(error, 'Failed to vote');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.bySprint(sprintId) });
    },
  });

  const unvoteMutation = useMutation({
    mutationFn: (itemId: string) =>
      apiService.unvoteRetrospectiveItem(retrospective?.id || '', itemId),
    onMutate: async (itemId: string) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.retrospective.bySprint(sprintId) });

      // Snapshot previous value for rollback
      const previousData = queryClient.getQueryData(queryKeys.retrospective.bySprint(sprintId));

      // Optimistically update the cache
      queryClient.setQueryData(
        queryKeys.retrospective.bySprint(sprintId),
        (old: ApiResponse<SprintRetrospectiveType> | undefined) => {
          if (!old?.data?.items) return old;

          return {
            ...old,
            data: {
              ...old.data,
              items: old.data.items.map((item: RetrospectiveItem) => {
                if (item.id === itemId && user?.id) {
                  return {
                    ...item,
                    votes: Math.max(0, item.votes - 1),
                    votedBy: (item.votedBy || []).filter((id: string) => id !== user.id),
                  };
                }
                return item;
              }),
            },
          };
        }
      );

      return { previousData };
    },
    onError: (error, _itemId, context) => {
      // Rollback to previous value on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.retrospective.bySprint(sprintId), context.previousData);
      }
      handleError(error, 'Failed to remove vote');
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.bySprint(sprintId) });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: (itemId: string) =>
      apiService.deleteRetrospectiveItem(retrospective?.id || '', itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.bySprint(sprintId) });
      handleSuccess('Item deleted successfully');
    },
    onError: (error) => handleError(error, 'Failed to delete item'),
  });

  const updateItemMutation = useMutation({
    mutationFn: ({ itemId, content }: { itemId: string; content: string }) =>
      apiService.updateRetrospectiveItem(retrospective?.id || '', itemId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.bySprint(sprintId) });
      setEditState((prev) => ({ ...prev, editingItemId: null, editContent: '' }));
      handleSuccess('Item updated successfully');
    },
    onError: (error) => {
      handleError(error, 'Failed to update item');
    },
  });

  const addActionMutation = useMutation({
    mutationFn: (actionItem: Partial<RetroActionItem>) =>
      apiService.addActionItem(retrospective?.id || '', actionItem),
    onMutate: () => {
      setUiState((prev) => ({ ...prev, showActionForm: false }));
      setFormState((prev) => ({
        ...prev,
        newActionItem: { title: '', description: '', ownerId: '', dueDate: '', status: 'PENDING' },
      }));
      setActionFormErrors({});
      setActionFormTouched({ title: false, ownerId: false, dueDate: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.bySprint(sprintId) });
      handleSuccess('Action item created successfully');
    },
    onError: (error) => {
      setUiState((prev) => ({ ...prev, showActionForm: true }));
      handleError(error, 'Failed to create action item');
    },
  });

  const deleteActionMutation = useMutation({
    mutationFn: (actionItemId: string) =>
      apiService.deleteActionItem(retrospective?.id || '', actionItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.bySprint(sprintId) });
      handleSuccess('Action item deleted successfully');
    },
    onError: (error) => handleError(error, 'Failed to delete action item'),
  });

  const updateSummaryMutation = useMutation({
    mutationFn: (data: { summary?: string; dodEvolutionNotes?: string }) =>
      apiService.updateRetrospective(retrospective?.id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.bySprint(sprintId) });
      handleSuccess('Summary updated successfully');
      setUiState((prev) => ({ ...prev, showSummaryForm: false }));
      setEditState((prev) => ({ ...prev, isEditingSummary: false }));
      setFormState((prev) => ({ ...prev, summaryContent: '' }));
    },
    onError: (error) => {
      handleError(error, 'Failed to update summary');
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: RetrospectiveStatus) =>
      apiService.updateRetrospective(retrospective?.id || '', { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.bySprint(sprintId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.allByTeam(teamId) });
      if (status === RetrospectiveStatus.COMPLETED) {
        setUiState((prev) => ({ ...prev, showSuccessModal: true }));
      } else {
        handleSuccess('Retrospective status updated successfully');
      }
    },
    onError: (error) => {
      handleError(error, 'Failed to update retrospective status');
    },
  });

  const addAttendeeMutation = useMutation({
    mutationFn: (data: { name: string; email?: string; role: string; attended: boolean }) =>
      apiService.addRetroAttendee(retrospective?.id || '', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.bySprint(sprintId) });
    },
    onError: (error) => handleError(error, 'Failed to add participant'),
  });

  const updateAttendeeMutation = useMutation({
    mutationFn: ({ attendeeId, attended }: { attendeeId: string; attended: boolean }) =>
      apiService.updateRetroAttendee(attendeeId, { attended }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.retrospective.bySprint(sprintId) });
    },
    onError: (error) => handleError(error, 'Failed to update participant'),
  });

  const retrospective = retroData?.data;

  const isCompleted = retrospective?.status === RetrospectiveStatus.COMPLETED;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const validateActionFormField = useCallback(
    (field: string, value: string): string | undefined => {
      switch (field) {
        case 'title':
          if (!value.trim()) {
            return 'Title is required';
          }
          if (value.trim().length < 3) {
            return 'Title must be at least 3 characters';
          }
          if (value.trim().length > 200) {
            return 'Title must be 200 characters or less';
          }
          return undefined;
        case 'ownerId':
          if (!value) {
            return 'Owner is required';
          }
          return undefined;
        case 'dueDate': {
          if (!value) {
            return 'Due date is required';
          }
          const selectedDate = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (selectedDate < today) {
            return 'Due date cannot be in the past';
          }
          return undefined;
        }
        default:
          return undefined;
      }
    },
    []
  );

  const validateActionForm = useCallback((): boolean => {
    const errors: { title?: string; ownerId?: string; dueDate?: string } = {};
    let isValid = true;

    const titleError = validateActionFormField('title', formState.newActionItem.title);
    if (titleError) {
      errors.title = titleError;
      isValid = false;
    }

    const ownerError = validateActionFormField('ownerId', formState.newActionItem.ownerId);
    if (ownerError) {
      errors.ownerId = ownerError;
      isValid = false;
    }

    const dueDateError = validateActionFormField('dueDate', formState.newActionItem.dueDate);
    if (dueDateError) {
      errors.dueDate = dueDateError;
      isValid = false;
    }

    setActionFormErrors(errors);
    setActionFormTouched({ title: true, ownerId: true, dueDate: true });
    return isValid;
  }, [formState.newActionItem, validateActionFormField]);

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    let businessDays = 0;
    const current = new Date(start);

    while (current <= end) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
      current.setDate(current.getDate() + 1);
    }

    return `${businessDays} business day${businessDays !== 1 ? 's' : ''}`;
  };

  const calculateStoryPoints = (items: ProductBacklogItem[] | undefined) => {
    if (!items) return 0;
    return items.reduce((sum, item) => sum + (item.storyPoints || 0), 0);
  };

  const calculateCompletion = (items: ProductBacklogItem[] | undefined) => {
    if (!items || items.length === 0) return 0;
    const completed = items.filter((item) => item.status === ItemStatus.DONE).length;
    return Math.round((completed / items.length) * 100);
  };

  const calculateTaskCompletion = (tasks: Task[] | undefined) => {
    if (!tasks) return '0';
    const completed = tasks.filter((task) => task.status === TaskStatus.DONE).length;
    return `${completed}/${tasks.length}`;
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getCategoryConfig = (category: RetrospectiveCategory) => {
    const configs = {
      [RetrospectiveCategory.WENT_WELL]: {
        title: 'What went well',
        icon: '😊',
        color: { bg: '#D1FAE5', border: '#10B981', text: '#065F46' },
        placeholder: 'What went well during this Sprint?',
      },
      [RetrospectiveCategory.DIDNT_GO_WELL]: {
        title: "What didn't go well",
        icon: '😟',
        color: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B' },
        placeholder: 'What challenges or issues did you face?',
      },
      [RetrospectiveCategory.IMPROVEMENT]: {
        title: 'What can we improve',
        icon: '💡',
        color: { bg: '#DBEAFE', border: '#3B82F6', text: '#1E40AF' },
        placeholder: 'What improvements can we make for next Sprint?',
      },
    };
    return configs[category];
  };

  const handleAddItem = useCallback(() => {
    if (!retrospective?.id) {
      showNotification('error', 'Retrospective not loaded. Please wait and try again.');
      return;
    }

    const trimmedContent = formState.newItemContent.trim();
    if (!trimmedContent) {
      showNotification('error', 'Please enter content for the item');
      return;
    }

    if (trimmedContent.length > 500) {
      showNotification('error', 'Item content must be 500 characters or less');
      return;
    }

    addItemMutation.mutate({
      category: activeCategory,
      content: trimmedContent,
      authorName: user ? `${user.firstName} ${user.lastName}` : 'Anonymous',
    });
  }, [
    formState.newItemContent,
    activeCategory,
    user,
    addItemMutation,
    showNotification,
    retrospective?.id,
  ]);

  const handleVote = useCallback(
    (itemId: string) => {
      if (!retrospective?.id) {
        showNotification('error', 'Retrospective not loaded. Please wait and try again.');
        return;
      }
      if (voteMutation.isPending || unvoteMutation.isPending) return;

      // Find the item to check if user has voted
      const item = retrospective.items?.find((i: RetrospectiveItem) => i.id === itemId);
      if (!item) return;

      // Check if current user has voted (user ID is in votedBy array)
      const hasVoted = user?.id && item.votedBy?.includes(user.id);

      if (hasVoted) {
        // User has voted, so unvote
        unvoteMutation.mutate(itemId);
      } else {
        // User hasn't voted, so vote
        voteMutation.mutate(itemId);
      }
    },
    [
      voteMutation,
      unvoteMutation,
      showNotification,
      retrospective?.id,
      retrospective?.items,
      user?.id,
    ]
  );

  const handleDeleteItem = useCallback(
    (itemId: string, itemContent: string) => {
      if (!retrospective?.id) {
        showNotification('error', 'Retrospective not loaded. Please wait and try again.');
        return;
      }
      if (deleteItemMutation.isPending) return;

      setDeleteConfirmation({ show: true, itemId, itemContent });
    },
    [deleteItemMutation, showNotification, retrospective?.id]
  );

  const confirmDeleteItem = useCallback(() => {
    if (deleteConfirmation.itemId) {
      deleteItemMutation.mutate(deleteConfirmation.itemId);
      setDeleteConfirmation({ show: false, itemId: null, itemContent: '' });
    }
  }, [deleteItemMutation, deleteConfirmation.itemId]);

  const cancelDeleteItem = useCallback(() => {
    setDeleteConfirmation({ show: false, itemId: null, itemContent: '' });
  }, []);

  const handleEditItem = useCallback((itemId: string, content: string) => {
    setEditState((prev) => ({ ...prev, editingItemId: itemId, editContent: content }));
  }, []);

  const handleSaveEdit = useCallback(() => {
    if (!retrospective?.id) {
      showNotification('error', 'Retrospective not loaded. Please wait and try again.');
      return;
    }

    const trimmedContent = editState.editContent.trim();
    if (!editState.editingItemId || !trimmedContent) {
      showNotification('error', 'Please enter content for the item');
      return;
    }

    if (trimmedContent.length > 500) {
      showNotification('error', 'Item content must be 500 characters or less');
      return;
    }

    updateItemMutation.mutate({ itemId: editState.editingItemId, content: trimmedContent });
  }, [
    editState.editingItemId,
    editState.editContent,
    updateItemMutation,
    showNotification,
    retrospective?.id,
  ]);

  const handleCancelEdit = useCallback(() => {
    setEditState((prev) => ({ ...prev, editingItemId: null, editContent: '' }));
  }, []);

  const handleAddSummary = useCallback(() => {
    if (!retrospective?.id) {
      showNotification('error', 'Retrospective not loaded. Please wait and try again.');
      return;
    }
    setEditState((prev) => ({ ...prev, isEditingSummary: false }));
    setFormState((prev) => ({ ...prev, summaryContent: '' }));
    setUiState((prev) => ({ ...prev, showSummaryForm: true }));
  }, [retrospective?.id, showNotification]);

  const handleEditSummary = useCallback(() => {
    if (!retrospective?.id) {
      showNotification('error', 'Retrospective not loaded. Please wait and try again.');
      return;
    }
    setEditState((prev) => ({ ...prev, isEditingSummary: true }));
    setFormState((prev) => ({ ...prev, summaryContent: retrospective?.summary || '' }));
    setUiState((prev) => ({ ...prev, showSummaryForm: true }));
  }, [retrospective?.id, showNotification, retrospective?.summary]);

  const handleSaveSummary = useCallback(() => {
    if (!retrospective?.id) {
      showNotification('error', 'Retrospective not loaded. Please wait and try again.');
      return;
    }

    const trimmedSummary = formState.summaryContent.trim();

    if (!trimmedSummary) {
      showNotification('error', 'Summary is required');
      return;
    }

    if (trimmedSummary.length < 10) {
      showNotification('error', 'Summary must be at least 10 characters');
      return;
    }

    if (trimmedSummary.length > 1000) {
      showNotification('error', 'Summary must be 1000 characters or less');
      return;
    }

    const htmlTagPattern = /<[^>]*>/g;
    if (htmlTagPattern.test(trimmedSummary)) {
      showNotification('error', 'HTML tags are not allowed');
      return;
    }

    updateSummaryMutation.mutate({ summary: trimmedSummary });
  }, [formState.summaryContent, showNotification, retrospective?.id, updateSummaryMutation]);

  const handleCancelSummary = useCallback(() => {
    setUiState((prev) => ({ ...prev, showSummaryForm: false }));
    setEditState((prev) => ({ ...prev, isEditingSummary: false }));
    setFormState((prev) => ({ ...prev, summaryContent: '' }));
  }, []);

  const handleAddActionItem = useCallback(() => {
    if (!retrospective?.id) {
      showNotification('error', 'Retrospective not loaded. Please wait and try again.');
      return;
    }

    if (!validateActionForm()) {
      return;
    }

    const trimmedTitle = formState.newActionItem.title.trim();
    if (trimmedTitle.length > 200) {
      showNotification('error', 'Title must be 200 characters or less');
      return;
    }

    if (formState.newActionItem.description && formState.newActionItem.description.length > 1000) {
      showNotification('error', 'Description must be 1000 characters or less');
      return;
    }

    addActionMutation.mutate(formState.newActionItem);
  }, [
    formState.newActionItem,
    addActionMutation,
    showNotification,
    retrospective?.id,
    validateActionForm,
  ]);

  const handleDeleteActionItem = useCallback(
    (actionItemId: string, actionItemTitle: string) => {
      if (!retrospective?.id) {
        showNotification('error', 'Retrospective not loaded. Please wait and try again.');
        return;
      }
      if (deleteActionMutation.isPending) return;

      setDeleteActionConfirmation({ show: true, actionItemId, actionItemTitle });
    },
    [deleteActionMutation, showNotification, retrospective?.id]
  );

  const confirmDeleteActionItem = useCallback(() => {
    if (deleteActionConfirmation.actionItemId) {
      deleteActionMutation.mutate(deleteActionConfirmation.actionItemId);
      setDeleteActionConfirmation({ show: false, actionItemId: null, actionItemTitle: '' });
    }
  }, [deleteActionMutation, deleteActionConfirmation.actionItemId]);

  const cancelDeleteActionItem = useCallback(() => {
    setDeleteActionConfirmation({ show: false, actionItemId: null, actionItemTitle: '' });
  }, []);

  const getStatusColor = (status: string): { bg: string; text: string } => {
    const colors: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#FEF3C7', text: '#92400E' },
      in_progress: { bg: '#DBEAFE', text: '#1E40AF' },
      completed: { bg: '#D1FAE5', text: '#065F46' },
      cancelled: { bg: '#F3F4F6', text: '#6B7280' },
    };
    return colors[status] ?? { bg: '#FEF3C7', text: '#92400E' };
  };

  const handleCompleteRetrospective = useCallback(() => {
    if (!retrospective?.id) {
      showNotification('error', 'Retrospective not loaded. Please wait and try again.');
      return;
    }
    if (updateStatusMutation.isPending) return;

    const errors: string[] = [];

    const summary = retrospective?.summary;
    if (!summary || summary.trim().length === 0) {
      errors.push('Retrospective Summary must be filled in before completing.');
    }

    const attendees = retrospective?.attendees || [];
    if (attendees.length === 0) {
      errors.push('At least one participant must be added before completing the retrospective.');
    }

    const hasAttended = attendees.some((a: RetroAttendee) => a.attended);
    if (attendees.length > 0 && !hasAttended) {
      errors.push('At least one participant must be marked as attended.');
    }

    const markedMemberNames = new Set(attendees.map((a: RetroAttendee) => a.name.toLowerCase()));
    const markedMemberEmails = new Set(
      attendees.map((a: RetroAttendee) => a.email?.toLowerCase()).filter(Boolean)
    );

    const unmarkedTeamMembers = teamMembers.filter((member) => {
      const memberName = `${member.user?.firstName} ${member.user?.lastName}`.toLowerCase();
      const memberEmail = member.user?.email?.toLowerCase();
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
        `All team members must be marked as attended or absent. Missing: ${unmarkedNames}${remaining}.`
      );
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      setUiState((prev) => ({ ...prev, showCompleteConfirmation: true }));
      return;
    }

    setValidationErrors([]);
    setUiState((prev) => ({ ...prev, showCompleteConfirmation: true }));
  }, [updateStatusMutation, showNotification, retrospective, teamMembers]);

  const confirmCompleteRetrospective = useCallback(() => {
    if (validationErrors.length > 0) {
      setUiState((prev) => ({ ...prev, showCompleteConfirmation: false }));
      return;
    }
    updateStatusMutation.mutate(RetrospectiveStatus.COMPLETED);
    setUiState((prev) => ({ ...prev, showCompleteConfirmation: false }));
  }, [updateStatusMutation, validationErrors]);

  const cancelCompleteRetrospective = useCallback(() => {
    setUiState((prev) => ({ ...prev, showCompleteConfirmation: false }));
    setValidationErrors([]);
  }, []);

  if (isLoading) {
    return <LoadingState variant="page" label="Loading Retrospective..." />;
  }

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (!sprintId) {
    navigate('/retrospectives');
    return null;
  }

  if (retroData && !retroData.data) {
    return (
      <div className={styles['retro-loading']} role="status" aria-live="polite">
        <div className={styles['loading-spinner']} aria-hidden="true" />
        <h2>Retrospective not found</h2>
        <p className={styles['error-hint']}>
          The retrospective for this sprint could not be loaded.
        </p>
        <div className={styles['form-actions']} style={{ marginTop: '20px' }}>
          <button
            className={`${styles.button} ${styles['button-secondary']}`}
            onClick={() => navigate('/retrospectives')}
          >
            Back to Retrospectives
          </button>
          <button
            className={`${styles.button} ${styles['button-primary']}`}
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  if (retrospective) {
    return (
      <div className={styles['retrospective-page']}>
        {notification && (
          <div
            className={`${styles.notification} ${styles[`notification-${notification.type}`]}`}
            role="alert"
            aria-live="assertive"
          >
            {notification.message}
          </div>
        )}

        <ConfirmDialog
          isOpen={deleteConfirmation.show}
          title="Confirm Deletion"
          name={deleteConfirmation.itemContent}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDeleteItem}
          onCancel={cancelDeleteItem}
          isLoading={deleteItemMutation.isPending}
          variant="danger"
        />

        <ConfirmDialog
          isOpen={deleteActionConfirmation.show}
          title="Delete Action Item"
          name={deleteActionConfirmation.actionItemTitle}
          confirmLabel="Delete"
          cancelLabel="Cancel"
          onConfirm={confirmDeleteActionItem}
          onCancel={cancelDeleteActionItem}
          isLoading={deleteActionMutation.isPending}
          variant="danger"
        />

        {uiState.showCompleteConfirmation && (
          <div
            className={styles['confirm-modal-overlay']}
            role="dialog"
            aria-modal="true"
            aria-labelledby="complete-modal-title"
          >
            <div className={styles['confirm-modal']}>
              {/* Decorative gradient orb */}
              <div
                className={`${styles['confirm-modal-orb']} ${validationErrors.length > 0 ? styles['confirm-modal-orb-danger'] : styles['confirm-modal-orb-warning']}`}
              />

              {/* Header */}
              <div className={styles['confirm-modal-header']}>
                <div className={styles['confirm-modal-header-content']}>
                  <div
                    className={`${styles['confirm-modal-icon-wrapper']} ${validationErrors.length > 0 ? styles['confirm-modal-icon-wrapper-danger'] : styles['confirm-modal-icon-wrapper-success']}`}
                  >
                    {validationErrors.length > 0 ? (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    ) : (
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    )}
                  </div>
                  <h2 id="complete-modal-title" className={styles['confirm-modal-title']}>
                    {validationErrors.length > 0
                      ? 'Cannot Complete Retrospective'
                      : 'Complete Retrospective'}
                  </h2>
                  <p className={styles['confirm-modal-subtitle']}>
                    {validationErrors.length > 0
                      ? 'Please address the following issues'
                      : 'This action cannot be undone'}
                  </p>
                </div>
              </div>

              {/* Body */}
              <div className={styles['confirm-modal-body']}>
                {validationErrors.length > 0 ? (
                  <ul className={styles['confirm-validation-list']}>
                    {validationErrors.map((error, index) => (
                      <li key={index} className={styles['confirm-validation-item']}>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        {error}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles['confirm-warning-card']}>
                    <div className={styles['confirm-warning-card-header']}>
                      <div className={styles['confirm-warning-card-icon']}>
                        <svg
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </div>
                      <div className={styles['confirm-warning-card-title-group']}>
                        <h3 className={styles['confirm-warning-card-title']}>
                          Confirmation Required
                        </h3>
                        <p className={styles['confirm-warning-card-subtitle']}>Final step</p>
                      </div>
                    </div>
                    <div className={styles['confirm-warning-card-content']}>
                      <p className={styles['confirm-warning-text']}>
                        Are you sure you want to mark this retrospective as completed? This action
                        cannot be undone.
                      </p>
                      <div className={styles['confirm-info-box']}>
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span className={styles['confirm-info-text']}>
                          Once completed, the retrospective will be locked and no further changes
                          can be made.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className={styles['confirm-modal-footer']}>
                {validationErrors.length > 0 ? (
                  <button
                    className={`${styles['confirm-btn']} ${styles['confirm-btn-primary']}`}
                    onClick={cancelCompleteRetrospective}
                    type="button"
                  >
                    OK
                  </button>
                ) : (
                  <>
                    <button
                      className={`${styles['confirm-btn']} ${styles['confirm-btn-secondary']}`}
                      onClick={cancelCompleteRetrospective}
                      disabled={updateStatusMutation.isPending}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className={`${styles['confirm-btn']} ${styles['confirm-btn-primary']} ${updateStatusMutation.isPending ? styles['confirm-btn-loading'] : ''}`}
                      onClick={confirmCompleteRetrospective}
                      disabled={updateStatusMutation.isPending}
                      type="button"
                    >
                      {updateStatusMutation.isPending ? (
                        <>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Completing...
                        </>
                      ) : (
                        <>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Complete
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <div className={styles['retro-header']}>
          <div className={styles['header-left']}>
            <button
              className={styles['back-button']}
              onClick={() => navigate('/retrospectives')}
              aria-label="Go back to Retrospectives list"
            >
              ← Back to Retrospectives
            </button>
            <h1 className={styles['page-title']}>🔍 Sprint Retrospective</h1>
            <p className={styles['retro-date']}>{formatDate(retrospective?.retroDate)}</p>
          </div>
          <div className={styles['header-actions']}>
            <span
              className={styles['participant-count']}
              aria-label={`${retrospective?.attendees?.filter((a: RetroAttendee) => a.attended).length || 0} of ${retrospective?.attendees?.length || 0} attendees attended`}
            >
              👥 {retrospective?.attendees?.filter((a: RetroAttendee) => a.attended).length || 0} /{' '}
              {retrospective?.attendees?.length || 0} Attendees
            </span>
          </div>
        </div>

        {sprint && (
          <section className={styles['sprint-info-section']} aria-label="Sprint Information">
            <div className={styles['sprint-info-header']}>
              <div className={styles['sprint-info-title']}>
                <span className={styles['sprint-icon']} aria-hidden="true">
                  🏃
                </span>
                <h2>{sprint.name}</h2>
                <span
                  className={`${styles['sprint-status-badge']} ${styles[`status-${sprint.status.toLowerCase()}`]}`}
                >
                  {sprint.status}
                </span>
              </div>
              {sprint.sprintGoal && (
                <div className={styles['sprint-goal-inline']}>
                  <span className={styles['goal-label']}>Goal:</span>
                  <span className={styles['goal-text']}>{sprint.sprintGoal}</span>
                </div>
              )}
            </div>

            <div className={styles['sprint-info-grid']}>
              <div className={styles['info-card']}>
                <div className={styles['info-card-icon']}>📅</div>
                <div className={styles['info-card-content']}>
                  <span className={styles['info-card-label']}>Duration</span>
                  <span className={styles['info-card-value']}>
                    {formatDate(sprint.startDate)} — {formatDate(sprint.endDate)}
                  </span>
                  <span className={styles['info-card-sub']}>
                    {calculateDuration(sprint.startDate, sprint.endDate)}
                  </span>
                </div>
              </div>

              <div className={styles['info-card']}>
                <div className={styles['info-card-icon']}>📊</div>
                <div className={styles['info-card-content']}>
                  <span className={styles['info-card-label']}>Product Backlog</span>
                  <span className={styles['info-card-value']}>
                    {sprint.items?.length || 0} items
                  </span>
                  <span className={styles['info-card-sub']}>
                    {calculateStoryPoints(sprint.items)} story points
                  </span>
                </div>
              </div>

              <div className={styles['info-card']}>
                <div className={styles['info-card-icon']}>✅</div>
                <div className={styles['info-card-content']}>
                  <span className={styles['info-card-label']}>Completion</span>
                  <span className={styles['info-card-value']}>
                    {calculateCompletion(sprint.items)}%
                  </span>
                  <div className={styles['progress-bar']}>
                    <div
                      className={styles['progress-fill']}
                      style={{ width: `${calculateCompletion(sprint.items)}%` }}
                      role="progressbar"
                      aria-valuenow={calculateCompletion(sprint.items)}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                </div>
              </div>

              <div className={styles['info-card']}>
                <div className={styles['info-card-icon']}>📋</div>
                <div className={styles['info-card-content']}>
                  <span className={styles['info-card-label']}>Tasks</span>
                  <span className={styles['info-card-value']}>
                    {sprint.tasks?.length || 0} tasks
                  </span>
                  <span className={styles['info-card-sub']}>
                    {calculateTaskCompletion(sprint.tasks)} completed
                  </span>
                </div>
              </div>
            </div>

            {sprint.items && sprint.items.length > 0 && (
              <div className={styles['user-stories-section']}>
                <h3 className={styles['stories-title']}>
                  <span aria-hidden="true">📖</span> Included Product Backlog Items
                </h3>
                <div className={styles['stories-grid']}>
                  {sprint.items.slice(0, 6).map((item, index) => (
                    <div
                      key={item.id}
                      className={styles['story-card']}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className={styles['story-header']}>
                        <span className={styles['story-priority']} data-priority={item.priority}>
                          {item.priority}
                        </span>
                        <span
                          className={`${styles['story-status']} ${styles[`status-${item.status.toLowerCase().replace('_', '-')}`]}`}
                        >
                          {formatStatus(item.status)}
                        </span>
                      </div>
                      <h4 className={styles['story-title']}>{item.title}</h4>
                      {item.storyPoints && (
                        <div className={styles['story-points']}>
                          <span className={styles['points-badge']}>{item.storyPoints} pts</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {sprint.items.length > 6 && (
                  <p className={styles['stories-more']}>+{sprint.items.length - 6} more items</p>
                )}
              </div>
            )}
          </section>
        )}

        <div className={styles['retro-content']}>
          <div
            className={styles['retro-columns']}
            role="region"
            aria-label="Retrospective feedback columns"
          >
            {Object.values(RetrospectiveCategory).map((category) => {
              const config = getCategoryConfig(category);
              const items =
                retrospective?.items?.filter(
                  (item: RetrospectiveItem) => item.category === category
                ) || [];

              return (
                <div
                  key={category}
                  className={styles['retro-column']}
                  style={{ borderColor: config.color.border }}
                  role="region"
                  aria-labelledby={`column-${category}`}
                >
                  <div
                    id={`column-${category}`}
                    className={styles['column-header']}
                    style={{ backgroundColor: config.color.bg, color: config.color.text }}
                  >
                    <span className={styles['column-icon']} aria-hidden="true">
                      {config.icon}
                    </span>
                    <h3>{config.title}</h3>
                    <span
                      className={styles['item-count']}
                      aria-label={`${items.length} items in ${config.title}`}
                    >
                      {items.length}
                    </span>
                  </div>

                  <div className={styles['column-items']}>
                    {items
                      .sort((a: RetrospectiveItem, b: RetrospectiveItem) => b.votes - a.votes)
                      .map((item: RetrospectiveItem) => (
                        <div key={item.id} className={styles['retro-item']}>
                          {editState.editingItemId === item.id ? (
                            <div className={styles['edit-item-form']}>
                              <textarea
                                value={editState.editContent}
                                onChange={(e) =>
                                  setEditState((prev) => ({ ...prev, editContent: e.target.value }))
                                }
                                rows={3}
                                autoFocus
                              />
                              <div className={styles['form-actions']}>
                                <button
                                  className={`${styles.button} ${styles['button-secondary']} ${styles.small}`}
                                  onClick={handleCancelEdit}
                                  disabled={updateItemMutation.isPending}
                                >
                                  Cancel
                                </button>
                                <button
                                  className={`${styles.button} ${styles['button-primary']} ${styles.small}`}
                                  onClick={handleSaveEdit}
                                  disabled={
                                    !editState.editContent.trim() || updateItemMutation.isPending
                                  }
                                >
                                  <SaveIcon className={styles['button-icon']} />
                                  {updateItemMutation.isPending ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p className={styles['item-content']}>{item.content}</p>
                              <div className={styles['item-footer']}>
                                <span className={styles['item-author']}>— {item.authorName}</span>
                                <div className={styles['item-actions']}>
                                  {(() => {
                                    const hasVoted = user?.id && item.votedBy?.includes(user.id);
                                    return (
                                      <button
                                        className={`${styles['vote-button']} ${hasVoted ? styles['vote-button-active'] : ''}`}
                                        onClick={() => handleVote(item.id)}
                                        disabled={
                                          voteMutation.isPending ||
                                          unvoteMutation.isPending ||
                                          isCompleted
                                        }
                                        aria-label={`${hasVoted ? 'Remove vote' : 'Vote'} for this item (${item.votes} votes)`}
                                      >
                                        <span className={styles['vote-icon']}>👍</span>
                                        <span className={styles['vote-count']}>{item.votes}</span>
                                      </button>
                                    );
                                  })()}
                                  <button
                                    className={styles['icon-button']}
                                    onClick={() => handleEditItem(item.id, item.content)}
                                    disabled={isCompleted}
                                    aria-label="Edit item"
                                    title="Edit"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    className={`${styles['icon-button']} ${styles.delete}`}
                                    onClick={() => handleDeleteItem(item.id, item.content)}
                                    disabled={deleteItemMutation.isPending || isCompleted}
                                    aria-label="Delete item"
                                    title="Delete"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}

                    <div className={styles['add-item-section']}>
                      {uiState.showAddItem && activeCategory === category ? (
                        <div className={styles['add-item-form']}>
                          <textarea
                            value={formState.newItemContent}
                            onChange={(e) =>
                              setFormState((prev) => ({ ...prev, newItemContent: e.target.value }))
                            }
                            placeholder={config.placeholder}
                            rows={3}
                            autoFocus
                          />
                          <div className={styles['form-actions']}>
                            <button
                              className={`${styles.button} ${styles['button-secondary']} ${styles.small}`}
                              onClick={() =>
                                setUiState((prev) => ({ ...prev, showAddItem: false }))
                              }
                            >
                              Cancel
                            </button>
                            <button
                              className={`${styles.button} ${styles['button-primary']} ${styles.small}`}
                              onClick={handleAddItem}
                              disabled={
                                !formState.newItemContent.trim() || addItemMutation.isPending
                              }
                            >
                              <PlusIcon className={styles['button-icon']} />
                              {addItemMutation.isPending ? 'Adding...' : 'Add'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          className={styles['add-item-button']}
                          onClick={() => {
                            setActiveCategory(category);
                            setUiState((prev) => ({ ...prev, showAddItem: true }));
                            setFormState((prev) => ({ ...prev, newItemContent: '' }));
                          }}
                          disabled={isCompleted}
                        >
                          + Add Item
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles['action-items-section']}>
            <div className={styles['section-header']}>
              <h3>📋 Action Items</h3>
              <button
                className={`${styles.button} ${styles['button-primary']}`}
                onClick={() => setUiState((prev) => ({ ...prev, showActionForm: true }))}
                disabled={isCompleted}
              >
                + Create Action Item
              </button>
            </div>

            <div className={styles['action-items-list']}>
              {retrospective?.actionItems?.length === 0 ? (
                <div className={styles['empty-state']}>
                  <p>No action items yet. Convert improvement items into actionable tasks.</p>
                </div>
              ) : (
                retrospective?.actionItems?.map((actionItem: RetroActionItem) => {
                  const statusColor = getStatusColor(actionItem.status);
                  return (
                    <div key={actionItem.id} className={styles['action-item-card']}>
                      <div className={styles['action-item-header']}>
                        <h4>{actionItem.title}</h4>
                        <div className={styles['action-item-badges']}>
                          {!actionItem.addedToSprintBacklog && (
                            <span
                              className={styles['status-badge']}
                              style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                            >
                              {actionItem.status.replace('_', ' ')}
                            </span>
                          )}
                          {actionItem.addedToSprintBacklog && (
                            <span className={styles['backlog-badge']}>✓ In Backlog</span>
                          )}
                        </div>
                      </div>
                      {actionItem.description && (
                        <p className={styles['action-item-description']}>
                          {actionItem.description}
                        </p>
                      )}
                      {!actionItem.addedToSprintBacklog && actionItem.status !== 'COMPLETED' && (
                        <BacklogHint />
                      )}
                      <div className={styles['action-item-meta']}>
                        <span>
                          👤{' '}
                          {actionItem.owner
                            ? `${actionItem.owner.firstName} ${actionItem.owner.lastName}`
                            : 'Unassigned'}
                        </span>
                        {actionItem.dueDate && (
                          <span className={styles['due-date']}>
                            📅 Due: {formatDate(actionItem.dueDate)}
                          </span>
                        )}
                      </div>
                      <div className={styles['action-item-footer']}>
                        <button
                          className={`${styles['icon-button']} ${styles.delete}`}
                          onClick={() => handleDeleteActionItem(actionItem.id, actionItem.title)}
                          disabled={deleteActionMutation.isPending || isCompleted}
                          aria-label="Delete action item"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <CreateActionItemModal
              isOpen={uiState.showActionForm}
              formData={formState.newActionItem}
              errors={actionFormErrors}
              touched={actionFormTouched}
              teamMembers={teamMembers}
              isLoadingTeam={isLoadingTeam}
              isPending={addActionMutation.isPending}
              onClose={() => {
                setUiState((prev) => ({ ...prev, showActionForm: false }));
                setActionFormErrors({});
                setActionFormTouched({ title: false, ownerId: false, dueDate: false });
              }}
              onSubmit={handleAddActionItem}
              onFieldChange={(field, value) => {
                setFormState((prev) => ({
                  ...prev,
                  newActionItem: { ...prev.newActionItem, [field]: value },
                }));
              }}
              onFieldBlur={(field) => {
                setActionFormTouched((prev) => ({ ...prev, [field]: true }));
              }}
              validateField={validateActionFormField}
            />
          </div>

          <AttendeesSection
            entityId={retrospective?.id || ''}
            sprintId={sprintId || ''}
            attendees={retrospective?.attendees || []}
            teamMembers={teamMembers}
            isCompleted={retrospective?.status === RetrospectiveStatus.COMPLETED}
            apiConfig={{
              addAttendee: (data: AttendeeFormData) =>
                apiService.addRetroAttendee(retrospective?.id || '', {
                  name: data.name,
                  email: data.email,
                  role: data.role,
                  attended: data.attended,
                }),
              updateAttendee: (id: string, data: AttendeeFormData) =>
                apiService.updateRetroAttendee(id, {
                  name: data.name,
                  email: data.email,
                  role: data.role,
                  attended: data.attended,
                }),
              deleteAttendee: (id: string) => apiService.deleteRetroAttendee(id),
            }}
            queryKey={['retrospective', sprintId] as string[]}
            defaultRole="stakeholder"
            onToggleAttendance={(attendeeId, attended) => {
              updateAttendeeMutation.mutate({ attendeeId, attended });
            }}
            onAddTeamMember={(member, attended) => {
              addAttendeeMutation.mutate({
                name: `${member.user?.firstName || ''} ${member.user?.lastName || ''}`.trim(),
                email: member.user?.email,
                role: mapTeamRoleToAttendeeRole(member.role),
                attended,
              });
            }}
            isAdding={addAttendeeMutation.isPending}
            isUpdating={updateAttendeeMutation.isPending}
          />

          <div className={styles['summary-section']}>
            <div className={styles['summary-header']}>
              <h3>
                <span className={styles['summary-header-icon']} aria-hidden="true">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10 9 9 9 8 9" />
                  </svg>
                </span>
                Retrospective Summary
              </h3>
              {!editState.isEditingSummary &&
                !uiState.showSummaryForm &&
                retrospective?.summary && (
                  <button
                    className={`${styles['icon-button']} ${styles.edit}`}
                    onClick={handleEditSummary}
                    disabled={isCompleted}
                    aria-label="Edit summary"
                    title="Edit"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                )}
            </div>

            {uiState.showSummaryForm || editState.isEditingSummary ? (
              <div
                className={styles['summary-form']}
                role="form"
                aria-label="Retrospective summary form"
              >
                <div className={styles['summary-form-header']}>
                  <div className={styles['summary-form-icon']} aria-hidden="true">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </div>
                  <div>
                    <h4>
                      {editState.isEditingSummary
                        ? 'Edit Retrospective Summary'
                        : 'Add Retrospective Summary'}
                    </h4>
                    <p className={styles['summary-form-subtitle']}>
                      {editState.isEditingSummary
                        ? 'Update the key insights and takeaways from this retrospective'
                        : 'Document the key insights, decisions, and action items'}
                    </p>
                  </div>
                </div>
                <div className={styles['form-group']}>
                  <label htmlFor="summary-input">
                    <span>
                      {editState.isEditingSummary
                        ? 'Summary'
                        : 'What were the key takeaways from this retrospective?'}
                    </span>
                    <span className={styles['required-indicator']}>*</span>
                  </label>
                  <textarea
                    id="summary-input"
                    value={formState.summaryContent}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, summaryContent: e.target.value }))
                    }
                    placeholder={
                      editState.isEditingSummary
                        ? ''
                        : 'What were the key takeaways from this retrospective?'
                    }
                    rows={6}
                    maxLength={1000}
                    aria-label="Retrospective summary"
                    aria-describedby="summary-help summary-counter"
                    aria-invalid={
                      !formState.summaryContent.trim() || formState.summaryContent.length < 10
                    }
                    aria-required="true"
                    autoFocus
                  />
                  <div id="summary-help" className={styles['help-text']}>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>
                      Enter key insights, decisions, and action items from the retrospective.
                      Minimum 10 characters, maximum 1000 characters.
                    </span>
                  </div>
                  <div className={styles['form-footer']}>
                    <span
                      id="summary-counter"
                      className={`${styles['char-counter']} ${
                        formState.summaryContent.length > 900
                          ? styles['char-counter-error']
                          : formState.summaryContent.length > 800
                            ? styles['char-counter-warning']
                            : ''
                      }`}
                      aria-live="polite"
                    >
                      {formState.summaryContent.length}/1000 characters
                    </span>
                    {formState.summaryContent.length > 800 &&
                      formState.summaryContent.length <= 1000 && (
                        <span className={styles['warning-text']}>Approaching character limit</span>
                      )}
                  </div>
                  <div className={styles['form-actions']}>
                    <button
                      className={`${styles.button} ${styles['button-secondary']}`}
                      onClick={handleCancelSummary}
                      disabled={updateSummaryMutation.isPending}
                      aria-label="Cancel summary changes"
                    >
                      Cancel
                    </button>
                    <button
                      className={`${styles.button} ${styles['button-primary']}`}
                      onClick={handleSaveSummary}
                      disabled={!formState.summaryContent.trim() || updateSummaryMutation.isPending}
                      aria-label="Save summary"
                    >
                      {updateSummaryMutation.isPending ? (
                        <>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                          </svg>
                          Saving...
                        </>
                      ) : (
                        <>
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                            <polyline points="17 21 17 13 7 13 7 21" />
                            <polyline points="7 3 7 8 15 8" />
                          </svg>
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {retrospective?.summary ? (
                  <div className={styles['summary-content']}>
                    <p className={styles['summary-content-text']}>{retrospective.summary}</p>
                  </div>
                ) : (
                  <div className={styles['summary-empty-state']}>
                    <div className={styles['summary-empty-icon']} aria-hidden="true">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                        <line x1="16" y1="13" x2="8" y2="13" />
                        <line x1="16" y1="17" x2="8" y2="17" />
                        <polyline points="10 9 9 9 8 9" />
                      </svg>
                    </div>
                    <p className={styles['summary-empty-text']}>
                      No summary has been added yet. Add a summary to document key insights and
                      decisions from this retrospective.
                    </p>
                    <button
                      className={styles['add-summary-button']}
                      onClick={handleAddSummary}
                      disabled={isCompleted}
                      aria-label="Add retrospective summary"
                    >
                      + Add Summary
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {retrospective?.status !== RetrospectiveStatus.COMPLETED && (
            <div className={styles['complete-retro-section']}>
              <button
                className={`${styles.button} ${styles['button-primary']} ${styles['complete-button']}`}
                onClick={handleCompleteRetrospective}
                disabled={updateStatusMutation.isPending}
                aria-label="Mark retrospective as completed"
              >
                {updateStatusMutation.isPending ? 'Completing...' : '✓ Complete Retrospective'}
              </button>
              <p className={styles['complete-hint']}>
                Mark this retrospective as completed to finalize it and prevent further edits.
              </p>
            </div>
          )}
        </div>

        {uiState.showSuccessModal && (
          <div
            className={styles['modal-overlay']}
            onClick={() => setUiState((prev) => ({ ...prev, showSuccessModal: false }))}
            role="dialog"
            aria-modal="true"
            aria-labelledby="success-modal-title"
          >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div className={styles['modal-header']}>
                <h3 id="success-modal-title">Success</h3>
                <button
                  className={styles['close-button']}
                  onClick={() => setUiState((prev) => ({ ...prev, showSuccessModal: false }))}
                  aria-label="Close dialog"
                  type="button"
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
              <div className={styles['modal-content']}>
                <div className={styles['success-message']}>
                  <div className={styles['success-icon']}>✓</div>
                  <p>Sprint Retrospective completed successfully!</p>
                </div>
              </div>
              <div className={styles['modal-actions']}>
                <button
                  className={`${styles.button} ${styles['button-primary']}`}
                  onClick={() => setUiState((prev) => ({ ...prev, showSuccessModal: false }))}
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return <LoadingState variant="page" label="Loading Retrospective..." />;
};
