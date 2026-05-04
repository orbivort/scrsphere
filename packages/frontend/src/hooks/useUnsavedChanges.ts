import { useState, useCallback } from 'react';

type ModalId = string;

export interface UseUnsavedChangesReturn {
  unsavedChangesModalOpen: boolean;
  pendingModalClose: ModalId | null;
  checkBeforeClose: (modalId: ModalId, isDirty: boolean, onClose: () => void) => void;
  handleUnsavedChangesConfirm: () => void;
  handleUnsavedChangesCancel: () => void;
  getUnsavedChangesMessage: () => string;
}

export function useUnsavedChanges(): UseUnsavedChangesReturn {
  const [unsavedChangesModalOpen, setUnsavedChangesModalOpen] = useState(false);
  const [pendingModalClose, setPendingModalClose] = useState<ModalId | null>(null);
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null);
  const [pendingDirtyReset, setPendingDirtyReset] = useState<(() => void) | null>(null);

  const checkBeforeClose = useCallback(
    (modalId: ModalId, isDirty: boolean, onClose: () => void) => {
      if (isDirty) {
        setPendingModalClose(modalId);
        setPendingCloseAction(() => onClose);
        setUnsavedChangesModalOpen(true);
      } else {
        onClose();
      }
    },
    []
  );

  const handleUnsavedChangesConfirm = useCallback(() => {
    setUnsavedChangesModalOpen(false);
    if (pendingCloseAction) {
      pendingCloseAction();
    }
    if (pendingDirtyReset) {
      pendingDirtyReset();
    }
    setPendingModalClose(null);
    setPendingCloseAction(null);
    setPendingDirtyReset(null);
  }, [pendingCloseAction, pendingDirtyReset]);

  const handleUnsavedChangesCancel = useCallback(() => {
    setUnsavedChangesModalOpen(false);
    setPendingModalClose(null);
    setPendingCloseAction(null);
    setPendingDirtyReset(null);
  }, []);

  const getUnsavedChangesMessage = useCallback(() => {
    const modalName = pendingModalClose === 'editProfile' ? 'profile edit' : 'password change';
    return `You have unsaved changes in the ${modalName} form. Are you sure you want to discard them?`;
  }, [pendingModalClose]);

  return {
    unsavedChangesModalOpen,
    pendingModalClose,
    checkBeforeClose,
    handleUnsavedChangesConfirm,
    handleUnsavedChangesCancel,
    getUnsavedChangesMessage,
  };
}
