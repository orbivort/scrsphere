// Product Backlog Service
import type {
  ProductBacklogItem,
  PaginatedResponse,
  ApiResponse,
  BulkCreateResponseData,
} from '../../types';
import type { BulkUploadItem } from '../../pages/Backlog/BulkUpload/bulkUploadUtils';
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

  async bulkCreateProductBacklogItems(
    items: BulkUploadItem[],
    teamId: string,
    goalId: string
  ): Promise<ApiResponse<BulkCreateResponseData>> {
    const payload = items.map((item) => ({
      teamId,
      goalId,
      title: item.title,
      description: item.description,
      storyPoints: item.storyPoints,
      businessValue: item.businessValue,
      priority: item.priority,
      labels: item.labels,
      acceptanceCriteria: item.acceptanceCriteria,
      _rowNumber: item._rowNumber,
    }));
    const { data } = await this.api.post('/product-backlog/bulk', payload);
    return data;
  }
}

export const productBacklogService = new ProductBacklogService();
