// Mapping Utilities
import {
  SprintDuration,
  type ApiResponse,
  type GeneratedSprint,
  type SprintConfiguration,
  type SprintGenerationResult,
} from '../../types';

export function normalizeSprintStatus(status: string | undefined): string {
  return (status ?? 'PLANNED').toLowerCase();
}

const DURATION_TO_BACKEND: Record<SprintDuration, string> = {
  [SprintDuration.ONE_WEEK]: 'ONE_WEEK',
  [SprintDuration.TWO_WEEKS]: 'TWO_WEEKS',
  [SprintDuration.THREE_WEEKS]: 'THREE_WEEKS',
  [SprintDuration.FOUR_WEEKS]: 'FOUR_WEEKS',
};

export function mapDurationToBackend(duration: SprintDuration): string {
  return DURATION_TO_BACKEND[duration];
}

const DURATION_TO_FRONTEND: Record<string, SprintDuration> = {
  ONE_WEEK: SprintDuration.ONE_WEEK,
  TWO_WEEKS: SprintDuration.TWO_WEEKS,
  THREE_WEEKS: SprintDuration.THREE_WEEKS,
  FOUR_WEEKS: SprintDuration.FOUR_WEEKS,
};

export function mapDurationToFrontend(duration: string): SprintDuration {
  return DURATION_TO_FRONTEND[duration] ?? SprintDuration.TWO_WEEKS;
}

export function mapSprintResponse<T extends GeneratedSprint>(
  response: ApiResponse<T>
): ApiResponse<T> {
  if (response.data) {
    const statusStr = normalizeSprintStatus((response.data as { status?: string }).status);
    return {
      ...response,
      data: {
        ...response.data,
        status: statusStr as T['status'],
      },
    };
  }
  return response;
}

export function mapSprintsResponse<T extends GeneratedSprint>(
  response: ApiResponse<T[]>
): ApiResponse<T[]> {
  if (response.data) {
    const mappedSprints = response.data.map((sprint) => {
      const statusStr = normalizeSprintStatus((sprint as { status?: string }).status);
      return {
        ...sprint,
        status: statusStr as T['status'],
      };
    });
    return { ...response, data: mappedSprints };
  }
  return response;
}

export function mapSprintConfigToBackend(
  config: Partial<SprintConfiguration>
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...config };
  if (config.duration) {
    payload.duration = mapDurationToBackend(config.duration);
  }
  return payload;
}

export function mapSprintConfigFromBackend(
  response: ApiResponse<SprintConfiguration>
): ApiResponse<SprintConfiguration> {
  if (response.data) {
    const durationValue = (response.data as { duration?: string }).duration;
    const mappedData = {
      ...response.data,
      duration: mapDurationToFrontend(durationValue ?? 'TWO_WEEKS'),
    };
    return { ...response, data: mappedData };
  }
  return response;
}

export function mapSprintGenerationResponse(
  response: ApiResponse<SprintGenerationResult>
): ApiResponse<SprintGenerationResult> {
  if (response.data?.sprints) {
    const mappedSprints = response.data.sprints.map((sprint) => {
      const statusStr = normalizeSprintStatus((sprint as { status?: string }).status);
      return {
        ...sprint,
        status: statusStr as GeneratedSprint['status'],
      };
    });
    return { ...response, data: { ...response.data, sprints: mappedSprints } };
  }
  return response;
}
