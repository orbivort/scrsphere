// Increment Service
import type { Increment, IncrementMetrics, ApiResponse } from '../../types';
import { coreApiService } from '../core/api.core';

class IncrementService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async getIncrements(teamId: string, sprintId?: string): Promise<ApiResponse<Increment[]>> {
    const { data } = await this.api.get('/increments', {
      params: { teamId, sprintId },
    });
    return data;
  }

  async getIncrement(id: string): Promise<ApiResponse<Increment>> {
    const { data } = await this.api.get(`/increments/${id}`);
    return data;
  }

  async createIncrement(increment: Partial<Increment>): Promise<ApiResponse<Increment>> {
    const { data } = await this.api.post('/increments', increment);
    return data;
  }

  async updateIncrement(id: string, updates: Partial<Increment>): Promise<ApiResponse<Increment>> {
    const { data } = await this.api.put(`/increments/${id}`, updates);
    return data;
  }

  async deliverIncrement(
    id: string,
    deliveryMethod: 'sprint_review' | 'early_release',
    notes?: string
  ): Promise<ApiResponse<Increment>> {
    const { data } = await this.api.post(`/increments/${id}/deliver`, {
      deliveryMethod,
      notes,
    });
    return data;
  }

  async getIncrementMetrics(teamId: string): Promise<ApiResponse<IncrementMetrics>> {
    const { data } = await this.api.get('/increments/metrics', {
      params: { teamId },
    });
    return data;
  }
}

export const incrementService = new IncrementService();
