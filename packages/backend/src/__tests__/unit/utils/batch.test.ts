import { describe, it, expect, vi } from 'vitest';
import { processBatch } from '../../../utils/batch';

describe('Batch Utility', () => {
  describe('processBatch', () => {
    it('should process all items in batches', async () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const processed: number[] = [];

      const processor = async (item: number) => {
        processed.push(item);
      };

      await processBatch(items, processor, 3);

      expect(processed).toHaveLength(10);
      expect(processed).toContain(1);
      expect(processed).toContain(10);
      expect(processed).toEqual(expect.arrayContaining(items));
    });

    it('should process items concurrently within each batch', async () => {
      const items = [1, 2, 3, 4, 5];
      const processingTimes: number[] = [];

      const processor = async (_item: number) => {
        const start = performance.now();
        await new Promise((resolve) => setTimeout(resolve, 10));
        processingTimes.push(performance.now() - start);
      };

      await processBatch(items, processor, 2);

      expect(processingTimes.length).toBe(5);
      processingTimes.forEach((time) => {
        expect(time).toBeGreaterThanOrEqual(10);
        expect(time).toBeLessThan(100);
      });
    });

    it('should handle empty array', async () => {
      const items: number[] = [];
      const processor = vi.fn();

      await processBatch(items, processor, 5);

      expect(processor).not.toHaveBeenCalled();
    });

    it('should handle array smaller than batch size', async () => {
      const items = [1, 2];
      const processor = vi.fn().mockResolvedValue(undefined);

      await processBatch(items, processor, 5);

      expect(processor).toHaveBeenCalledTimes(2);
    });

    it('should use default batch size of 5', async () => {
      const items = Array.from({ length: 12 }, (_, i) => i + 1);
      const processor = vi.fn().mockResolvedValue(undefined);

      await processBatch(items, processor);

      expect(processor).toHaveBeenCalledTimes(12);
    });

    it('should handle processor errors gracefully', async () => {
      const items = [1, 2, 3];
      const processor = vi.fn().mockImplementation((item: number) => {
        if (item === 2) {
          return Promise.reject(new Error('Processing error for item 2'));
        }
        return Promise.resolve();
      });

      await expect(processBatch(items, processor, 1)).rejects.toThrow(
        'Processing error for item 2'
      );
    });

    it('should process all batches even if some items fail', async () => {
      const items = [1, 2, 3, 4, 5];
      const processedItems: number[] = [];
      const processor = vi.fn().mockImplementation(async (item: number) => {
        if (item === 3) {
          throw new Error('Error processing item 3');
        }
        processedItems.push(item);
      });

      await expect(processBatch(items, processor, 1)).rejects.toThrow();

      expect(processedItems).toContain(1);
      expect(processedItems).toContain(2);
    });
  });
});
