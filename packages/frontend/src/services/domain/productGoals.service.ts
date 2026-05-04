// Product Goals Service
import type { ProductGoal, ApiResponse, StatusChangeHistoryItem } from '../../types';
import { coreApiService } from '../core/api.core';

class ProductGoalsService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async getProductGoals(teamId: string): Promise<ApiResponse<ProductGoal[]>> {
    const { data } = await this.api.get('/product-goals', {
      params: { teamId },
    });
    return data;
  }

  async createProductGoal(goal: Partial<ProductGoal>): Promise<ApiResponse<ProductGoal>> {
    const { data } = await this.api.post('/product-goals', goal);
    return data;
  }

  async updateProductGoal(
    id: string,
    updates: Partial<ProductGoal>
  ): Promise<ApiResponse<ProductGoal>> {
    const { data } = await this.api.put(`/product-goals/${id}`, updates);
    return data;
  }

  async deleteProductGoal(id: string): Promise<ApiResponse<never>> {
    const { data } = await this.api.delete(`/product-goals/${id}`);
    return data;
  }

  async getProductGoalStatusHistory(id: string): Promise<ApiResponse<StatusChangeHistoryItem[]>> {
    const { data } = await this.api.get(`/product-goals/${id}/status-history`);
    return data;
  }
}

export const productGoalsService = new ProductGoalsService();
