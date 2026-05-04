import { ItemStatus } from '../types';

export interface WorkflowTransition {
  allowed: ItemStatus[];
  description: string;
  requiresValidation?: boolean;
}

export const WORKFLOW_TRANSITIONS: Record<ItemStatus, WorkflowTransition> = {
  [ItemStatus.NEW]: {
    allowed: [ItemStatus.REFINED],
    description: 'New items must be refined first',
    requiresValidation: false,
  },
  [ItemStatus.REFINED]: {
    allowed: [ItemStatus.READY, ItemStatus.NEW],
    description: 'Refined items can be marked ready or sent back to new',
    requiresValidation: false,
  },
  [ItemStatus.READY]: {
    allowed: [ItemStatus.IN_PROGRESS, ItemStatus.REFINED],
    description: 'Ready items can be started or sent back to refined',
    requiresValidation: true,
  },
  [ItemStatus.IN_PROGRESS]: {
    allowed: [ItemStatus.DONE, ItemStatus.READY],
    description: 'In progress items can be completed or sent back to ready',
    requiresValidation: true,
  },
  [ItemStatus.DONE]: {
    allowed: [],
    description: 'Completed items cannot be transitioned',
    requiresValidation: false,
  },
};

export const canTransition = (from: ItemStatus, to: ItemStatus): boolean => {
  if (from === to) return false;
  return WORKFLOW_TRANSITIONS[from].allowed.includes(to);
};

export const getValidTransitions = (currentStatus: ItemStatus): ItemStatus[] => {
  return WORKFLOW_TRANSITIONS[currentStatus].allowed;
};

export const getTransitionDescription = (from: ItemStatus, to: ItemStatus): string => {
  if (!canTransition(from, to)) {
    const allowedStatuses = WORKFLOW_TRANSITIONS[from].allowed
      .map((s) => s.replace('_', ' '))
      .join(', ');
    return `Transition from ${from.replace('_', ' ')} to ${to.replace('_', ' ')} is not allowed. Allowed transitions: ${allowedStatuses || 'None'}`;
  }
  return WORKFLOW_TRANSITIONS[from].description;
};

export const requiresValidation = (from: ItemStatus, to: ItemStatus): boolean => {
  return canTransition(from, to) && WORKFLOW_TRANSITIONS[from].requiresValidation === true;
};

export const validateTransition = (
  currentStatus: ItemStatus,
  newStatus: ItemStatus
): { valid: boolean; message?: string; requiresValidation: boolean } => {
  if (currentStatus === newStatus) {
    return {
      valid: false,
      message: 'Item is already in this status',
      requiresValidation: false,
    };
  }

  if (!canTransition(currentStatus, newStatus)) {
    return {
      valid: false,
      message: getTransitionDescription(currentStatus, newStatus),
      requiresValidation: false,
    };
  }

  return {
    valid: true,
    requiresValidation: requiresValidation(currentStatus, newStatus),
  };
};
