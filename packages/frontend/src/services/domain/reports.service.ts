// Reports Service
import type {
  SprintHistoryItem,
  TeamMetrics,
  Insight,
  StatusChangeHistoryItem,
  ApiResponse,
} from '../../types';
import { coreApiService } from '../core/api.core';

class ReportsService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async getVelocityData(
    teamId: string
  ): Promise<ApiResponse<{ sprints: string[]; planned: number[]; completed: number[] }>> {
    const { data } = await this.api.get('/reports/velocity', {
      params: { teamId },
    });
    return data;
  }

  async getSprintHistory(teamId: string): Promise<ApiResponse<SprintHistoryItem[]>> {
    const { data } = await this.api.get('/reports/sprint-history', {
      params: { teamId },
    });
    return data;
  }

  async getTeamMetrics(teamId: string): Promise<ApiResponse<TeamMetrics>> {
    const { data } = await this.api.get('/reports/metrics', {
      params: { teamId },
    });
    return data;
  }

  async getInsights(teamId: string): Promise<ApiResponse<Insight[]>> {
    const { data } = await this.api.get('/reports/insights', {
      params: { teamId },
    });
    return data;
  }

  async getStatusChangeHistory(
    entityType: string,
    entityId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<StatusChangeHistoryItem[]>> {
    const { data } = await this.api.get(`/workflows/${entityType}/${entityId}/history`, {
      params: { limit, offset },
    });
    return data;
  }
}

export const reportsService = new ReportsService();
