// Sprint Configuration Service
import type {
  SprintConfiguration,
  SprintDuration,
  SprintGenerationResult,
  GeneratedSprint,
  ApiResponse,
} from '../../types';
import { coreApiService } from '../core/api.core';
import {
  mapSprintConfigToBackend,
  mapSprintConfigFromBackend,
  mapSprintGenerationResponse,
  mapSprintResponse,
  mapSprintsResponse,
  mapDurationToBackend,
} from '../utils/mapping.utils';

class SprintConfigService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async getSprintConfiguration(teamId: string): Promise<ApiResponse<SprintConfiguration>> {
    const { data } = await this.api.get('/sprint-configuration', {
      params: { teamId },
    });
    return mapSprintConfigFromBackend(data);
  }

  async createSprintConfiguration(
    config: Partial<SprintConfiguration>
  ): Promise<ApiResponse<SprintConfiguration>> {
    const payload = mapSprintConfigToBackend(config);
    const { data } = await this.api.post('/sprint-configuration', payload);
    return mapSprintConfigFromBackend(data);
  }

  async updateSprintConfiguration(
    id: string,
    updates: Partial<SprintConfiguration>
  ): Promise<ApiResponse<SprintConfiguration>> {
    const payload = mapSprintConfigToBackend(updates);
    const { data } = await this.api.put(`/sprint-configuration/${id}`, payload);
    return mapSprintConfigFromBackend(data);
  }

  async generateSprintsForYear(
    teamId: string,
    duration: SprintDuration,
    year: number
  ): Promise<ApiResponse<SprintGenerationResult>> {
    const backendDuration = mapDurationToBackend(duration);
    const { data } = await this.api.post('/sprint-configuration/generate', {
      teamId,
      duration: backendDuration,
      year,
    });
    return mapSprintGenerationResponse(data);
  }

  async getGeneratedSprints(
    teamId: string,
    year?: number
  ): Promise<ApiResponse<GeneratedSprint[]>> {
    const { data } = await this.api.get('/sprint-configuration/sprints', {
      params: { teamId, year },
    });
    return mapSprintsResponse(data);
  }

  async deleteGeneratedSprint(sprintId: string): Promise<ApiResponse<never>> {
    const { data } = await this.api.delete(`/sprint-configuration/sprints/${sprintId}`);
    return data;
  }

  async updateGeneratedSprint(
    sprintId: string,
    updates: { sprintGoal?: string }
  ): Promise<ApiResponse<GeneratedSprint>> {
    const { data } = await this.api.put(`/sprint-configuration/sprints/${sprintId}`, updates);
    return mapSprintResponse(data);
  }
}

export const sprintConfigService = new SprintConfigService();
