// System Parameters Service
import type { SystemParameter, ApiResponse } from '../../types';
import { coreApiService } from '../core/api.core';

class SystemParamsService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  async getSystemParameters(): Promise<ApiResponse<SystemParameter[]>> {
    const { data } = await this.api.get('/system-parameters');
    return data;
  }

  async updateSystemParameter(key: string, value: string): Promise<ApiResponse<SystemParameter>> {
    const { data } = await this.api.put(`/system-parameters/${key}`, { value });
    return data;
  }
}

export const systemParamsService = new SystemParamsService();
