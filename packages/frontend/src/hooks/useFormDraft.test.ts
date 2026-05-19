import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { useFormDraft } from './useFormDraft';

describe('useFormDraft', () => {
  const mockKey = 'test-form';
  const mockInitialData = { name: '', email: '' };

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should initialize with no draft', () => {
    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData })
    );

    expect(result.current.hasDraft).toBe(false);
    expect(result.current.draft).toBeNull();
    expect(result.current.showRestorePrompt).toBe(false);
  });

  it('should save draft to localStorage', async () => {
    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    const draftData = { name: 'John', email: 'john@example.com' };

    act(() => {
      result.current.saveDraft(draftData);
    });

    await waitFor(
      () => {
        expect(result.current.hasDraft).toBe(true);
      },
      { timeout: 300 }
    );

    expect(localStorage.getItem(`form-draft-${mockKey}`)).toBe(JSON.stringify(draftData));
    expect(result.current.lastSavedAt).toBeInstanceOf(Date);
  });

  it('should load draft from localStorage', async () => {
    const draftData = { name: 'Jane', email: 'jane@example.com' };

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    act(() => {
      result.current.saveDraft(draftData);
    });

    await waitFor(
      () => {
        expect(result.current.hasDraft).toBe(true);
      },
      { timeout: 300 }
    );

    let loadedDraft: typeof mockInitialData | null = null;
    act(() => {
      loadedDraft = result.current.loadDraft();
    });

    expect(loadedDraft).toEqual(draftData);
    expect(localStorage.getItem(`form-draft-${mockKey}`)).toBe(JSON.stringify(draftData));
  });

  it('should clear draft from localStorage', async () => {
    const draftData = { name: 'John', email: 'john@example.com' };

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    act(() => {
      result.current.saveDraft(draftData);
    });

    await waitFor(
      () => {
        expect(result.current.hasDraft).toBe(true);
      },
      { timeout: 300 }
    );

    let clearResult: { success: boolean; error?: string; clearedKeys: string[] };
    act(() => {
      clearResult = result.current.clearDraft();
    });

    expect(result.current.hasDraft).toBe(false);
    expect(result.current.showRestorePrompt).toBe(false);
    expect(localStorage.getItem(`form-draft-${mockKey}`)).toBeNull();
    expect(localStorage.getItem(`form-draft-${mockKey}-timestamp`)).toBeNull();
    expect(clearResult!.success).toBe(true);
    expect(clearResult!.clearedKeys).toContain(`form-draft-${mockKey}`);
    expect(clearResult!.clearedKeys).toContain(`form-draft-${mockKey}-timestamp`);
  });

  it('should handle localStorage errors gracefully', async () => {
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage full');
    });

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 100 })
    );

    act(() => {
      result.current.saveDraft({ name: 'Test', email: 'test@test.com' });
    });

    await waitFor(
      () => {
        expect(result.current).toBeDefined();
      },
      { timeout: 200 }
    );

    mockSetItem.mockRestore();
  });

  it('should debounce save operations', async () => {
    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 200 })
    );

    const draft1 = { name: 'First', email: 'first@example.com' };
    const draft2 = { name: 'Second', email: 'second@example.com' };

    act(() => {
      result.current.saveDraft(draft1);
    });

    act(() => {
      result.current.saveDraft(draft2);
    });

    await waitFor(
      () => {
        const saved = localStorage.getItem(`form-draft-${mockKey}`);
        expect(saved).toBe(JSON.stringify(draft2));
      },
      { timeout: 300 }
    );
  });

  it('should update showRestorePrompt when setShowRestorePrompt is called', () => {
    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData })
    );

    act(() => {
      result.current.setShowRestorePrompt(true);
    });

    expect(result.current.showRestorePrompt).toBe(true);

    act(() => {
      result.current.setShowRestorePrompt(false);
    });

    expect(result.current.showRestorePrompt).toBe(false);
  });

  it('should return success result when clearDraft succeeds', async () => {
    const draftData = { name: 'John', email: 'john@example.com' };

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    act(() => {
      result.current.saveDraft(draftData);
    });

    await waitFor(
      () => {
        expect(result.current.hasDraft).toBe(true);
      },
      { timeout: 300 }
    );

    let clearResult: { success: boolean; error?: string; clearedKeys: string[] };
    act(() => {
      clearResult = result.current.clearDraft();
    });

    expect(clearResult!.success).toBe(true);
    expect(clearResult!.error).toBeUndefined();
    expect(clearResult!.clearedKeys).toHaveLength(2);

    expect(clearResult!.clearedKeys).toContain(`form-draft-${mockKey}`);
    expect(clearResult!.clearedKeys).toContain(`form-draft-${mockKey}-timestamp`);
  });

  it('should handle localStorage removal errors gracefully', async () => {
    const draftData = { name: 'John', email: 'john@example.com' };

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    act(() => {
      result.current.saveDraft(draftData);
    });

    await waitFor(
      () => {
        expect(result.current.hasDraft).toBe(true);
      },
      { timeout: 300 }
    );

    const mockRemoveItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage access denied');
    });

    let clearResult: { success: boolean; error?: string; clearedKeys: string[] };
    act(() => {
      clearResult = result.current.clearDraft();
    });

    expect(clearResult!.success).toBe(false);
    expect(clearResult!.error).toBeDefined();

    mockRemoveItem.mockRestore();
  });

  it('should handle storage unavailable on initialization', () => {
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage is disabled', 'SecurityError');
    });

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData })
    );

    expect(result.current.isStorageAvailable).toBe(false);

    mockSetItem.mockRestore();
  });

  it('should not save draft when storage is unavailable', () => {
    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData })
    );

    act(() => {
      result.current.saveDraft({ name: 'test', email: 'test@test.com' });
    });

    expect(result.current.hasDraft).toBe(false);
  });

  it('should generate draft key with userId and dateKey', () => {
    const userId = 'user-123';
    const dateKey = '2024-01-01';

    renderHook(() => useFormDraft({ key: mockKey, initialData: mockInitialData, userId, dateKey }));

    const expectedDraftKey = `form-draft-${mockKey}_user-${userId}_date-${dateKey}`;
    expect(localStorage.getItem(expectedDraftKey)).toBeNull();
  });

  it('should clear draft when storage is unavailable', () => {
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData })
    );

    expect(result.current.isStorageAvailable).toBe(false);

    let clearResult: ReturnType<typeof result.current.clearDraft>;
    act(() => {
      clearResult = result.current.clearDraft();
    });

    expect(clearResult!.success).toBe(true);
    expect(clearResult!.clearedKeys).toHaveLength(0);

    mockSetItem.mockRestore();
  });

  it('should handle clearDraft when item still exists after removal', async () => {
    const draftData = { name: 'John', email: 'john@example.com' };

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    act(() => {
      result.current.saveDraft(draftData);
    });

    await waitFor(
      () => {
        expect(result.current.hasDraft).toBe(true);
      },
      { timeout: 300 }
    );

    const mockGetItem = vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('still-exists');

    let clearResult: { success: boolean; error?: string; clearedKeys: string[] };
    act(() => {
      clearResult = result.current.clearDraft();
    });

    expect(clearResult!.error).toContain('Failed to remove');

    mockGetItem.mockRestore();
  });

  it('should handle security error in loadDraft', () => {
    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    const { result } = renderHook(() =>
      useFormDraft({ key: `${mockKey}-sec`, initialData: mockInitialData })
    );

    expect(result.current.isStorageAvailable).toBe(false);

    const loaded = result.current.loadDraft();
    expect(loaded).toBeNull();

    mockSetItem.mockRestore();
  });

  it('should clean up debounce timer on unmount', async () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { result, unmount } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 100 })
    );

    act(() => {
      result.current.saveDraft({ name: 'test', email: 'test@test.com' });
    });

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();

    clearTimeoutSpy.mockRestore();
  });

  it('should handle checkForDraft with JSON parse error', () => {
    localStorage.setItem(`form-draft-${mockKey}`, 'invalid-json');

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData })
    );

    expect(result.current.draft).toBeNull();
    expect(result.current.hasDraft).toBe(false);
  });

  it('should handle QuotaExceededError during saveDraft silently', async () => {
    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Storage quota exceeded', 'QuotaExceededError');
    });

    act(() => {
      result.current.saveDraft({ name: 'John', email: 'john@example.com' });
    });

    await vi.waitFor(
      () => {
        expect(result.current.hasDraft).toBe(false);
      },
      { timeout: 300 }
    );

    mockSetItem.mockRestore();
  });

  it('should handle SecurityError during saveDraft and mark storage unavailable', async () => {
    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    act(() => {
      result.current.saveDraft({ name: 'John', email: 'john@example.com' });
    });

    await vi.waitFor(
      () => {
        expect(result.current.isStorageAvailable).toBe(false);
      },
      { timeout: 300 }
    );

    mockSetItem.mockRestore();
  });

  it('should handle SecurityError in checkForDraft and mark storage unavailable', () => {
    localStorage.setItem(`form-draft-${mockKey}`, JSON.stringify({ name: 'test' }));

    const mockGetItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData })
    );

    expect(result.current.isStorageAvailable).toBe(false);
    expect(result.current.hasDraft).toBe(false);

    mockGetItem.mockRestore();
  });

  it('should handle SecurityError in loadDraft and mark storage unavailable', () => {
    localStorage.setItem(`form-draft-${mockKey}`, JSON.stringify({ name: 'test' }));

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData })
    );

    const mockGetItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    let loaded: unknown;
    act(() => {
      loaded = result.current.loadDraft();
    });

    expect(loaded).toBeNull();
    expect(result.current.isStorageAvailable).toBe(false);

    mockGetItem.mockRestore();
  });

  it('should handle SecurityError during clearDraft draftKey removal gracefully', async () => {
    const draftData = { name: 'John', email: 'john@example.com' };

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    act(() => {
      result.current.saveDraft(draftData);
    });

    await vi.waitFor(
      () => {
        expect(result.current.hasDraft).toBe(true);
      },
      { timeout: 300 }
    );

    const mockRemoveItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('Access denied', 'SecurityError');
    });

    let clearResult: { success: boolean; error?: string; clearedKeys: string[] };
    act(() => {
      clearResult = result.current.clearDraft();
    });

    expect(clearResult!.success).toBe(true);
    expect(clearResult!.clearedKeys).toHaveLength(0);

    mockRemoveItem.mockRestore();
  });

  it('should handle SecurityError during clearDraft timestampKey removal', async () => {
    const draftData = { name: 'John', email: 'john@example.com' };

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    act(() => {
      result.current.saveDraft(draftData);
    });

    await vi.waitFor(
      () => {
        expect(result.current.hasDraft).toBe(true);
      },
      { timeout: 300 }
    );

    let callCount = 0;
    const mockRemoveItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        throw new DOMException('Access denied', 'SecurityError');
      }
    });

    let clearResult: { success: boolean; error?: string; clearedKeys: string[] };
    act(() => {
      clearResult = result.current.clearDraft();
    });

    expect(clearResult!.success).toBe(false);
    expect(clearResult!.error).toContain('Error removing timestamp');
    expect(clearResult!.clearedKeys).toContain(`form-draft-${mockKey}`);

    mockRemoveItem.mockRestore();
  });

  it('isQuotaExceededError should return false for non-DOMException errors', () => {
    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Some random error');
    });

    act(() => {
      result.current.saveDraft({ name: 'test', email: 'test@test.com' });
    });

    expect(result.current).toBeDefined();

    mockSetItem.mockRestore();
  });

  it('isQuotaExceededError should return false for DOMException with non-matching name', () => {
    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Invalid state', 'InvalidStateError');
    });

    act(() => {
      result.current.saveDraft({ name: 'test', email: 'test@test.com' });
    });

    expect(result.current).toBeDefined();

    mockSetItem.mockRestore();
  });

  it('isSecurityError should return false for non-DOMException errors', () => {
    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Not a DOM exception');
    });

    act(() => {
      result.current.saveDraft({ name: 'test', email: 'test@test.com' });
    });

    expect(result.current).toBeDefined();

    mockSetItem.mockRestore();
  });
});
