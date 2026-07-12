import { ItemStatus } from '../types';

export interface WorkflowTransition {
  allowed: ItemStatus[];
  description: string;
  requiresValidation?: boolean;
}

// Translation keys for status descriptions
export const WORKFLOW_DESCRIPTION_KEYS: Record<ItemStatus, string> = {
  [ItemStatus.NEW]: 'workflowTransitions.newDescription',
  [ItemStatus.REFINED]: 'workflowTransitions.refinedDescription',
  [ItemStatus.READY]: 'workflowTransitions.readyDescription',
  [ItemStatus.IN_PROGRESS]: 'workflowTransitions.inProgressDescription',
  [ItemStatus.DONE]: 'workflowTransitions.doneDescription',
};

export const WORKFLOW_TRANSITIONS: Record<ItemStatus, WorkflowTransition> = {
  [ItemStatus.NEW]: {
    allowed: [ItemStatus.REFINED],
    description: 'workflowTransitions.newDescription',
    requiresValidation: false,
  },
  [ItemStatus.REFINED]: {
    allowed: [ItemStatus.READY, ItemStatus.NEW],
    description: 'workflowTransitions.refinedDescription',
    requiresValidation: false,
  },
  [ItemStatus.READY]: {
    allowed: [ItemStatus.IN_PROGRESS, ItemStatus.REFINED],
    description: 'workflowTransitions.readyDescription',
    requiresValidation: true,
  },
  [ItemStatus.IN_PROGRESS]: {
    allowed: [ItemStatus.DONE, ItemStatus.READY],
    description: 'workflowTransitions.inProgressDescription',
    requiresValidation: true,
  },
  [ItemStatus.DONE]: {
    allowed: [],
    description: 'workflowTransitions.doneDescription',
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

/**
 * Get transition error message key for i18n
 */
export const getTransitionErrorKey = (): string => {
  return 'validation.invalidTransition';
};

/**
 * Get transition error message data for i18n
 */
export const getTransitionErrorData = (
  from: ItemStatus,
  to: ItemStatus,
  statusLabels: Record<ItemStatus, string>
): { current: string; target: string; allowed: string } => {
  const allowedStatuses = WORKFLOW_TRANSITIONS[from].allowed.map((s) => statusLabels[s]).join(', ');
  return {
    current: statusLabels[from],
    target: statusLabels[to],
    allowed: allowedStatuses || 'None',
  };
};

export const getTransitionDescription = (from: ItemStatus, _to: ItemStatus): string => {
  return WORKFLOW_TRANSITIONS[from].description;
};

export const requiresValidation = (from: ItemStatus, to: ItemStatus): boolean => {
  return canTransition(from, to) && WORKFLOW_TRANSITIONS[from].requiresValidation === true;
};

/**
 * Validate transition - returns translation key and data for i18n
 */
export const validateTransition = (
  currentStatus: ItemStatus,
  newStatus: ItemStatus
): {
  valid: boolean;
  messageKey?: string;
  messageData?: Record<string, string>;
  requiresValidation: boolean;
} => {
  if (currentStatus === newStatus) {
    return {
      valid: false,
      messageKey: 'validation.statusAlreadySet',
      requiresValidation: false,
    };
  }

  if (!canTransition(currentStatus, newStatus)) {
    return {
      valid: false,
      messageKey: 'validation.invalidTransition',
      requiresValidation: false,
    };
  }

  return {
    valid: true,
    requiresValidation: requiresValidation(currentStatus, newStatus),
  };
};
