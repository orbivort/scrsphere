// Product Backlog Service
import type { ProductBacklogItem, PaginatedResponse, ApiResponse } from '../../types';
import { coreApiService } from '../core/api.core';

class ProductBacklogService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async getProductBacklog(
    teamId: string,
    params?: { status?: string; labels?: string; page?: number; limit?: number }
  ): Promise<PaginatedResponse<ProductBacklogItem>> {
    const { data } = await this.api.get('/product-backlog', {
      params: { teamId, ...params },
    });
    return data;
  }

  async createProductBacklogItem(
    item: Partial<ProductBacklogItem>
  ): Promise<ApiResponse<ProductBacklogItem>> {
    const { data } = await this.api.post('/product-backlog', item);
    return data;
  }

  async updateProductBacklogItem(
    id: string,
    updates: Partial<ProductBacklogItem>
  ): Promise<ApiResponse<ProductBacklogItem>> {
    const { data } = await this.api.put(`/product-backlog/${id}`, updates);
    return data;
  }

  async updateBacklogItemPriority(
    id: string,
    priority: string
  ): Promise<ApiResponse<ProductBacklogItem>> {
    const { data } = await this.api.put(`/product-backlog/${id}/priority`, {
      priority,
    });
    return data;
  }

  async deleteProductBacklogItem(id: string): Promise<ApiResponse<never>> {
    const { data } = await this.api.delete(`/product-backlog/${id}`);
    return data;
  }
}

export const productBacklogService = new ProductBacklogService();
