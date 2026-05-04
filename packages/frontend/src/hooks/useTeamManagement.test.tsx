import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

import {
  useTeams,
  useTeam,
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
} from './useTeamManagement';
import { apiService } from '../services';
import type { Team } from '../types';

interface WrapperProps {
  children: React.ReactNode;
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  const Wrapper: React.FC<WrapperProps> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return Wrapper;
};

const mockTeam: Team = {
  id: 'team-1',
  name: 'Test Team',
  description: 'Test description',
  createdBy: 'user-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  members: [],
};

describe('useTeamManagement Hooks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('useTeams', () => {
    it('should fetch teams successfully', async () => {
      vi.spyOn(apiService, 'getTeams').mockResolvedValue({
        success: true,
        data: {
          teams: [mockTeam],
          pagination: {
            page: 1,
            limit: 10,
            total: 1,
            totalPages: 1,
          },
        },
      });

      const { result } = renderHook(() => useTeams(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiService.getTeams).toHaveBeenCalled();
    });

    it('should fetch teams with query parameters', async () => {
      vi.spyOn(apiService, 'getTeams').mockResolvedValue({
        success: true,
        data: {
          teams: [mockTeam],
          pagination: {
            page: 2,
            limit: 20,
            total: 1,
            totalPages: 1,
          },
        },
      });

      const query = { page: 2, limit: 20, search: 'test' };

      const { result } = renderHook(() => useTeams(query), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiService.getTeams).toHaveBeenCalledWith(query);
    });

    it('should handle fetch error', async () => {
      vi.spyOn(apiService, 'getTeams').mockRejectedValue(new Error('Failed to fetch'));

      const { result } = renderHook(() => useTeams(), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 }
      );

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useTeam', () => {
    it('should fetch single team by id', async () => {
      vi.spyOn(apiService, 'getTeam').mockResolvedValue({
        success: true,
        data: mockTeam,
      });

      const { result } = renderHook(() => useTeam('team-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toEqual(mockTeam);
      expect(apiService.getTeam).toHaveBeenCalledWith('team-1');
    });

    it('should not fetch when id is empty', () => {
      const getTeamSpy = vi.spyOn(apiService, 'getTeam');

      const { result } = renderHook(() => useTeam(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isFetching).toBe(false);
      expect(getTeamSpy).not.toHaveBeenCalled();
    });

    it('should handle fetch error', async () => {
      vi.spyOn(apiService, 'getTeam').mockRejectedValue(new Error('Team not found'));

      const { result } = renderHook(() => useTeam('team-1'), {
        wrapper: createWrapper(),
      });

      await waitFor(
        () => {
          expect(result.current.isError).toBe(true);
        },
        { timeout: 3000 }
      );

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useCreateTeam', () => {
    it('should create a team successfully', async () => {
      const newTeamData = { name: 'New Team', description: 'New description' };

      vi.spyOn(apiService, 'createTeam').mockResolvedValue({
        success: true,
        data: { ...mockTeam, ...newTeamData },
      });

      const { result } = renderHook(() => useCreateTeam(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newTeamData);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiService.createTeam).toHaveBeenCalledWith(newTeamData);
    });

    it('should handle create error', async () => {
      vi.spyOn(apiService, 'createTeam').mockRejectedValue(new Error('Create failed'));

      const { result } = renderHook(() => useCreateTeam(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ name: 'New Team', description: '' });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useUpdateTeam', () => {
    it('should update a team successfully', async () => {
      const updateData = { name: 'Updated Team' };

      vi.spyOn(apiService, 'updateTeam').mockResolvedValue({
        success: true,
        data: { ...mockTeam, name: 'Updated Team' },
      });

      const { result } = renderHook(() => useUpdateTeam(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 'team-1', data: updateData });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiService.updateTeam).toHaveBeenCalledWith('team-1', updateData);
    });

    it('should handle update error', async () => {
      vi.spyOn(apiService, 'updateTeam').mockRejectedValue(new Error('Update failed'));

      const { result } = renderHook(() => useUpdateTeam(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({ id: 'team-1', data: { name: 'Updated' } });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });

  describe('useDeleteTeam', () => {
    it('should delete a team successfully', async () => {
      vi.spyOn(apiService, 'deleteTeam').mockResolvedValue({
        success: true,
        data: undefined,
      });

      const { result } = renderHook(() => useDeleteTeam(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('team-1');

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(apiService.deleteTeam).toHaveBeenCalledWith('team-1');
    });

    it('should handle delete error', async () => {
      vi.spyOn(apiService, 'deleteTeam').mockRejectedValue(new Error('Delete failed'));

      const { result } = renderHook(() => useDeleteTeam(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('team-1');

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeInstanceOf(Error);
    });
  });
});
