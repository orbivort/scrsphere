import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useToast } from './useToast';

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should return empty toasts array initially', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toEqual([]);
    });
  });

  describe('addToast', () => {
    it('should add a toast with default duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'Test message');
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0]).toMatchObject({
        type: 'success',
        message: 'Test message',
        duration: 5000,
      });
      expect(result.current.toasts[0].id).toBeDefined();
    });

    it('should add a toast with custom duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('error', 'Error message', 10000);
      });

      expect(result.current.toasts[0].duration).toBe(10000);
    });

    it('should add multiple toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'First message');
        result.current.addToast('error', 'Second message');
        result.current.addToast('info', 'Third message');
      });

      expect(result.current.toasts).toHaveLength(3);
    });

    it('should return toast id', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        toastId = result.current.addToast('success', 'Test message');
      });

      expect(toastId!).toBeDefined();
      expect(typeof toastId!).toBe('string');
    });

    it('should auto-remove toast after duration', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'Test message', 1000);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should not auto-remove toast when duration is 0', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'Test message', 0);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.toasts).toHaveLength(1);
    });
  });

  describe('removeToast', () => {
    it('should remove toast by id', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        toastId = result.current.addToast('success', 'Test message', 0);
      });

      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        result.current.removeToast(toastId!);
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should not remove other toasts', () => {
      const { result } = renderHook(() => useToast());

      let firstId: string;
      let secondId: string;
      act(() => {
        firstId = result.current.addToast('success', 'First message', 0);
        secondId = result.current.addToast('error', 'Second message', 0);
      });

      act(() => {
        result.current.removeToast(firstId!);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].id).toBe(secondId!);
    });

    it('should handle removing non-existent toast id', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'Test message', 0);
      });

      act(() => {
        result.current.removeToast('non-existent-id');
      });

      expect(result.current.toasts).toHaveLength(1);
    });
  });

  describe('convenience methods', () => {
    it('should add success toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Success message');
      });

      expect(result.current.toasts[0]).toMatchObject({
        type: 'success',
        message: 'Success message',
      });
    });

    it('should add error toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.error('Error message');
      });

      expect(result.current.toasts[0]).toMatchObject({
        type: 'error',
        message: 'Error message',
      });
    });

    it('should add info toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.info('Info message');
      });

      expect(result.current.toasts[0]).toMatchObject({
        type: 'info',
        message: 'Info message',
      });
    });

    it('should add warning toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.warning('Warning message');
      });

      expect(result.current.toasts[0]).toMatchObject({
        type: 'warning',
        message: 'Warning message',
      });
    });

    it('should pass custom duration to convenience methods', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.success('Success message', 3000);
      });

      expect(result.current.toasts[0].duration).toBe(3000);
    });

    it('should return toast id from convenience methods', () => {
      const { result } = renderHook(() => useToast());

      let toastId: string;
      act(() => {
        toastId = result.current.success('Success message');
      });

      expect(toastId!).toBeDefined();
      expect(typeof toastId!).toBe('string');
    });
  });

  describe('clearAll', () => {
    it('should remove all toasts', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'First', 0);
        result.current.addToast('error', 'Second', 0);
        result.current.addToast('info', 'Third', 0);
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.toasts).toHaveLength(0);
    });

    it('should work when no toasts exist', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.clearAll();
      });

      expect(result.current.toasts).toHaveLength(0);
    });
  });

  describe('toast types', () => {
    it('should support all toast types', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'Success', 0);
        result.current.addToast('error', 'Error', 0);
        result.current.addToast('info', 'Info', 0);
        result.current.addToast('warning', 'Warning', 0);
      });

      const types = result.current.toasts.map((t) => t.type);
      expect(types).toContain('success');
      expect(types).toContain('error');
      expect(types).toContain('info');
      expect(types).toContain('warning');
    });
  });

  describe('toast auto-removal', () => {
    it('should remove only the expired toast', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', 'First', 1000);
        result.current.addToast('error', 'Second', 5000);
      });

      expect(result.current.toasts).toHaveLength(2);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.toasts).toHaveLength(1);
      expect(result.current.toasts[0].message).toBe('Second');
    });

    it('should handle multiple toasts with different durations', () => {
      const { result } = renderHook(() => useToast());

      act(() => {
        result.current.addToast('success', '1s', 1000);
        result.current.addToast('error', '2s', 2000);
        result.current.addToast('info', '3s', 3000);
      });

      expect(result.current.toasts).toHaveLength(3);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.toasts).toHaveLength(2);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.toasts).toHaveLength(1);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current.toasts).toHaveLength(0);
    });
  });
});
