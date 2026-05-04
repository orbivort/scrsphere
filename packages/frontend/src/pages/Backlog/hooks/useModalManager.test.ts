import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useModalManager } from './useModalManager';

describe('useModalManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have all modals closed initially', () => {
      const { result } = renderHook(() => useModalManager());

      expect(result.current.showCreateModal).toBe(false);
      expect(result.current.showEditModal).toBe(false);
      expect(result.current.showDetailModal).toBe(false);
      expect(result.current.showDeleteModal).toBe(false);
      expect(result.current.showValidationModal).toBe(false);
      expect(result.current.showBulkUploadModal).toBe(false);
    });

    it('should have null validation type initially', () => {
      const { result } = renderHook(() => useModalManager());

      expect(result.current.validationType).toBe(null);
    });

    it('should have empty validation checks initially', () => {
      const { result } = renderHook(() => useModalManager());

      expect(result.current.validationChecks).toEqual({});
    });

    it('should have null pending status initially', () => {
      const { result } = renderHook(() => useModalManager());

      expect(result.current.pendingStatus).toBe(null);
    });
  });

  describe('openModal', () => {
    it('should open create modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('create');
      });

      expect(result.current.showCreateModal).toBe(true);
    });

    it('should open edit modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('edit');
      });

      expect(result.current.showEditModal).toBe(true);
    });

    it('should open detail modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('detail');
      });

      expect(result.current.showDetailModal).toBe(true);
    });

    it('should open delete modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('delete');
      });

      expect(result.current.showDeleteModal).toBe(true);
    });

    it('should open validation modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('validation');
      });

      expect(result.current.showValidationModal).toBe(true);
    });

    it('should open bulk upload modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('bulkUpload');
      });

      expect(result.current.showBulkUploadModal).toBe(true);
    });

    it('should allow multiple modals to be open simultaneously', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('create');
        result.current.openModal('detail');
      });

      expect(result.current.showCreateModal).toBe(true);
      expect(result.current.showDetailModal).toBe(true);
    });
  });

  describe('closeModal', () => {
    it('should close create modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('create');
      });
      expect(result.current.showCreateModal).toBe(true);

      act(() => {
        result.current.closeModal('create');
      });
      expect(result.current.showCreateModal).toBe(false);
    });

    it('should close edit modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('edit');
      });
      expect(result.current.showEditModal).toBe(true);

      act(() => {
        result.current.closeModal('edit');
      });
      expect(result.current.showEditModal).toBe(false);
    });

    it('should close detail modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('detail');
      });
      expect(result.current.showDetailModal).toBe(true);

      act(() => {
        result.current.closeModal('detail');
      });
      expect(result.current.showDetailModal).toBe(false);
    });

    it('should close delete modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('delete');
      });
      expect(result.current.showDeleteModal).toBe(true);

      act(() => {
        result.current.closeModal('delete');
      });
      expect(result.current.showDeleteModal).toBe(false);
    });

    it('should close validation modal and reset validation state', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('validation');
        result.current.setValidationType('ready');
        result.current.setValidationChecks({ check1: true });
      });

      act(() => {
        result.current.closeModal('validation');
      });

      expect(result.current.showValidationModal).toBe(false);
      expect(result.current.validationType).toBe(null);
      expect(result.current.validationChecks).toEqual({});
      expect(result.current.pendingStatus).toBe(null);
    });

    it('should close bulk upload modal', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('bulkUpload');
      });
      expect(result.current.showBulkUploadModal).toBe(true);

      act(() => {
        result.current.closeModal('bulkUpload');
      });
      expect(result.current.showBulkUploadModal).toBe(false);
    });
  });

  describe('closeAllModals', () => {
    it('should close all open modals', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.openModal('create');
        result.current.openModal('edit');
        result.current.openModal('detail');
        result.current.openModal('delete');
        result.current.openModal('validation');
        result.current.openModal('bulkUpload');
      });

      act(() => {
        result.current.closeAllModals();
      });

      expect(result.current.showCreateModal).toBe(false);
      expect(result.current.showEditModal).toBe(false);
      expect(result.current.showDetailModal).toBe(false);
      expect(result.current.showDeleteModal).toBe(false);
      expect(result.current.showValidationModal).toBe(false);
      expect(result.current.showBulkUploadModal).toBe(false);
    });

    it('should reset validation state when closing all modals', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.setValidationType('done');
        result.current.setValidationChecks({ check1: true, check2: false });
      });

      act(() => {
        result.current.closeAllModals();
      });

      expect(result.current.validationType).toBe(null);
      expect(result.current.validationChecks).toEqual({});
      expect(result.current.pendingStatus).toBe(null);
    });
  });

  describe('Direct State Setters', () => {
    it('should set showCreateModal directly', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.setShowCreateModal(true);
      });

      expect(result.current.showCreateModal).toBe(true);
    });

    it('should set validationType directly', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.setValidationType('ready');
      });

      expect(result.current.validationType).toBe('ready');
    });

    it('should set validationChecks directly', () => {
      const { result } = renderHook(() => useModalManager());

      act(() => {
        result.current.setValidationChecks({ check1: true, check2: false });
      });

      expect(result.current.validationChecks).toEqual({ check1: true, check2: false });
    });
  });

  describe('Stable References', () => {
    it('should have stable openModal reference', () => {
      const { result, rerender } = renderHook(() => useModalManager());

      const firstRef = result.current.openModal;
      rerender();
      const secondRef = result.current.openModal;

      expect(firstRef).toBe(secondRef);
    });

    it('should have stable closeModal reference', () => {
      const { result, rerender } = renderHook(() => useModalManager());

      const firstRef = result.current.closeModal;
      rerender();
      const secondRef = result.current.closeModal;

      expect(firstRef).toBe(secondRef);
    });

    it('should have stable closeAllModals reference', () => {
      const { result, rerender } = renderHook(() => useModalManager());

      const firstRef = result.current.closeAllModals;
      rerender();
      const secondRef = result.current.closeAllModals;

      expect(firstRef).toBe(secondRef);
    });
  });
});
