import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
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
    const modalType = pendingModalClose === 'editProfile' ? 'profileEdit' : 'passwordChange';
    return t(`unsavedChanges.messages.${modalType}`);
  }, [pendingModalClose, t]);

  return {
    unsavedChangesModalOpen,
    pendingModalClose,
    checkBeforeClose,
    handleUnsavedChangesConfirm,
    handleUnsavedChangesCancel,
    getUnsavedChangesMessage,
  };
}
