import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { apiService, definitionService } from '../../services';
import { useTeamStore } from '../../store';
import { logger } from '../../utils/logger';
import { queryKeys } from '../../hooks/queryKeys';
import { useToast } from '../../hooks/useToast';
import {
  ItemStatus,
  MoSCoWPriority,
  TaskStatus,
  type ProductBacklogItem,
  type Task,
  type BacklogAdjustment,
  type StakeholderFeedback,
  type RetroActionItem,
} from '../../types';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/common/Loading';
import { ToastContainer } from '../../components/common/ToastContainer';

import styles from './Backlog.module.css';
import { PendingAdjustments } from './PendingAdjustments';
import { PendingFeedback } from './PendingFeedback';
import { PendingRetroActionItems } from './PendingRetroActionItems';
import { BulkUploadModal } from './BulkUpload';
import { BacklogHeader, BacklogFilterBar, ActiveGoalBanner } from './components';
import { BoardView } from './views/BoardView';
import { ListView } from './views/ListView';
import {
  CreateItemModal,
  EditItemModal,
  ItemDetailModal,
  DeleteConfirmModal,
  ValidationModal,
} from './modals';
import { type ItemFormData, type FilterState } from './types/backlog.types';
import { MOSCOW_TO_BUSINESS_VALUE } from './config/moscow.config';
import { useBacklogMutations } from './hooks/useBacklogMutations';
import { useModalManager } from './hooks/useModalManager';
import { useBacklogData } from './hooks/useBacklogData';
import { useDefinitionOfReadyDone } from './hooks/useDefinitionOfReadyDone';
import { BacklogProvider, useBacklogContext } from './context/BacklogContext';
import {
  validateFormData,
  validateStatusTransition,
  validateItemForStatusChange,
} from './utils/validation';
import { getAutoValidationChecks } from './utils/statusTransitions';

const BacklogContent: React.FC = () => {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  const [filters, setFilters] = useState<FilterState>({
    status: [ItemStatus.NEW, ItemStatus.REFINED, ItemStatus.READY],
    search: '',
  });
  const [isLoadingChildTasks, setIsLoadingChildTasks] = useState(false);
  const { toasts, success, error: showError, removeToast } = useToast();

  const {
    formData,
    setFormData,
    setFormErrors,
    setLabelTags,
    setInitialFormData,
    setWorkflowError,
    selectedItem,
    setSelectedItem,
    resetForm,
  } = useBacklogContext();

  const { currentTeam } = useTeamStore();
  const teamId = currentTeam?.id;

  const { backlogData, activeGoal, filteredItems, isLoading, isLoadingGoals } = useBacklogData(
    teamId,
    filters
  );

  const { dorItems, dodItems } = useDefinitionOfReadyDone(teamId);

  const {
    showCreateModal,
    showEditModal,
    showDetailModal,
    showDeleteModal,
    showValidationModal,
    showBulkUploadModal,
    setShowCreateModal,
    setShowEditModal,
    setShowDetailModal,
    setShowDeleteModal,
    setShowValidationModal,
    setShowBulkUploadModal,
    validationType,
    setValidationType,
    validationChecks,
    setValidationChecks,
    pendingStatus,
    setPendingStatus,
  } = useModalManager();

  const { createItemMutation, updateItemMutation, editItemMutation, deleteItemMutation } =
    useBacklogMutations({
      resetForm,
      setFormErrors,
      setWorkflowError,
      setSelectedItem,
      onCreateSuccess: () => setShowCreateModal(false),
      onEditSuccess: () => {
        setShowEditModal(false);
        setShowDetailModal(false);
      },
      onDeleteSuccess: () => {
        setShowDeleteModal(false);
        setShowDetailModal(false);
      },
      onSuccessToast: success,
      onErrorToast: showError,
    });

  const doneCount = filteredItems.filter((item) => item.status === ItemStatus.DONE).length;

  const itemsByMoscow = useMemo(
    () => ({
      [MoSCoWPriority.MUST_HAVE]: filteredItems.filter(
        (item) => item.priority === MoSCoWPriority.MUST_HAVE
      ),
      [MoSCoWPriority.SHOULD_HAVE]: filteredItems.filter(
        (item) => item.priority === MoSCoWPriority.SHOULD_HAVE
      ),
      [MoSCoWPriority.COULD_HAVE]: filteredItems.filter(
        (item) => item.priority === MoSCoWPriority.COULD_HAVE
      ),
      [MoSCoWPriority.WONT_HAVE]: filteredItems.filter(
        (item) => item.priority === MoSCoWPriority.WONT_HAVE
      ),
    }),
    [filteredItems]
  );

  const validateForm = (isEditMode: boolean = false): boolean => {
    const result = validateFormData(formData, { teamId, activeGoalId: activeGoal?.id }, isEditMode);

    if (result.workflowError) {
      setWorkflowError(result.workflowError);
    }

    setFormErrors(result.errors);
    return result.isValid;
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setWorkflowError(null);
    setTimeout(() => {
      setInitialFormData({
        title: '',
        description: '',
        estimate: undefined,
        moscowPriority: MoSCoWPriority.COULD_HAVE,
        businessValue: MOSCOW_TO_BUSINESS_VALUE[MoSCoWPriority.COULD_HAVE],
        labels: '',
        acceptanceCriteria: '',
        status: ItemStatus.NEW,
      });
    }, 0);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleOpenDetailModal = (item: ProductBacklogItem) => {
    setSelectedItem(item);
    setWorkflowError(null);
    setShowDetailModal(true);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setSelectedItem(null);
    setWorkflowError(null);
  };

  const handleOpenEditModal = () => {
    if (!selectedItem) return;
    setWorkflowError(null);
    const editFormData: ItemFormData = {
      title: selectedItem.title,
      description: selectedItem.description ?? '',
      estimate: selectedItem.storyPoints,
      moscowPriority: selectedItem.priority,
      businessValue: selectedItem.businessValue,
      labels: selectedItem.labels.join(', '),
      acceptanceCriteria: selectedItem.acceptanceCriteria ?? '',
      status: selectedItem.status,
    };
    setFormData(editFormData);
    setLabelTags(selectedItem.labels);
    setInitialFormData(editFormData);
    setShowDetailModal(false);
    setShowEditModal(true);
  };

  const handleEditSubmit = () => {
    if (!selectedItem || !validateForm(true)) return;

    const labelsArray = formData.labels
      .split(',')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    editItemMutation.mutate({
      id: selectedItem.id,
      updates: {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        storyPoints: formData.estimate,
        priority: formData.moscowPriority,
        businessValue: formData.businessValue,
        labels: labelsArray,
        acceptanceCriteria: formData.acceptanceCriteria.trim() || undefined,
        status: formData.status,
      },
    });
  };

  const handleCreateSubmit = () => {
    if (!validateForm()) return;

    const labelsArray = formData.labels
      .split(',')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    createItemMutation.mutate({
      teamId,
      title: formData.title.trim(),
      description: formData.description.trim() || undefined,
      storyPoints: formData.estimate,
      priority: formData.moscowPriority,
      businessValue: formData.businessValue,
      labels: labelsArray,
      acceptanceCriteria: formData.acceptanceCriteria.trim() || undefined,
      status: formData.status,
      goalId: activeGoal?.id,
    });
  };

  const handleDeleteConfirm = () => {
    if (!selectedItem) return;
    deleteItemMutation.mutate(selectedItem.id);
  };

  const handleOpenDeleteModal = () => {
    setWorkflowError(null);
    setShowDetailModal(false);
    setShowDeleteModal(true);
  };

  const handleQuickStatusChange = async (newStatus: ItemStatus) => {
    if (!selectedItem) return;

    const validationResult = validateStatusTransition(selectedItem.status, newStatus);
    if (!validationResult.valid) {
      setWorkflowError(validationResult.message ?? 'Invalid status transition');
      return;
    }

    const fieldValidation = validateItemForStatusChange(selectedItem, newStatus);
    if (!fieldValidation.valid) {
      setWorkflowError(fieldValidation.message ?? null);
      return;
    }

    if (newStatus === ItemStatus.DONE) {
      setIsLoadingChildTasks(true);
      setWorkflowError(null);

      try {
        const response = await apiService.getTasksByPbiId(selectedItem.id);
        const tasks = response.data ?? [];

        const incompleteTasks = tasks.filter((task: Task) => task.status !== TaskStatus.DONE);

        if (incompleteTasks.length > 0) {
          const taskNames = incompleteTasks
            .slice(0, 3)
            .map((t: Task) => `"${t.title}"`)
            .join(', ');
          const moreCount =
            incompleteTasks.length > 3 ? ` and ${incompleteTasks.length - 3} more` : '';

          setWorkflowError(
            `Cannot mark as Done. The following child tasks must be completed first: ${taskNames}${moreCount}. ` +
              `Please complete all ${incompleteTasks.length} incomplete task(s) before changing the status to Done.`
          );
          setIsLoadingChildTasks(false);
          return;
        }

        setWorkflowError(null);
        setValidationType('done');
        setPendingStatus(newStatus);
        const autoChecks = getAutoValidationChecks(selectedItem, 'done');
        setValidationChecks(autoChecks);
        setShowValidationModal(true);
      } catch (error) {
        logger.error('Failed to fetch child tasks', undefined, { error });
        setWorkflowError('Failed to verify child tasks. Please try again.');
      } finally {
        setIsLoadingChildTasks(false);
      }
      return;
    }

    if (newStatus === ItemStatus.READY) {
      setWorkflowError(null);
      setValidationType('ready');
      setPendingStatus(newStatus);
      const autoChecks = getAutoValidationChecks(selectedItem, 'ready');
      setValidationChecks(autoChecks);
      setShowValidationModal(true);
      return;
    }

    executeStatusChange(newStatus);
  };

  const executeStatusChange = (newStatus: ItemStatus) => {
    if (!selectedItem) return;
    setWorkflowError(null);
    updateItemMutation.mutate(
      { id: selectedItem.id, updates: { status: newStatus } },
      {
        onSuccess: () => {
          setSelectedItem((prev) => (prev ? { ...prev, status: newStatus } : null));
          setShowValidationModal(false);
          setValidationChecks({});
          setPendingStatus(null);
        },
        onError: (error: unknown) => {
          const err = error as {
            response?: { status?: number; data?: { error?: { message?: string } } };
          };
          if (err.response?.status === 400 && err.response.data?.error?.message) {
            setWorkflowError(err.response.data.error.message);
          } else if (err.response?.status === 403) {
            setWorkflowError(
              err.response.data?.error?.message ??
                'You do not have permission to perform this status transition'
            );
          }
        },
      }
    );
  };

  const handleValidationCheckChange = (checkId: string, checked: boolean) => {
    setValidationChecks((prev) => ({ ...prev, [checkId]: checked }));
  };

  const handleValidationConfirm = async () => {
    if (!pendingStatus || !selectedItem) return;

    if (validationType === 'done') {
      try {
        const verifications = dodItems.map((item) => ({
          dodItemId: item.id,
          isVerified: validationChecks[item.id] ?? false,
        }));

        await definitionService.verifyDoDForPBI(selectedItem.id, verifications);
      } catch (error) {
        logger.error('Failed to save DoD verifications', undefined, { error });
        setWorkflowError('Failed to save DoD verifications. Please try again.');
        return;
      }
    }

    if (validationType === 'ready') {
      try {
        const verifications = dorItems.map((item) => ({
          dorItemId: item.id,
          isVerified: validationChecks[item.id] ?? false,
        }));

        await definitionService.verifyDoRForPBI(selectedItem.id, verifications);
      } catch (error) {
        logger.error('Failed to save DoR verifications', undefined, { error });
        setWorkflowError('Failed to save DoR verifications. Please try again.');
        return;
      }
    }

    executeStatusChange(pendingStatus);
  };

  const handleValidationCancel = () => {
    setShowValidationModal(false);
    setValidationChecks({});
    setPendingStatus(null);
    setValidationType(null);
    setWorkflowError(null);
  };

  if (isLoading || isLoadingGoals) {
    return <LoadingState variant="page" label="Loading Product Backlog..." />;
  }

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (!activeGoal) {
    return <EmptyState type="no-active-goal" variant="full-page" />;
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className={styles['product-backlog']} data-testid="product-backlog">
        <BacklogHeader
          itemCount={filteredItems.length}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onNewItem={handleOpenCreateModal}
          onBulkImport={() => setShowBulkUploadModal(true)}
        />

        <PendingAdjustments
          onImplementAdd={(adjustment: BacklogAdjustment) => {
            setFormData({
              title: adjustment.description,
              description: `Reason: ${adjustment.reason}`,
              estimate: undefined,
              moscowPriority: MoSCoWPriority.COULD_HAVE,
              businessValue: undefined,
              labels: '',
              acceptanceCriteria: '',
              status: ItemStatus.NEW,
            });
            setShowCreateModal(true);
          }}
        />

        <PendingFeedback
          onCreateWorkItem={(feedback: StakeholderFeedback) => {
            setFormData({
              title:
                feedback.content.substring(0, 100) + (feedback.content.length > 100 ? '...' : ''),
              description: `Feedback from ${feedback.authorName}:\n\n${feedback.content}`,
              estimate: undefined,
              moscowPriority: MoSCoWPriority.COULD_HAVE,
              businessValue: undefined,
              labels: feedback.category,
              acceptanceCriteria: '',
              status: ItemStatus.NEW,
            });
            setShowCreateModal(true);
          }}
        />

        <PendingRetroActionItems
          onCreateWorkItem={(actionItem: RetroActionItem) => {
            setFormData({
              title: actionItem.title,
              description: actionItem.description ?? `Action item from retrospective`,
              estimate: undefined,
              moscowPriority: MoSCoWPriority.COULD_HAVE,
              businessValue: undefined,
              labels: 'retro-action',
              acceptanceCriteria: '',
              status: ItemStatus.NEW,
            });
            setShowCreateModal(true);
          }}
        />

        <ActiveGoalBanner
          goal={activeGoal}
          backlogItems={backlogData?.data ?? []}
          itemsByMoscow={itemsByMoscow}
          doneCount={doneCount}
          totalCount={filteredItems.length}
        />

        <BacklogFilterBar filters={filters} onFiltersChange={setFilters} />

        {viewMode === 'board' && (
          <BoardView
            itemsByMoscow={itemsByMoscow}
            onItemClick={handleOpenDetailModal}
            onPriorityChange={(itemId, newPriority) => {
              updateItemMutation.mutate({ id: itemId, updates: { priority: newPriority } });
            }}
          />
        )}

        {viewMode === 'list' && (
          <ListView items={filteredItems} onItemClick={handleOpenDetailModal} />
        )}

        <CreateItemModal
          isOpen={showCreateModal}
          onClose={handleCloseCreateModal}
          onSubmit={handleCreateSubmit}
          isSubmitting={createItemMutation.isPending}
          activeGoalId={activeGoal.id}
        />

        <ItemDetailModal
          isOpen={showDetailModal}
          onClose={handleCloseDetailModal}
          onEdit={handleOpenEditModal}
          onDelete={handleOpenDeleteModal}
          onStatusChange={handleQuickStatusChange}
          isUpdating={updateItemMutation.isPending}
          isLoadingChildTasks={isLoadingChildTasks}
        />

        <EditItemModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setWorkflowError(null);
            resetForm();
          }}
          onSubmit={handleEditSubmit}
          isSubmitting={editItemMutation.isPending}
        />

        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setWorkflowError(null);
          }}
          onConfirm={handleDeleteConfirm}
          isDeleting={deleteItemMutation.isPending}
        />

        <ValidationModal
          isOpen={showValidationModal}
          validationType={validationType}
          dorItems={dorItems}
          dodItems={dodItems}
          validationChecks={validationChecks}
          onCheckChange={handleValidationCheckChange}
          onConfirm={handleValidationConfirm}
          onCancel={handleValidationCancel}
          isUpdating={updateItemMutation.isPending}
        />

        <BulkUploadModal
          isOpen={showBulkUploadModal}
          onClose={() => setShowBulkUploadModal(false)}
          teamId={teamId || ''}
          goalId={activeGoal.id || ''}
          existingItems={backlogData?.data ?? []}
          onUploadComplete={() => {
            void queryClient.invalidateQueries({ queryKey: queryKeys.productBacklog.all });
            void queryClient.invalidateQueries({ queryKey: queryKeys.productGoal.all });
          }}
        />
      </div>
    </>
  );
};

export const ProductBacklog: React.FC = () => {
  return (
    <BacklogProvider>
      <BacklogContent />
    </BacklogProvider>
  );
};
