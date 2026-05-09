import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiService } from '../services';
import { useTeamStore } from '../store';
import type { GeneratedSprint } from '../types';
import { getSprintTimeCategory } from '../utils/sprintUtils';

import { queryKeys } from './queryKeys';

export const useSprintsData = (year: number) => {
  const { currentTeam } = useTeamStore();
  const teamId = currentTeam?.id;

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.generatedSprint.byTeam(teamId),
    queryFn: () => apiService.getGeneratedSprints(teamId ?? '', year),
    enabled: !!teamId,
  });

  const categorizedSprints = useMemo(() => {
    const current: GeneratedSprint[] = [];
    const future: GeneratedSprint[] = [];

    if (data?.data) {
      data.data.forEach((sprint: GeneratedSprint) => {
        if (!sprint.startDate || !sprint.endDate) return;

        const category = getSprintTimeCategory(sprint.startDate, sprint.endDate);
        if (category === 'past') return;

        const sprintWithCategory = {
          ...sprint,
          category,
        };

        if (category === 'current') {
          current.push(sprintWithCategory);
        } else {
          future.push(sprintWithCategory);
        }
      });
    }

    current.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    future.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    return { current, future };
  }, [data]);

  return {
    sprints: data?.data ?? [],
    categorizedSprints,
    isLoading,
    error,
  };
};
