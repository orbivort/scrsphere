// Scrum Values Health Check Service
import type { ApiResponse, ScrumValue, HealthCheckStatus } from '../../types';
import { coreApiService } from '../core/api.core';

export interface HealthCheckResponsePayload {
  scrumValue: ScrumValue;
  score: number;
  anonymous: boolean;
}

export interface HealthCheckResults {
  healthCheckId: string;
  status: HealthCheckStatus;
  createdAt: string;
  results: Array<{ scrumValue: string; averageScore: number; responseCount: number }>;
  overallAverage: number;
}

export interface HealthCheckTrendItem {
  healthCheckId: string;
  createdAt: string;
  overallAverage: number;
  values: Array<{ scrumValue: string; averageScore: number }>;
}

class HealthCheckService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async createHealthCheck(teamId: string, sprintId?: string): Promise<ApiResponse<never>> {
    const { data } = await this.api.post(`/teams/${teamId}/health-checks`, { sprintId });
    return data;
  }

  async submitResponses(
    healthCheckId: string,
    responses: HealthCheckResponsePayload[]
  ): Promise<
    ApiResponse<{ healthCheckId: string; saved: Array<{ scrumValue: string; score: number }> }>
  > {
    const { data } = await this.api.post(`/health-checks/${healthCheckId}/responses`, {
      responses,
    });
    return data;
  }

  async getResults(healthCheckId: string): Promise<ApiResponse<HealthCheckResults>> {
    const { data } = await this.api.get(`/health-checks/${healthCheckId}/results`);
    return data;
  }

  async getTrend(teamId: string): Promise<ApiResponse<HealthCheckTrendItem[]>> {
    const { data } = await this.api.get(`/teams/${teamId}/health-check-trend`);
    return data;
  }
}

export const healthCheckService = new HealthCheckService();
