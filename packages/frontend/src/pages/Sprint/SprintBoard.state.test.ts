import { describe, it, expect } from 'vitest';
import {
  initialModalState,
  modalReducer,
  resetModalState,
  initialFormState,
  formReducer,
  resetFormState,
} from './SprintBoard.state';
import type { ModalState, ModalAction, FormState, FormAction } from './SprintBoard.types';
import type { Task, TaskStatus } from '../../types';

describe('initialModalState', () => {
  it('should have all modal flags set to false', () => {
    expect(initialModalState.showTaskModal).toBe(false);
    expect(initialModalState.showDetailModal).toBe(false);
    expect(initialModalState.showEditModal).toBe(false);
    expect(initialModalState.showDeleteConfirm).toBe(false);
    expect(initialModalState.showCompleteSprintModal).toBe(false);
    expect(initialModalState.showBacklogManager).toBe(false);
    expect(initialModalState.showDodVerification).toBe(false);
    expect(initialModalState.showKeyboardHelp).toBe(false);
  });

  it('should have null selectedTask', () => {
    expect(initialModalState.selectedTask).toBeNull();
  });

  it('should have null errors', () => {
    expect(initialModalState.completeSprintError).toBeNull();
    expect(initialModalState.workflowError).toBeNull();
  });
});

describe('modalReducer', () => {
  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-1',
    sprintId: 'sprint-1',
    pbiId: 'pbi-1',
    title: 'Test Task',
    status: 'TODO' as TaskStatus,
    assigneeId: 'user-1',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  });

  describe('OPEN actions', () => {
    it('should handle OPEN_CREATE_MODAL', () => {
      const action: ModalAction = { type: 'OPEN_CREATE_MODAL' };
      const state = modalReducer(initialModalState, action);

      expect(state.showTaskModal).toBe(true);
      expect(state.selectedTask).toBeNull();
      expect(state.workflowError).toBeNull();
    });

    it('should handle OPEN_DETAIL_MODAL', () => {
      const task = createMockTask();
      const action: ModalAction = { type: 'OPEN_DETAIL_MODAL', payload: task };
      const state = modalReducer(initialModalState, action);

      expect(state.showDetailModal).toBe(true);
      expect(state.selectedTask).toEqual(task);
      expect(state.workflowError).toBeNull();
    });

    it('should handle OPEN_EDIT_MODAL', () => {
      const task = createMockTask();
      const action: ModalAction = { type: 'OPEN_EDIT_MODAL', payload: task };
      const state = modalReducer(initialModalState, action);

      expect(state.showEditModal).toBe(true);
      expect(state.selectedTask).toEqual(task);
      expect(state.workflowError).toBeNull();
    });

    it('should handle OPEN_DELETE_CONFIRM', () => {
      const task = createMockTask();
      const action: ModalAction = { type: 'OPEN_DELETE_CONFIRM', payload: task };
      const state = modalReducer(initialModalState, action);

      expect(state.showDeleteConfirm).toBe(true);
      expect(state.selectedTask).toEqual(task);
      expect(state.workflowError).toBeNull();
    });

    it('should handle OPEN_COMPLETE_SPRINT_MODAL', () => {
      const action: ModalAction = { type: 'OPEN_COMPLETE_SPRINT_MODAL' };
      const state = modalReducer(initialModalState, action);

      expect(state.showCompleteSprintModal).toBe(true);
      expect(state.workflowError).toBeNull();
    });

    it('should handle OPEN_BACKLOG_MANAGER', () => {
      const action: ModalAction = { type: 'OPEN_BACKLOG_MANAGER' };
      const state = modalReducer(initialModalState, action);

      expect(state.showBacklogManager).toBe(true);
      expect(state.workflowError).toBeNull();
    });

    it('should handle OPEN_DOD_VERIFICATION', () => {
      const action: ModalAction = { type: 'OPEN_DOD_VERIFICATION' };
      const state = modalReducer(initialModalState, action);

      expect(state.showDodVerification).toBe(true);
      expect(state.workflowError).toBeNull();
    });

    it('should handle OPEN_KEYBOARD_HELP', () => {
      const action: ModalAction = { type: 'OPEN_KEYBOARD_HELP' };
      const state = modalReducer(initialModalState, action);

      expect(state.showKeyboardHelp).toBe(true);
    });
  });

  describe('CLOSE actions', () => {
    it('should handle CLOSE_CREATE_MODAL', () => {
      const openState = modalReducer(initialModalState, { type: 'OPEN_CREATE_MODAL' });
      const closeAction: ModalAction = { type: 'CLOSE_CREATE_MODAL' };
      const state = modalReducer(openState, closeAction);

      expect(state.showTaskModal).toBe(false);
      expect(state.workflowError).toBeNull();
    });

    it('should handle CLOSE_DETAIL_MODAL', () => {
      const task = createMockTask();
      const openState = modalReducer(initialModalState, {
        type: 'OPEN_DETAIL_MODAL',
        payload: task,
      });
      const closeAction: ModalAction = { type: 'CLOSE_DETAIL_MODAL' };
      const state = modalReducer(openState, closeAction);

      expect(state.showDetailModal).toBe(false);
      expect(state.workflowError).toBeNull();
    });

    it('should handle CLOSE_EDIT_MODAL', () => {
      const task = createMockTask();
      const openState = modalReducer(initialModalState, { type: 'OPEN_EDIT_MODAL', payload: task });
      const closeAction: ModalAction = { type: 'CLOSE_EDIT_MODAL' };
      const state = modalReducer(openState, closeAction);

      expect(state.showEditModal).toBe(false);
      expect(state.workflowError).toBeNull();
    });

    it('should handle CLOSE_DELETE_CONFIRM and clear selectedTask', () => {
      const task = createMockTask();
      const openState = modalReducer(initialModalState, {
        type: 'OPEN_DELETE_CONFIRM',
        payload: task,
      });
      const closeAction: ModalAction = { type: 'CLOSE_DELETE_CONFIRM' };
      const state = modalReducer(openState, closeAction);

      expect(state.showDeleteConfirm).toBe(false);
      expect(state.selectedTask).toBeNull();
      expect(state.workflowError).toBeNull();
    });

    it('should handle CLOSE_COMPLETE_SPRINT_MODAL and clear error', () => {
      const openState = modalReducer(initialModalState, { type: 'OPEN_COMPLETE_SPRINT_MODAL' });
      const errorState = modalReducer(openState, {
        type: 'SET_COMPLETE_SPRINT_ERROR',
        payload: 'Error',
      });
      const closeAction: ModalAction = { type: 'CLOSE_COMPLETE_SPRINT_MODAL' };
      const state = modalReducer(errorState, closeAction);

      expect(state.showCompleteSprintModal).toBe(false);
      expect(state.completeSprintError).toBeNull();
      expect(state.workflowError).toBeNull();
    });

    it('should handle CLOSE_BACKLOG_MANAGER', () => {
      const openState = modalReducer(initialModalState, { type: 'OPEN_BACKLOG_MANAGER' });
      const closeAction: ModalAction = { type: 'CLOSE_BACKLOG_MANAGER' };
      const state = modalReducer(openState, closeAction);

      expect(state.showBacklogManager).toBe(false);
      expect(state.workflowError).toBeNull();
    });

    it('should handle CLOSE_DOD_VERIFICATION', () => {
      const openState = modalReducer(initialModalState, { type: 'OPEN_DOD_VERIFICATION' });
      const closeAction: ModalAction = { type: 'CLOSE_DOD_VERIFICATION' };
      const state = modalReducer(openState, closeAction);

      expect(state.showDodVerification).toBe(false);
      expect(state.workflowError).toBeNull();
    });

    it('should handle CLOSE_KEYBOARD_HELP', () => {
      const openState = modalReducer(initialModalState, { type: 'OPEN_KEYBOARD_HELP' });
      const closeAction: ModalAction = { type: 'CLOSE_KEYBOARD_HELP' };
      const state = modalReducer(openState, closeAction);

      expect(state.showKeyboardHelp).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle SET_COMPLETE_SPRINT_ERROR', () => {
      const action: ModalAction = {
        type: 'SET_COMPLETE_SPRINT_ERROR',
        payload: 'Sprint completion failed',
      };
      const state = modalReducer(initialModalState, action);

      expect(state.completeSprintError).toBe('Sprint completion failed');
    });

    it('should handle SET_COMPLETE_SPRINT_ERROR with null', () => {
      const errorState = modalReducer(initialModalState, {
        type: 'SET_COMPLETE_SPRINT_ERROR',
        payload: 'Error',
      });
      const action: ModalAction = { type: 'SET_COMPLETE_SPRINT_ERROR', payload: null };
      const state = modalReducer(errorState, action);

      expect(state.completeSprintError).toBeNull();
    });

    it('should handle SET_WORKFLOW_ERROR', () => {
      const action: ModalAction = {
        type: 'SET_WORKFLOW_ERROR',
        payload: 'Workflow error occurred',
      };
      const state = modalReducer(initialModalState, action);

      expect(state.workflowError).toBe('Workflow error occurred');
    });

    it('should handle SET_WORKFLOW_ERROR with null', () => {
      const errorState = modalReducer(initialModalState, {
        type: 'SET_WORKFLOW_ERROR',
        payload: 'Error',
      });
      const action: ModalAction = { type: 'SET_WORKFLOW_ERROR', payload: null };
      const state = modalReducer(errorState, action);

      expect(state.workflowError).toBeNull();
    });
  });

  describe('RESET_ALL_MODALS', () => {
    it('should reset all modal state to initial', () => {
      const task = createMockTask();
      const modifiedState: ModalState = {
        showTaskModal: true,
        showDetailModal: true,
        showEditModal: true,
        showDeleteConfirm: true,
        showCompleteSprintModal: true,
        showBacklogManager: true,
        showDodVerification: true,
        showKeyboardHelp: true,
        selectedTask: task,
        completeSprintError: 'Error',
        workflowError: 'Workflow error',
      };

      const action: ModalAction = { type: 'RESET_ALL_MODALS' };
      const state = modalReducer(modifiedState, action);

      expect(state).toEqual(initialModalState);
    });
  });

  describe('Unknown action', () => {
    it('should return current state for unknown action', () => {
      const action = { type: 'UNKNOWN_ACTION' } as unknown as ModalAction;
      const state = modalReducer(initialModalState, action);

      expect(state).toEqual(initialModalState);
    });
  });
});

describe('resetModalState', () => {
  it('should return initial modal state', () => {
    const state = resetModalState();
    expect(state).toEqual(initialModalState);
  });
});

describe('initialFormState', () => {
  it('should have initial form data', () => {
    expect(initialFormState.formData.title).toBe('');
    expect(initialFormState.formData.description).toBe('');
    expect(initialFormState.formData.pbiId).toBe('');
    expect(initialFormState.formData.assigneeId).toBe('');
    expect(initialFormState.formData.status).toBe('TODO');
    expect(initialFormState.formData.estimatedHours).toBe(0);
    expect(initialFormState.formData.remainingHours).toBe(0);
  });

  it('should have empty form errors', () => {
    expect(initialFormState.formErrors).toEqual({});
  });
});

describe('formReducer', () => {
  describe('SET_FORM_DATA', () => {
    it('should update form data with partial data', () => {
      const action: FormAction = { type: 'SET_FORM_DATA', payload: { title: 'New Title' } };
      const state = formReducer(initialFormState, action);

      expect(state.formData.title).toBe('New Title');
      expect(state.formData.description).toBe(''); // unchanged
    });

    it('should merge multiple field updates', () => {
      const action: FormAction = {
        type: 'SET_FORM_DATA',
        payload: { title: 'New Title', estimatedHours: 8 },
      };
      const state = formReducer(initialFormState, action);

      expect(state.formData.title).toBe('New Title');
      expect(state.formData.estimatedHours).toBe(8);
      expect(state.formData.description).toBe(''); // unchanged
    });

    it('should preserve existing data when updating', () => {
      const firstUpdate: FormAction = { type: 'SET_FORM_DATA', payload: { title: 'First Title' } };
      const intermediateState = formReducer(initialFormState, firstUpdate);

      const secondUpdate: FormAction = {
        type: 'SET_FORM_DATA',
        payload: { description: 'Description' },
      };
      const finalState = formReducer(intermediateState, secondUpdate);

      expect(finalState.formData.title).toBe('First Title');
      expect(finalState.formData.description).toBe('Description');
    });
  });

  describe('SET_FORM_ERRORS', () => {
    it('should set form errors', () => {
      const action: FormAction = {
        type: 'SET_FORM_ERRORS',
        payload: { title: 'Title is required' },
      };
      const state = formReducer(initialFormState, action);

      expect(state.formErrors).toEqual({ title: 'Title is required' });
    });

    it('should replace existing errors', () => {
      const firstError: FormAction = {
        type: 'SET_FORM_ERRORS',
        payload: { title: 'Title error' },
      };
      const intermediateState = formReducer(initialFormState, firstError);

      const secondError: FormAction = {
        type: 'SET_FORM_ERRORS',
        payload: { description: 'Description error' },
      };
      const finalState = formReducer(intermediateState, secondError);

      expect(finalState.formErrors).toEqual({ description: 'Description error' });
    });

    it('should handle multiple errors', () => {
      const action: FormAction = {
        type: 'SET_FORM_ERRORS',
        payload: {
          title: 'Title is required',
          description: 'Description is required',
        },
      };
      const state = formReducer(initialFormState, action);

      expect(state.formErrors).toEqual({
        title: 'Title is required',
        description: 'Description is required',
      });
    });
  });

  describe('CLEAR_FORM_ERRORS', () => {
    it('should clear all form errors', () => {
      const errorState: FormState = {
        ...initialFormState,
        formErrors: { title: 'Error', description: 'Another error' },
      };

      const action: FormAction = { type: 'CLEAR_FORM_ERRORS' };
      const state = formReducer(errorState, action);

      expect(state.formErrors).toEqual({});
    });

    it('should work when no errors exist', () => {
      const action: FormAction = { type: 'CLEAR_FORM_ERRORS' };
      const state = formReducer(initialFormState, action);

      expect(state.formErrors).toEqual({});
    });
  });

  describe('RESET_FORM', () => {
    it('should reset form to initial state', () => {
      const modifiedState: FormState = {
        formData: {
          title: 'Modified',
          description: 'Modified Desc',
          pbiId: 'pbi-1',
          assigneeId: 'user-1',
          status: 'IN_PROGRESS' as TaskStatus,
          estimatedHours: 10,
          remainingHours: 5,
        },
        formErrors: { title: 'Error' },
      };

      const action: FormAction = { type: 'RESET_FORM' };
      const state = formReducer(modifiedState, action);

      expect(state).toEqual(initialFormState);
    });
  });

  describe('INITIALIZE_FORM_FOR_EDIT', () => {
    it('should initialize form with task data', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Task Title',
        description: 'Task Description',
        pbiId: 'pbi-1',
        assigneeId: 'user-1',
        status: 'IN_PROGRESS' as TaskStatus,
        estimatedHours: 8,
        remainingHours: 5,
        sprintId: 'sprint-1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      const action: FormAction = { type: 'INITIALIZE_FORM_FOR_EDIT', payload: task };
      const state = formReducer(initialFormState, action);

      expect(state.formData.title).toBe('Task Title');
      expect(state.formData.description).toBe('Task Description');
      expect(state.formData.pbiId).toBe('pbi-1');
      expect(state.formData.assigneeId).toBe('user-1');
      expect(state.formData.status).toBe('IN_PROGRESS');
      expect(state.formData.estimatedHours).toBe(8);
      expect(state.formData.remainingHours).toBe(5);
      expect(state.formErrors).toEqual({});
    });

    it('should handle task with undefined description', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Task Title',
        description: undefined,
        pbiId: 'pbi-1',
        assigneeId: 'user-1',
        status: 'TODO' as TaskStatus,
        estimatedHours: 8,
        remainingHours: 8,
        sprintId: 'sprint-1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      const action: FormAction = { type: 'INITIALIZE_FORM_FOR_EDIT', payload: task };
      const state = formReducer(initialFormState, action);

      expect(state.formData.description).toBe('');
    });

    it('should handle task with undefined pbiId', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Task Title',
        description: 'Description',
        pbiId: undefined,
        assigneeId: 'user-1',
        status: 'TODO' as TaskStatus,
        estimatedHours: 8,
        remainingHours: 8,
        sprintId: 'sprint-1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      const action: FormAction = { type: 'INITIALIZE_FORM_FOR_EDIT', payload: task };
      const state = formReducer(initialFormState, action);

      expect(state.formData.pbiId).toBe('');
    });

    it('should handle task with undefined assigneeId', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Task Title',
        description: 'Description',
        pbiId: 'pbi-1',
        assigneeId: undefined,
        status: 'TODO' as TaskStatus,
        estimatedHours: 8,
        remainingHours: 8,
        sprintId: 'sprint-1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      const action: FormAction = { type: 'INITIALIZE_FORM_FOR_EDIT', payload: task };
      const state = formReducer(initialFormState, action);

      expect(state.formData.assigneeId).toBe('');
    });

    it('should handle task with undefined hours', () => {
      const task: Task = {
        id: 'task-1',
        title: 'Task Title',
        description: 'Description',
        pbiId: 'pbi-1',
        assigneeId: 'user-1',
        status: 'TODO' as TaskStatus,
        estimatedHours: undefined,
        remainingHours: undefined,
        sprintId: 'sprint-1',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      };

      const action: FormAction = { type: 'INITIALIZE_FORM_FOR_EDIT', payload: task };
      const state = formReducer(initialFormState, action);

      expect(state.formData.estimatedHours).toBe(0);
      expect(state.formData.remainingHours).toBe(0);
    });
  });

  describe('INITIALIZE_FORM_FOR_CREATE', () => {
    it('should initialize form with TODO status by default', () => {
      const action: FormAction = { type: 'INITIALIZE_FORM_FOR_CREATE' };
      const state = formReducer(initialFormState, action);

      expect(state.formData.status).toBe('TODO');
      expect(state.formData.title).toBe('');
      expect(state.formData.description).toBe('');
      expect(state.formErrors).toEqual({});
    });

    it('should initialize form with specified status', () => {
      const action: FormAction = {
        type: 'INITIALIZE_FORM_FOR_CREATE',
        payload: 'IN_PROGRESS' as TaskStatus,
      };
      const state = formReducer(initialFormState, action);

      expect(state.formData.status).toBe('IN_PROGRESS');
    });

    it('should reset all fields when initializing for create', () => {
      const modifiedState: FormState = {
        formData: {
          title: 'Old Title',
          description: 'Old Description',
          pbiId: 'old-pbi',
          assigneeId: 'old-user',
          status: 'DONE' as TaskStatus,
          estimatedHours: 10,
          remainingHours: 5,
        },
        formErrors: { title: 'Error' },
      };

      const action: FormAction = {
        type: 'INITIALIZE_FORM_FOR_CREATE',
        payload: 'TODO' as TaskStatus,
      };
      const state = formReducer(modifiedState, action);

      expect(state.formData.title).toBe('');
      expect(state.formData.description).toBe('');
      expect(state.formData.pbiId).toBe('');
      expect(state.formData.assigneeId).toBe('');
      expect(state.formData.status).toBe('TODO');
      expect(state.formData.estimatedHours).toBe(0);
      expect(state.formData.remainingHours).toBe(0);
      expect(state.formErrors).toEqual({});
    });
  });

  describe('Unknown action', () => {
    it('should return current state for unknown action', () => {
      const action = { type: 'UNKNOWN_ACTION' } as unknown as FormAction;
      const state = formReducer(initialFormState, action);

      expect(state).toEqual(initialFormState);
    });
  });
});

describe('resetFormState', () => {
  it('should return initial form state', () => {
    const state = resetFormState();
    expect(state).toEqual(initialFormState);
  });
});
