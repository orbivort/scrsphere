// Sprint Service
import type { Sprint, ProductBacklogItem, ApiResponse } from '../../types';
import { coreApiService } from '../core/api.core';

class SprintService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async getSprints(teamId: string): Promise<ApiResponse<Sprint[]>> {
    const { data } = await this.api.get('/sprints', { params: { teamId } });
    return data;
  }

  async getActiveSprint(teamId: string): Promise<ApiResponse<Sprint>> {
    const { data } = await this.api.get('/sprints/active', {
      params: { teamId },
    });
    return data;
  }

  async createSprint(sprint: Partial<Sprint>): Promise<ApiResponse<Sprint>> {
    const { data } = await this.api.post('/sprints', sprint);
    return data;
  }

  async getSprint(id: string): Promise<ApiResponse<Sprint>> {
    const { data } = await this.api.get(`/sprints/${id}`);
    return data;
  }

  async startSprint(
    id: string,
    data?: {
      backlogItems?: Array<{ pbiId: string }>;
      tasks?: Array<{
        pbiId: string;
        title: string;
        description?: string;
        assigneeId?: string;
        estimatedHours?: number;
        remainingHours?: number;
      }>;
    }
  ): Promise<ApiResponse<Sprint>> {
    const { data: response } = await this.api.post(`/sprints/${id}/start`, data || {});
    return response;
  }

  async rollbackSprintStart(
    id: string,
    rollbackData: {
      previousPbiStatuses: Record<string, string>;
      createdSprintBacklogItemIds: string[];
      createdTaskIds: string[];
    }
  ): Promise<ApiResponse<{ message: string }>> {
    const { data } = await this.api.post(`/sprints/${id}/rollback`, rollbackData);
    return data;
  }

  async updateSprint(id: string, updates: Partial<Sprint>): Promise<ApiResponse<Sprint>> {
    const { data } = await this.api.put(`/sprints/${id}`, updates);
    return data;
  }

  async completeSprint(id: string): Promise<ApiResponse<Sprint>> {
    const { data } = await this.api.post(`/sprints/${id}/complete`);
    return data;
  }

  async cancelSprint(id: string, reason: string): Promise<ApiResponse<Sprint>> {
    const { data } = await this.api.post(`/sprints/${id}/cancel`, { reason });
    return data;
  }

  async getBurndownData(
    sprintId: string
  ): Promise<ApiResponse<{ dates: string[]; ideal: number[]; actual: number[] }>> {
    const { data } = await this.api.get(`/sprints/${sprintId}/burndown`);
    return data;
  }

  async getAvailablePBIsForSprint(teamId: string): Promise<ApiResponse<ProductBacklogItem[]>> {
    const { data } = await this.api.get('/sprints/available-pbis', {
      params: { teamId },
    });
    return data;
  }

  async getSprintBacklogPBIs(sprintId: string): Promise<ApiResponse<ProductBacklogItem[]>> {
    const { data } = await this.api.get(`/sprints/${sprintId}/backlog-pbis`);
    return data;
  }

  async getEligiblePBIsForIncrement(sprintId: string): Promise<ApiResponse<ProductBacklogItem[]>> {
    const { data } = await this.api.get(`/sprints/${sprintId}/eligible-pbis`);
    return data;
  }
}

export const sprintService = new SprintService();
