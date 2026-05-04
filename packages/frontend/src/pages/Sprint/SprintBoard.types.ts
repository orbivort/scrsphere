import { type UseMutationResult } from '@tanstack/react-query';

import {
  type Task,
  type TaskStatus,
  type Sprint,
  type TeamMember,
  type User,
  type ProductBacklogItem,
  type DoDItem,
  type Impediment,
  type DoDChecklistVerification,
} from '../../types';

// ============================================================================
// Existing Types
// ============================================================================

export interface TaskFormData {
  title: string;
  description: string;
  pbiId: string;
  assigneeId: string;
  status: TaskStatus;
  estimatedHours: number;
  remainingHours: number;
}

export interface FormErrors {
  title?: string;
  description?: string;
  pbiId?: string;
  assigneeId?: string;
  estimatedHours?: string;
  remainingHours?: string;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface BurndownDataPoint {
  day: number;
  date: string;
  ideal: number;
  actual: number | null;
}

export interface WIPLimits {
  todo: number;
  in_progress: number;
  done: number;
}

export type ViewMode = 'kanban' | 'swimlanes';
export type SwimlaneGroup = 'assignee' | 'pbi' | 'none';

export interface ModalState {
  showTaskModal: boolean;
  showDetailModal: boolean;
  showEditModal: boolean;
  showDeleteConfirm: boolean;
  showCompleteSprintModal: boolean;
  showBacklogManager: boolean;
  showDodVerification: boolean;
  showKeyboardHelp: boolean;
  selectedTask: Task | null;
  completeSprintError: string | null;
  workflowError: string | null;
}

export type ModalAction =
  | { type: 'OPEN_CREATE_MODAL' }
  | { type: 'OPEN_DETAIL_MODAL'; payload: Task }
  | { type: 'OPEN_EDIT_MODAL'; payload: Task }
  | { type: 'OPEN_DELETE_CONFIRM'; payload: Task }
  | { type: 'OPEN_COMPLETE_SPRINT_MODAL' }
  | { type: 'OPEN_BACKLOG_MANAGER' }
  | { type: 'OPEN_DOD_VERIFICATION' }
  | { type: 'OPEN_KEYBOARD_HELP' }
  | { type: 'CLOSE_CREATE_MODAL' }
  | { type: 'CLOSE_DETAIL_MODAL' }
  | { type: 'CLOSE_EDIT_MODAL' }
  | { type: 'CLOSE_DELETE_CONFIRM' }
  | { type: 'CLOSE_COMPLETE_SPRINT_MODAL' }
  | { type: 'CLOSE_BACKLOG_MANAGER' }
  | { type: 'CLOSE_DOD_VERIFICATION' }
  | { type: 'CLOSE_KEYBOARD_HELP' }
  | { type: 'SET_COMPLETE_SPRINT_ERROR'; payload: string | null }
  | { type: 'SET_WORKFLOW_ERROR'; payload: string | null }
  | { type: 'RESET_ALL_MODALS' };

export interface FormState {
  formData: TaskFormData;
  formErrors: FormErrors;
}

export type FormAction =
  | { type: 'SET_FORM_DATA'; payload: Partial<TaskFormData> }
  | { type: 'SET_FORM_ERRORS'; payload: FormErrors }
  | { type: 'CLEAR_FORM_ERRORS' }
  | { type: 'RESET_FORM' }
  | { type: 'INITIALIZE_FORM_FOR_EDIT'; payload: Task }
  | { type: 'INITIALIZE_FORM_FOR_CREATE'; payload?: TaskStatus };

export interface TransitionValidationResult {
  valid: boolean;
  updates?: Partial<Task>;
  error?: string;
}

// ============================================================================
// New Types for Extracted Hooks
// ============================================================================

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

export interface TasksByStatus {
  todo: Task[];
  in_progress: Task[];
  done: Task[];
}

export interface WipWarning {
  column: TaskStatus;
  current: number;
  limit: number;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
}

export interface TransitionOptions {
  checkWipLimits?: boolean;
  wipLimits?: { in_progress: number };
  tasksByStatus?: TasksByStatus;
  checkRequiredFields?: boolean;
}

// ============================================================================
// Hook Options and Return Types
// ============================================================================

export interface UseSprintBoardDataOptions {
  teamId: string | undefined;
  showBurndown: boolean;
  showDodVerification: boolean;
  filterAssignee: string;
  filterPbi: string;
  debouncedSearchQuery: string;
  swimlaneGroup: SwimlaneGroup;
}

export interface UseSprintBoardDataReturn {
  sprint: Sprint | null;
  tasks: Task[];
  teamMembers: (TeamMember & { user?: User })[];
  sprintItems: ProductBacklogItem[];
  dodItems: DoDItem[];
  impediments: Impediment[];
  dodVerifications: DoDChecklistVerification[];
  burndownData: unknown;
  isLoading: boolean;
  sprintLoading: boolean;
  tasksLoading: boolean;
  wipLimits: WIPLimits;
  filteredTasks: Task[];
  tasksByStatus: TasksByStatus;
  sprintStats: SprintStats;
  daysRemaining: number;
  sprintDuration: number;
  burndownChartData: BurndownDataPoint[];
  wipWarnings: WipWarning[];
  groupedBySwimlane: Record<string, Task[]> | null;
}

export interface UseTaskFormValidationOptions {
  formData: TaskFormData;
  selectedTask: Task | null;
}

export interface UseTaskFormValidationReturn {
  validateForm: () => boolean;
  validateTaskStatusTransition: (
    currentStatus: TaskStatus,
    newStatus: TaskStatus
  ) => ValidationResult;
  validateAndPrepareTransition: (
    task: Task,
    newStatus: TaskStatus,
    options?: TransitionOptions
  ) => TransitionValidationResult;
  getAvailableTransitions: (currentStatus: TaskStatus) => TaskStatus[];
}

export interface UseDragAndDropReturn {
  draggedTaskId: string | null;
  dropTargetColumn: TaskStatus | null;
  handleDragStart: (e: React.DragEvent, taskId: string) => void;
  handleDragEnd: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, status: TaskStatus) => void;
  handleDragOver: (e: React.DragEvent, status: TaskStatus) => void;
  handleDragLeave: () => void;
}

export interface UseKeyboardNavigationOptions {
  tasks: Task[];
  filteredTasks: Task[];
  tasksByStatus: TasksByStatus;
  wipLimits: WIPLimits;
  onMoveTask: (taskId: string, updates: Partial<Task>) => void;
  onOpenDetail: (task: Task) => void;
  showToast: (type: string, message: string) => void;
}

export interface UseKeyboardNavigationReturn {
  focusedTaskId: string | null;
  setFocusedTaskId: (id: string | null) => void;
  keyboardDraggedTaskId: string | null;
  keyboardGrabState: 'idle' | 'grabbed';
  keyboardDropTargetStatus: TaskStatus | null;
  handleKeyDown: (e: React.KeyboardEvent, task: Task) => void;
}

export interface UseTaskMutationsOptions {
  sprintId: string | undefined;
  teamId: string | undefined;
  onSuccess: (action: 'create' | 'update' | 'delete' | 'complete') => void;
  onError: (action: 'create' | 'update' | 'delete' | 'complete', error: unknown) => void;
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
