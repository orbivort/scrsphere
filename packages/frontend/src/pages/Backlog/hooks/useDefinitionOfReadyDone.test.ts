import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';

import { useDefinitionOfReadyDone } from './useDefinitionOfReadyDone';
import { apiService } from '../../../services';

vi.mock('../../../services', () => ({
  apiService: {
    getDefinitionOfReady: vi.fn(),
    getDefinitionOfDone: vi.fn(),
  },
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
  setStoreProvider: vi.fn(),
}));

describe('useDefinitionOfReadyDone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return empty arrays initially', async () => {
      vi.mocked(apiService.getDefinitionOfReady).mockResolvedValue({
        success: true,
        data: { items: [] },
      });
      vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
        success: true,
        data: { items: [] },
      });

      const { result } = renderHook(() => useDefinitionOfReadyDone('team-1'));

      expect(result.current.dorItems).toEqual([]);
      expect(result.current.dodItems).toEqual([]);
    });

    it('should return loading states as false after data loads', async () => {
      vi.mocked(apiService.getDefinitionOfReady).mockResolvedValue({
        success: true,
        data: { items: [] },
      });
      vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
        success: true,
        data: { items: [] },
      });

      const { result } = renderHook(() => useDefinitionOfReadyDone('team-1'));

      await waitFor(() => {
        expect(result.current.isLoadingDoR).toBe(false);
        expect(result.current.isLoadingDoD).toBe(false);
      });
    });
  });

  describe('Data Fetching', () => {
    it('should fetch Definition of Ready successfully', async () => {
      const mockDoRResponse = {
        success: true,
        data: {
          items: [
            {
              id: 'dor-1',
              description: 'Title and description present',
              category: 'Content',
              isActive: true,
              order: 1,
            },
            {
              id: 'dor-2',
              description: 'Acceptance criteria defined',
              category: 'Quality',
              isActive: true,
              order: 2,
            },
          ],
        },
      };

      vi.mocked(apiService.getDefinitionOfReady).mockResolvedValue(mockDoRResponse);
      vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
        success: true,
        data: { items: [] },
      });

      const { result } = renderHook(() => useDefinitionOfReadyDone('team-1'));

      await waitFor(() => {
        expect(result.current.dorItems.length).toBe(2);
      });

      expect(result.current.dorItems[0]).toEqual({
        id: 'dor-1',
        label: 'Title and description present',
        description: 'Content',
      });
      expect(result.current.dorItems[1]).toEqual({
        id: 'dor-2',
        label: 'Acceptance criteria defined',
        description: 'Quality',
      });
    });

    it('should fetch Definition of Done successfully', async () => {
      const mockDoDResponse = {
        success: true,
        data: {
          items: [
            {
              id: 'dod-1',
              description: 'Code reviewed',
              category: 'Quality',
              isActive: true,
              order: 1,
            },
            {
              id: 'dod-2',
              description: 'Tests passed',
              category: 'Testing',
              isActive: true,
              order: 2,
            },
          ],
        },
      };

      vi.mocked(apiService.getDefinitionOfReady).mockResolvedValue({
        success: true,
        data: { items: [] },
      });
      vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue(mockDoDResponse);

      const { result } = renderHook(() => useDefinitionOfReadyDone('team-1'));

      await waitFor(() => {
        expect(result.current.dodItems.length).toBe(2);
      });

      expect(result.current.dodItems[0]).toEqual({
        id: 'dod-1',
        label: 'Code reviewed',
        description: 'Quality',
      });
      expect(result.current.dodItems[1]).toEqual({
        id: 'dod-2',
        label: 'Tests passed',
        description: 'Testing',
      });
    });

    it('should not fetch when teamId is undefined', async () => {
      renderHook(() => useDefinitionOfReadyDone(undefined));

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(apiService.getDefinitionOfReady).not.toHaveBeenCalled();
      expect(apiService.getDefinitionOfDone).not.toHaveBeenCalled();
    });

    it('should filter inactive items', async () => {
      const mockDoRResponse = {
        success: true,
        data: {
          items: [
            {
              id: 'dor-1',
              description: 'Active item',
              category: 'Content',
              isActive: true,
              order: 1,
            },
            {
              id: 'dor-2',
              description: 'Inactive item',
              category: 'Content',
              isActive: false,
              order: 2,
            },
          ],
        },
      };

      vi.mocked(apiService.getDefinitionOfReady).mockResolvedValue(mockDoRResponse);
      vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
        success: true,
        data: { items: [] },
      });

      const { result } = renderHook(() => useDefinitionOfReadyDone('team-1'));

      await waitFor(() => {
        expect(result.current.dorItems.length).toBe(1);
      });

      expect(result.current.dorItems[0]?.id).toBe('dor-1');
    });

    it('should sort items by order', async () => {
      const mockDoRResponse = {
        success: true,
        data: {
          items: [
            {
              id: 'dor-3',
              description: 'Third item',
              category: 'Content',
              isActive: true,
              order: 3,
            },
            {
              id: 'dor-1',
              description: 'First item',
              category: 'Content',
              isActive: true,
              order: 1,
            },
            {
              id: 'dor-2',
              description: 'Second item',
              category: 'Content',
              isActive: true,
              order: 2,
            },
          ],
        },
      };

      vi.mocked(apiService.getDefinitionOfReady).mockResolvedValue(mockDoRResponse);
      vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
        success: true,
        data: { items: [] },
      });

      const { result } = renderHook(() => useDefinitionOfReadyDone('team-1'));

      await waitFor(() => {
        expect(result.current.dorItems.length).toBe(3);
      });

      expect(result.current.dorItems[0]?.id).toBe('dor-1');
      expect(result.current.dorItems[1]?.id).toBe('dor-2');
      expect(result.current.dorItems[2]?.id).toBe('dor-3');
    });

    it('should use default description when category is missing', async () => {
      const mockDoRResponse = {
        success: true,
        data: {
          items: [
            {
              id: 'dor-1',
              description: 'Item without category',
              category: null,
              isActive: true,
              order: 1,
            },
          ],
        },
      };

      vi.mocked(apiService.getDefinitionOfReady).mockResolvedValue(mockDoRResponse);
      vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
        success: true,
        data: { items: [] },
      });

      const { result } = renderHook(() => useDefinitionOfReadyDone('team-1'));

      await waitFor(() => {
        expect(result.current.dorItems.length).toBe(1);
      });

      expect(result.current.dorItems[0]?.description).toBe('Required criterion');
    });
  });

  describe('Loading States', () => {
    it('should set isLoadingDoR to true while fetching', async () => {
      let resolveDoR: (value: unknown) => void;
      vi.mocked(apiService.getDefinitionOfReady).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDoR = resolve;
          })
      );
      vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
        success: true,
        data: { items: [] },
      });

      const { result } = renderHook(() => useDefinitionOfReadyDone('team-1'));

      await waitFor(() => {
        expect(result.current.isLoadingDoR).toBe(true);
      });

      resolveDoR!({ success: true, data: { items: [] } });

      await waitFor(() => {
        expect(result.current.isLoadingDoR).toBe(false);
      });
    });

    it('should set isLoadingDoD to true while fetching', async () => {
      let resolveDoD: (value: unknown) => void;
      vi.mocked(apiService.getDefinitionOfReady).mockResolvedValue({
        success: true,
        data: { items: [] },
      });
      vi.mocked(apiService.getDefinitionOfDone).mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDoD = resolve;
          })
      );

      const { result } = renderHook(() => useDefinitionOfReadyDone('team-1'));

      await waitFor(() => {
        expect(result.current.isLoadingDoD).toBe(true);
      });

      resolveDoD!({ success: true, data: { items: [] } });

      await waitFor(() => {
        expect(result.current.isLoadingDoD).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle DoR API error gracefully', async () => {
      vi.mocked(apiService.getDefinitionOfReady).mockRejectedValue(new Error('Network error'));
      vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
        success: true,
        data: { items: [] },
      });

      const { result } = renderHook(() => useDefinitionOfReadyDone('team-1'));

      await waitFor(() => {
        expect(result.current.isLoadingDoR).toBe(false);
      });

      expect(result.current.dorItems).toEqual([]);
    });

    it('should handle DoD API error gracefully', async () => {
      vi.mocked(apiService.getDefinitionOfReady).mockResolvedValue({
        success: true,
        data: { items: [] },
      });
      vi.mocked(apiService.getDefinitionOfDone).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useDefinitionOfReadyDone('team-1'));

      await waitFor(() => {
        expect(result.current.isLoadingDoD).toBe(false);
      });

      expect(result.current.dodItems).toEqual([]);
    });

    it('should handle unsuccessful response', async () => {
      vi.mocked(apiService.getDefinitionOfReady).mockResolvedValue({
        success: false,
        data: null,
      });
      vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
        success: false,
        data: null,
      });

      const { result } = renderHook(() => useDefinitionOfReadyDone('team-1'));

      await waitFor(() => {
        expect(result.current.isLoadingDoR).toBe(false);
      });

      expect(result.current.dorItems).toEqual([]);
      expect(result.current.dodItems).toEqual([]);
    });

    it('should handle missing data in response', async () => {
      vi.mocked(apiService.getDefinitionOfReady).mockResolvedValue({
        success: true,
        data: undefined as unknown as { items: never[] },
      });
      vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
        success: true,
        data: undefined as unknown as { items: never[] },
      });

      const { result } = renderHook(() => useDefinitionOfReadyDone('team-1'));

      await waitFor(() => {
        expect(result.current.isLoadingDoR).toBe(false);
      });

      expect(result.current.dorItems).toEqual([]);
      expect(result.current.dodItems).toEqual([]);
    });
  });

  describe('Team ID Changes', () => {
    it('should refetch when teamId changes', async () => {
      vi.mocked(apiService.getDefinitionOfReady).mockResolvedValue({
        success: true,
        data: { items: [] },
      });
      vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
        success: true,
        data: { items: [] },
      });

      const { result, rerender } = renderHook(({ teamId }) => useDefinitionOfReadyDone(teamId), {
        initialProps: { teamId: 'team-1' },
      });

      await waitFor(() => {
        expect(result.current.isLoadingDoR).toBe(false);
      });

      expect(apiService.getDefinitionOfReady).toHaveBeenCalledWith('team-1');

      rerender({ teamId: 'team-2' });

      await waitFor(() => {
        expect(apiService.getDefinitionOfReady).toHaveBeenCalledWith('team-2');
      });
    });

    it('should not fetch when teamId changes to undefined', async () => {
      vi.mocked(apiService.getDefinitionOfReady).mockResolvedValue({
        success: true,
        data: { items: [] },
      });
      vi.mocked(apiService.getDefinitionOfDone).mockResolvedValue({
        success: true,
        data: { items: [] },
      });

      const { rerender } = renderHook(({ teamId }) => useDefinitionOfReadyDone(teamId), {
        initialProps: { teamId: 'team-1' },
      });

      await waitFor(() => {
        expect(apiService.getDefinitionOfReady).toHaveBeenCalledWith('team-1');
      });

      vi.clearAllMocks();

      rerender({ teamId: undefined });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(apiService.getDefinitionOfReady).not.toHaveBeenCalled();
      expect(apiService.getDefinitionOfDone).not.toHaveBeenCalled();
    });
  });
});
