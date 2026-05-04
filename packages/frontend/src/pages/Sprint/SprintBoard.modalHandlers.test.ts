import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Task, TaskStatus } from '../../types';
import type { ModalAction, FormAction } from './SprintBoard.types';
import { useModalHandlers } from './SprintBoard.modalHandlers';

describe('useModalHandlers', () => {
  const createMockTask = (overrides: Partial<Task> = {}): Task => ({
    id: 'task-1',
    sprintId: 'sprint-1',
    pbiId: 'pbi-1',
    title: 'Test Task',
    description: 'Test description',
    status: 'TODO' as TaskStatus,
    assigneeId: 'user-1',
    estimatedHours: 8,
    remainingHours: 5,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('openCreateModal', () => {
    it('should dispatch OPEN_CREATE_MODAL action', () => {
      const modalDispatch = vi.fn();
      const formDispatch = vi.fn();
      const sprintItems: { id: string }[] = [];

      const { result } = renderHook(() =>
        useModalHandlers({
          modalDispatch,
          formDispatch,
          selectedTask: null,
          sprintItems,
        })
      );

      act(() => {
        result.current.openCreateModal();
      });

      expect(modalDispatch).toHaveBeenCalledWith({ type: 'OPEN_CREATE_MODAL' });
      expect(formDispatch).toHaveBeenCalledWith({
        type: 'INITIALIZE_FORM_FOR_CREATE',
        payload: 'TODO',
      });
    });

    it('should auto-select PBI when only one sprint item exists', () => {
      const modalDispatch = vi.fn();
      const formDispatch = vi.fn();
      const sprintItems = [{ id: 'pbi-1' }];

      const { result } = renderHook(() =>
        useModalHandlers({
          modalDispatch,
          formDispatch,
          selectedTask: null,
          sprintItems,
        })
      );

      act(() => {
        result.current.openCreateModal();
      });

      expect(modalDispatch).toHaveBeenCalledWith({ type: 'OPEN_CREATE_MODAL' });
      expect(formDispatch).toHaveBeenCalledWith({
        type: 'INITIALIZE_FORM_FOR_CREATE',
        payload: undefined,
      });
      expect(formDispatch).toHaveBeenCalledWith({
        type: 'SET_FORM_DATA',
        payload: { pbiId: 'pbi-1' },
      });
    });

    it('should use TODO status when multiple sprint items exist', () => {
      const modalDispatch = vi.fn();
      const formDispatch = vi.fn();
      const sprintItems = [{ id: 'pbi-1' }, { id: 'pbi-2' }];

      const { result } = renderHook(() =>
        useModalHandlers({
          modalDispatch,
          formDispatch,
          selectedTask: null,
          sprintItems,
        })
      );

      act(() => {
        result.current.openCreateModal();
      });

      expect(formDispatch).toHaveBeenCalledWith({
        type: 'INITIALIZE_FORM_FOR_CREATE',
        payload: 'TODO',
      });
    });
  });

  describe('openEditModal', () => {
    it('should close detail modal and open edit modal with selected task', () => {
      const modalDispatch = vi.fn();
      const formDispatch = vi.fn();
      const selectedTask = createMockTask();

      const { result } = renderHook(() =>
        useModalHandlers({
          modalDispatch,
          formDispatch,
          selectedTask,
          sprintItems: [],
        })
      );

      act(() => {
        result.current.openEditModal();
      });

      expect(modalDispatch).toHaveBeenCalledWith({ type: 'CLOSE_DETAIL_MODAL' });
      expect(modalDispatch).toHaveBeenCalledWith({
        type: 'OPEN_EDIT_MODAL',
        payload: selectedTask,
      });
    });

    it('should not open edit modal if no task is selected', () => {
      const modalDispatch = vi.fn();
      const formDispatch = vi.fn();

      const { result } = renderHook(() =>
        useModalHandlers({
          modalDispatch,
          formDispatch,
          selectedTask: null,
          sprintItems: [],
        })
      );

      act(() => {
        result.current.openEditModal();
      });

      expect(modalDispatch).not.toHaveBeenCalled();
    });
  });

  describe('closeDetailModal', () => {
    it('should close detail modal and reset form', () => {
      const modalDispatch = vi.fn();
      const formDispatch = vi.fn();

      const { result } = renderHook(() =>
        useModalHandlers({
          modalDispatch,
          formDispatch,
          selectedTask: null,
          sprintItems: [],
        })
      );

      act(() => {
        result.current.closeDetailModal();
      });

      expect(modalDispatch).toHaveBeenCalledWith({ type: 'CLOSE_DETAIL_MODAL' });
      expect(formDispatch).toHaveBeenCalledWith({ type: 'RESET_FORM' });
    });
  });

  describe('closeEditModal', () => {
    it('should close edit modal and reset form', () => {
      const modalDispatch = vi.fn();
      const formDispatch = vi.fn();

      const { result } = renderHook(() =>
        useModalHandlers({
          modalDispatch,
          formDispatch,
          selectedTask: null,
          sprintItems: [],
        })
      );

      act(() => {
        result.current.closeEditModal();
      });

      expect(modalDispatch).toHaveBeenCalledWith({ type: 'CLOSE_EDIT_MODAL' });
      expect(formDispatch).toHaveBeenCalledWith({ type: 'RESET_FORM' });
    });
  });

  describe('closeModal', () => {
    it('should close all modals and reset form', () => {
      const modalDispatch = vi.fn();
      const formDispatch = vi.fn();

      const { result } = renderHook(() =>
        useModalHandlers({
          modalDispatch,
          formDispatch,
          selectedTask: null,
          sprintItems: [],
        })
      );

      act(() => {
        result.current.closeModal();
      });

      expect(modalDispatch).toHaveBeenCalledWith({ type: 'CLOSE_CREATE_MODAL' });
      expect(modalDispatch).toHaveBeenCalledWith({ type: 'CLOSE_DELETE_CONFIRM' });
      expect(modalDispatch).toHaveBeenCalledWith({ type: 'CLOSE_DETAIL_MODAL' });
      expect(modalDispatch).toHaveBeenCalledWith({ type: 'CLOSE_EDIT_MODAL' });
      expect(formDispatch).toHaveBeenCalledWith({ type: 'RESET_FORM' });
    });
  });

  describe('handleFormDataChange', () => {
    it('should dispatch SET_FORM_DATA with partial data', () => {
      const modalDispatch = vi.fn();
      const formDispatch = vi.fn();

      const { result } = renderHook(() =>
        useModalHandlers({
          modalDispatch,
          formDispatch,
          selectedTask: null,
          sprintItems: [],
        })
      );

      act(() => {
        result.current.handleFormDataChange({ title: 'New Title' });
      });

      expect(formDispatch).toHaveBeenCalledWith({
        type: 'SET_FORM_DATA',
        payload: { title: 'New Title' },
      });
    });

    it('should handle multiple field updates', () => {
      const modalDispatch = vi.fn();
      const formDispatch = vi.fn();

      const { result } = renderHook(() =>
        useModalHandlers({
          modalDispatch,
          formDispatch,
          selectedTask: null,
          sprintItems: [],
        })
      );

      act(() => {
        result.current.handleFormDataChange({
          title: 'New Title',
          description: 'New Description',
          estimatedHours: 8,
        });
      });

      expect(formDispatch).toHaveBeenCalledWith({
        type: 'SET_FORM_DATA',
        payload: {
          title: 'New Title',
          description: 'New Description',
          estimatedHours: 8,
        },
      });
    });

    it('should handle status update', () => {
      const modalDispatch = vi.fn();
      const formDispatch = vi.fn();

      const { result } = renderHook(() =>
        useModalHandlers({
          modalDispatch,
          formDispatch,
          selectedTask: null,
          sprintItems: [],
        })
      );

      act(() => {
        result.current.handleFormDataChange({ status: 'IN_PROGRESS' as TaskStatus });
      });

      expect(formDispatch).toHaveBeenCalledWith({
        type: 'SET_FORM_DATA',
        payload: { status: 'IN_PROGRESS' },
      });
    });
  });
});

describe('Modal Action Types', () => {
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

  it('should have correct OPEN_CREATE_MODAL action structure', () => {
    const action: ModalAction = { type: 'OPEN_CREATE_MODAL' };
    expect(action.type).toBe('OPEN_CREATE_MODAL');
  });

  it('should have correct OPEN_DETAIL_MODAL action structure', () => {
    const task = createMockTask();
    const action: ModalAction = { type: 'OPEN_DETAIL_MODAL', payload: task };
    expect(action.type).toBe('OPEN_DETAIL_MODAL');
    expect(action.payload).toEqual(task);
  });

  it('should have correct OPEN_EDIT_MODAL action structure', () => {
    const task = createMockTask();
    const action: ModalAction = { type: 'OPEN_EDIT_MODAL', payload: task };
    expect(action.type).toBe('OPEN_EDIT_MODAL');
    expect(action.payload).toEqual(task);
  });

  it('should have correct OPEN_DELETE_CONFIRM action structure', () => {
    const task = createMockTask();
    const action: ModalAction = { type: 'OPEN_DELETE_CONFIRM', payload: task };
    expect(action.type).toBe('OPEN_DELETE_CONFIRM');
    expect(action.payload).toEqual(task);
  });

  it('should have correct CLOSE actions structure', () => {
    const closeActions: ModalAction['type'][] = [
      'CLOSE_CREATE_MODAL',
      'CLOSE_DETAIL_MODAL',
      'CLOSE_EDIT_MODAL',
      'CLOSE_DELETE_CONFIRM',
      'CLOSE_COMPLETE_SPRINT_MODAL',
      'CLOSE_BACKLOG_MANAGER',
      'CLOSE_DOD_VERIFICATION',
      'CLOSE_KEYBOARD_HELP',
    ];

    closeActions.forEach((actionType) => {
      const action: ModalAction = { type: actionType };
      expect(action.type).toBe(actionType);
    });
  });

  it('should have correct error setting actions', () => {
    const setCompleteSprintError: ModalAction = {
      type: 'SET_COMPLETE_SPRINT_ERROR',
      payload: 'Error message',
    };
    expect(setCompleteSprintError.type).toBe('SET_COMPLETE_SPRINT_ERROR');
    expect(setCompleteSprintError.payload).toBe('Error message');

    const setWorkflowError: ModalAction = {
      type: 'SET_WORKFLOW_ERROR',
      payload: 'Workflow error',
    };
    expect(setWorkflowError.type).toBe('SET_WORKFLOW_ERROR');
    expect(setWorkflowError.payload).toBe('Workflow error');

    const resetError: ModalAction = {
      type: 'SET_COMPLETE_SPRINT_ERROR',
      payload: null,
    };
    expect(resetError.payload).toBeNull();
  });

  it('should have correct RESET_ALL_MODALS action', () => {
    const action: ModalAction = { type: 'RESET_ALL_MODALS' };
    expect(action.type).toBe('RESET_ALL_MODALS');
  });
});

describe('Form Action Types', () => {
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

  it('should have correct SET_FORM_DATA action structure', () => {
    const action: FormAction = {
      type: 'SET_FORM_DATA',
      payload: { title: 'New Title' },
    };
    expect(action.type).toBe('SET_FORM_DATA');
    expect(action.payload).toEqual({ title: 'New Title' });
  });

  it('should have correct SET_FORM_ERRORS action structure', () => {
    const action: FormAction = {
      type: 'SET_FORM_ERRORS',
      payload: { title: 'Title is required' },
    };
    expect(action.type).toBe('SET_FORM_ERRORS');
    expect(action.payload).toEqual({ title: 'Title is required' });
  });

  it('should have correct CLEAR_FORM_ERRORS action', () => {
    const action: FormAction = { type: 'CLEAR_FORM_ERRORS' };
    expect(action.type).toBe('CLEAR_FORM_ERRORS');
  });

  it('should have correct RESET_FORM action', () => {
    const action: FormAction = { type: 'RESET_FORM' };
    expect(action.type).toBe('RESET_FORM');
  });

  it('should have correct INITIALIZE_FORM_FOR_EDIT action structure', () => {
    const task = createMockTask();
    const action: FormAction = {
      type: 'INITIALIZE_FORM_FOR_EDIT',
      payload: task,
    };
    expect(action.type).toBe('INITIALIZE_FORM_FOR_EDIT');
    expect(action.payload).toEqual(task);
  });

  it('should have correct INITIALIZE_FORM_FOR_CREATE action with status', () => {
    const action: FormAction = {
      type: 'INITIALIZE_FORM_FOR_CREATE',
      payload: 'TODO' as TaskStatus,
    };
    expect(action.type).toBe('INITIALIZE_FORM_FOR_CREATE');
    expect(action.payload).toBe('TODO');
  });

  it('should have correct INITIALIZE_FORM_FOR_CREATE action without status', () => {
    const action: FormAction = {
      type: 'INITIALIZE_FORM_FOR_CREATE',
    };
    expect(action.type).toBe('INITIALIZE_FORM_FOR_CREATE');
    expect(action.payload).toBeUndefined();
  });
});
