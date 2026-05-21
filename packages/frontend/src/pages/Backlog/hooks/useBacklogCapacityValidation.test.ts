import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Define mock config before mocks are hoisted
const mockConfig = {
  MAX_ITEMS_PER_GOAL: 200,
  isLimitEnabled: true,
};

// Mock the productBacklogService
vi.mock('../../../services/domain/productBacklog.service', () => ({
  productBacklogService: {
    getBacklogItemCountByGoal: vi.fn(),
  },
}));

// Mock the config with mutable state for testing
vi.mock('../../../config/backlog.config', () => ({
  get BACKLOG_CONFIG() {
    return { MAX_ITEMS_PER_GOAL: mockConfig.MAX_ITEMS_PER_GOAL };
  },
  isBacklogLimitEnabled: () => mockConfig.isLimitEnabled,
}));

// Import the mocked service and the hook
import { productBacklogService } from '../../../services/domain/productBacklog.service';
import { useBacklogCapacityValidation } from './useBacklogCapacityValidation';

describe('useBacklogCapacityValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock config to default values
    mockConfig.MAX_ITEMS_PER_GOAL = 200;
    mockConfig.isLimitEnabled = true;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should have isLimitEnabled as true', () => {
      const { result } = renderHook(() => useBacklogCapacityValidation());

      expect(result.current.isLimitEnabled).toBe(true);
    });

    it('should have maxItemsPerGoal as 200', () => {
      const { result } = renderHook(() => useBacklogCapacityValidation());

      expect(result.current.maxItemsPerGoal).toBe(200);
    });
  });

  describe('validateCapacity', () => {
    it('should return valid when limit is disabled', async () => {
      // Disable the limit for this test
      mockConfig.isLimitEnabled = false;

      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateCapacity>>;
      await act(async () => {
        validationResult = await result.current.validateCapacity('goal-1', 10);
      });

      expect(validationResult!).toEqual({ isValid: true });

      // Restore the mock
      mockConfig.isLimitEnabled = true;
    });

    it('should return valid when goalId is undefined', async () => {
      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateCapacity>>;
      await act(async () => {
        validationResult = await result.current.validateCapacity(undefined, 10);
      });

      expect(validationResult!).toEqual({ isValid: true });
      expect(productBacklogService.getBacklogItemCountByGoal).not.toHaveBeenCalled();
    });

    it('should return valid when within capacity', async () => {
      vi.mocked(productBacklogService.getBacklogItemCountByGoal).mockResolvedValueOnce(180);

      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateCapacity>>;
      await act(async () => {
        validationResult = await result.current.validateCapacity('goal-1', 10);
      });

      expect(validationResult!).toEqual({
        isValid: true,
        currentCount: 180,
        maxLimit: 200,
        availableSlots: 20,
      });
      expect(productBacklogService.getBacklogItemCountByGoal).toHaveBeenCalledWith('goal-1');
    });

    it('should return invalid when exceeding capacity', async () => {
      vi.mocked(productBacklogService.getBacklogItemCountByGoal).mockResolvedValueOnce(180);

      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateCapacity>>;
      await act(async () => {
        validationResult = await result.current.validateCapacity('goal-1', 30);
      });

      expect(validationResult!.isValid).toBe(false);
      expect(validationResult!.currentCount).toBe(180);
      expect(validationResult!.maxLimit).toBe(200);
      expect(validationResult!.availableSlots).toBe(20);
      expect(validationResult!.error).toBe(
        'Cannot add 30 items. This goal already has 180 items (maximum: 200). Available slots: 20'
      );
      expect(productBacklogService.getBacklogItemCountByGoal).toHaveBeenCalledWith('goal-1');
    });

    it('should return correct available slots when at exact capacity', async () => {
      vi.mocked(productBacklogService.getBacklogItemCountByGoal).mockResolvedValueOnce(200);

      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateCapacity>>;
      await act(async () => {
        validationResult = await result.current.validateCapacity('goal-1', 1);
      });

      expect(validationResult!.isValid).toBe(false);
      expect(validationResult!.availableSlots).toBe(0);
      expect(validationResult!.error).toBe(
        'Cannot add 1 items. This goal already has 200 items (maximum: 200). Available slots: 0'
      );
    });

    it('should return valid when adding exactly available slots', async () => {
      vi.mocked(productBacklogService.getBacklogItemCountByGoal).mockResolvedValueOnce(190);

      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateCapacity>>;
      await act(async () => {
        validationResult = await result.current.validateCapacity('goal-1', 10);
      });

      expect(validationResult!.isValid).toBe(true);
      expect(validationResult!.currentCount).toBe(190);
      expect(validationResult!.availableSlots).toBe(10);
    });

    it('should return valid on API error (fail open)', async () => {
      vi.mocked(productBacklogService.getBacklogItemCountByGoal).mockRejectedValueOnce(
        new Error('API Error')
      );

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateCapacity>>;
      await act(async () => {
        validationResult = await result.current.validateCapacity('goal-1', 10);
      });

      expect(validationResult!).toEqual({ isValid: true });
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to validate backlog capacity:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle zero current count', async () => {
      vi.mocked(productBacklogService.getBacklogItemCountByGoal).mockResolvedValueOnce(0);

      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateCapacity>>;
      await act(async () => {
        validationResult = await result.current.validateCapacity('goal-1', 50);
      });

      expect(validationResult!).toEqual({
        isValid: true,
        currentCount: 0,
        maxLimit: 200,
        availableSlots: 200,
      });
    });
  });

  describe('validateBulkImport', () => {
    it('should return valid when limit is disabled', async () => {
      // Disable the limit for this test
      mockConfig.isLimitEnabled = false;

      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateBulkImport>>;
      await act(async () => {
        validationResult = await result.current.validateBulkImport([
          { goalId: 'goal-1' },
          { goalId: 'goal-2' },
        ]);
      });

      expect(validationResult!).toEqual({ isValid: true });

      // Restore the mock
      mockConfig.isLimitEnabled = true;
    });

    it('should return valid when all goals are within capacity', async () => {
      vi.mocked(productBacklogService.getBacklogItemCountByGoal)
        .mockResolvedValueOnce(100) // goal-1 has 100 items
        .mockResolvedValueOnce(150); // goal-2 has 150 items

      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateBulkImport>>;
      await act(async () => {
        validationResult = await result.current.validateBulkImport([
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-2' },
        ]);
      });

      expect(validationResult!).toEqual({ isValid: true });
      expect(productBacklogService.getBacklogItemCountByGoal).toHaveBeenCalledTimes(2);
    });

    it('should return first error when any goal exceeds capacity', async () => {
      vi.mocked(productBacklogService.getBacklogItemCountByGoal)
        .mockResolvedValueOnce(190) // goal-1 has 190 items, adding 15 would exceed
        .mockResolvedValueOnce(100); // goal-2 has 100 items (won't be called)

      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateBulkImport>>;
      await act(async () => {
        validationResult = await result.current.validateBulkImport([
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-1' }, // 15 items for goal-1
          { goalId: 'goal-2' },
        ]);
      });

      expect(validationResult!.isValid).toBe(false);
      expect(validationResult!.currentCount).toBe(190);
      expect(validationResult!.error).toContain('Cannot add 15 items');
      // Should stop at first error, not validate goal-2
      expect(productBacklogService.getBacklogItemCountByGoal).toHaveBeenCalledTimes(1);
    });

    it('should handle items without goalId', async () => {
      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateBulkImport>>;
      await act(async () => {
        validationResult = await result.current.validateBulkImport([
          { goalId: undefined },
          { goalId: undefined },
          {},
        ]);
      });

      expect(validationResult!).toEqual({ isValid: true });
      // Should not call API for items without goalId
      expect(productBacklogService.getBacklogItemCountByGoal).not.toHaveBeenCalled();
    });

    it('should handle mixed items with and without goalId', async () => {
      vi.mocked(productBacklogService.getBacklogItemCountByGoal).mockResolvedValueOnce(100);

      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateBulkImport>>;
      await act(async () => {
        validationResult = await result.current.validateBulkImport([
          { goalId: undefined },
          { goalId: 'goal-1' },
          {},
          { goalId: 'goal-1' },
        ]);
      });

      expect(validationResult!).toEqual({ isValid: true });
      // Should only call API for goal-1 (2 items)
      expect(productBacklogService.getBacklogItemCountByGoal).toHaveBeenCalledWith('goal-1');
    });

    it('should handle empty items array', async () => {
      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateBulkImport>>;
      await act(async () => {
        validationResult = await result.current.validateBulkImport([]);
      });

      expect(validationResult!).toEqual({ isValid: true });
      expect(productBacklogService.getBacklogItemCountByGoal).not.toHaveBeenCalled();
    });

    it('should validate multiple goals separately', async () => {
      vi.mocked(productBacklogService.getBacklogItemCountByGoal)
        .mockResolvedValueOnce(50) // goal-1 has 50 items
        .mockResolvedValueOnce(80) // goal-2 has 80 items
        .mockResolvedValueOnce(30); // goal-3 has 30 items

      const { result } = renderHook(() => useBacklogCapacityValidation());

      let validationResult: Awaited<ReturnType<typeof result.current.validateBulkImport>>;
      await act(async () => {
        validationResult = await result.current.validateBulkImport([
          { goalId: 'goal-1' },
          { goalId: 'goal-1' },
          { goalId: 'goal-2' },
          { goalId: 'goal-2' },
          { goalId: 'goal-2' },
          { goalId: 'goal-3' },
        ]);
      });

      expect(validationResult!).toEqual({ isValid: true });
      expect(productBacklogService.getBacklogItemCountByGoal).toHaveBeenCalledTimes(3);
      expect(productBacklogService.getBacklogItemCountByGoal).toHaveBeenNthCalledWith(1, 'goal-1');
      expect(productBacklogService.getBacklogItemCountByGoal).toHaveBeenNthCalledWith(2, 'goal-2');
      expect(productBacklogService.getBacklogItemCountByGoal).toHaveBeenNthCalledWith(3, 'goal-3');
    });
  });

  describe('Stable References', () => {
    it('should have stable validateCapacity reference', () => {
      const { result, rerender } = renderHook(() => useBacklogCapacityValidation());

      const firstRef = result.current.validateCapacity;
      rerender();
      const secondRef = result.current.validateCapacity;

      expect(firstRef).toBe(secondRef);
    });

    it('should have stable validateBulkImport reference', () => {
      const { result, rerender } = renderHook(() => useBacklogCapacityValidation());

      const firstRef = result.current.validateBulkImport;
      rerender();
      const secondRef = result.current.validateBulkImport;

      expect(firstRef).toBe(secondRef);
    });
  });
});
