import { TaskStatus as TaskStatusEnum } from '../../types';

import type { ModalState, ModalAction, FormState, FormAction } from './SprintBoard.types';
import { initialFormData } from './SprintBoard.constants';

export const initialModalState: ModalState = {
  showTaskModal: false,
  showDetailModal: false,
  showEditModal: false,
  showDeleteConfirm: false,
  showCompleteSprintModal: false,
  showBacklogManager: false,
  showDodVerification: false,
  showKeyboardHelp: false,
  selectedTask: null,
  completeSprintError: null,
  workflowError: null,
};

export function modalReducer(state: ModalState, action: ModalAction): ModalState {
  switch (action.type) {
    case 'OPEN_CREATE_MODAL':
      return { ...state, showTaskModal: true, selectedTask: null, workflowError: null };
    case 'OPEN_DETAIL_MODAL':
      return { ...state, showDetailModal: true, selectedTask: action.payload, workflowError: null };
    case 'OPEN_EDIT_MODAL':
      return { ...state, showEditModal: true, selectedTask: action.payload, workflowError: null };
    case 'OPEN_DELETE_CONFIRM':
      return {
        ...state,
        showDeleteConfirm: true,
        selectedTask: action.payload,
        workflowError: null,
      };
    case 'OPEN_COMPLETE_SPRINT_MODAL':
      return { ...state, showCompleteSprintModal: true, workflowError: null };
    case 'OPEN_BACKLOG_MANAGER':
      return { ...state, showBacklogManager: true, workflowError: null };
    case 'OPEN_DOD_VERIFICATION':
      return { ...state, showDodVerification: true, workflowError: null };
    case 'OPEN_KEYBOARD_HELP':
      return { ...state, showKeyboardHelp: true };
    case 'CLOSE_CREATE_MODAL':
      return { ...state, showTaskModal: false, workflowError: null };
    case 'CLOSE_DETAIL_MODAL':
      return { ...state, showDetailModal: false, workflowError: null };
    case 'CLOSE_EDIT_MODAL':
      return { ...state, showEditModal: false, workflowError: null };
    case 'CLOSE_DELETE_CONFIRM':
      return { ...state, showDeleteConfirm: false, selectedTask: null, workflowError: null };
    case 'CLOSE_COMPLETE_SPRINT_MODAL':
      return {
        ...state,
        showCompleteSprintModal: false,
        completeSprintError: null,
        workflowError: null,
      };
    case 'CLOSE_BACKLOG_MANAGER':
      return { ...state, showBacklogManager: false, workflowError: null };
    case 'CLOSE_DOD_VERIFICATION':
      return { ...state, showDodVerification: false, workflowError: null };
    case 'CLOSE_KEYBOARD_HELP':
      return { ...state, showKeyboardHelp: false };
    case 'SET_COMPLETE_SPRINT_ERROR':
      return { ...state, completeSprintError: action.payload };
    case 'SET_WORKFLOW_ERROR':
      return { ...state, workflowError: action.payload };
    case 'RESET_ALL_MODALS':
      return initialModalState;
    default:
      return state;
  }
}

export const resetModalState = (): ModalState => initialModalState;

export const initialFormState: FormState = {
  formData: initialFormData,
  formErrors: {},
};

export function formReducer(state: FormState, action: FormAction): FormState {
  switch (action.type) {
    case 'SET_FORM_DATA':
      return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'SET_FORM_ERRORS':
      return { ...state, formErrors: action.payload };
    case 'CLEAR_FORM_ERRORS':
      return { ...state, formErrors: {} };
    case 'RESET_FORM':
      return initialFormState;
    case 'INITIALIZE_FORM_FOR_EDIT': {
      const task = action.payload;
      return {
        ...state,
        formData: {
          title: task.title,
          description: task.description ?? '',
          pbiId: task.pbiId || '',
          assigneeId: task.assigneeId ?? '',
          status: task.status,
          estimatedHours: task.estimatedHours ?? 0,
          remainingHours: task.remainingHours ?? 0,
        },
        formErrors: {},
      };
    }
    case 'INITIALIZE_FORM_FOR_CREATE':
      return {
        ...state,
        formData: {
          ...initialFormData,
          status: action.payload ?? TaskStatusEnum.TODO,
        },
        formErrors: {},
      };
    default:
      return state;
  }
}

export const resetFormState = (): FormState => initialFormState;
