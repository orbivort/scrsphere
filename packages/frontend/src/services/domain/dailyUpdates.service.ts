// Daily Updates Service
import type { DailyUpdate, Impediment, ApiResponse } from '../../types';
import { coreApiService } from '../core/api.core';

class DailyUpdatesService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async getDailyUpdates(sprintId: string, date?: string): Promise<ApiResponse<DailyUpdate[]>> {
    const { data } = await this.api.get(`/daily-updates/${sprintId}`, {
      params: { date },
    });
    return data;
  }

  async createDailyUpdate(
    sprintId: string,
    update: Partial<DailyUpdate>
  ): Promise<ApiResponse<DailyUpdate>> {
    const { data } = await this.api.post(`/daily-updates/${sprintId}`, update);
    return data;
  }

  async getTeamMembersWithUpdates(
    sprintId: string,
    date: string
  ): Promise<
    ApiResponse<{
      submitted: DailyUpdate[];
      pending: { userId: string; userName: string }[];
    }>
  > {
    const { data } = await this.api.get(`/daily-updates/${sprintId}/team-status`, {
      params: { date },
    });
    return data;
  }

  async sendDailyUpdateReminder(sprintId: string): Promise<
    ApiResponse<{
      sentCount: number;
      totalPending: number;
      message: string;
      errors?: string[];
    }>
  > {
    const { data } = await this.api.post(`/daily-updates/${sprintId}/send-reminder`);
    return data;
  }

  async promoteToImpediment(
    dailyUpdateId: string,
    impedimentData: {
      title: string;
      description?: string;
      ownerId?: string;
      priority?: string;
      teamId: string;
      sprintId?: string;
    }
  ): Promise<ApiResponse<{ dailyUpdate: DailyUpdate; impediment: Impediment }>> {
    const { data } = await this.api.post(
      `/daily-updates/${dailyUpdateId}/promote-impediment`,
      impedimentData
    );
    return data;
  }

  async getImpedimentByDailyUpdate(dailyUpdateId: string): Promise<ApiResponse<Impediment>> {
    const { data } = await this.api.get(`/daily-updates/${dailyUpdateId}/impediment`);
    return data;
  }
}

export const dailyUpdatesService = new DailyUpdatesService();
