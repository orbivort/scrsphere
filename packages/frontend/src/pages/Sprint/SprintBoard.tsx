import React, { useState, useReducer, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { apiService } from '../../services';
import { useTeamStore } from '../../store';
import { logger } from '../../utils/logger';
import { useDebounce, useToast } from '../../hooks';
import { ToastContainer } from '../../components/common/ToastContainer/ToastContainer';
import {
  TaskStatus as TaskStatusEnum,
  ImpedimentStatus,
  type Task,
  type TaskStatus,
} from '../../types';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/common/Loading';

import { DoDVerificationModal } from './components/DoDVerificationModal';
import type { ViewMode, SwimlaneGroup } from './SprintBoard.types';
import { TASK_STATUS_CONFIG } from './SprintBoard.constants';
import {
  initialModalState,
  modalReducer,
  initialFormState,
  formReducer,
} from './SprintBoard.state';
import {
  useSprintBoardData,
  useTaskMutations,
  useTaskFormValidation,
  useDragAndDrop,
  useKeyboardNavigation,
  useFocusTrap,
} from './SprintBoard.hooks';
import { useModalHandlers } from './SprintBoard.modalHandlers';
import {
  SprintBoardHeader,
  BoardFilters,
  WipWarnings,
  KanbanColumn,
  SwimlanesBoard,
  BurndownChart,
  SprintOverview,
} from './components';
import {
  TaskDetailModal,
  TaskEditModal,
  TaskCreateModal,
  DeleteConfirmModal,
  CompleteSprintModal,
  KeyboardHelpModal,
} from './components/modals';
import { SprintBacklogManager } from './SprintBacklogManager';
import styles from './SprintBoard.module.css';

export const SprintBoard: React.FC = () => {
  const { currentTeam } = useTeamStore();
  const navigate = useNavigate();
  const teamId = currentTeam?.id;

  const [modalState, modalDispatch] = useReducer(modalReducer, initialModalState);
  const {
    showTaskModal,
    showDetailModal,
    showEditModal,
    showDeleteConfirm,
    showCompleteSprintModal,
    showBacklogManager,
    showDodVerification,
    showKeyboardHelp,
    selectedTask,
    completeSprintError,
    workflowError,
  } = modalState;

  const [formState, formDispatch] = useReducer(formReducer, initialFormState);
  const { formData, formErrors } = formState;

  const { toasts, success: toastSuccess, error: toastError, removeToast } = useToast();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [swimlaneGroup, setSwimlaneGroup] = useState<SwimlaneGroup>('none');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterPbi, setFilterPbi] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [showBurndown, setShowBurndown] = useState(false);
  const [showBurndownDataTable, setShowBurndownDataTable] = useState(false);

  const detailModalRef = useRef<HTMLDivElement>(null);
  const editModalRef = useRef<HTMLDivElement>(null);
  const createModalRef = useRef<HTMLDivElement>(null);
  const deleteModalRef = useRef<HTMLDivElement>(null);
  const completeSprintModalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(showDetailModal, detailModalRef);
  useFocusTrap(showEditModal, editModalRef);
  useFocusTrap(showTaskModal, createModalRef);
  useFocusTrap(showDeleteConfirm, deleteModalRef);
  useFocusTrap(showCompleteSprintModal, completeSprintModalRef);

  const boardData = useSprintBoardData({
    teamId,
    showBurndown,
    showDodVerification,
    filterAssignee,
    filterPbi,
    debouncedSearchQuery,
    swimlaneGroup,
  });

  const {
    sprint,
    tasks,
    teamMembers,
    sprintItems,
    dodItems,
    impediments,
    dodVerifications,
    sprintLoading,
    tasksLoading,
    wipLimits,
    filteredTasks,
    tasksByStatus,
    sprintStats,
    daysRemaining,
    sprintDuration,
    burndownChartData,
    wipWarnings,
    groupedBySwimlane,
  } = boardData;

  const handleSetFormErrors = useCallback((errors: Record<string, string | undefined>) => {
    formDispatch({
      type: 'SET_FORM_ERRORS',
      payload: errors as Record<string, string | undefined>,
    });
  }, []);

  const formValidation = useTaskFormValidation({
    formData,
    selectedTask,
    onSetFormErrors: handleSetFormErrors,
  });

  const { validateForm, validateAndPrepareTransition, getAvailableTransitions } = formValidation;

  const closeModal = useCallback(() => {
    modalDispatch({ type: 'CLOSE_CREATE_MODAL' });
    modalDispatch({ type: 'CLOSE_DELETE_CONFIRM' });
    modalDispatch({ type: 'CLOSE_DETAIL_MODAL' });
    modalDispatch({ type: 'CLOSE_EDIT_MODAL' });
    formDispatch({ type: 'RESET_FORM' });
  }, []);

  const handleSetCompleteSprintError = useCallback((error: string | null) => {
    modalDispatch({ type: 'SET_COMPLETE_SPRINT_ERROR', payload: error });
  }, []);

  const handleNavigateToIncrement = useCallback(
    (sprintId: string) => {
      navigate(`/increment/create?sprintId=${sprintId}&fromSprintComplete=true`);
    },
    [navigate]
  );

  const showToast = useCallback(
    (type: 'success' | 'error' | 'warning' | 'info', message: string) => {
      switch (type) {
        case 'success':
          toastSuccess(message);
          break;
        case 'error':
          toastError(message);
          break;
      }
    },
    [toastSuccess, toastError]
  );

  const handleCloseCompleteSprintModal = useCallback(() => {
    modalDispatch({ type: 'CLOSE_COMPLETE_SPRINT_MODAL' });
  }, []);

  const mutations = useTaskMutations({
    sprintId: sprint?.id,
    teamId,
    onCloseModal: closeModal,
    onCloseCompleteSprintModal: handleCloseCompleteSprintModal,
    onSetCompleteSprintError: handleSetCompleteSprintError,
    onNavigateToIncrement: handleNavigateToIncrement,
    showToast,
  });

  const handleSetWorkflowError = useCallback((error: string | null) => {
    modalDispatch({ type: 'SET_WORKFLOW_ERROR', payload: error });
  }, []);

  const handleMoveTask = useCallback(
    (taskId: string, updates: Partial<Task>) => {
      mutations.updateTaskMutation.mutate({ taskId, updates });
    },
    [mutations.updateTaskMutation]
  );

  const dragAndDrop = useDragAndDrop({
    tasks,
    wipLimits,
    tasksByStatus,
    teamId,
    validateAndPrepareTransition,
    onMoveTask: handleMoveTask,
    showToast,
    onSetWorkflowError: handleSetWorkflowError,
  });

  const {
    draggedTaskId,
    dropTargetColumn,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleDragOver,
    handleDragLeave,
  } = dragAndDrop;

  const isModalOpen =
    showDetailModal ||
    showEditModal ||
    showTaskModal ||
    showDeleteConfirm ||
    showCompleteSprintModal ||
    showKeyboardHelp;

  const openDetailModal = useCallback((task: Task) => {
    modalDispatch({ type: 'OPEN_DETAIL_MODAL', payload: task });
    formDispatch({ type: 'INITIALIZE_FORM_FOR_EDIT', payload: task });
  }, []);

  const keyboardNav = useKeyboardNavigation({
    tasks,
    filteredTasks,
    tasksByStatus,
    wipLimits,
    teamId,
    validateAndPrepareTransition,
    onMoveTask: handleMoveTask,
    onOpenDetail: openDetailModal,
    onOpenKeyboardHelp: () => modalDispatch({ type: 'OPEN_KEYBOARD_HELP' }),
    onOpenCreateModal: () => modalDispatch({ type: 'OPEN_CREATE_MODAL' }),
    onToggleBurndown: () => setShowBurndown((prev) => !prev),
    showToast,
    isModalOpen,
  });

  const {
    focusedTaskId,
    setFocusedTaskId,
    keyboardGrabState,
    keyboardDraggedTaskId,
    keyboardDropTargetStatus,
    handleKeyDown,
  } = keyboardNav;

  const modalHandlers = useModalHandlers({
    modalDispatch,
    formDispatch,
    selectedTask,
    sprintItems,
  });

  const { openCreateModal, openEditModal, closeDetailModal, closeEditModal, handleFormDataChange } =
    modalHandlers;

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) return;

      const taskData: Partial<Task> = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        pbiId: formData.pbiId || selectedTask?.pbiId,
        assigneeId: formData.assigneeId || undefined,
        status: formData.status,
        estimatedHours: formData.estimatedHours || undefined,
        remainingHours:
          formData.remainingHours !== undefined && formData.remainingHours !== null
            ? formData.remainingHours
            : undefined,
        sprintId: sprint?.id,
      };

      if (selectedTask) {
        mutations.updateTaskMutation.mutate({ taskId: selectedTask.id, updates: taskData });
      } else {
        mutations.createTaskMutation.mutate(taskData);
      }
    },
    [formData, selectedTask, sprint?.id, validateForm, mutations]
  );

  const handleOpenCompleteSprintModal = useCallback(() => {
    modalDispatch({ type: 'OPEN_COMPLETE_SPRINT_MODAL' });
  }, []);

  const incompleteTasksCount = tasks.filter((t) => t.status !== TaskStatusEnum.DONE).length;
  const incompletePbisCount = new Set(
    tasks.filter((t) => t.status !== TaskStatusEnum.DONE).map((t) => t.pbiId)
  ).size;
  const incompleteTasksList = tasks
    .filter((t) => t.status !== TaskStatusEnum.DONE)
    .map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      pbiTitle: task.pbi?.title || 'Unknown PBI',
      assigneeId: task.assigneeId,
    }));

  const outstandingImpediments = impediments.filter(
    (imp) => imp.status !== ImpedimentStatus.RESOLVED && imp.status !== ImpedimentStatus.CLOSED
  );
  const outstandingImpedimentsCount = outstandingImpediments.length;
  const hasIncompleteTasks = incompleteTasksCount > 0;
  const hasOutstandingImpediments = outstandingImpedimentsCount > 0;

  const handleProceedToDodVerification = useCallback(() => {
    if (hasIncompleteTasks || hasOutstandingImpediments) return;
    modalDispatch({ type: 'CLOSE_COMPLETE_SPRINT_MODAL' });
    modalDispatch({ type: 'OPEN_DOD_VERIFICATION' });
  }, [hasIncompleteTasks, hasOutstandingImpediments]);

  const handleDodVerificationConfirm = useCallback(
    async (verifications: { pbiId: string; dodItemId: string; isVerified: boolean }[]) => {
      try {
        const pbiVerifications = new Map<string, { dodItemId: string; isVerified: boolean }[]>();

        for (const v of verifications) {
          if (!pbiVerifications.has(v.pbiId)) {
            pbiVerifications.set(v.pbiId, []);
          }
          pbiVerifications.get(v.pbiId)!.push({ dodItemId: v.dodItemId, isVerified: v.isVerified });
        }

        const savePromises: Promise<unknown>[] = [];
        pbiVerifications.forEach((items, pbiId) => {
          savePromises.push(apiService.verifyDoDForPBI(pbiId, items));
        });

        await Promise.all(savePromises);

        modalDispatch({ type: 'CLOSE_DOD_VERIFICATION' });
        mutations.completeSprintMutation.mutate();
      } catch (error) {
        logger.error('Failed to save DoD verifications', undefined, { error });
        toastError('Failed to save DoD verifications. Please try again.');
      }
    },
    [mutations.completeSprintMutation, toastError]
  );

  const handleDodVerificationCancel = useCallback(() => {
    modalDispatch({ type: 'CLOSE_DOD_VERIFICATION' });
    modalDispatch({ type: 'OPEN_COMPLETE_SPRINT_MODAL' });
  }, []);

  const handleQuickStatusChange = useCallback(
    (newStatus: TaskStatus) => {
      if (!selectedTask) return;

      const result = validateAndPrepareTransition(selectedTask, newStatus, {
        checkWipLimits: true,
        wipLimits,
        tasksByStatus,
        checkRequiredFields: true,
      });

      if (!result.valid) {
        modalDispatch({ type: 'SET_WORKFLOW_ERROR', payload: result.error! });
        toastError(result.error!);
        return;
      }

      if (newStatus === TaskStatusEnum.IN_PROGRESS) {
        const formErrors: string[] = [];
        if (!formData.assigneeId) {
          formErrors.push('Assignee is required');
        }
        if (!formData.estimatedHours || formData.estimatedHours <= 0) {
          formErrors.push('Estimated hours must be greater than 0');
        }
        if (
          formData.remainingHours === undefined ||
          formData.remainingHours === null ||
          formData.remainingHours <= 0
        ) {
          formErrors.push('Remaining hours must be greater than 0');
        }

        if (formErrors.length > 0) {
          const errorMessage = `Cannot move to In Progress: ${formErrors.join(', ')}`;
          modalDispatch({ type: 'SET_WORKFLOW_ERROR', payload: errorMessage });
          toastError(errorMessage);
          return;
        }
      }

      modalDispatch({ type: 'SET_WORKFLOW_ERROR', payload: null });

      mutations.updateTaskMutation.mutate(
        { taskId: selectedTask.id, updates: result.updates! },
        {
          onSuccess: () => {
            if (selectedTask) {
              modalDispatch({
                type: 'OPEN_DETAIL_MODAL',
                payload: {
                  ...selectedTask,
                  status: newStatus,
                  remainingHours:
                    newStatus === TaskStatusEnum.DONE ? 0 : selectedTask.remainingHours,
                },
              });
            }
            formDispatch({
              type: 'SET_FORM_DATA',
              payload: {
                status: newStatus,
                remainingHours: newStatus === TaskStatusEnum.DONE ? 0 : formData.remainingHours,
              },
            });
            toastSuccess(
              `Task status changed to ${TASK_STATUS_CONFIG[newStatus].label}${newStatus === TaskStatusEnum.DONE ? ' (Remaining hours set to 0)' : ''}`
            );
          },
          onError: (error: unknown) => {
            const err = error as {
              response?: { data?: { error?: { message?: string } } };
              message?: string;
            };
            const errorMessage =
              err.response?.data?.error?.message || err.message || 'Failed to update task status';
            modalDispatch({ type: 'SET_WORKFLOW_ERROR', payload: errorMessage });
          },
        }
      );
    },
    [
      selectedTask,
      validateAndPrepareTransition,
      wipLimits,
      tasksByStatus,
      formData,
      mutations.updateTaskMutation,
      toastError,
      toastSuccess,
    ]
  );

  const handleDeleteConfirm = useCallback(() => {
    if (selectedTask) {
      mutations.deleteTaskMutation.mutate(selectedTask.id);
    }
  }, [selectedTask, mutations.deleteTaskMutation]);

  const handleMoveStatus = useCallback(
    (taskId: string, newStatus: TaskStatus) => {
      const task = tasks.find((t) => t.id === taskId);

      if (!task) {
        toastError('Task not found');
        return;
      }

      if (task.status === newStatus) {
        return;
      }

      const result = validateAndPrepareTransition(task, newStatus, {
        checkWipLimits: true,
        wipLimits,
        tasksByStatus,
        checkRequiredFields: true,
      });

      if (!result.valid) {
        toastError(result.error!);
        return;
      }

      mutations.updateTaskMutation.mutate({ taskId, updates: result.updates! });
    },
    [
      tasks,
      validateAndPrepareTransition,
      wipLimits,
      tasksByStatus,
      mutations.updateTaskMutation,
      toastError,
    ]
  );

  if (sprintLoading || tasksLoading) {
    return <LoadingState variant="page" label="Loading sprint board..." />;
  }

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (!sprint) {
    return <EmptyState type="no-active-sprint" variant="full-page" />;
  }

  return (
    <div
      className={styles['sprint-board']}
      role="main"
      aria-label="Sprint Board"
      data-testid="sprint-board"
    >
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <SprintBoardHeader
        sprint={sprint}
        daysRemaining={daysRemaining}
        onKeyboardHelp={() => modalDispatch({ type: 'OPEN_KEYBOARD_HELP' })}
        onToggleBurndown={() => setShowBurndown(!showBurndown)}
        onOpenBacklogManager={() => modalDispatch({ type: 'OPEN_BACKLOG_MANAGER' })}
        onOpenCreateModal={openCreateModal}
        onCompleteSprint={handleOpenCompleteSprintModal}
        showBurndown={showBurndown}
      />

      {sprint && (
        <SprintOverview
          sprintGoal={sprint.sprintGoal}
          totalTasks={sprintStats.totalTasks}
          todoTasks={sprintStats.todoTasks}
          inProgressTasks={sprintStats.inProgressTasks}
          doneTasks={sprintStats.doneTasks}
          totalEstimatedHours={sprintStats.totalEstimatedHours}
          totalRemainingHours={sprintStats.totalRemainingHours}
          progressPercentage={sprintStats.progressPercentage}
          totalPbis={sprintStats.totalPbis}
          completedPbis={sprintStats.completedPbis}
          totalStoryPoints={sprintStats.totalStoryPoints}
          completedStoryPoints={sprintStats.completedStoryPoints}
        />
      )}

      {showBurndown && (
        <BurndownChart
          sprintName={sprint.name}
          sprintDuration={sprintDuration}
          daysRemaining={daysRemaining}
          totalEstimatedHours={sprintStats.totalEstimatedHours}
          totalRemainingHours={sprintStats.totalRemainingHours}
          progressPercentage={sprintStats.progressPercentage}
          burndownChartData={burndownChartData}
          showDataTable={showBurndownDataTable}
          onToggleDataTable={() => setShowBurndownDataTable(!showBurndownDataTable)}
          onClose={() => setShowBurndown(false)}
        />
      )}

      <BoardFilters
        filterAssignee={filterAssignee}
        filterPbi={filterPbi}
        searchQuery={searchQuery}
        viewMode={viewMode}
        swimlaneGroup={swimlaneGroup}
        teamMembers={teamMembers}
        sprintItems={sprintItems}
        onFilterAssigneeChange={setFilterAssignee}
        onFilterPbiChange={setFilterPbi}
        onSearchQueryChange={setSearchQuery}
        onViewModeChange={setViewMode}
        onSwimlaneGroupChange={setSwimlaneGroup}
      />

      <WipWarnings warnings={wipWarnings} />

      <div
        id="kanban-board"
        className={`${styles['kanban-board']} ${viewMode === 'swimlanes' ? styles['swimlanes-view'] : ''}`}
        role="list"
        aria-label="Task board"
        tabIndex={-1}
      >
        {viewMode === 'kanban' ? (
          <>
            <KanbanColumn
              status={TaskStatusEnum.TODO}
              title="TO DO"
              tasks={tasksByStatus.todo}
              wipLimit={wipLimits.todo}
              allTasksByStatus={tasksByStatus}
              wipLimits={wipLimits}
              draggedTaskId={draggedTaskId}
              dropTargetColumn={dropTargetColumn}
              focusedTaskId={focusedTaskId}
              keyboardGrabState={keyboardGrabState}
              keyboardDropTargetStatus={keyboardDropTargetStatus}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onTaskClick={openDetailModal}
              onKeyDown={handleKeyDown}
              onFocus={setFocusedTaskId}
              onBlur={() => setFocusedTaskId(null)}
              onMoveStatus={handleMoveStatus}
            />

            <KanbanColumn
              status={TaskStatusEnum.IN_PROGRESS}
              title="IN PROGRESS"
              tasks={tasksByStatus.in_progress}
              wipLimit={wipLimits.in_progress}
              allTasksByStatus={tasksByStatus}
              wipLimits={wipLimits}
              draggedTaskId={draggedTaskId}
              dropTargetColumn={dropTargetColumn}
              focusedTaskId={focusedTaskId}
              keyboardGrabState={keyboardGrabState}
              keyboardDropTargetStatus={keyboardDropTargetStatus}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onTaskClick={openDetailModal}
              onKeyDown={handleKeyDown}
              onFocus={setFocusedTaskId}
              onBlur={() => setFocusedTaskId(null)}
              onMoveStatus={handleMoveStatus}
            />

            <KanbanColumn
              status={TaskStatusEnum.DONE}
              title="DONE"
              tasks={tasksByStatus.done}
              wipLimit={wipLimits.done}
              allTasksByStatus={tasksByStatus}
              wipLimits={wipLimits}
              draggedTaskId={draggedTaskId}
              dropTargetColumn={dropTargetColumn}
              focusedTaskId={focusedTaskId}
              keyboardGrabState={keyboardGrabState}
              keyboardDropTargetStatus={keyboardDropTargetStatus}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onTaskClick={openDetailModal}
              onKeyDown={handleKeyDown}
              onFocus={setFocusedTaskId}
              onBlur={() => setFocusedTaskId(null)}
              onMoveStatus={handleMoveStatus}
            />
          </>
        ) : (
          <SwimlanesBoard
            groupedBySwimlane={groupedBySwimlane}
            swimlaneGroup={swimlaneGroup}
            teamMembers={teamMembers}
            sprintItems={sprintItems}
            tasksByStatus={tasksByStatus}
            draggedTaskId={draggedTaskId}
            dropTargetColumn={dropTargetColumn}
            focusedTaskId={focusedTaskId}
            keyboardGrabState={keyboardGrabState}
            keyboardDraggedTaskId={keyboardDraggedTaskId}
            keyboardDropTargetStatus={keyboardDropTargetStatus}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onTaskClick={openDetailModal}
            onKeyDown={handleKeyDown}
            onFocus={setFocusedTaskId}
            onBlur={() => setFocusedTaskId(null)}
          />
        )}
      </div>

      {showDetailModal && selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          workflowError={workflowError}
          onClose={closeDetailModal}
          onEdit={openEditModal}
          onDelete={() => {
            modalDispatch({ type: 'CLOSE_DETAIL_MODAL' });
            modalDispatch({ type: 'OPEN_DELETE_CONFIRM', payload: selectedTask });
          }}
          onStatusChange={handleQuickStatusChange}
          onClearWorkflowError={() => modalDispatch({ type: 'SET_WORKFLOW_ERROR', payload: null })}
          getAvailableTransitions={getAvailableTransitions}
          isUpdating={mutations.updateTaskMutation.isPending}
          modalRef={detailModalRef}
        />
      )}

      {showEditModal && selectedTask && (
        <TaskEditModal
          task={selectedTask}
          formData={formData}
          formErrors={formErrors}
          workflowError={workflowError}
          sprintItems={sprintItems}
          teamMembers={teamMembers}
          onClose={closeEditModal}
          onBackToDetails={() => {
            modalDispatch({ type: 'CLOSE_EDIT_MODAL' });
            modalDispatch({ type: 'OPEN_DETAIL_MODAL', payload: selectedTask! });
          }}
          onSubmit={handleSubmit}
          onFormDataChange={handleFormDataChange}
          isUpdating={mutations.updateTaskMutation.isPending}
          modalRef={editModalRef}
        />
      )}

      {showTaskModal && (
        <TaskCreateModal
          formData={formData}
          formErrors={formErrors}
          workflowError={workflowError}
          sprintItems={sprintItems}
          teamMembers={teamMembers}
          onClose={closeModal}
          onSubmit={handleSubmit}
          onFormDataChange={handleFormDataChange}
          isCreating={mutations.createTaskMutation.isPending}
          modalRef={createModalRef}
        />
      )}

      {showDeleteConfirm && selectedTask && (
        <DeleteConfirmModal
          task={selectedTask}
          onClose={() => modalDispatch({ type: 'CLOSE_DELETE_CONFIRM' })}
          onConfirm={handleDeleteConfirm}
          isDeleting={mutations.deleteTaskMutation.isPending}
          modalRef={deleteModalRef}
        />
      )}

      {showCompleteSprintModal && (
        <CompleteSprintModal
          sprintName={sprint?.name || ''}
          daysRemaining={daysRemaining}
          sprintStats={{
            totalTasks: sprintStats.totalTasks,
            doneTasks: sprintStats.doneTasks,
            completedStoryPoints: sprintStats.completedStoryPoints,
            totalStoryPoints: sprintStats.totalStoryPoints,
            progressPercentage: sprintStats.progressPercentage,
          }}
          incompleteTasks={incompleteTasksList}
          incompleteTasksCount={incompleteTasksCount}
          incompletePbisCount={incompletePbisCount}
          outstandingImpediments={outstandingImpediments}
          outstandingImpedimentsCount={outstandingImpedimentsCount}
          completeSprintError={completeSprintError}
          onClose={handleCloseCompleteSprintModal}
          onProceedToDodVerification={handleProceedToDodVerification}
          onManageBacklog={() => {
            modalDispatch({ type: 'CLOSE_COMPLETE_SPRINT_MODAL' });
            modalDispatch({ type: 'OPEN_BACKLOG_MANAGER' });
          }}
          onViewImpediments={() => {
            modalDispatch({ type: 'CLOSE_COMPLETE_SPRINT_MODAL' });
            navigate('/impediments');
          }}
          isCompleting={mutations.completeSprintMutation.isPending}
          modalRef={completeSprintModalRef}
        />
      )}

      <DoDVerificationModal
        isOpen={showDodVerification}
        onClose={handleDodVerificationCancel}
        onConfirm={handleDodVerificationConfirm}
        dodItems={dodItems}
        pbis={sprintItems}
        tasks={tasks}
        isLoading={mutations.completeSprintMutation.isPending}
        existingVerifications={dodVerifications}
      />

      {showBacklogManager && sprint && (
        <SprintBacklogManager
          sprintId={sprint.id}
          sprintName={sprint.name}
          sprintGoal={sprint.sprintGoal}
          onClose={() => modalDispatch({ type: 'CLOSE_BACKLOG_MANAGER' })}
        />
      )}

      {showKeyboardHelp && (
        <KeyboardHelpModal onClose={() => modalDispatch({ type: 'CLOSE_KEYBOARD_HELP' })} />
      )}
    </div>
  );
};
