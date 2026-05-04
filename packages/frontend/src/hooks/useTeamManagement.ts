import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiService } from '../services';
import type {
  CreateTeamInput,
  UpdateTeamInput,
  TeamQuery,
  TeamsResponse,
} from '../types/teamManagement.types';

import { queryKeys } from './queryKeys';
import { useMutationErrorHandler } from './useMutationErrorHandler';

export const useTeams = (query?: TeamQuery) => {
  return useQuery({
    queryKey: queryKeys.team.list({ search: query?.search, page: query?.page }),
    queryFn: async () => {
      const result = await apiService.getTeams(query);
      if ('data' in result && result.data && !Array.isArray(result.data)) {
        return result as { success: boolean; data: TeamsResponse };
      }
      if ('data' in result && Array.isArray(result.data)) {
        return {
          success: result.success,
          data: {
            teams: result.data,
            pagination: { page: 1, limit: 10, total: result.data.length, totalPages: 1 },
          },
        } as { success: boolean; data: TeamsResponse };
      }
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useTeam = (id: string) => {
  return useQuery({
    queryKey: queryKeys.team.detail(id),
    queryFn: () => apiService.getTeam(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateTeam = () => {
  const queryClient = useQueryClient();
  const { handleMutationError } = useMutationErrorHandler();

  return useMutation({
    mutationFn: (data: CreateTeamInput) => apiService.createTeam(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.myTeams.all });
    },
    onError: (error: unknown) => {
      handleMutationError(error, {
        operationName: 'create team',
      });
    },
  });
};

export const useUpdateTeam = () => {
  const queryClient = useQueryClient();
  const { handleMutationError } = useMutationErrorHandler();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeamInput }) =>
      apiService.updateTeam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.myTeams.all });
    },
    onError: (error: unknown) => {
      handleMutationError(error, {
        operationName: 'update team',
      });
    },
  });
};

export const useDeleteTeam = () => {
  const queryClient = useQueryClient();
  const { handleMutationError } = useMutationErrorHandler();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteTeam(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.team.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.myTeams.all });
    },
    onError: (error: unknown) => {
      handleMutationError(error, {
        operationName: 'delete team',
      });
    },
  });
};
