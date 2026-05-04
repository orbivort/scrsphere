import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface UseFormDraftOptions<T> {
  key: string;
  initialData: T;
  debounceMs?: number;
  userId?: string;
  dateKey?: string;
}

interface ClearDraftResult {
  success: boolean;
  error?: string;
  clearedKeys: string[];
}

interface UseFormDraftReturn<T> {
  draft: T | null;
  hasDraft: boolean;
  saveDraft: (data: T) => void;
  loadDraft: () => T | null;
  clearDraft: () => ClearDraftResult;
  showRestorePrompt: boolean;
  setShowRestorePrompt: (show: boolean) => void;
  lastSavedAt: Date | null;
  isStorageAvailable: boolean;
}

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function isQuotaExceededError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED';
  }
  return false;
}

function isSecurityError(error: unknown): boolean {
  if (error instanceof DOMException) {
    return error.name === 'SecurityError';
  }
  return false;
}

export function useFormDraft<T extends Record<string, unknown>>({
  key,
  debounceMs = 1000,
  userId,
  dateKey,
}: UseFormDraftOptions<T>): UseFormDraftReturn<T> {
  const [hasDraft, setHasDraft] = useState(false);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [isStorageAvailable, setIsStorageAvailable] = useState(() => isLocalStorageAvailable());
  const [draftData, setDraftData] = useState<T | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const draftKey = useMemo(() => {
    const parts = [`form-draft-${key}`];
    if (userId) parts.push(`user-${userId}`);
    if (dateKey) parts.push(`date-${dateKey}`);
    return parts.join('_');
  }, [key, userId, dateKey]);

  const timestampKey = useMemo(() => {
    const parts = [`form-draft-${key}-timestamp`];
    if (userId) parts.push(`user-${userId}`);
    if (dateKey) parts.push(`date-${dateKey}`);
    return parts.join('_');
  }, [key, userId, dateKey]);

  const checkForDraft = useCallback(() => {
    if (!isStorageAvailable) {
      return null;
    }
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved) as T;
        setHasDraft(true);
        setDraftData(parsed);
        return parsed;
      }
    } catch (error) {
      if (isSecurityError(error)) {
        setIsStorageAvailable(false);
      }
    }
    setHasDraft(false);
    setDraftData(null);
    return null;
  }, [draftKey, isStorageAvailable]);

  useEffect(() => {
    const draft = checkForDraft();
    if (draft) {
      setShowRestorePrompt(true);
    }
  }, [checkForDraft]);

  const saveDraft = useCallback(
    (data: T) => {
      if (!isStorageAvailable) {
        return;
      }
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        try {
          localStorage.setItem(draftKey, JSON.stringify(data));
          localStorage.setItem(timestampKey, new Date().toISOString());
          setLastSavedAt(new Date());
          setHasDraft(true);
        } catch (error) {
          if (isQuotaExceededError(error)) {
            return;
          }
          if (isSecurityError(error)) {
            setIsStorageAvailable(false);
            return;
          }
        }
      }, debounceMs);
    },
    [draftKey, timestampKey, debounceMs, isStorageAvailable]
  );

  const loadDraft = useCallback((): T | null => {
    if (!isStorageAvailable) {
      return null;
    }
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved) as T;
        setDraftData(parsed);
        return parsed;
      }
    } catch (error) {
      if (isSecurityError(error)) {
        setIsStorageAvailable(false);
      }
    }
    setDraftData(null);
    return null;
  }, [draftKey, isStorageAvailable]);

  const clearDraft = useCallback((): ClearDraftResult => {
    const clearedKeys: string[] = [];
    const errors: string[] = [];

    if (!isStorageAvailable) {
      setHasDraft(false);
      setShowRestorePrompt(false);
      setLastSavedAt(null);
      setDraftData(null);
      return {
        success: true,
        clearedKeys: [],
      };
    }

    try {
      localStorage.removeItem(draftKey);
      clearedKeys.push(draftKey);

      if (localStorage.getItem(draftKey) !== null) {
        errors.push(`Failed to remove draft data: ${draftKey}`);
      }
    } catch (error) {
      if (isSecurityError(error)) {
        setIsStorageAvailable(false);
        setHasDraft(false);
        setShowRestorePrompt(false);
        setLastSavedAt(null);
        setDraftData(null);
        return {
          success: true,
          clearedKeys: [],
        };
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Error removing draft data: ${errorMessage}`);
    }

    try {
      localStorage.removeItem(timestampKey);
      clearedKeys.push(timestampKey);

      if (localStorage.getItem(timestampKey) !== null) {
        errors.push(`Failed to remove timestamp: ${timestampKey}`);
      }
    } catch (error) {
      if (isSecurityError(error)) {
        setIsStorageAvailable(false);
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Error removing timestamp: ${errorMessage}`);
    }

    setHasDraft(false);
    setShowRestorePrompt(false);
    setLastSavedAt(null);
    setDraftData(null);

    if (errors.length > 0) {
      return {
        success: false,
        error: errors.join('; '),
        clearedKeys,
      };
    }

    return {
      success: true,
      clearedKeys,
    };
  }, [draftKey, timestampKey, isStorageAvailable]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setHasDraft(false);
    setShowRestorePrompt(false);
    setLastSavedAt(null);
    setDraftData(null);
  }, [userId, dateKey]);

  return {
    draft: draftData,
    hasDraft,
    saveDraft,
    loadDraft,
    clearDraft,
    showRestorePrompt,
    setShowRestorePrompt,
    lastSavedAt,
    isStorageAvailable,
  };
}
