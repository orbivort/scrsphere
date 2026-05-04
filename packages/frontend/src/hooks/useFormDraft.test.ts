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

    // Wait for debounce and state update
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

    // First save a draft to set up the state
    act(() => {
      result.current.saveDraft(draftData);
    });

    // Wait for the draft to be saved
    await waitFor(
      () => {
        expect(result.current.hasDraft).toBe(true);
      },
      { timeout: 300 }
    );

    // Now load the draft
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

    // First save a draft to set up the state
    act(() => {
      result.current.saveDraft(draftData);
    });

    // Wait for the draft to be saved
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

    // Wait for debounce - the hook should handle the error gracefully without throwing
    await waitFor(
      () => {
        // The hook should not have crashed and should still be functional
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

    // Only the second draft should be saved after debounce
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

    // First save a draft to set up the state
    act(() => {
      result.current.saveDraft(draftData);
    });

    // Wait for the draft to be saved
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

    // Verify the result indicates success
    expect(clearResult!.success).toBe(true);
    expect(clearResult!.error).toBeUndefined();
    expect(clearResult!.clearedKeys).toHaveLength(2);

    // Verify both keys are in the cleared list
    expect(clearResult!.clearedKeys).toContain(`form-draft-${mockKey}`);
    expect(clearResult!.clearedKeys).toContain(`form-draft-${mockKey}-timestamp`);
  });

  it('should handle localStorage removal errors gracefully', async () => {
    const draftData = { name: 'John', email: 'john@example.com' };

    const { result } = renderHook(() =>
      useFormDraft({ key: mockKey, initialData: mockInitialData, debounceMs: 50 })
    );

    // First save a draft to set up the state
    act(() => {
      result.current.saveDraft(draftData);
    });

    // Wait for the draft to be saved
    await waitFor(
      () => {
        expect(result.current.hasDraft).toBe(true);
      },
      { timeout: 300 }
    );

    // Now mock removeItem to throw an error
    const mockRemoveItem = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('Storage access denied');
    });

    let clearResult: { success: boolean; error?: string; clearedKeys: string[] };
    act(() => {
      clearResult = result.current.clearDraft();
    });

    // Verify the result indicates failure
    expect(clearResult!.success).toBe(false);
    expect(clearResult!.error).toBeDefined();

    mockRemoveItem.mockRestore();
  });
});
