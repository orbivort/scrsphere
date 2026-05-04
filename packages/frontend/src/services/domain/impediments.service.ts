// Impediments Service
import type { Impediment, ApiResponse } from '../../types';
import { coreApiService } from '../core/api.core';

class ImpedimentsService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async getImpediments(teamId: string): Promise<ApiResponse<Impediment[]>> {
    const { data } = await this.api.get('/impediments', {
      params: { teamId },
    });
    return data;
  }

  async createImpediment(impediment: Partial<Impediment>): Promise<ApiResponse<Impediment>> {
    const { data } = await this.api.post('/impediments', impediment);
    return data;
  }

  async updateImpediment(
    id: string,
    updates: Partial<Impediment>
  ): Promise<ApiResponse<Impediment>> {
    const { data } = await this.api.put(`/impediments/${id}`, updates);
    return data;
  }

  async deleteImpediment(id: string, teamId: string): Promise<ApiResponse<never>> {
    const { data } = await this.api.delete(`/impediments/${id}`, {
      params: { teamId },
    });
    return data;
  }
}

export const impedimentsService = new ImpedimentsService();
