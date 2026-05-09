import { useMemo, useEffect, useRef, useState, useCallback, type RefObject } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { TIME } from '@scrsphere/shared';

import { apiService } from '../../services';
import { useAnnounce } from '../../components/LiveAnnouncer';
import { useMutationErrorHandler } from '../../hooks/useMutationErrorHandler';
import { queryKeys } from '../../hooks/queryKeys';
import {
  TaskStatus as TaskStatusEnum,
  type Task,
  type User,
  type TeamMember,
  type ProductBacklogItem,
  type DoDItem,
  type Impediment,
  type DoDChecklistVerification,
  type TaskStatus,
  type Sprint,
} from '../../types';

import type {
  BurndownDataPoint,
  WIPLimits,
  SwimlaneGroup,
  TasksByStatus,
  TransitionValidationResult,
  TransitionOptions,
  UseDragAndDropReturn,
} from './SprintBoard.types';
import { calculateWIPLimit, TASK_STATUS_CONFIG } from './SprintBoard.constants';

// ============================================
// Interfaces
// ============================================

export interface UseSprintBoardDataOptions {
  teamId: string | undefined;
  showBurndown: boolean;
  showDodVerification: boolean;
  filterAssignee: string;
  filterPbi: string;
  debouncedSearchQuery: string;
  swimlaneGroup: SwimlaneGroup;
}

export interface SprintStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  doneTasks: number;
  totalEstimatedHours: number;
  totalRemainingHours: number;
  hoursCompleted: number;
  progressPercentage: number;
  totalPbis: number;
  completedPbis: number;
  totalStoryPoints: number;
  completedStoryPoints: number;
}

export interface UseSprintBoardDataReturn {
  // Raw data
  sprint: Sprint | null;
  tasks: Task[];
  teamMembers: (TeamMember & { user?: User })[];
  sprintItems: ProductBacklogItem[];
  dodItems: DoDItem[];
  impediments: Impediment[];
  dodVerifications: DoDChecklistVerification[];
  burndownData: unknown;

  // Loading states
  isLoading: boolean;
  sprintLoading: boolean;
  tasksLoading: boolean;

  // Derived data
  wipLimits: WIPLimits;
  filteredTasks: Task[];
  tasksByStatus: { todo: Task[]; in_progress: Task[]; done: Task[] };
  sprintStats: SprintStats;
  daysRemaining: number;
  sprintDuration: number;
  burndownChartData: BurndownDataPoint[];
  wipWarnings: { column: TaskStatus; current: number; limit: number }[];
  groupedBySwimlane: Record<string, Task[]> | null;
}

// ============================================
// useSprintBoardData Hook
// ============================================

export const useSprintBoardData = (
  options: UseSprintBoardDataOptions
): UseSprintBoardDataReturn => {
  const {
    teamId,
    showBurndown,
    showDodVerification,
    filterAssignee,
    filterPbi,
    debouncedSearchQuery,
    swimlaneGroup,
  } = options;

  // ============================================
  // Data Fetching with useQuery
  // ============================================

  // Fetch active sprint
  const { data: sprintData, isLoading: sprintLoading } = useQuery({
    queryKey: queryKeys.sprint.activeSprint(teamId ?? ''),
    queryFn: () => apiService.getActiveSprint(teamId ?? ''),
    enabled: !!teamId,
  });

  const sprint = sprintData?.data ?? null;
  const sprintTasks = sprint?.tasks ?? [];

  // Fetch sprint tasks
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: sprint?.id ? queryKeys.sprintTasks.bySprint(sprint.id) : queryKeys.sprintTasks.all,
    queryFn: () => apiService.getSprintTasks(sprint?.id ?? ''),
    enabled: !!sprint?.id && !!teamId,
  });

  // Fetch team data
  const { data: teamData } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => apiService.getTeam(teamId ?? ''),
    enabled: !!teamId,
  });

  // Fetch burndown data (conditional)
  const { data: burndownData } = useQuery({
    queryKey: sprint?.id ? queryKeys.burndown.bySprint(sprint.id) : queryKeys.burndown.all,
    queryFn: () => apiService.getBurndownData(sprint?.id ?? ''),
    enabled: !!sprint?.id && showBurndown && !!teamId,
  });

  // Fetch DoD items
  const { data: dodData } = useQuery({
    queryKey: ['definition-of-done', teamId],
    queryFn: () => apiService.getDefinitionOfDone(teamId ?? ''),
    enabled: !!teamId,
  });

  // Fetch impediments
  const { data: impedimentsData } = useQuery({
    queryKey: ['impediments', teamId],
    queryFn: () => apiService.getImpediments(teamId ?? ''),
    enabled: !!teamId,
  });

  // Fetch DoD compliance (conditional)
  const { data: dodComplianceData } = useQuery({
    queryKey: ['dod-compliance', sprint?.id],
    queryFn: () => apiService.getDoDComplianceReport(sprint?.id ?? ''),
    enabled: !!sprint?.id && showDodVerification,
  });

  // ============================================
  // Extract Raw Data
  // ============================================

  const tasks = tasksData?.data ?? sprintTasks;
  const teamMembers: (TeamMember & { user?: User })[] = teamData?.data?.members ?? [];
  const sprintItems: ProductBacklogItem[] = useMemo(() => sprint?.items ?? [], [sprint]);
  const dodItems: DoDItem[] =
    (dodData as { data?: { items?: DoDItem[] } } | undefined)?.data?.items
      ?.filter((item: DoDItem) => item.isActive)
      .sort((a: DoDItem, b: DoDItem) => a.order - b.order) ?? [];
  const impediments: Impediment[] = impedimentsData?.data ?? [];
  const dodVerifications: DoDChecklistVerification[] =
    dodComplianceData?.data?.pbiDetails.flatMap(
      (detail: { verifications: DoDChecklistVerification[] }) => detail.verifications
    ) ?? [];

  // ============================================
  // Derived Computations
  // ============================================

  // WIP Limits based on team size
  const wipLimits = useMemo((): WIPLimits => {
    const teamSize = teamMembers.length;
    const inProgressLimit = calculateWIPLimit(teamSize);
    return {
      todo: Infinity,
      in_progress: inProgressLimit,
      done: Infinity,
    };
  }, [teamMembers.length]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (filterAssignee !== 'all' && task.assigneeId !== filterAssignee) return false;
      if (filterPbi !== 'all' && task.pbiId !== filterPbi) return false;
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(query);
        const descMatch = task.description?.toLowerCase().includes(query);
        const pbiMatch = task.pbi?.title.toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !pbiMatch) return false;
      }
      return true;
    });
  }, [tasks, filterAssignee, filterPbi, debouncedSearchQuery]);

  // Tasks grouped by status
  const tasksByStatus = useMemo(
    () => ({
      todo: filteredTasks.filter((t) => t.status === TaskStatusEnum.TODO),
      in_progress: filteredTasks.filter((t) => t.status === TaskStatusEnum.IN_PROGRESS),
      done: filteredTasks.filter((t) => t.status === TaskStatusEnum.DONE),
    }),
    [filteredTasks]
  );

  // Sprint statistics
  const sprintStats = useMemo((): SprintStats => {
    const totalTasks = tasks.length;
    const todoTasks = tasks.filter((t) => t.status === TaskStatusEnum.TODO).length;
    const inProgressTasks = tasks.filter((t) => t.status === TaskStatusEnum.IN_PROGRESS).length;
    const doneTasks = tasks.filter((t) => t.status === TaskStatusEnum.DONE).length;

    const totalEstimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0);
    const totalRemainingHours = tasks.reduce((sum, t) => {
      const remaining = t.remainingHours ?? t.estimatedHours ?? 0;
      return sum + remaining;
    }, 0);
    const hoursCompleted = totalEstimatedHours - totalRemainingHours;

    const uniquePbis = [...new Set(tasks.map((t) => t.pbiId))];
    const pbisWithAllTasksDone = uniquePbis.filter((pbiId) => {
      const pbiTasks = tasks.filter((t) => t.pbiId === pbiId);
      return pbiTasks.length > 0 && pbiTasks.every((t) => t.status === TaskStatusEnum.DONE);
    }).length;

    const totalStoryPoints = sprintItems.reduce((sum, item) => sum + (item.storyPoints ?? 0), 0);
    const completedStoryPoints = sprintItems
      .filter((item) => {
        const itemTasks = tasks.filter((t) => t.pbiId === item.id);
        return itemTasks.length > 0 && itemTasks.every((t) => t.status === TaskStatusEnum.DONE);
      })
      .reduce((sum, item) => sum + (item.storyPoints ?? 0), 0);

    return {
      totalTasks,
      todoTasks,
      inProgressTasks,
      doneTasks,
      totalEstimatedHours,
      totalRemainingHours,
      hoursCompleted,
      progressPercentage:
        totalEstimatedHours > 0 ? Math.round((hoursCompleted / totalEstimatedHours) * 100) : 0,
      totalPbis: uniquePbis.length,
      completedPbis: pbisWithAllTasksDone,
      totalStoryPoints,
      completedStoryPoints,
    };
  }, [tasks, sprintItems]);

  // Days remaining in sprint
  const daysRemaining = useMemo(() => {
    if (!sprint?.endDate) return 0;
    const end = new Date(sprint.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / TIME.DAY);
    return Math.max(0, diff);
  }, [sprint?.endDate]);

  // Sprint duration
  const sprintDuration = useMemo(() => {
    if (!sprint?.startDate || !sprint.endDate) return 14;
    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    return Math.ceil((end.getTime() - start.getTime()) / TIME.DAY);
  }, [sprint?.startDate, sprint?.endDate]);

  // Burndown chart data
  const burndownChartData = useMemo((): BurndownDataPoint[] => {
    if (!sprint?.startDate || !sprint.endDate) return [];

    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / TIME.DAY);
    const totalHours = sprintStats.totalEstimatedHours || 1;
    const idealDailyBurn = totalHours / totalDays;

    const backendDates = (burndownData as { data?: { dates?: string[] } }).data?.dates ?? [];
    const backendIdeal = (burndownData as { data?: { ideal?: number[] } }).data?.ideal ?? [];
    const backendActual =
      (burndownData as { data?: { actual?: (number | null)[] } }).data?.actual ?? [];

    const data: BurndownDataPoint[] = [];

    for (let day = 0; day <= totalDays; day++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + day);
      const dateStr = date.toISOString().split('T')[0] ?? '';

      const backendIndex = backendDates.indexOf(dateStr);

      data.push({
        day,
        date: dateStr,
        ideal:
          backendIndex >= 0 && backendIdeal[backendIndex] !== undefined
            ? backendIdeal[backendIndex]
            : Math.max(0, totalHours - idealDailyBurn * day),
        actual:
          backendIndex >= 0 && backendActual[backendIndex] !== undefined
            ? backendActual[backendIndex]
            : null,
      });
    }

    return data;
  }, [sprint, sprintStats.totalEstimatedHours, burndownData]);

  // WIP warnings
  const wipWarnings = useMemo(() => {
    const warnings: { column: TaskStatus; current: number; limit: number }[] = [];

    if (tasksByStatus.in_progress.length > wipLimits.in_progress) {
      warnings.push({
        column: TaskStatusEnum.IN_PROGRESS,
        current: tasksByStatus.in_progress.length,
        limit: wipLimits.in_progress,
      });
    }

    return warnings;
  }, [tasksByStatus, wipLimits]);

  // Grouped by swimlane
  const groupedBySwimlane = useMemo(() => {
    if (swimlaneGroup === 'none') return null;

    const groups: Record<string, Task[]> = {};

    filteredTasks.forEach((task) => {
      let key: string;
      if (swimlaneGroup === 'assignee') {
        key = task.assigneeId ?? 'unassigned';
      } else {
        key = task.pbiId;
      }

      let group = groups[key];
      if (!group) {
        group = [];
        groups[key] = group;
      }
      group.push(task);
    });

    return groups;
  }, [filteredTasks, swimlaneGroup]);

  // Combined loading state
  const isLoading = sprintLoading || tasksLoading;

  return {
    // Raw data
    sprint,
    tasks,
    teamMembers,
    sprintItems,
    dodItems,
    impediments,
    dodVerifications,
    burndownData,

    // Loading states
    isLoading,
    sprintLoading,
    tasksLoading,

    // Derived data
    wipLimits,
    filteredTasks,
    tasksByStatus,
    sprintStats,
    daysRemaining,
    sprintDuration,
    burndownChartData,
    wipWarnings,
    groupedBySwimlane,
  };
};

// ============================================
// useFocusTrap Hook
// ============================================

export const useFocusTrap = (isActive: boolean, modalRef: RefObject<HTMLElement | null>) => {
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive && modalRef.current) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;

      const getFocusableElements = () => {
        if (!modalRef.current) return [];
        return Array.from(
          modalRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);
      };

      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        const closeButton = modalRef.current.querySelector('[data-modal-close]') as HTMLElement;
        closeButton.focus();
      }
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return;

        const focusableElements = getFocusableElements();
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      };

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          const closeEvent = new CustomEvent('modalCloseRequest', {
            bubbles: true,
          });
          modalRef.current?.dispatchEvent(closeEvent);
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('keydown', handleEscape);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('keydown', handleEscape);
        previouslyFocusedElement.current?.focus();
      };
    }
    return undefined;
  }, [isActive, modalRef]);

  return previouslyFocusedElement;
};

// ============================================
// useKeyboardNavigation Hook
// ============================================

/**
 * Status order for keyboard navigation (left to right)
 */
const STATUS_ORDER: TaskStatus[] = [
  TaskStatusEnum.TODO,
  TaskStatusEnum.IN_PROGRESS,
  TaskStatusEnum.DONE,
];

/**
 * Options for the useKeyboardNavigation hook
 */
export interface UseKeyboardNavigationOptions {
  /** All tasks in the sprint */
  tasks: Task[];
  /** Filtered tasks based on current filters */
  filteredTasks: Task[];
  /** Tasks grouped by status */
  tasksByStatus: TasksByStatus;
  /** WIP limits for each status */
  wipLimits: WIPLimits;
  /** Team ID for validation */
  teamId: string | undefined;
  /** Function to validate and prepare status transitions */
  validateAndPrepareTransition: (
    task: Task,
    newStatus: TaskStatus,
    options?: TransitionOptions
  ) => TransitionValidationResult;
  /** Callback when a task is moved */
  onMoveTask: (taskId: string, updates: Partial<Task>) => void;
  /** Callback to open task detail modal */
  onOpenDetail: (task: Task) => void;
  /** Callback to open keyboard help modal */
  onOpenKeyboardHelp: () => void;
  /** Callback to open create task modal */
  onOpenCreateModal: () => void;
  /** Callback to toggle burndown chart */
  onToggleBurndown: () => void;
  /** Function to show toast notifications */
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  /** Whether any modal is currently open */
  isModalOpen: boolean;
}

/**
 * Return type for the useKeyboardNavigation hook
 */
export interface UseKeyboardNavigationReturn {
  /** Currently focused task ID */
  focusedTaskId: string | null;
  /** Setter for focused task ID */
  setFocusedTaskId: (id: string | null) => void;
  /** Task ID currently being dragged via keyboard */
  keyboardDraggedTaskId: string | null;
  /** Current keyboard grab state */
  keyboardGrabState: 'idle' | 'grabbed';
  /** Target status for keyboard drop */
  keyboardDropTargetStatus: TaskStatus | null;
  /** Keyboard event handler for tasks */
  handleKeyDown: (e: React.KeyboardEvent, task: Task) => void;
}

/**
 * Hook for managing keyboard navigation on the Sprint Board
 *
 * This hook consolidates all keyboard navigation logic including:
 * - Task focus management
 * - Keyboard-based drag and drop
 * - Global keyboard shortcuts
 * - Screen reader announcements
 *
 * @param options - Configuration options for the hook
 * @returns Keyboard navigation state and handlers
 */
export const useKeyboardNavigation = (
  options: UseKeyboardNavigationOptions
): UseKeyboardNavigationReturn => {
  const {
    filteredTasks,
    tasksByStatus,
    wipLimits,
    validateAndPrepareTransition,
    onMoveTask,
    onOpenDetail,
    onOpenKeyboardHelp,
    onOpenCreateModal,
    onToggleBurndown,
    showToast,
    isModalOpen,
  } = options;

  // Screen reader announcement hook
  const announce = useAnnounce();

  // ============================================
  // State
  // ============================================

  const [focusedTaskId, setFocusedTaskId] = useState<string | null>(null);
  const [keyboardDraggedTaskId, setKeyboardDraggedTaskId] = useState<string | null>(null);
  const [keyboardGrabState, setKeyboardGrabState] = useState<'idle' | 'grabbed'>('idle');
  const [keyboardDropTargetStatus, setKeyboardDropTargetStatus] = useState<TaskStatus | null>(null);

  // ============================================
  // Helper Functions
  // ============================================

  /**
   * Get the adjacent status in the specified direction
   */
  const getAdjacentStatus = useCallback(
    (currentStatus: TaskStatus, direction: 'left' | 'right'): TaskStatus | null => {
      const currentIndex = STATUS_ORDER.indexOf(currentStatus);
      if (currentIndex === -1) return null;

      if (direction === 'left' && currentIndex > 0) {
        return STATUS_ORDER[currentIndex - 1] ?? null;
      }
      if (direction === 'right' && currentIndex < STATUS_ORDER.length - 1) {
        return STATUS_ORDER[currentIndex + 1] ?? null;
      }
      return null;
    },
    []
  );

  /**
   * Get tasks in a specific status
   */
  const getTasksInStatus = useCallback(
    (status: TaskStatus): Task[] => {
      return filteredTasks.filter((t) => t.status === status);
    },
    [filteredTasks]
  );

  /**
   * Get WIP limit for a specific status
   */
  const getWIPLimitForStatus = useCallback(
    (status: TaskStatus): number => {
      switch (status) {
        case TaskStatusEnum.TODO:
          return wipLimits.todo;
        case TaskStatusEnum.IN_PROGRESS:
          return wipLimits.in_progress;
        case TaskStatusEnum.DONE:
          return wipLimits.done;
        default:
          return Infinity;
      }
    },
    [wipLimits]
  );

  // ============================================
  // Screen Reader Announcements
  // ============================================

  /**
   * Announce that a task has been grabbed for keyboard drag
   */
  const announceGrabbed = useCallback(
    (task: Task) => {
      const statusLabel = TASK_STATUS_CONFIG[task.status].label;
      announce(
        `Task ${task.title} grabbed. Current status: ${statusLabel}. Use ArrowLeft or ArrowRight to change status. Escape to cancel, Enter to drop.`,
        'assertive'
      );
    },
    [announce]
  );

  /**
   * Announce that a task has been dropped in a new status
   */
  const announceDropped = useCallback(
    (task: Task, newStatus: TaskStatus) => {
      const statusLabel = TASK_STATUS_CONFIG[newStatus].label;
      announce(`Task ${task.title} moved to ${statusLabel}.`, 'polite');
    },
    [announce]
  );

  /**
   * Announce that a keyboard drag has been cancelled
   */
  const announceCancelled = useCallback(
    (task: Task) => {
      const statusLabel = TASK_STATUS_CONFIG[task.status].label;
      announce(`Drag cancelled. Task remains in ${statusLabel}.`, 'polite');
    },
    [announce]
  );

  /**
   * Announce a WIP limit error
   */
  const announceWipError = useCallback(
    (message: string) => {
      announce(message, 'assertive');
    },
    [announce]
  );

  /**
   * Announce movement to a new target status
   */
  const announceMoving = useCallback(
    (_task: Task, targetStatus: TaskStatus) => {
      const statusLabel = TASK_STATUS_CONFIG[targetStatus].label;
      const taskCount = getTasksInStatus(targetStatus).length;
      const wipLimit = getWIPLimitForStatus(targetStatus);
      const wipInfo = wipLimit < Infinity ? ` WIP limit: ${wipLimit}.` : '';
      announce(
        `Target status: ${statusLabel}. ${taskCount} tasks currently in this column.${wipInfo}`,
        'polite'
      );
    },
    [announce, getTasksInStatus, getWIPLimitForStatus]
  );

  // ============================================
  // Global Keyboard Shortcuts
  // ============================================

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs or modals are open
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        isModalOpen
      ) {
        return;
      }

      switch (e.key) {
        case '?':
          e.preventDefault();
          onOpenKeyboardHelp();
          break;
        case 'n':
        case 'N':
          e.preventDefault();
          onOpenCreateModal();
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          onToggleBurndown();
          break;
        case 's':
        case 'S':
          e.preventDefault();
          document.querySelector<HTMLInputElement>('input[type="text"]')?.focus();
          break;
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isModalOpen, onOpenKeyboardHelp, onOpenCreateModal, onToggleBurndown]);

  // ============================================
  // Main Keyboard Handler
  // ============================================

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, task: Task) => {
      const currentIndex = filteredTasks.findIndex((t) => t.id === task.id);

      // Handle keyboard drag operations when in grab mode
      if (keyboardGrabState === 'grabbed' && keyboardDraggedTaskId === task.id) {
        switch (e.key) {
          case 'ArrowRight': {
            e.preventDefault();
            const targetStatus = getAdjacentStatus(task.status, 'right');
            if (targetStatus) {
              setKeyboardDropTargetStatus(targetStatus);
              announceMoving(task, targetStatus);
            }
            break;
          }
          case 'ArrowLeft': {
            e.preventDefault();
            const targetStatus = getAdjacentStatus(task.status, 'left');
            if (targetStatus) {
              setKeyboardDropTargetStatus(targetStatus);
              announceMoving(task, targetStatus);
            }
            break;
          }
          case 'Enter': {
            e.preventDefault();
            // Complete the drop operation
            if (keyboardDropTargetStatus && keyboardDropTargetStatus !== task.status) {
              const result = validateAndPrepareTransition(task, keyboardDropTargetStatus, {
                checkWipLimits: true,
                wipLimits,
                tasksByStatus,
                checkRequiredFields: true,
              });

              if (!result.valid || !result.updates) {
                showToast('error', result.error ?? 'Invalid transition');
                announceWipError(result.error ?? 'Invalid transition');
                return;
              }

              onMoveTask(task.id, result.updates);
              announceDropped(
                { ...task, status: keyboardDropTargetStatus },
                keyboardDropTargetStatus
              );
            }
            // Reset grab state
            setKeyboardGrabState('idle');
            setKeyboardDraggedTaskId(null);
            setKeyboardDropTargetStatus(null);
            break;
          }
          case 'Escape': {
            e.preventDefault();
            // Cancel the drag operation
            announceCancelled(task);
            setKeyboardGrabState('idle');
            setKeyboardDraggedTaskId(null);
            setKeyboardDropTargetStatus(null);
            break;
          }
          case 'ArrowDown': {
            e.preventDefault();
            // Navigate between tasks while grabbed
            if (currentIndex < filteredTasks.length - 1) {
              const nextTask = filteredTasks[currentIndex + 1];
              if (nextTask) {
                setFocusedTaskId(nextTask.id);
              }
            }
            break;
          }
          case 'ArrowUp': {
            e.preventDefault();
            // Navigate between tasks while grabbed
            if (currentIndex > 0) {
              const prevTask = filteredTasks[currentIndex - 1];
              if (prevTask) {
                setFocusedTaskId(prevTask.id);
              }
            }
            break;
          }
        }
        return;
      }

      // Normal keyboard operations (not in grab mode)
      switch (e.key) {
        case ' ':
          e.preventDefault();
          // Start grab mode
          setKeyboardDraggedTaskId(task.id);
          setKeyboardGrabState('grabbed');
          setKeyboardDropTargetStatus(task.status);
          announceGrabbed(task);
          break;
        case 'Enter':
          e.preventDefault();
          onOpenDetail(task);
          break;
        case 'ArrowRight':
          // Ctrl+ArrowRight: Quick move to next status
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const targetStatus = getAdjacentStatus(task.status, 'right');
            if (targetStatus) {
              const result = validateAndPrepareTransition(task, targetStatus, {
                checkWipLimits: true,
                wipLimits,
                tasksByStatus,
                checkRequiredFields: true,
              });

              if (result.valid && result.updates) {
                onMoveTask(task.id, result.updates);
                announceDropped(task, targetStatus);
              } else {
                showToast('error', result.error ?? 'Invalid transition');
                announceWipError(result.error ?? 'Invalid transition');
              }
            }
          } else {
            // Legacy behavior: Move to next status
            e.preventDefault();
            if (task.status === TaskStatusEnum.TODO) {
              const result = validateAndPrepareTransition(task, TaskStatusEnum.IN_PROGRESS, {
                checkWipLimits: true,
                wipLimits,
                tasksByStatus,
                checkRequiredFields: true,
              });

              if (result.valid && result.updates) {
                onMoveTask(task.id, result.updates);
              } else {
                showToast('error', result.error ?? 'Invalid transition');
              }
            } else if (task.status === TaskStatusEnum.IN_PROGRESS) {
              const result = validateAndPrepareTransition(task, TaskStatusEnum.DONE);

              if (result.valid && result.updates) {
                onMoveTask(task.id, result.updates);
                showToast('success', 'Task moved to Done (Remaining hours set to 0)');
              } else {
                showToast('error', result.error ?? 'Invalid transition');
              }
            }
          }
          break;
        case 'ArrowLeft':
          // Ctrl+ArrowLeft: Quick move to previous status
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            const targetStatus = getAdjacentStatus(task.status, 'left');
            if (targetStatus) {
              const result = validateAndPrepareTransition(task, targetStatus, {
                checkWipLimits: true,
                wipLimits,
                tasksByStatus,
                checkRequiredFields: true,
              });

              if (result.valid && result.updates) {
                onMoveTask(task.id, result.updates);
                announceDropped(task, targetStatus);
              } else {
                showToast('error', result.error ?? 'Invalid transition');
                announceWipError(result.error ?? 'Invalid transition');
              }
            }
          } else {
            // Legacy behavior: Move to previous status
            e.preventDefault();
            if (task.status === TaskStatusEnum.DONE) {
              const result = validateAndPrepareTransition(task, TaskStatusEnum.IN_PROGRESS);

              if (result.valid && result.updates) {
                onMoveTask(task.id, result.updates);
              } else {
                showToast('error', result.error ?? 'Invalid transition');
              }
            } else if (task.status === TaskStatusEnum.IN_PROGRESS) {
              const result = validateAndPrepareTransition(task, TaskStatusEnum.TODO);

              if (result.valid && result.updates) {
                onMoveTask(task.id, result.updates);
              } else {
                showToast('error', result.error ?? 'Invalid transition');
              }
            }
          }
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentIndex < filteredTasks.length - 1) {
            const nextTask = filteredTasks[currentIndex + 1];
            if (nextTask) {
              setFocusedTaskId(nextTask.id);
            }
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (currentIndex > 0) {
            const prevTask = filteredTasks[currentIndex - 1];
            if (prevTask) {
              setFocusedTaskId(prevTask.id);
            }
          }
          break;
      }
    },
    [
      filteredTasks,
      keyboardGrabState,
      keyboardDraggedTaskId,
      keyboardDropTargetStatus,
      getAdjacentStatus,
      announceMoving,
      validateAndPrepareTransition,
      wipLimits,
      tasksByStatus,
      onMoveTask,
      showToast,
      announceWipError,
      announceDropped,
      announceCancelled,
      announceGrabbed,
      onOpenDetail,
    ]
  );

  return {
    focusedTaskId,
    setFocusedTaskId,
    keyboardDraggedTaskId,
    keyboardGrabState,
    keyboardDropTargetStatus,
    handleKeyDown,
  };
};

// ============================================
// useTaskMutations Hook
// ============================================

export interface UseTaskMutationsOptions {
  sprintId: string | undefined;
  teamId: string | undefined;
  onCloseModal: () => void;
  onCloseCompleteSprintModal: () => void;
  onSetCompleteSprintError: (error: string | null) => void;
  onNavigateToIncrement: (sprintId: string) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export interface UseTaskMutationsReturn {
  createTaskMutation: UseMutationResult<unknown, unknown, Partial<Task>, unknown>;
  updateTaskMutation: UseMutationResult<
    unknown,
    unknown,
    { taskId: string; updates: Partial<Task> },
    unknown
  >;
  deleteTaskMutation: UseMutationResult<unknown, unknown, string, unknown>;
  completeSprintMutation: UseMutationResult<unknown, unknown, void, unknown>;
}

export const useTaskMutations = (options: UseTaskMutationsOptions): UseTaskMutationsReturn => {
  const {
    sprintId,
    teamId,
    onCloseModal,
    onCloseCompleteSprintModal,
    onSetCompleteSprintError,
    onNavigateToIncrement,
    showToast,
  } = options;

  const queryClient = useQueryClient();
  const { handleMutationError } = useMutationErrorHandler();

  const createTaskMutation = useMutation({
    mutationFn: (taskData: Partial<Task>) => apiService.createTask(sprintId ?? '', taskData),
    onSuccess: () => {
      // Invalidate specific sprint tasks query to trigger refetch
      if (sprintId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sprintTasks.bySprint(sprintId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.burndown.bySprint(sprintId) });
      }
      if (teamId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.activeSprint(teamId) });
      }
      // Also invalidate the general lists to ensure consistency
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintTasks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.burndown.all });
      onCloseModal();
      showToast('success', 'Task created successfully');
    },
    onError: (error: unknown) => {
      handleMutationError(error, {
        operationName: 'create task',
        showToast: (msg) => showToast('error', msg),
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) =>
      apiService.updateTask(sprintId ?? '', taskId, updates),
    onSuccess: () => {
      // Invalidate specific sprint tasks query to trigger refetch
      if (sprintId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sprintTasks.bySprint(sprintId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.burndown.bySprint(sprintId) });
      }
      if (teamId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.activeSprint(teamId) });
      }
      // Also invalidate the general lists to ensure consistency
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintTasks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.burndown.all });
      onCloseModal();
      showToast('success', 'Task updated successfully');
    },
    onError: (error: unknown) => {
      handleMutationError(error, {
        operationName: 'update task',
        showToast: (msg) => showToast('error', msg),
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) => apiService.deleteTask(sprintId ?? '', taskId),
    onSuccess: () => {
      // Invalidate specific sprint tasks query to trigger refetch
      if (sprintId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sprintTasks.bySprint(sprintId) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.burndown.bySprint(sprintId) });
      }
      if (teamId) {
        void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.activeSprint(teamId) });
      }
      // Also invalidate the general lists to ensure consistency
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintTasks.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.burndown.all });
      onCloseModal();
      showToast('success', 'Task deleted successfully');
    },
    onError: (error: unknown) => {
      const message = handleMutationError(error, {
        operationName: 'delete task',
        showToast: (msg) => showToast('error', msg),
      });
      showToast('error', message);
    },
  });

  const completeSprintMutation = useMutation({
    mutationFn: async () => {
      if (!sprintId) throw new Error('No active sprint');
      return apiService.completeSprint(sprintId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprint.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.productBacklog.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.sprintTasks.all });
      onCloseCompleteSprintModal();
      showToast('success', 'Sprint completed successfully! Redirecting to create Increment...');
      setTimeout(() => {
        if (sprintId) {
          onNavigateToIncrement(sprintId);
        }
      }, 1500);
    },
    onError: (error: unknown) => {
      const message = handleMutationError(error, {
        operationName: 'complete sprint',
        setWorkflowError: onSetCompleteSprintError,
        showToast: (msg) => showToast('error', msg),
      });
      onSetCompleteSprintError(message);
      showToast('error', message);
    },
  });

  return {
    createTaskMutation,
    updateTaskMutation,
    deleteTaskMutation,
    completeSprintMutation,
  };
};

// ============================================
// useDragAndDrop Hook
// ============================================

export interface UseDragAndDropOptions {
  tasks: Task[];
  wipLimits: WIPLimits;
  tasksByStatus: TasksByStatus;
  teamId: string | undefined;
  validateAndPrepareTransition: (
    task: Task,
    newStatus: TaskStatus,
    options?: TransitionOptions
  ) => TransitionValidationResult;
  onMoveTask: (taskId: string, updates: Partial<Task>) => void;
  showToast: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onSetWorkflowError: (error: string | null) => void;
}

export const useDragAndDrop = (options: UseDragAndDropOptions): UseDragAndDropReturn => {
  const {
    tasks,
    wipLimits,
    tasksByStatus,
    teamId,
    validateAndPrepareTransition,
    onMoveTask,
    showToast,
    onSetWorkflowError,
  } = options;

  // Drag state
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetColumn, setDropTargetColumn] = useState<TaskStatus | null>(null);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);

    const target = e.target as HTMLElement;
    target.style.opacity = '0.5';
  }, []);

  // Handle drag end
  const handleDragEnd = useCallback((e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = '1';
    setDraggedTaskId(null);
    setDropTargetColumn(null);
  }, []);

  // Handle drop
  const handleDrop = useCallback(
    (e: React.DragEvent, status: TaskStatus) => {
      e.preventDefault();
      setDropTargetColumn(null);

      if (!teamId) {
        showToast('error', 'Team ID is required. Please select a team first.');
        return;
      }

      const taskId = e.dataTransfer.getData('taskId');
      const task = tasks.find((t) => t.id === taskId);

      if (task && task.status !== status) {
        // Use shared validation function
        const result = validateAndPrepareTransition(task, status, {
          checkWipLimits: true,
          wipLimits,
          tasksByStatus,
          checkRequiredFields: true,
        });

        if (!result.valid || !result.updates) {
          showToast('error', result.error ?? 'Invalid transition');
          onSetWorkflowError(result.error ?? 'Invalid transition');
          setTimeout(() => onSetWorkflowError(null), 5000);
          return;
        }

        onSetWorkflowError(null);
        onMoveTask(taskId, result.updates);
      }
    },
    [
      tasks,
      tasksByStatus,
      wipLimits,
      onMoveTask,
      showToast,
      teamId,
      validateAndPrepareTransition,
      onSetWorkflowError,
    ]
  );

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetColumn(status);
  }, []);

  // Handle drag leave
  const handleDragLeave = useCallback(() => {
    setDropTargetColumn(null);
  }, []);

  return {
    draggedTaskId,
    dropTargetColumn,
    handleDragStart,
    handleDragEnd,
    handleDrop,
    handleDragOver,
    handleDragLeave,
  };
};

// ============================================
// useTaskFormValidation Hook
// ============================================

export interface UseTaskFormValidationOptions {
  formData: {
    title: string;
    description: string;
    pbiId: string;
    assigneeId: string;
    estimatedHours: number;
    remainingHours: number;
  };
  selectedTask: Task | null;
  onSetFormErrors: (errors: Record<string, string | undefined>) => void;
}

export interface UseTaskFormValidationReturn {
  validateForm: () => boolean;
  validateTaskStatusTransition: (
    currentStatus: TaskStatus,
    newStatus: TaskStatus
  ) => { valid: boolean; message?: string };
  validateAndPrepareTransition: (
    task: Task,
    newStatus: TaskStatus,
    options?: TransitionOptions
  ) => TransitionValidationResult;
  getAvailableTransitions: (currentStatus: TaskStatus) => TaskStatus[];
}

/**
 * Hook for managing form validation logic on the Sprint Board
 *
 * This hook consolidates all form validation logic including:
 * - Form field validation
 * - Task status transition validation
 * - WIP limit checking
 * - Required field validation for status transitions
 *
 * @param options - Configuration options for the hook
 * @returns Validation functions
 */
export const useTaskFormValidation = (
  options: UseTaskFormValidationOptions
): UseTaskFormValidationReturn => {
  const { formData, selectedTask, onSetFormErrors } = options;

  // ============================================
  // Status Transition Validation
  // ============================================

  const validateTaskStatusTransition = useCallback(
    (currentStatus: TaskStatus, newStatus: TaskStatus): { valid: boolean; message?: string } => {
      const validTransitions: Record<TaskStatus, TaskStatus[]> = {
        [TaskStatusEnum.TODO]: [TaskStatusEnum.IN_PROGRESS],
        [TaskStatusEnum.IN_PROGRESS]: [TaskStatusEnum.DONE, TaskStatusEnum.TODO],
        [TaskStatusEnum.DONE]: [],
      };

      if (currentStatus === newStatus) {
        return { valid: false, message: 'Task is already in this status' };
      }

      if (!validTransitions[currentStatus].includes(newStatus)) {
        const allowedStatuses = validTransitions[currentStatus]
          .map((s) => TASK_STATUS_CONFIG[s].label)
          .join(', ');
        return {
          valid: false,
          message: `Transition from ${TASK_STATUS_CONFIG[currentStatus].label} to ${TASK_STATUS_CONFIG[newStatus].label} is not allowed. Allowed transitions: ${allowedStatuses || 'None'}`,
        };
      }

      return { valid: true };
    },
    []
  );

  const getAvailableTransitions = useCallback((currentStatus: TaskStatus): TaskStatus[] => {
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatusEnum.TODO]: [TaskStatusEnum.IN_PROGRESS],
      [TaskStatusEnum.IN_PROGRESS]: [TaskStatusEnum.DONE, TaskStatusEnum.TODO],
      [TaskStatusEnum.DONE]: [],
    };
    return validTransitions[currentStatus];
  }, []);

  // ============================================
  // Shared Status Transition Validation
  // ============================================

  const validateAndPrepareTransition = useCallback(
    (
      task: Task,
      newStatus: TaskStatus,
      options?: TransitionOptions
    ): TransitionValidationResult => {
      // Step 1: Validate status transition
      const validationResult = validateTaskStatusTransition(task.status, newStatus);
      if (!validationResult.valid) {
        return { valid: false, error: validationResult.message ?? 'Invalid status transition' };
      }

      // Step 2: Check WIP limits for IN_PROGRESS
      if (newStatus === TaskStatusEnum.IN_PROGRESS && options?.checkWipLimits) {
        const wipLimit = options.wipLimits?.in_progress ?? 0;
        const currentCount = options.tasksByStatus?.in_progress.length ?? 0;
        if (currentCount >= wipLimit) {
          return {
            valid: false,
            error: `WIP limit reached for In Progress (${wipLimit} tasks max)`,
          };
        }
      }

      // Step 3: Check required fields for IN_PROGRESS
      if (newStatus === TaskStatusEnum.IN_PROGRESS && options?.checkRequiredFields) {
        const missingFields: string[] = [];
        if (!task.assigneeId) {
          missingFields.push('Assignee');
        }
        if (!task.estimatedHours || task.estimatedHours <= 0) {
          missingFields.push('Estimated Hours');
        }

        if (missingFields.length > 0) {
          return {
            valid: false,
            error: `Cannot move to In Progress. Please set: ${missingFields.join(', ')}`,
          };
        }
      }

      // Step 4: Prepare updates
      const updates: Partial<Task> = { status: newStatus };
      if (newStatus === TaskStatusEnum.DONE) {
        updates.remainingHours = 0;
      }

      return { valid: true, updates };
    },
    [validateTaskStatusTransition]
  );

  // ============================================
  // Form Validation
  // ============================================

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string | undefined> = {};

    // Title validation (required for both create and edit)
    if (!formData.title.trim()) {
      errors.title = 'Task title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Title must be 100 characters or less';
    }

    // Description validation (required for both create and edit)
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
    }

    // Parent Backlog Item validation (required for create only)
    if (!selectedTask && !formData.pbiId) {
      errors.pbiId = 'Please select a parent backlog item';
    }

    // Assignee validation (required for both create and edit)
    if (!formData.assigneeId) {
      errors.assigneeId = 'Assignee is required';
    }

    // Estimated hours validation (required for both create and edit)
    if (!formData.estimatedHours || formData.estimatedHours <= 0) {
      errors.estimatedHours = 'Estimated hours must be greater than 0';
    }

    // Remaining hours validation (required for both create and edit)
    if (formData.remainingHours <= 0) {
      errors.remainingHours = 'Remaining hours must be greater than 0';
    }

    // Cross-field validation: remaining hours cannot exceed estimated hours
    if (formData.remainingHours > formData.estimatedHours && formData.estimatedHours > 0) {
      errors.remainingHours = 'Remaining hours cannot exceed estimated hours';
    }

    onSetFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, selectedTask, onSetFormErrors]);

  return {
    validateForm,
    validateTaskStatusTransition,
    validateAndPrepareTransition,
    getAvailableTransitions,
  };
};
