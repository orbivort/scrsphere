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

export const TASK_STATUS_CONFIG: Record<
  TaskStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    description: string;
  }
> = {
  [TaskStatusEnum.TODO]: {
    label: 'To Do',
    color: '#6b7280',
    bgColor: '#f3f4f6',
    borderColor: '#d1d5db',
    icon: 'M12 4v16m8-8H4',
    description: 'Task is ready to be started',
  },
  [TaskStatusEnum.IN_PROGRESS]: {
    label: 'In Progress',
    color: '#1e40af',
    bgColor: '#dbeafe',
    borderColor: '#93c5fd',
    icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
    description: 'Task is currently being worked on',
  },
  [TaskStatusEnum.DONE]: {
    label: 'Done',
    color: '#065f46',
    bgColor: '#d1fae5',
    borderColor: '#6ee7b7',
    icon: 'M5 13l4 4L19 7',
    description: 'Task has been completed',
  },
};
