import { useState, useCallback } from 'react';

import { type ItemStatus } from '../../../types';

/**
 * Modal type identifier
 */
export type ModalType = 'create' | 'edit' | 'detail' | 'delete' | 'validation' | 'bulkUpload';

/**
 * Validation type for the validation modal
 */
export type ValidationType = 'ready' | 'done' | null;

/**
 * Return type for the useModalManager hook
 */
interface UseModalManagerReturn {
  // Modal visibility states
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailModal: boolean;
  showDeleteModal: boolean;
  showValidationModal: boolean;
  showBulkUploadModal: boolean;

  // Modal state setters
  setShowCreateModal: (show: boolean) => void;
  setShowEditModal: (show: boolean) => void;
  setShowDetailModal: (show: boolean) => void;
  setShowDeleteModal: (show: boolean) => void;
  setShowValidationModal: (show: boolean) => void;
  setShowBulkUploadModal: (show: boolean) => void;

  // Validation modal state
  validationType: ValidationType;
  setValidationType: React.Dispatch<React.SetStateAction<ValidationType>>;
  validationChecks: Record<string, boolean>;
  setValidationChecks: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  pendingStatus: ItemStatus | null;
  setPendingStatus: React.Dispatch<React.SetStateAction<ItemStatus | null>>;

  // Helper functions
  openModal: (modalType: ModalType) => void;
  closeModal: (modalType: ModalType) => void;
  closeAllModals: () => void;
}

/**
 * Custom hook for managing modal state in the Backlog component
 *
 * This hook encapsulates all modal state management including:
 * - 6 modal visibility states
 * - Validation modal specific state (type, checks, pending status)
 * - Helper functions for opening and closing modals
 *
 * @returns Object containing all modal state and handlers
 *
 * @example
 * ```tsx
 * const {
 *   showCreateModal,
 *   setShowCreateModal,
 *   openModal,
 *   closeModal,
 *   validationType,
 *   validationChecks,
 * } = useModalManager();
 * ```
 */
export const useModalManager = (): UseModalManagerReturn => {
  // Modal visibility states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);

  // Validation modal state
  const [validationType, setValidationType] = useState<ValidationType>(null);
  const [validationChecks, setValidationChecks] = useState<Record<string, boolean>>({});
  const [pendingStatus, setPendingStatus] = useState<ItemStatus | null>(null);

  /**
   * Open a specific modal
   */
  const openModal = useCallback((modalType: ModalType) => {
    switch (modalType) {
      case 'create':
        setShowCreateModal(true);
        break;
      case 'edit':
        setShowEditModal(true);
        break;
      case 'detail':
        setShowDetailModal(true);
        break;
      case 'delete':
        setShowDeleteModal(true);
        break;
      case 'validation':
        setShowValidationModal(true);
        break;
      case 'bulkUpload':
        setShowBulkUploadModal(true);
        break;
    }
  }, []);

  /**
   * Close a specific modal
   */
  const closeModal = useCallback((modalType: ModalType) => {
    switch (modalType) {
      case 'create':
        setShowCreateModal(false);
        break;
      case 'edit':
        setShowEditModal(false);
        break;
      case 'detail':
        setShowDetailModal(false);
        break;
      case 'delete':
        setShowDeleteModal(false);
        break;
      case 'validation':
        setShowValidationModal(false);
        setValidationChecks({});
        setPendingStatus(null);
        setValidationType(null);
        break;
      case 'bulkUpload':
        setShowBulkUploadModal(false);
        break;
    }
  }, []);

  /**
   * Close all modals
   */
  const closeAllModals = useCallback(() => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDetailModal(false);
    setShowDeleteModal(false);
    setShowValidationModal(false);
    setShowBulkUploadModal(false);
    setValidationChecks({});
    setPendingStatus(null);
    setValidationType(null);
  }, []);

  return {
    // Modal visibility states
    showCreateModal,
    showEditModal,
    showDetailModal,
    showDeleteModal,
    showValidationModal,
    showBulkUploadModal,

    // Modal state setters
    setShowCreateModal,
    setShowEditModal,
    setShowDetailModal,
    setShowDeleteModal,
    setShowValidationModal,
    setShowBulkUploadModal,

    // Validation modal state
    validationType,
    setValidationType,
    validationChecks,
    setValidationChecks,
    pendingStatus,
    setPendingStatus,

    // Helper functions
    openModal,
    closeModal,
    closeAllModals,
  };
};
