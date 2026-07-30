import { TaskStatus as TaskStatusEnum, type TaskStatus } from '../../types';

import type { TaskFormData } from './SprintBoard.types';

export const initialFormData: TaskFormData = {
  title: '',
  description: '',
  pbiId: '',
  assigneeId: '',
  status: TaskStatusEnum.TODO,
  estimatedHours: 0,
  remainingHours: 0,
};

export const calculateWIPLimit = (teamSize: number): number => {
  return teamSize + 1;
};

/**
 * Base task status configuration without labels (for i18n support)
 */
export const TASK_STATUS_CONFIG_BASE: Record<
  TaskStatus,
  {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
  }
> = {
  [TaskStatusEnum.TODO]: {
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db',
    icon: 'M12 4v16m8-8H4',
  },
  [TaskStatusEnum.IN_PROGRESS]: {
    color: '#1e40af',
    bgColor: '#dbeafe',
    borderColor: '#93c5fd',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  },
  [TaskStatusEnum.DONE]: {
    color: '#065f46',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    icon: 'M5 13l4 4L19 7',
  },
};

/**
 * Status label keys for i18n
 */
export const TASK_STATUS_LABEL_KEYS: Record<TaskStatus, string> = {
  [TaskStatusEnum.TODO]: 'taskStatus.todo',
  [TaskStatusEnum.IN_PROGRESS]: 'taskStatus.inProgress',
  [TaskStatusEnum.DONE]: 'taskStatus.done',
};

/**
 * Status description keys for i18n
 */
export const TASK_STATUS_DESCRIPTION_KEYS: Record<TaskStatus, string> = {
  [TaskStatusEnum.TODO]: 'taskStatus.todoDesc',
  [TaskStatusEnum.IN_PROGRESS]: 'taskStatus.inProgressDesc',
  [TaskStatusEnum.DONE]: 'taskStatus.doneDesc',
};
