import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useUnsavedChanges } from './useUnsavedChanges';

describe('useUnsavedChanges', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should return initial state with modal closed', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      expect(result.current.unsavedChangesModalOpen).toBe(false);
      expect(result.current.pendingModalClose).toBeNull();
    });
  });

  describe('checkBeforeClose', () => {
    it('should call onClose directly when isDirty is false', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.checkBeforeClose('testModal', false, mockOnClose);
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
      expect(result.current.unsavedChangesModalOpen).toBe(false);
    });

    it('should open modal when isDirty is true', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.checkBeforeClose('testModal', true, mockOnClose);
      });

      expect(result.current.unsavedChangesModalOpen).toBe(true);
      expect(result.current.pendingModalClose).toBe('testModal');
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should store onClose callback for later use', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.checkBeforeClose('testModal', true, mockOnClose);
      });

      act(() => {
        result.current.handleUnsavedChangesConfirm();
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleUnsavedChangesConfirm', () => {
    it('should close modal and call pending close action', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.checkBeforeClose('testModal', true, mockOnClose);
      });

      act(() => {
        result.current.handleUnsavedChangesConfirm();
      });

      expect(result.current.unsavedChangesModalOpen).toBe(false);
      expect(result.current.pendingModalClose).toBeNull();
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call dirty reset callback if provided', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.checkBeforeClose('testModal', true, mockOnClose);
      });

      act(() => {
        result.current.handleUnsavedChangesConfirm();
      });

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should handle confirm without pending close action', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.handleUnsavedChangesConfirm();
      });

      expect(result.current.unsavedChangesModalOpen).toBe(false);
      expect(result.current.pendingModalClose).toBeNull();
    });
  });

  describe('handleUnsavedChangesCancel', () => {
    it('should close modal without calling onClose', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.checkBeforeClose('testModal', true, mockOnClose);
      });

      act(() => {
        result.current.handleUnsavedChangesCancel();
      });

      expect(result.current.unsavedChangesModalOpen).toBe(false);
      expect(result.current.pendingModalClose).toBeNull();
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should clear pending close action', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.checkBeforeClose('testModal', true, mockOnClose);
      });

      expect(result.current.pendingModalClose).toBe('testModal');

      act(() => {
        result.current.handleUnsavedChangesCancel();
      });

      expect(result.current.pendingModalClose).toBeNull();
    });
  });

  describe('getUnsavedChangesMessage', () => {
    it('should return profile edit message for editProfile modal', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.checkBeforeClose('editProfile', true, mockOnClose);
      });

      const message = result.current.getUnsavedChangesMessage();
      expect(message).toContain('profile edit');
    });

    it('should return password change message for other modals', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.checkBeforeClose('changePassword', true, mockOnClose);
      });

      const message = result.current.getUnsavedChangesMessage();
      expect(message).toContain('password change');
    });

    it('should return password change message for unknown modal ids', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.checkBeforeClose('someOtherModal', true, mockOnClose);
      });

      const message = result.current.getUnsavedChangesMessage();
      expect(message).toContain('password change');
    });

    it('should update message when pendingModalClose changes', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.checkBeforeClose('editProfile', true, mockOnClose);
      });

      const profileMessage = result.current.getUnsavedChangesMessage();
      expect(profileMessage).toContain('profile edit');

      act(() => {
        result.current.handleUnsavedChangesCancel();
      });

      act(() => {
        result.current.checkBeforeClose('changePassword', true, mockOnClose);
      });

      const passwordMessage = result.current.getUnsavedChangesMessage();
      expect(passwordMessage).toContain('password change');
    });
  });

  describe('multiple modals', () => {
    it('should handle multiple modal close requests', () => {
      const { result } = renderHook(() => useUnsavedChanges());
      const mockOnClose2 = vi.fn();

      act(() => {
        result.current.checkBeforeClose('modal1', true, mockOnClose);
      });

      act(() => {
        result.current.handleUnsavedChangesCancel();
      });

      act(() => {
        result.current.checkBeforeClose('modal2', true, mockOnClose2);
      });

      expect(result.current.pendingModalClose).toBe('modal2');

      act(() => {
        result.current.handleUnsavedChangesConfirm();
      });

      expect(mockOnClose2).toHaveBeenCalledTimes(1);
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });

  describe('state transitions', () => {
    it('should reset all state after confirm', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.checkBeforeClose('testModal', true, mockOnClose);
      });

      expect(result.current.unsavedChangesModalOpen).toBe(true);
      expect(result.current.pendingModalClose).toBe('testModal');

      act(() => {
        result.current.handleUnsavedChangesConfirm();
      });

      expect(result.current.unsavedChangesModalOpen).toBe(false);
      expect(result.current.pendingModalClose).toBeNull();
    });

    it('should reset all state after cancel', () => {
      const { result } = renderHook(() => useUnsavedChanges());

      act(() => {
        result.current.checkBeforeClose('testModal', true, mockOnClose);
      });

      expect(result.current.unsavedChangesModalOpen).toBe(true);
      expect(result.current.pendingModalClose).toBe('testModal');

      act(() => {
        result.current.handleUnsavedChangesCancel();
      });

      expect(result.current.unsavedChangesModalOpen).toBe(false);
      expect(result.current.pendingModalClose).toBeNull();
    });
  });
});
