import { useCallback } from 'react';

import { TaskStatus as TaskStatusEnum, type Task } from '../../types';

import type { ModalAction, FormAction, TaskFormData } from './SprintBoard.types';

export interface UseModalHandlersOptions {
  modalDispatch: React.Dispatch<ModalAction>;
  formDispatch: React.Dispatch<FormAction>;
  selectedTask: Task | null;
  sprintItems: { id: string }[];
}

export interface UseModalHandlersReturn {
  openCreateModal: () => void;
  openEditModal: () => void;
  closeDetailModal: () => void;
  closeEditModal: () => void;
  closeModal: () => void;
  handleFormDataChange: (data: Partial<TaskFormData>) => void;
}

export const useModalHandlers = (options: UseModalHandlersOptions): UseModalHandlersReturn => {
  const { modalDispatch, formDispatch, selectedTask, sprintItems } = options;

  const openCreateModal = useCallback(() => {
    modalDispatch({ type: 'OPEN_CREATE_MODAL' });
    formDispatch({
      type: 'INITIALIZE_FORM_FOR_CREATE',
      payload: sprintItems.length === 1 ? undefined : TaskStatusEnum.TODO,
    });
    if (sprintItems.length === 1) {
      const firstItem = sprintItems[0];
      if (firstItem) {
        formDispatch({ type: 'SET_FORM_DATA', payload: { pbiId: firstItem.id } });
      }
    }
  }, [modalDispatch, formDispatch, sprintItems]);

  const openEditModal = useCallback(() => {
    if (!selectedTask) return;
    modalDispatch({ type: 'CLOSE_DETAIL_MODAL' });
    modalDispatch({ type: 'OPEN_EDIT_MODAL', payload: selectedTask });
  }, [modalDispatch, selectedTask]);

  const closeDetailModal = useCallback(() => {
    modalDispatch({ type: 'CLOSE_DETAIL_MODAL' });
    formDispatch({ type: 'RESET_FORM' });
  }, [modalDispatch, formDispatch]);

  const closeEditModal = useCallback(() => {
    modalDispatch({ type: 'CLOSE_EDIT_MODAL' });
    formDispatch({ type: 'RESET_FORM' });
  }, [modalDispatch, formDispatch]);

  const closeModal = useCallback(() => {
    modalDispatch({ type: 'CLOSE_CREATE_MODAL' });
    modalDispatch({ type: 'CLOSE_DELETE_CONFIRM' });
    modalDispatch({ type: 'CLOSE_DETAIL_MODAL' });
    modalDispatch({ type: 'CLOSE_EDIT_MODAL' });
    formDispatch({ type: 'RESET_FORM' });
  }, [modalDispatch, formDispatch]);

  const handleFormDataChange = useCallback(
    (data: Partial<TaskFormData>) => {
      formDispatch({ type: 'SET_FORM_DATA', payload: data });
    },
    [formDispatch]
  );

  return {
    openCreateModal,
    openEditModal,
    closeDetailModal,
    closeEditModal,
    closeModal,
    handleFormDataChange,
  };
};
