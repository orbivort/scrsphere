import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiService } from '../../services';
import { useTeamStore } from '../../store';
import { logger } from '../../utils/logger';
import { MoSCoWPriority, type ProductBacklogItem, type Task } from '../../types';
import { queryKeys } from '../../hooks/queryKeys';
import { ToastContainer } from '../../components/common/ToastContainer';
import { useToast } from '../../hooks/useToast';
import { ArrowLeftIcon, PlusIcon } from '../../components/common/Icons';

import styles from './SprintBacklogManager.module.css';

interface TaskGenerationConfig {
  taskCount: number;
  estimatedHours: number;
}

const STORY_POINTS_TO_TASKS: Record<number, TaskGenerationConfig> = {
  1: { taskCount: 1, estimatedHours: 2 },
  2: { taskCount: 1, estimatedHours: 4 },
  3: { taskCount: 1, estimatedHours: 8 },
  5: { taskCount: 2, estimatedHours: 8 },
  8: { taskCount: 3, estimatedHours: 8 },
  13: { taskCount: 5, estimatedHours: 8 },
};

const generateDraftTaskData = (
  pbiId: string,
  pbiTitle: string,
  storyPoints: number
): Array<{
  pbiId: string;
  title: string;
  estimatedHours: number;
  remainingHours: number;
}> => {
  const config = STORY_POINTS_TO_TASKS[storyPoints] ?? { taskCount: 1, estimatedHours: 8 };
  const tasks: Array<{
    pbiId: string;
    title: string;
    estimatedHours: number;
    remainingHours: number;
  }> = [];

  for (let i = 0; i < config.taskCount; i++) {
    const taskTitle =
      config.taskCount === 1 ? `Adhoc: ${pbiTitle} - Task` : `Adhoc: ${pbiTitle} - Task ${i + 1}`;

    tasks.push({
      pbiId,
      title: taskTitle,
      estimatedHours: config.estimatedHours,
      remainingHours: config.estimatedHours,
    });
  }

  return tasks;
};

interface SprintBacklogManagerProps {
  sprintId: string;
  sprintName: string;
  sprintGoal?: string;
  onClose: () => void;
}

interface SprintBacklogItem extends ProductBacklogItem {
  tasks: Task[];
}

interface RemoveItemData {
  pbiId: string;
  pbiTitle: string;
  taskCount: number;
}

type TaskAction = 'delete' | 'return_to_backlog' | 'keep_in_sprint';

const priorityLabels: Record<MoSCoWPriority, { label: string; color: string }> = {
  [MoSCoWPriority.MUST_HAVE]: { label: 'MUST', color: '#ef4444' },
  [MoSCoWPriority.SHOULD_HAVE]: { label: 'SHOULD', color: '#f59e0b' },
  [MoSCoWPriority.COULD_HAVE]: { label: 'COULD', color: '#3b82f6' },
  [MoSCoWPriority.WONT_HAVE]: { label: "WON'T", color: '#6b7280' },
};

export const SprintBacklogManager: React.FC<SprintBacklogManagerProps> = ({
  sprintId,
  sprintName,
  sprintGoal,
  onClose,
}) => {
  const { currentTeam } = useTeamStore();
  const queryClient = useQueryClient();
  const teamId = currentTeam?.id;

  const { toasts, success, error: showError, warning, removeToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [selectedItemForRemoval, setSelectedItemForRemoval] = useState<RemoveItemData | null>(null);
  const [taskAction, setTaskAction] = useState<TaskAction>('return_to_backlog');
  const [removeReason, setRemoveReason] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addReason, setAddReason] = useState('');

  const { data: sprintData, isLoading: sprintLoading } = useQuery({
    queryKey: ['activeSprint', teamId],
    queryFn: () => {
      if (!teamId) throw new Error('Team ID is required');
      return apiService.getActiveSprint(teamId);
    },
    enabled: !!teamId,
  });

  const { data: tasksData } = useQuery({
    queryKey: ['sprintTasks', sprintId],
    queryFn: () => apiService.getSprintTasks(sprintId),
    enabled: !!sprintId,
  });

  const { data: availablePBIsData, isLoading: availableLoading } = useQuery({
    queryKey: ['availablePBIs', teamId],
    queryFn: () => {
      if (!teamId) throw new Error('Team ID is required');
      return apiService.getAvailablePBIsForSprint(teamId);
    },
    enabled: !!teamId && showAddModal,
  });

  const { data: changesData } = useQuery({
    queryKey: ['sprintBacklogChanges', sprintId],
    queryFn: () => apiService.getSprintBacklogChanges(sprintId, 10),
    enabled: !!sprintId,
  });

  const sprintItems: ProductBacklogItem[] = useMemo(
    () => sprintData?.data?.items ?? [],
    [sprintData]
  );
  const tasks: Task[] = useMemo(() => tasksData?.data ?? [], [tasksData]);
  const availablePBIs: ProductBacklogItem[] = useMemo(
    () => availablePBIsData?.data ?? [],
    [availablePBIsData]
  );
  const recentChanges = changesData?.data ?? [];

  const sprintBacklogItems: SprintBacklogItem[] = useMemo(() => {
    return sprintItems.map((item) => ({
      ...item,
      tasks: tasks.filter((task) => task.pbiId === item.id),
    }));
  }, [sprintItems, tasks]);

  const sprintStats = useMemo(() => {
    const totalItems = sprintBacklogItems.length;
    const totalPoints = sprintBacklogItems.reduce((sum, item) => sum + (item.storyPoints ?? 0), 0);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
    const totalRemainingHours = tasks.reduce(
      (sum, t) => sum + (t.remainingHours ?? t.estimatedHours ?? 0),
      0
    );

    return {
      totalItems,
      totalPoints,
      totalTasks,
      completedTasks,
      totalEstimatedHours,
      totalRemainingHours,
      progressPercentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    };
  }, [sprintBacklogItems, tasks]);

  const filteredAvailablePBIs = useMemo(() => {
    if (!searchQuery) return availablePBIs;
    const query = searchQuery.toLowerCase();
    return availablePBIs.filter(
      (pbi) =>
        pbi.title.toLowerCase().includes(query) || pbi.description?.toLowerCase().includes(query)
    );
  }, [availablePBIs, searchQuery]);

  const addPBIMutation = useMutation({
    mutationFn: async (pbiId: string) => {
      const result = await apiService.addPBIToSprint(sprintId, pbiId, addReason || undefined);
      return { ...result, pbiId };
    },
    onSuccess: async (response) => {
      const pbiId = response.pbiId;
      const pbi = availablePBIs.find((item) => item.id === pbiId);

      if (pbi) {
        const draftTasks = generateDraftTaskData(pbiId, pbi.title, pbi.storyPoints ?? 0);

        try {
          const createTaskPromises = draftTasks.map((taskData) =>
            apiService.createTask(sprintId, {
              pbiId: taskData.pbiId,
              title: taskData.title,
              estimatedHours: taskData.estimatedHours,
              remainingHours: taskData.remainingHours,
            })
          );

          await Promise.all(createTaskPromises);

          const taskInfo =
            draftTasks.length > 0
              ? ` with ${draftTasks.length} draft task${draftTasks.length > 1 ? 's' : ''}`
              : '';
          success(`PBI added to sprint${taskInfo}`);
        } catch (taskError: unknown) {
          logger.error('Failed to create draft tasks', undefined, { error: taskError });
          warning('PBI added to sprint, but failed to create draft tasks');
        }
      } else {
        success('PBI added to sprint successfully');
      }

      void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintTasks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintBacklogChanges.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.availablePBIs.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.burndown.all });
      setShowAddModal(false);
      setAddReason('');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
          ?.message ?? 'Failed to add PBI to sprint';
      showError(message);
    },
  });

  const removePBIMutation = useMutation({
    mutationFn: () => {
      if (!selectedItemForRemoval) return Promise.reject(new Error('No item selected'));
      return apiService.removePBIFromSprint(
        sprintId,
        selectedItemForRemoval.pbiId,
        taskAction,
        removeReason || undefined
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintTasks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintBacklogChanges.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.availablePBIs.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.burndown.all });
      setShowRemoveModal(false);
      setSelectedItemForRemoval(null);
      setRemoveReason('');
      setTaskAction('return_to_backlog');
      success('PBI returned to backlog successfully');
    },
    onError: (error: unknown) => {
      const message =
        (error as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
          ?.message ?? 'Failed to return PBI to backlog';
      showError(message);
    },
  });

  const handleAddPBI = useCallback(
    (pbiId: string) => {
      addPBIMutation.mutate(pbiId);
    },
    [addPBIMutation]
  );

  const handleRemoveClick = useCallback(
    (pbiId: string, pbiTitle: string) => {
      const item = sprintBacklogItems.find((i) => i.id === pbiId);
      setSelectedItemForRemoval({
        pbiId,
        pbiTitle,
        taskCount: item?.tasks.length ?? 0,
      });
      setShowRemoveModal(true);
    },
    [sprintBacklogItems]
  );

  const confirmRemove = useCallback(() => {
    removePBIMutation.mutate();
  }, [removePBIMutation]);

  const getPriorityStyle = (priority: MoSCoWPriority) => {
    return priorityLabels[priority];
  };

  const getTaskStatusClass = (status: string) => {
    return status.toLowerCase().replace('_', '-');
  };

  const formatTimeAgo = (date: Date | string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  if (sprintLoading) {
    return (
      <div className={styles['sbm-overlay']}>
        <div className={styles['sbm-modal']}>
          <div className={styles['sbm-loading']}>
            <div className={styles['sbm-spinner']}>⏳</div>
            <p>Loading sprint backlog...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <div className={styles['sbm-overlay']}>
        <div className={styles['sbm-modal']} onClick={(e) => e.stopPropagation()}>
          <div className={styles['sbm-header']}>
            <div className={styles['sbm-header-left']}>
              <h2>📋 Sprint Backlog Manager</h2>
              <span className={styles['sbm-sprint-name']}>{sprintName}</span>
            </div>
            <button className={styles['sbm-close-btn']} onClick={onClose} aria-label="Close">
              ×
            </button>
          </div>

          {sprintGoal && (
            <div className={styles['sbm-goal-banner']}>
              <h3>🎯 Sprint Goal</h3>
              <p>{sprintGoal}</p>
            </div>
          )}

          <div className={styles['sbm-stats']}>
            <div className={styles['sbm-stat-card']}>
              <div className={styles['sbm-stat-value']}>{sprintStats.totalItems}</div>
              <div className={styles['sbm-stat-label']}>Items</div>
            </div>
            <div className={styles['sbm-stat-card']}>
              <div className={styles['sbm-stat-value']}>{sprintStats.totalPoints}</div>
              <div className={styles['sbm-stat-label']}>Story Points</div>
            </div>
            <div className={styles['sbm-stat-card']}>
              <div className={styles['sbm-stat-value']}>{sprintStats.totalTasks}</div>
              <div className={styles['sbm-stat-label']}>Tasks</div>
            </div>
            <div className={styles['sbm-stat-card']}>
              <div className={styles['sbm-stat-value']}>{sprintStats.totalRemainingHours}h</div>
              <div className={styles['sbm-stat-label']}>Remaining</div>
            </div>
          </div>

          <div className={styles['sbm-content']}>
            <div className={styles['sbm-current-backlog']}>
              <div className={styles['sbm-section-header']}>
                <h3>Current Sprint Backlog</h3>
                <button className={styles['sbm-add-btn']} onClick={() => setShowAddModal(true)}>
                  + Add Item
                </button>
              </div>

              <div className={styles['sbm-items-list']}>
                {sprintBacklogItems.length === 0 ? (
                  <div className={styles['sbm-empty-state']}>
                    <span className={styles['sbm-empty-icon']}>📭</span>
                    <p>No items in sprint backlog</p>
                    <button
                      className={`${styles['sbm-add-btn']} ${styles['sbm-add-btn-center']}`}
                      onClick={() => setShowAddModal(true)}
                    >
                      + Add First Item
                    </button>
                  </div>
                ) : (
                  sprintBacklogItems.map((item) => {
                    const priorityStyle = getPriorityStyle(item.priority);
                    return (
                      <div key={item.id} className={styles['sbm-item-card']}>
                        <div className={styles['sbm-item-header']}>
                          <div className={styles['sbm-item-info']}>
                            <span className={styles['sbm-item-id']}>#{item.id.slice(-4)}</span>
                            <span
                              className={styles['sbm-item-priority']}
                              style={{ backgroundColor: priorityStyle.color }}
                            >
                              {priorityStyle.label}
                            </span>
                          </div>
                          <button
                            className={styles['sbm-remove-btn']}
                            onClick={() => handleRemoveClick(item.id, item.title)}
                            title="Remove from sprint"
                          >
                            ✕
                          </button>
                        </div>
                        <h4 className={styles['sbm-item-title']}>{item.title}</h4>
                        <div className={styles['sbm-item-meta']}>
                          <span className={styles['sbm-item-points']}>
                            {item.storyPoints ?? 0} pts
                          </span>
                          <span className={styles['sbm-item-tasks']}>
                            {item.tasks.length} tasks
                          </span>
                          {item.tasks.length > 0 && (
                            <span className={styles['sbm-item-progress']}>
                              {item.tasks.filter((t) => t.status === 'DONE').length}/
                              {item.tasks.length} done
                            </span>
                          )}
                        </div>
                        {item.tasks.length > 0 && (
                          <div className={styles['sbm-item-tasks-preview']}>
                            {item.tasks.slice(0, 3).map((task) => (
                              <div
                                key={task.id}
                                className={`${styles['sbm-task-preview']} ${styles[`sbm-task-${getTaskStatusClass(task.status)}`]}`}
                              >
                                <span className={styles['sbm-task-status-dot']} />
                                <span className={styles['sbm-task-title']}>{task.title}</span>
                              </div>
                            ))}
                            {item.tasks.length > 3 && (
                              <span className={styles['sbm-more-tasks']}>
                                +{item.tasks.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className={styles['sbm-changes']}>
              <div className={styles['sbm-section-header']}>
                <h3>Recent Changes</h3>
              </div>
              <div className={styles['sbm-changes-list']}>
                {recentChanges.length === 0 ? (
                  <div className={styles['sbm-no-changes']}>
                    <p>No recent changes</p>
                  </div>
                ) : (
                  recentChanges.map((change) => (
                    <div key={change.id} className={styles['sbm-change-item']}>
                      <span
                        className={`${styles['sbm-change-type']} ${styles[`sbm-change-${change.changeType.toLowerCase()}`]}`}
                      >
                        {change.changeType === 'ADDED' ? '➕' : '➖'}
                      </span>
                      <div className={styles['sbm-change-content']}>
                        <span className={styles['sbm-change-title']}>{change.pbiTitle}</span>
                        <span className={styles['sbm-change-meta']}>
                          by {change.changedByName} •{' '}
                          {formatTimeAgo(change.createdAt ?? change.changedAt)}
                        </span>
                        {change.reason && (
                          <span className={styles['sbm-change-reason']}>"{change.reason}"</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className={styles['sbm-modal-overlay']}>
          <div className={styles['sbm-add-modal']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['sbm-modal-header']}>
              <h3>
                <PlusIcon size={18} /> Add Item to Sprint
              </h3>
              <button className={styles['sbm-modal-close']} onClick={() => setShowAddModal(false)}>
                ×
              </button>
            </div>
            <div className={styles['sbm-modal-body']}>
              <input
                type="text"
                className={styles['sbm-search-input']}
                placeholder="Search available items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <div className={styles['sbm-available-items']}>
                {availableLoading ? (
                  <div className={styles['sbm-loading-inline']}>
                    <span className={styles['sbm-spinner-small']}>⏳</span> Loading...
                  </div>
                ) : filteredAvailablePBIs.length === 0 ? (
                  <div className={styles['sbm-no-items']}>
                    <p>No available items found</p>
                    <span className={styles['sbm-hint']}>Items must be in READY status</span>
                  </div>
                ) : (
                  filteredAvailablePBIs.map((pbi) => {
                    const priorityStyle = getPriorityStyle(pbi.priority);
                    return (
                      <div key={pbi.id} className={styles['sbm-available-item']}>
                        <div className={styles['sbm-available-item-info']}>
                          <span
                            className={styles['sbm-item-priority']}
                            style={{ backgroundColor: priorityStyle.color }}
                          >
                            {priorityStyle.label}
                          </span>
                          <span className={styles['sbm-item-title']}>{pbi.title}</span>
                          <span className={styles['sbm-item-points']}>
                            {pbi.storyPoints ?? 0} pts
                          </span>
                        </div>
                        <button
                          className={styles['sbm-add-item-btn']}
                          onClick={() => handleAddPBI(pbi.id)}
                          disabled={addPBIMutation.isPending}
                        >
                          <PlusIcon size={14} /> Add
                        </button>
                      </div>
                    );
                  })
                )}
              </div>

              <div className={styles['sbm-reason-input']}>
                <label>Reason (optional)</label>
                <textarea
                  placeholder="Why are you adding this item?"
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showRemoveModal && selectedItemForRemoval && (
        <div className={styles['sbm-modal-overlay']} onClick={() => setShowRemoveModal(false)}>
          <div className={styles['sbm-remove-modal']} onClick={(e) => e.stopPropagation()}>
            <div className={`${styles['sbm-modal-header']} ${styles['sbm-modal-header-warning']}`}>
              <h3>↩️ Return Item to Backlog</h3>
              <button
                className={styles['sbm-modal-close']}
                onClick={() => setShowRemoveModal(false)}
              >
                ×
              </button>
            </div>
            <div className={styles['sbm-modal-body']}>
              <div className={styles['sbm-remove-preview']}>
                <strong>{selectedItemForRemoval.pbiTitle}</strong>
                <span>
                  {selectedItemForRemoval.taskCount} task
                  {selectedItemForRemoval.taskCount !== 1 ? 's' : ''} associated
                </span>
              </div>

              <div className={styles['sbm-task-action-group']}>
                <label>What will happen when you remove this item?</label>
                <div className={styles['sbm-task-actions']}>
                  <div
                    className={`${styles['sbm-task-action-option']} ${styles['sbm-task-action-single']}`}
                  >
                    <div className={styles['sbm-task-action-icon']}>↩️</div>
                    <div className={styles['sbm-task-action-content']}>
                      <span className={styles['sbm-task-action-title']}>Return to Backlog</span>
                      <ul className={styles['sbm-task-action-list']}>
                        <li>All tasks associated with this PBI will be permanently deleted</li>
                        <li>
                          The PBI will return to the READY status to be available for future sprint
                          planning sessions
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles['sbm-reason-input']}>
                <label>Reason (optional)</label>
                <textarea
                  placeholder="Why are you removing this item?"
                  value={removeReason}
                  onChange={(e) => setRemoveReason(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
            <div className={styles['sbm-modal-footer']}>
              <button
                className={`${styles['sbm-btn']} ${styles['sbm-btn-secondary']}`}
                onClick={() => setShowRemoveModal(false)}
              >
                Cancel
              </button>
              <button
                className={`${styles['sbm-btn']} ${styles['sbm-btn-primary']}`}
                onClick={confirmRemove}
                disabled={removePBIMutation.isPending}
              >
                <ArrowLeftIcon size={16} />
                {removePBIMutation.isPending ? 'Returning...' : 'Return to Backlog'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SprintBacklogManager;
