import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TIME } from '@scrsphere/shared';

import { apiService } from '../../services';
import { useTeamStore } from '../../store';
import { useMutationErrorHandler } from '../../hooks/useMutationErrorHandler';
import { queryKeys } from '../../hooks/queryKeys';
import { ToastContainer } from '../../components/common/ToastContainer';
import { useToast } from '../../hooks/useToast';
import {
  ItemStatus,
  TaskStatus,
  SprintStatus,
  type ProductBacklogItem,
  type GeneratedSprint,
  type TeamMember,
} from '../../types';
import { EmptyState } from '../../components/EmptyState';
import { LoadingState } from '../../components/common/Loading';
import { useAnnounce } from '../../components/LiveAnnouncer';
import {
  CalendarIcon,
  ClockIcon,
  SettingsIcon,
  FileTextIcon,
  TargetIcon,
  PlayIcon,
  XIcon,
  EditIcon,
} from '../../components/common/Icons';

import { AddTaskModal } from './components/AddTaskModal';
import { EditSprintGoalModal } from './components/EditSprintGoalModal';
import { StartSprintModal } from './components/StartSprintModal';
import { TeamCapacityModal } from './components/TeamCapacityModal';
import styles from './SprintPlanning.module.css';

// Environment variable for backlog item limit (default: 100)
const BACKLOG_ITEM_LIMIT = parseInt(import.meta.env.VITE_BACKLOG_ITEM_LIMIT ?? '100', 10);

interface SprintTask {
  id: string;
  title: string;
  pbiId: string;
  assigneeId?: string;
  assigneeName?: string;
  status: TaskStatus;
  estimatedHours?: number;
  remainingHours?: number;
}

interface SprintBacklogItem extends ProductBacklogItem {
  tasks: SprintTask[];
  isReady?: boolean;
  readyChecklist?: ReadyChecklistItem[];
}

interface TeamAvailability {
  memberId: string;
  userId: string;
  memberName: string;
  availableHours: number;
}

interface ReadyChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

const MOSCOW_PRIORITY_CONFIG: Record<string, { label: string; shortLabel: string }> = {
  MUST_HAVE: { label: 'Must Have', shortLabel: 'Must' },
  SHOULD_HAVE: { label: 'Should Have', shortLabel: 'Should' },
  COULD_HAVE: { label: 'Could Have', shortLabel: 'Could' },
  WONT_HAVE: { label: "Won't Have", shortLabel: "Won't" },
};

type SprintTimeCategory = 'current' | 'future' | 'past';

interface SprintWithCategory {
  id: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  category: SprintTimeCategory;
  sprintGoal?: string;
  sprintNumber?: number;
  year?: number;
}

const getSprintTimeCategory = (startDate: string, endDate: string): SprintTimeCategory => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  if (now >= start && now <= end) {
    return 'current';
  } else if (now < start) {
    return 'future';
  } else {
    return 'past';
  }
};

const formatSprintOptionLabel = (sprint: SprintWithCategory): string => {
  const categoryLabel =
    sprint.category === 'current'
      ? '[Active]'
      : sprint.category === 'future'
        ? '[Upcoming]'
        : '[Done]';
  const statusDisplay =
    sprint.status.charAt(0).toUpperCase() + sprint.status.slice(1).toLowerCase();
  return `${categoryLabel} ${sprint.name} (${statusDisplay})`;
};

const DEFAULT_READY_CHECKLIST: ReadyChecklistItem[] = [
  { id: '1', label: 'Has clear acceptance criteria', checked: false },
  { id: '2', label: 'Estimated by team', checked: false },
  { id: '3', label: 'Dependencies identified', checked: false },
  { id: '4', label: 'Understandable by team', checked: false },
];

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

const generateDraftTasks = (pbiId: string, pbiTitle: string, storyPoints: number): SprintTask[] => {
  const config = STORY_POINTS_TO_TASKS[storyPoints] ?? { taskCount: 1, estimatedHours: 8 };
  const tasks: SprintTask[] = [];

  for (let i = 0; i < config.taskCount; i++) {
    const taskTitle =
      config.taskCount === 1 ? `Plan: ${pbiTitle} - Task` : `Plan: ${pbiTitle} - Task ${i + 1}`;

    tasks.push({
      id: `task-plan-${pbiId}-${Date.now()}-${i}`,
      title: taskTitle,
      pbiId,
      status: TaskStatus.TODO,
      estimatedHours: config.estimatedHours,
      remainingHours: config.estimatedHours,
    });
  }

  return tasks;
};

export const SprintPlanning: React.FC = () => {
  const { currentTeam, userRoleInCurrentTeam } = useTeamStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const teamId = currentTeam?.id;
  const currentYear = new Date().getFullYear();
  const { handleMutationError } = useMutationErrorHandler();

  const [selectedSprintId, setSelectedSprintId] = useState<string | null>(null);
  const [sprintBacklogItems, setSprintBacklogItems] = useState<SprintBacklogItem[]>([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedItemForTask, setSelectedItemForTask] = useState<string | null>(null);
  const [teamAvailability, setTeamAvailability] = useState<TeamAvailability[]>([]);
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [planningStartTime, setPlanningStartTime] = useState<Date | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showStartSprintModal, setShowStartSprintModal] = useState(false);
  const [startSprintError, setStartSprintError] = useState<string | null>(null);
  const { toasts, success, error: showError, warning, info, removeToast } = useToast();
  const [showSprintGoalModal, setShowSprintGoalModal] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [focusedItemIndex, setFocusedItemIndex] = useState<number>(-1);
  const [grabbedItemId, setGrabbedItemId] = useState<string | null>(null);

  const sprintBacklogRef = useRef<HTMLDivElement>(null);
  const announce = useAnnounce();

  const { data: generatedSprintsData, isLoading: generatedSprintsLoading } = useQuery({
    queryKey: queryKeys.generatedSprint.byTeam(teamId),
    queryFn: () => apiService.getGeneratedSprints(teamId ?? '', currentYear),
    enabled: !!teamId,
  });

  const { data: backlogData, isLoading: backlogLoading } = useQuery({
    queryKey: queryKeys.productBacklog.list({ teamId, limit: BACKLOG_ITEM_LIMIT }),
    queryFn: () => apiService.getProductBacklog(teamId ?? '', { limit: BACKLOG_ITEM_LIMIT }),
    enabled: !!teamId,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: teamMembersData } = useQuery({
    queryKey: queryKeys.team.detail(teamId ?? ''),
    queryFn: () => apiService.getTeam(teamId ?? ''),
    enabled: !!teamId,
  });

  const { data: goalsData, isLoading: goalsLoading } = useQuery({
    queryKey: queryKeys.productGoal.list({ teamId }),
    queryFn: () => apiService.getProductGoals(teamId ?? ''),
    enabled: !!teamId,
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
  });

  const activeGoal = useMemo(() => {
    if (!goalsData?.data) return null;
    const activeGoals = goalsData.data.filter((g) => g.status.toUpperCase() === 'ACTIVE');
    return activeGoals.length > 0 ? activeGoals[0] : null;
  }, [goalsData?.data]);

  useQuery({
    queryKey: ['sprintTasks', selectedSprintId],
    queryFn: () =>
      selectedSprintId
        ? apiService.getSprintTasks(selectedSprintId)
        : Promise.resolve({ success: true, data: [] }),
    enabled: !!selectedSprintId,
  });

  const startSprintMutation = useMutation({
    mutationFn: (params: {
      sprintId: string;
      data: {
        backlogItems: Array<{ pbiId: string }>;
        tasks: Array<{
          pbiId: string;
          title: string;
          description?: string;
          assigneeId?: string;
          estimatedHours?: number;
          remainingHours?: number;
        }>;
      };
    }) => apiService.startSprint(params.sprintId, params.data),
    onSuccess: (response) => {
      if (response.success) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.generatedSprint.all });
        void queryClient.invalidateQueries({ queryKey: queryKeys.productBacklog.all });
        if (teamId) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.sprint.activeSprint(teamId),
            refetchType: 'all',
          });
        }
        void queryClient.invalidateQueries({
          queryKey: queryKeys.sprintTasks.all,
          refetchType: 'all',
        });
        void queryClient.removeQueries({ queryKey: queryKeys.sprintTasks.all });
        setShowStartSprintModal(false);
        setStartSprintError(null);
        success('Sprint started successfully! Redirecting to Sprint Board...');
        setTimeout(() => void navigate('/sprint'), 1.5 * TIME.SECOND);
      } else {
        const errorMsg = response.error?.message ?? 'Failed to start sprint';
        setStartSprintError(errorMsg);
        showError(errorMsg);
      }
    },
    onError: (error: unknown) => {
      const message = handleMutationError(error, {
        operationName: 'start sprint',
        setWorkflowError: setStartSprintError,
        showToast: (msg) => showError(msg),
      });
      setStartSprintError(message);
      showError(message);
      void queryClient.invalidateQueries({ queryKey: queryKeys.productBacklog.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.generatedSprint.all });
    },
  });

  const updateGeneratedSprintMutation = useMutation({
    mutationFn: ({ sprintId, updates }: { sprintId: string; updates: { sprintGoal: string } }) =>
      apiService.updateGeneratedSprint(sprintId, updates),
    onSuccess: (response) => {
      if (response.success) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.generatedSprint.all });
        success('Sprint goal updated successfully');
        setShowSprintGoalModal(false);
      } else {
        showError(response.error?.message ?? 'Failed to update sprint goal');
      }
    },
    onError: (error: unknown) => {
      handleMutationError(error, {
        operationName: 'update sprint goal',
        showToast: (msg) => showError(msg),
      });
    },
  });

  const getFilteredBacklogItems = useCallback(() => {
    if (!backlogData?.data) return [];

    const sprintItemIds = new Set(sprintBacklogItems.map((item) => item.id));
    const availableItems = backlogData.data.filter((item) => !sprintItemIds.has(item.id));

    // Use case-insensitive comparison for READY status
    const readyItems = availableItems.filter(
      (item) => item.status.toUpperCase() === ItemStatus.READY
    );

    return readyItems;
  }, [backlogData, sprintBacklogItems]);

  const filteredBacklogItems = getFilteredBacklogItems();

  const selectedSprint = generatedSprintsData?.data?.find(
    (s: GeneratedSprint) => s.id === selectedSprintId
  );

  const categorizedSprints = useMemo(() => {
    const current: SprintWithCategory[] = [];
    const future: SprintWithCategory[] = [];

    if (generatedSprintsData?.data) {
      generatedSprintsData.data.forEach((sprint: GeneratedSprint) => {
        if (!sprint.startDate || !sprint.endDate) return;

        const category = getSprintTimeCategory(sprint.startDate, sprint.endDate);
        if (category === 'past') return;

        const sprintWithCategory: SprintWithCategory = {
          id: sprint.id,
          name: sprint.name,
          status: sprint.status,
          startDate: sprint.startDate,
          endDate: sprint.endDate,
          category,
          sprintGoal: sprint.sprintGoal,
          sprintNumber: sprint.sprintNumber,
          year: sprint.year,
        };

        if (category === 'current') {
          current.push(sprintWithCategory);
        } else {
          future.push(sprintWithCategory);
        }
      });
    }

    current.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    future.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return { current, future };
  }, [generatedSprintsData]);

  const sprintStats = {
    totalItems: sprintBacklogItems.length,
    totalPoints: sprintBacklogItems.reduce((sum, item) => sum + (item.storyPoints ?? 0), 0),
    totalTasks: sprintBacklogItems.reduce((sum, item) => sum + item.tasks.length, 0),
    estimatedHours: sprintBacklogItems.reduce(
      (sum, item) => sum + item.tasks.reduce((s, t) => s + (t.estimatedHours ?? 0), 0),
      0
    ),
    remainingHours: sprintBacklogItems.reduce(
      (sum, item) =>
        sum + item.tasks.reduce((s, t) => s + (t.remainingHours ?? t.estimatedHours ?? 0), 0),
      0
    ),
  };

  const totalTeamCapacity = teamAvailability.reduce((sum, m) => sum + m.availableHours, 0);
  const capacityUsed = sprintStats.estimatedHours;
  const capacityPercentage =
    totalTeamCapacity > 0 ? Math.round((capacityUsed / totalTeamCapacity) * 100) : 0;

  const completedSprints = useMemo(
    () =>
      generatedSprintsData?.data?.filter(
        (s: GeneratedSprint) => s.status === SprintStatus.COMPLETED
      ) ?? [],
    [generatedSprintsData]
  );

  const calculateVelocityData = useCallback(() => {
    if (completedSprints.length === 0) return { average: 0, min: 0, max: 0, range: '0 - 0' };

    const velocities = completedSprints
      .map(() => {
        const sprintItems = backlogData?.data.filter((i) => i.status === ItemStatus.DONE) ?? [];
        return sprintItems.reduce((s, i) => s + (i.storyPoints ?? 0), 0);
      })
      .filter((v) => v > 0);

    if (velocities.length === 0) return { average: 0, min: 0, max: 0, range: '0 - 0' };

    const average = Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length);
    const min = Math.min(...velocities);
    const max = Math.max(...velocities);

    return { average, min, max, range: `${min} - ${max}` };
  }, [completedSprints, backlogData]);

  const velocityData = calculateVelocityData();

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (planningStartTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - planningStartTime.getTime()) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [planningStartTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const members: TeamMember[] = teamMembersData?.data?.members ?? [];
    if (members.length > 0) {
      setTeamAvailability(
        members.map((member) => ({
          memberId: member.id,
          userId: member.userId,
          memberName: member.user ? `${member.user.firstName} ${member.user.lastName}` : 'Unknown',
          availableHours: 40,
        }))
      );
    } else {
      setTeamAvailability([]); // Clear availability if no members
    }
  }, [teamMembersData]);

  useEffect(() => {
    if (selectedSprintId && !planningStartTime) {
      setPlanningStartTime(new Date());
    }
  }, [selectedSprintId, planningStartTime]);

  const checkItemReadiness = (
    item: ProductBacklogItem
  ): { isReady: boolean; checklist: ReadyChecklistItem[] } => {
    const checklist = DEFAULT_READY_CHECKLIST.map((c) => ({ ...c }));

    if (checklist[0])
      checklist[0].checked = !!(item.acceptanceCriteria && item.acceptanceCriteria.length > 10);
    if (checklist[1]) checklist[1].checked = !!(item.storyPoints && item.storyPoints > 0);
    if (checklist[2]) checklist[2].checked = true;
    if (checklist[3]) checklist[3].checked = !!(item.description && item.description.length > 10);

    const isReady = checklist.every((c) => c.checked);
    return { isReady, checklist };
  };

  const handleAddToSprint = useCallback(
    (item: ProductBacklogItem) => {
      if (!selectedSprintId) {
        warning('Please select a sprint first');
        return;
      }

      if (!item.id) {
        showError('Invalid item: Item data is missing or corrupted');
        return;
      }

      if (sprintBacklogItems.some((sprintItem) => sprintItem.id === item.id)) {
        warning(`"${item.title}" is already in the sprint backlog`);
        return;
      }

      try {
        const { isReady, checklist } = checkItemReadiness(item);
        const generatedTasks = generateDraftTasks(item.id, item.title, item.storyPoints ?? 0);

        const sprintItem: SprintBacklogItem = {
          ...item,
          tasks: generatedTasks,
          isReady,
          readyChecklist: checklist,
        };

        setSprintBacklogItems((prev) => [...prev, sprintItem]);

        const taskInfo =
          generatedTasks.length > 0
            ? ` with ${generatedTasks.length} draft task${generatedTasks.length > 1 ? 's' : ''}`
            : '';
        success(`"${item.title}" added to sprint backlog${taskInfo}`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        showError(`Error processing item: ${errorMessage}`);
      }
    },
    [selectedSprintId, sprintBacklogItems, success, warning, showError]
  );

  const handleRemoveFromSprint = useCallback(
    (itemId: string) => {
      if (!itemId) {
        showError('Invalid item ID: Cannot remove item');
        return;
      }

      const item = sprintBacklogItems.find((i) => i.id === itemId);
      if (!item) {
        showError('Item not found in sprint backlog');
        return;
      }

      try {
        const itemTitle = item.title;

        setSprintBacklogItems((prev) => prev.filter((i) => i.id !== itemId));

        info(`"${itemTitle}" removed from sprint backlog`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
        showError(`Error removing item: ${errorMessage}`);
      }
    },
    [sprintBacklogItems, showError, info]
  );

  const handleAddTask = useCallback(
    (task: { title: string; estimatedHours: number; assigneeId: string }) => {
      if (!selectedItemForTask) return;

      const assignee = teamAvailability.find((m) => m.userId === task.assigneeId);

      const newTask: SprintTask = {
        id: `task-${Date.now()}`,
        title: task.title,
        pbiId: selectedItemForTask,
        assigneeId: task.assigneeId || undefined,
        assigneeName: assignee?.memberName,
        status: TaskStatus.TODO,
        estimatedHours: task.estimatedHours || undefined,
        remainingHours: task.estimatedHours || undefined,
      };

      setSprintBacklogItems((prev) =>
        prev.map((item) => {
          if (item.id === selectedItemForTask) {
            return { ...item, tasks: [...item.tasks, newTask] };
          }
          return item;
        })
      );

      setSelectedItemForTask(null);
      setShowTaskModal(false);
      success('Task added successfully');
    },
    [selectedItemForTask, teamAvailability, success]
  );

  const handleUpdateTaskAssignee = useCallback(
    (itemId: string, taskId: string, assigneeId: string | undefined) => {
      const assignee = teamAvailability.find((m) => m.userId === assigneeId);
      setSprintBacklogItems((prev) =>
        prev.map((item) => {
          if (item.id === itemId) {
            return {
              ...item,
              tasks: item.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      assigneeId: assigneeId ?? undefined,
                      assigneeName: assignee?.memberName,
                    }
                  : task
              ),
            };
          }
          return item;
        })
      );
    },
    [teamAvailability]
  );

  const handleRemoveTask = useCallback((itemId: string, taskId: string) => {
    setSprintBacklogItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            tasks: item.tasks.filter((task) => task.id !== taskId),
          };
        }
        return item;
      })
    );
  }, []);

  const handleDragStart = useCallback((e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('itemId', itemId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedItemId(itemId);

    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  }, []);

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedItemId(null);
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);

      if (!selectedSprintId) return;

      const itemId = e.dataTransfer.getData('itemId');
      const item = (backlogData?.data ?? []).find((i) => i.id === itemId);
      if (item) {
        handleAddToSprint(item);
      }
    },
    [selectedSprintId, backlogData, handleAddToSprint]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (sprintBacklogRef.current && !sprintBacklogRef.current.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  }, []);

  /**
   * Handle grabbing an item for keyboard drag operation
   */
  const handleGrabItem = useCallback(
    (item: ProductBacklogItem) => {
      if (!selectedSprintId) {
        warning('Please select a sprint first');
        announce('Please select a sprint first', 'assertive');
        return;
      }

      setGrabbedItemId(item.id);
      announce(
        `Backlog item ${item.title} grabbed. Press Enter to add to sprint backlog. Escape to cancel.`,
        'assertive'
      );
    },
    [selectedSprintId, warning, announce]
  );

  /**
   * Handle cancelling a keyboard drag operation
   */
  const handleCancelDrag = useCallback(() => {
    if (grabbedItemId) {
      const item = filteredBacklogItems.find((i) => i.id === grabbedItemId);
      if (item) {
        announce(`Drag cancelled. Item ${item.title} remains in product backlog.`, 'polite');
      }
    }
    setGrabbedItemId(null);
    setFocusedItemIndex(-1);
  }, [grabbedItemId, filteredBacklogItems, announce]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, item: ProductBacklogItem, index: number) => {
      switch (e.key) {
        case 'Enter':
        case ' ': {
          e.preventDefault();
          if (grabbedItemId) {
            // If an item is grabbed, ignore - this is handled by sprint backlog
            return;
          }
          // Start grab mode
          handleGrabItem(item);
          break;
        }
        case 'ArrowDown':
          e.preventDefault();
          if (index < filteredBacklogItems.length - 1) {
            setFocusedItemIndex(index + 1);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (index > 0) {
            setFocusedItemIndex(index - 1);
          }
          break;
        case 'Escape':
          e.preventDefault();
          if (grabbedItemId) {
            handleCancelDrag();
          }
          break;
        case 'Tab':
          break;
      }
    },
    [filteredBacklogItems.length, grabbedItemId, handleGrabItem, handleCancelDrag]
  );

  /**
   * Handle dropping a grabbed item to sprint backlog
   */
  const handleDropToSprint = useCallback(() => {
    if (!grabbedItemId) return;

    const item = filteredBacklogItems.find((i) => i.id === grabbedItemId);
    if (item) {
      handleAddToSprint(item);
      announce(`Item ${item.title} added to sprint backlog.`, 'polite');
    }
    setGrabbedItemId(null);
    setFocusedItemIndex(-1);
  }, [grabbedItemId, filteredBacklogItems, handleAddToSprint, announce]);

  /**
   * Handle removing item from sprint backlog with announcement
   */
  const handleRemoveFromSprintWithAnnounce = useCallback(
    (itemId: string) => {
      const item = sprintBacklogItems.find((i) => i.id === itemId);
      if (item) {
        handleRemoveFromSprint(itemId);
        announce(`Item ${item.title} removed from sprint backlog.`, 'polite');
      }
    },
    [sprintBacklogItems, handleRemoveFromSprint, announce]
  );

  const handleSprintBacklogKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Handle dropping grabbed item
      if (e.key === 'Enter' && grabbedItemId) {
        e.preventDefault();
        handleDropToSprint();
        return;
      }

      // Handle removing item from sprint backlog
      if ((e.key === 'Delete' || e.key === 'Backspace') && focusedItemIndex >= 0) {
        e.preventDefault();
        const sprintItem = sprintBacklogItems[focusedItemIndex];
        if (sprintItem) {
          handleRemoveFromSprintWithAnnounce(sprintItem.id);
        }
        return;
      }

      // Legacy support: Enter on focused product backlog item
      if (e.key === 'Enter' && focusedItemIndex >= 0 && filteredBacklogItems[focusedItemIndex]) {
        handleAddToSprint(filteredBacklogItems[focusedItemIndex]);
      }

      // Arrow navigation within sprint backlog
      if (e.key === 'ArrowDown' && focusedItemIndex < sprintBacklogItems.length - 1) {
        e.preventDefault();
        setFocusedItemIndex(focusedItemIndex + 1);
      }
      if (e.key === 'ArrowUp' && focusedItemIndex > 0) {
        e.preventDefault();
        setFocusedItemIndex(focusedItemIndex - 1);
      }
    },
    [
      grabbedItemId,
      focusedItemIndex,
      filteredBacklogItems,
      sprintBacklogItems,
      handleDropToSprint,
      handleRemoveFromSprintWithAnnounce,
      handleAddToSprint,
    ]
  );

  const handleStartSprint = useCallback(() => {
    if (!teamId) {
      showError('Team ID is required. Please select a team first.');
      return;
    }

    if (!selectedSprintId) {
      showError('No sprint selected');
      return;
    }

    if (sprintBacklogItems.length === 0) {
      showError('Cannot start sprint without any backlog items');
      return;
    }

    if (!selectedSprint?.sprintGoal?.trim()) {
      showError('Please define a sprint goal before starting the sprint.');
      return;
    }

    if (capacityPercentage > 100) {
      warning('Sprint is over capacity. Consider removing some items.');
    }

    setShowStartSprintModal(true);
  }, [
    teamId,
    selectedSprintId,
    sprintBacklogItems.length,
    capacityPercentage,
    selectedSprint,
    showError,
    warning,
  ]);

  const handleConfirmStartSprint = async () => {
    if (!selectedSprintId) return;

    const backlogItems = sprintBacklogItems.map((item) => ({
      pbiId: item.id,
    }));

    const tasks = sprintBacklogItems.flatMap((item) =>
      item.tasks.map((task) => ({
        pbiId: item.id,
        title: task.title,
        assigneeId: task.assigneeId,
        estimatedHours: task.estimatedHours,
        remainingHours: task.remainingHours,
      }))
    );

    startSprintMutation.mutate({
      sprintId: selectedSprintId,
      data: {
        backlogItems,
        tasks,
      },
    });
  };

  const handleCancelStartSprint = () => {
    setShowStartSprintModal(false);
    setStartSprintError(null);
    startSprintMutation.reset();
  };

  const handleSaveSprintGoal = useCallback(
    (goal: string) => {
      if (!selectedSprintId) {
        showError('No sprint selected');
        return;
      }
      if (!goal.trim()) {
        warning('Please enter a sprint goal');
        return;
      }

      updateGeneratedSprintMutation.mutate({
        sprintId: selectedSprintId,
        updates: { sprintGoal: goal.trim() },
      });
    },
    [selectedSprintId, updateGeneratedSprintMutation, showError, warning]
  );

  const handleOpenCapacityModal = useCallback(() => {
    setShowCapacityModal(true);
  }, []);

  const handleCloseCapacityModal = useCallback(() => {
    setShowCapacityModal(false);
  }, []);

  const handleSaveCapacity = useCallback((newAvailability: TeamAvailability[]) => {
    setTeamAvailability(newAvailability);
  }, []);

  const calculateSprintDuration = () => {
    if (!selectedSprint?.startDate || !selectedSprint.endDate) return 0;
    const start = new Date(selectedSprint.startDate);
    const end = new Date(selectedSprint.endDate);

    let businessDays = 0;
    const currentDate = new Date(start);

    while (currentDate <= end) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        businessDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return businessDays;
  };

  const getRecommendedPlanningTime = () => {
    const days = calculateSprintDuration();
    const weeks = Math.ceil(days / 7);
    return weeks * 2 * 60 * 60;
  };

  const isLoading = generatedSprintsLoading || backlogLoading || goalsLoading;

  if (!teamId) {
    return <EmptyState type="no-team" variant="full-page" />;
  }

  if (isLoading) {
    return <LoadingState variant="page" label="Loading Sprint Planning..." />;
  }

  if (!activeGoal) {
    return <EmptyState type="no-active-goal" variant="full-page" />;
  }

  return (
    <>
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <div
        className={styles['sprint-planning']}
        role="main"
        aria-label="Sprint Planning"
        data-testid="sprint-planning"
      >
        {/* Header */}
        <header className={styles['planning-header']}>
          <div className={styles['header-left']}>
            <h1 className={styles['page-title']}>
              <span className={styles['page-title-icon']}>
                <CalendarIcon size={24} aria-hidden="true" />
              </span>
              Sprint Planning
            </h1>
            <p className={styles['page-subtitle']}>
              Plan your next sprint by selecting items from the product backlog
            </p>
          </div>
          <div className={styles['header-right']}>
            {planningStartTime && (
              <div
                className={styles['planning-timer']}
                role="timer"
                aria-label={`Planning time: ${formatTime(elapsedTime)}`}
              >
                <span className={styles['timer-icon']} aria-hidden="true">
                  <ClockIcon size={16} />
                </span>
                <span
                  className={`${styles['timer-value']} ${elapsedTime > getRecommendedPlanningTime() ? styles.warning : ''}`}
                >
                  {formatTime(elapsedTime)}
                </span>
                <span className={styles['timer-label']}>Planning Time</span>
              </div>
            )}
            <label htmlFor="sprint-select" className={styles['visually-hidden']}>
              Select Sprint
            </label>
            <select
              id="sprint-select"
              data-testid="sprint-select"
              className={styles['sprint-select']}
              value={selectedSprintId ?? ''}
              onChange={(e) => setSelectedSprintId(e.target.value || null)}
              aria-describedby="sprint-select-hint"
              disabled={generatedSprintsLoading}
            >
              <option value="">Select Sprint...</option>

              {categorizedSprints.current.length > 0 && (
                <optgroup label="-- Active Sprint --">
                  {categorizedSprints.current.map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {formatSprintOptionLabel(sprint)}
                    </option>
                  ))}
                </optgroup>
              )}

              {categorizedSprints.future.length > 0 && (
                <optgroup label="-- Upcoming Sprints --">
                  {categorizedSprints.future.map((sprint) => (
                    <option key={sprint.id} value={sprint.id}>
                      {formatSprintOptionLabel(sprint)}
                    </option>
                  ))}
                </optgroup>
              )}

              {categorizedSprints.current.length === 0 &&
                categorizedSprints.future.length === 0 && (
                  <optgroup label="No Sprints Available">
                    <option disabled value="">
                      No sprints configured - click Configure Sprints
                    </option>
                  </optgroup>
                )}
            </select>
            <span id="sprint-select-hint" className={styles['visually-hidden']}>
              Choose a sprint to plan or configure new sprints
            </span>
            <Link
              to="/settings/sprint-configuration"
              state={{ from: 'sprint-planning' }}
              className={`${styles.button} ${styles['button-secondary']} ${styles['config-link']}`}
              aria-label="Configure sprint settings"
              title="Set up sprint duration and generate sprints for the year"
            >
              <span aria-hidden="true">
                <SettingsIcon size={16} />
              </span>{' '}
              Configure Sprints
            </Link>
          </div>
        </header>

        {/* Metrics Bar */}
        <section className={styles['sprint-planning-metrics-bar']} aria-label="Sprint metrics">
          <div
            className={styles['sprint-planning-metric-card']}
            role="group"
            aria-labelledby="velocity-label"
          >
            <div className={styles['sprint-planning-metric-label']} id="velocity-label">
              Avg Velocity
            </div>
            <div className={styles['sprint-planning-metric-value']}>{velocityData.average} pts</div>
            <div className={styles['sprint-planning-metric-hint']}>Range: {velocityData.range}</div>
            <div
              className={styles['velocity-indicator']}
              aria-label={`Velocity range from ${velocityData.min} to ${velocityData.max} story points`}
            >
              <div className={styles['velocity-bar']}>
                <div
                  className={styles['velocity-range']}
                  style={{
                    left: `${(velocityData.min / (velocityData.max || 1)) * 100}%`,
                    width: `${((velocityData.max - velocityData.min) / (velocityData.max || 1)) * 100}%`,
                  }}
                />
                <div
                  className={styles['velocity-average']}
                  style={{ left: `${(velocityData.average / (velocityData.max || 1)) * 100}%` }}
                  title={`Average: ${velocityData.average} pts`}
                />
              </div>
            </div>
          </div>
          <div
            className={`${styles['sprint-planning-metric-card']} ${styles.clickable}`}
            onClick={handleOpenCapacityModal}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleOpenCapacityModal()}
            aria-labelledby="capacity-label"
            aria-describedby="capacity-hint"
          >
            <div className={styles['sprint-planning-metric-label']} id="capacity-label">
              Team Capacity
            </div>
            <div className={styles['sprint-planning-metric-value']}>{totalTeamCapacity} hrs</div>
            <div className={styles['sprint-planning-metric-hint']} id="capacity-hint">
              Click to adjust
            </div>
          </div>
          <div
            className={styles['sprint-planning-metric-card']}
            role="group"
            aria-labelledby="planned-label"
          >
            <div className={styles['sprint-planning-metric-label']} id="planned-label">
              Planned Capacity
            </div>
            <div className={styles['sprint-planning-metric-value']}>
              {sprintStats.estimatedHours} hrs
            </div>
            <div className={styles['sprint-planning-metric-hint']}>
              {sprintStats.totalTasks} tasks
            </div>
          </div>
          <div
            className={styles['sprint-planning-metric-card']}
            role="group"
            aria-labelledby="used-label"
          >
            <div className={styles['sprint-planning-metric-label']} id="used-label">
              Capacity Used
            </div>
            <div
              className={`${styles['metric-value']} ${capacityPercentage > 100 ? styles.danger : capacityPercentage > 80 ? styles.warning : ''}`}
            >
              {capacityPercentage}%
            </div>
            <div className={styles['sprint-planning-metric-hint']}>
              {capacityPercentage > 100
                ? 'Over capacity!'
                : capacityPercentage > 80
                  ? 'Near limit'
                  : 'Available'}
            </div>
          </div>
        </section>

        {/* Capacity Bar */}
        {selectedSprintId && (
          <div
            className={styles['capacity-bar']}
            role="progressbar"
            aria-valuenow={capacityPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className={styles['capacity-label']} id="capacity-bar-label">
              Sprint Capacity
            </div>
            <div className={styles['capacity-progress']} aria-hidden="true">
              <div
                className={`${styles['capacity-fill']} ${capacityPercentage > 100 ? styles.danger : capacityPercentage > 80 ? styles.warning : ''}`}
                style={{ width: `${Math.min(capacityPercentage, 100)}%` }}
              />
            </div>
            <div
              className={styles['capacity-text']}
              aria-label={`${sprintStats.estimatedHours} of ${totalTeamCapacity} hours used`}
            >
              {sprintStats.estimatedHours} / {totalTeamCapacity} hours
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className={styles['planning-content']}>
          {/* Backlog Items Pool */}
          <section className={styles['backlog-pool']} aria-labelledby="backlog-title" role="region">
            <div className={styles['pool-header']}>
              <h3 id="backlog-title">
                <FileTextIcon size={16} aria-hidden="true" /> Product Backlog
              </h3>
              <span
                className={styles['item-count']}
                aria-label={`${filteredBacklogItems.length} READY items available`}
              >
                {filteredBacklogItems.length} READY items
              </span>
            </div>

            <div className={styles['pool-filters']} role="group" aria-label="Filter backlog items">
              <div className={styles['filter-indicator']}>
                <span className={`${styles['filter-badge']} ${styles.ready}`}>✓ READY Only</span>
                <span className={styles['filter-hint']}>
                  Only items marked as READY are displayed
                </span>
              </div>
            </div>

            <div
              className={styles['items-list']}
              role="listbox"
              aria-label="Available READY backlog items for sprint planning"
            >
              {filteredBacklogItems.map((item, index) => {
                const { isReady } = checkItemReadiness(item);
                const isGrabbed = grabbedItemId === item.id;
                const isFocused = focusedItemIndex === index;
                return (
                  <div
                    key={item.id}
                    className={`${styles['planning-item']} ${draggedItemId === item.id ? styles.dragging : ''} ${isFocused ? styles.focused : ''} ${isReady ? styles.ready : styles['not-ready']} ${isGrabbed ? styles.grabbed : ''}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, item.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleAddToSprint(item)}
                    onKeyDown={(e) => handleKeyDown(e, item, index)}
                    onFocus={() => setFocusedItemIndex(index)}
                    onBlur={() => setFocusedItemIndex(-1)}
                    role="option"
                    tabIndex={0}
                    aria-selected={isFocused}
                    aria-grabbed={isGrabbed ? 'true' : 'false'}
                    aria-roledescription="draggable backlog item"
                    aria-label={`${item.title}, ${item.storyPoints ?? 0} points, priority ${MOSCOW_PRIORITY_CONFIG[item.priority]?.label ?? item.priority}${isReady ? ', ready for sprint' : ', needs refinement'}${isGrabbed ? ', currently grabbed' : ''}`}
                  >
                    <div className={styles['item-header']}>
                      <span className={styles['item-id']}>#{item.id.slice(-4)}</span>
                      <span className={styles['item-priority']}>
                        {MOSCOW_PRIORITY_CONFIG[item.priority]?.shortLabel ?? item.priority}
                      </span>
                      {isReady && (
                        <span
                          className={styles['ready-badge']}
                          title="Ready for sprint"
                          aria-label="Ready for sprint"
                        >
                          ✓ Ready
                        </span>
                      )}
                    </div>
                    <div className={styles['item-title']}>{item.title}</div>
                    <div className={styles['item-meta']}>
                      <span className={styles['item-estimate']}>{item.storyPoints ?? 0} pts</span>
                      <div className={styles['item-labels']}>
                        {item.labels.slice(0, 2).map((label) => (
                          <span key={label} className={styles['label-tag']}>
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <button
                      className={styles['item-add-btn']}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToSprint(item);
                      }}
                      aria-label={`Add ${item.title} to sprint`}
                    >
                      + Add to Sprint
                    </button>
                  </div>
                );
              })}
              {filteredBacklogItems.length === 0 && (
                <div className={styles['empty-pool']} role="status">
                  <p>No READY items available</p>
                  <p className={styles.hint}>
                    Items must be marked as READY to be displayed for sprint planning
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Sprint Backlog */}
          <section
            ref={sprintBacklogRef}
            className={`${styles['sprint-backlog']} ${!selectedSprintId ? styles.disabled : ''} ${isDraggingOver ? styles['drag-over'] : ''} ${grabbedItemId ? styles['drop-target-active'] : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onKeyDown={handleSprintBacklogKeyDown}
            aria-labelledby="sprint-backlog-title"
            role="region"
            aria-dropeffect={grabbedItemId ? 'move' : isDraggingOver ? 'move' : 'none'}
          >
            <div className={styles['sprint-header']}>
              <h3 id="sprint-backlog-title">
                <TargetIcon size={16} aria-hidden="true" /> Sprint Backlog
              </h3>
              {selectedSprint && (
                <div className={styles['sprint-info']}>
                  <span className={styles['sprint-name']}>{selectedSprint.name}</span>
                  <span className={styles['sprint-dates']}>
                    {calculateSprintDuration()} days (
                    {new Date(selectedSprint.startDate).toLocaleDateString()} -{' '}
                    {new Date(selectedSprint.endDate).toLocaleDateString()})
                  </span>
                </div>
              )}
            </div>

            {!selectedSprintId ? (
              <div className={styles['no-sprint-selected']} role="status">
                <div className={styles['empty-icon-wrapper']} aria-hidden="true">
                  <ClockIcon size={32} />
                </div>
                <h4>No Sprint Selected</h4>
                <p>
                  Select a sprint from the dropdown above or create a new sprint to start planning
                </p>
              </div>
            ) : (
              <>
                {selectedSprint && (
                  <div className={styles['sprint-goal-card']}>
                    <div className={styles['goal-header']}>
                      <div className={styles['goal-label']}>Sprint Goal</div>
                      <button
                        className={styles['goal-edit-btn']}
                        onClick={() => {
                          setShowSprintGoalModal(true);
                        }}
                        aria-label="Edit sprint goal"
                      >
                        <EditIcon size={12} aria-hidden="true" /> Edit
                      </button>
                    </div>
                    <div className={styles['goal-text']}>
                      {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty string should show No goal defined */}
                      {selectedSprint.sprintGoal || 'No goal defined - click Edit to add one'}
                    </div>
                  </div>
                )}

                <div
                  className={styles['sprint-planning-sprint-stats']}
                  role="group"
                  aria-label="Sprint statistics"
                >
                  <div className={styles.stat}>
                    <span className={styles['stat-value']}>{sprintStats.totalItems}</span>
                    <span className={styles['stat-label']}>Items</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles['stat-value']}>{sprintStats.totalPoints}</span>
                    <span className={styles['stat-label']}>Story Points</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles['stat-value']}>{sprintStats.totalTasks}</span>
                    <span className={styles['stat-label']}>Tasks</span>
                  </div>
                  <div className={styles.stat}>
                    <span className={styles['stat-value']}>{sprintStats.remainingHours} h</span>
                    <span className={styles['stat-label']}>Planned</span>
                  </div>
                </div>

                <div
                  className={styles['sprint-items-list']}
                  role="list"
                  aria-label="Sprint backlog items"
                >
                  {sprintBacklogItems.length === 0 ? (
                    <div className={styles['empty-sprint']} role="status">
                      <p>Drag READY items from the backlog or click to add</p>
                      <p className={styles.hint}>
                        {grabbedItemId
                          ? 'Press Enter to add the grabbed item to sprint backlog'
                          : 'Only items marked as READY are available in the backlog'}
                      </p>
                    </div>
                  ) : (
                    sprintBacklogItems.map((item, index) => (
                      <div
                        key={item.id}
                        className={`${styles['sprint-item']} ${focusedItemIndex === index ? styles.focused : ''}`}
                        role="listitem"
                        tabIndex={0}
                        onFocus={() => setFocusedItemIndex(index)}
                        onBlur={() => setFocusedItemIndex(-1)}
                        onKeyDown={(e) => {
                          if (e.key === 'Delete' || e.key === 'Backspace') {
                            e.preventDefault();
                            handleRemoveFromSprintWithAnnounce(item.id);
                          }
                        }}
                        aria-label={`${item.title}, ${item.storyPoints ?? 0} points, ${item.tasks.length} tasks. Press Delete to remove.`}
                      >
                        <div className={styles['sprint-item-header']}>
                          <div className={styles['sprint-item-info']}>
                            <span className={styles['item-id']}>#{item.id.slice(-4)}</span>
                            <span className={styles['sprint-item-title']}>{item.title}</span>
                            <span className={styles['item-estimate']}>
                              {item.storyPoints ?? 0} pts
                            </span>
                          </div>
                          <button
                            className={styles['remove-item-btn']}
                            onClick={() => handleRemoveFromSprint(item.id)}
                            title="Remove from sprint"
                            aria-label={`Remove ${item.title} from sprint`}
                          >
                            <XIcon size={14} />
                          </button>
                        </div>

                        {/* Tasks for this item */}
                        <div
                          className={styles['item-tasks']}
                          role="list"
                          aria-label={`Tasks for ${item.title}`}
                        >
                          {item.tasks.map((task) => (
                            <div
                              key={task.id}
                              className={`${styles['task-item']} ${styles[task.status]}`}
                              role="listitem"
                            >
                              <span className={styles['task-title']}>{task.title}</span>
                              <select
                                className={styles['task-assignee-select']}
                                value={task.assigneeId ?? ''}
                                onChange={(e) =>
                                  handleUpdateTaskAssignee(
                                    item.id,
                                    task.id,
                                    e.target.value || undefined
                                  )
                                }
                                aria-label={`Task assignee: ${task.title}`}
                              >
                                <option value="">Unassigned</option>
                                {teamAvailability.map((member) => (
                                  <option key={member.memberId} value={member.userId}>
                                    {member.memberName}
                                  </option>
                                ))}
                              </select>
                              {task.estimatedHours && (
                                <div className={styles['task-hours-container']}>
                                  <span className={styles['task-hours-label']}>
                                    {task.estimatedHours} h
                                  </span>
                                </div>
                              )}
                              <button
                                className={styles['remove-task-btn']}
                                onClick={() => handleRemoveTask(item.id, task.id)}
                                title="Remove task"
                                aria-label={`Remove task: ${task.title}`}
                              >
                                <XIcon size={12} />
                              </button>
                            </div>
                          ))}
                          <button
                            className={styles['add-task-btn']}
                            onClick={() => {
                              setSelectedItemForTask(item.id);
                              setShowTaskModal(true);
                            }}
                            aria-label={`Add task to ${item.title}`}
                          >
                            + Add Task
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className={styles['sprint-actions']}>
                  <button
                    className={`${styles.button} ${styles['button-primary']}`}
                    onClick={handleStartSprint}
                    disabled={sprintBacklogItems.length === 0 || startSprintMutation.isPending}
                    aria-busy={startSprintMutation.isPending}
                  >
                    {startSprintMutation.isPending ? (
                      'Starting Sprint...'
                    ) : (
                      <>
                        <PlayIcon size={14} aria-hidden="true" />
                        Start Sprint
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </section>
        </div>

        {/* Add Task Modal */}
        <AddTaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setSelectedItemForTask(null);
          }}
          onSubmit={handleAddTask}
          teamMembers={teamAvailability}
          itemTitle={
            selectedItemForTask
              ? sprintBacklogItems.find((item) => item.id === selectedItemForTask)?.title
              : undefined
          }
        />

        {/* Team Capacity Modal */}
        <TeamCapacityModal
          isOpen={showCapacityModal}
          onClose={handleCloseCapacityModal}
          onSave={handleSaveCapacity}
          teamAvailability={teamAvailability}
        />

        {/* Sprint Goal Modal */}
        <EditSprintGoalModal
          isOpen={showSprintGoalModal}
          onClose={() => setShowSprintGoalModal(false)}
          onSave={handleSaveSprintGoal}
          initialGoal={selectedSprint?.sprintGoal ?? ''}
          sprintName={selectedSprint?.name}
          isSaving={updateGeneratedSprintMutation.isPending}
        />

        {/* Start Sprint Confirmation Modal */}
        <StartSprintModal
          isOpen={showStartSprintModal}
          onClose={handleCancelStartSprint}
          onConfirm={handleConfirmStartSprint}
          sprintName={selectedSprint?.name ?? ''}
          sprintGoal={selectedSprint?.sprintGoal}
          sprintDuration={calculateSprintDuration()}
          stats={sprintStats}
          teamCapacity={totalTeamCapacity}
          capacityPercentage={capacityPercentage}
          error={startSprintError}
          isLoading={startSprintMutation.isPending}
          userRole={userRoleInCurrentTeam}
        />
      </div>
    </>
  );
};
