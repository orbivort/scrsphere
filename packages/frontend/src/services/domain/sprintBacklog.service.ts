// Sprint Backlog Service
import type { Task, ApiResponse, SprintBacklogItem, BacklogChange } from '../../types';
import { coreApiService } from '../core/api.core';

class SprintBacklogService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async getSprintTasks(sprintId: string): Promise<ApiResponse<Task[]>> {
    const { data } = await this.api.get(`/sprint-backlog/${sprintId}/tasks`);
    return data;
  }

  async createTask(sprintId: string, task: Partial<Task>): Promise<ApiResponse<Task>> {
    const { data } = await this.api.post(`/sprint-backlog/${sprintId}/tasks`, task);
    return data;
  }

  async updateTask(
    sprintId: string,
    taskId: string,
    updates: Partial<Task>
  ): Promise<ApiResponse<Task>> {
    const { data } = await this.api.put(`/sprint-backlog/${sprintId}/tasks/${taskId}`, updates);
    return data;
  }

  async deleteTask(sprintId: string, taskId: string): Promise<ApiResponse<null>> {
    const { data } = await this.api.delete(`/sprint-backlog/${sprintId}/tasks/${taskId}`);
    return data;
  }

  async getTasksByPbiId(pbiId: string): Promise<ApiResponse<Task[]>> {
    const { data } = await this.api.get(`/product-backlog/${pbiId}/tasks`);
    return data;
  }

  async addPBIToSprint(
    sprintId: string,
    pbiId: string,
    reason?: string
  ): Promise<ApiResponse<{ sprintBacklogItem: SprintBacklogItem; change: BacklogChange }>> {
    const { data } = await this.api.post(`/sprints/${sprintId}/backlog-items`, {
      pbiId,
      reason,
    });
    return data;
  }

  async removePBIFromSprint(
    sprintId: string,
    pbiId: string,
    taskAction: 'delete' | 'return_to_backlog' | 'keep_in_sprint',
    reason?: string
  ): Promise<ApiResponse<{ change: BacklogChange }>> {
    const { data } = await this.api.delete(`/sprints/${sprintId}/backlog-items/${pbiId}`, {
      data: { taskAction, reason },
    });
    return data;
  }

  async getSprintBacklogChanges(
    sprintId: string,
    limit?: number
  ): Promise<ApiResponse<BacklogChange[]>> {
    const { data } = await this.api.get(`/sprints/${sprintId}/backlog-changes`, {
      params: { limit },
    });
    return data;
  }
}

export const sprintBacklogService = new SprintBacklogService();
