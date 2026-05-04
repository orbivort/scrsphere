// Definition Service
import type {
  DefinitionOfDone,
  DoDItem,
  DoDChecklistVerification,
  DoDComplianceReport,
  DefinitionOfReady,
  DoRItem,
  DoRChecklistVerification,
  ApiResponse,
} from '../../types';
import { coreApiService } from '../core/api.core';

class DefinitionService {
  private get api() {
    return coreApiService.axiosInstance;
  }

  // Definition of Done
  async getDefinitionOfDone(teamId: string): Promise<ApiResponse<DefinitionOfDone>> {
    const { data } = await this.api.get(`/teams/${teamId}/definition-of-done`);
    return data;
  }

  async updateDefinitionOfDone(
    teamId: string,
    items: DoDItem[]
  ): Promise<ApiResponse<DefinitionOfDone>> {
    const { data } = await this.api.put(`/teams/${teamId}/definition-of-done`, { items });
    return data;
  }

  async getDoDHistory(teamId: string): Promise<ApiResponse<DefinitionOfDone[]>> {
    const { data } = await this.api.get(`/teams/${teamId}/definition-of-done/history`);
    return data;
  }

  async verifyDoDForPBI(
    pbiId: string,
    verifications: { dodItemId: string; isVerified: boolean; notes?: string }[]
  ): Promise<ApiResponse<DoDChecklistVerification[]>> {
    const { data } = await this.api.post(`/product-backlog/${pbiId}/verify-dod`, { verifications });
    return data;
  }

  async getDoDVerificationsForPBI(pbiId: string): Promise<ApiResponse<DoDChecklistVerification[]>> {
    const { data } = await this.api.get(`/product-backlog/${pbiId}/dod-verifications`);
    return data;
  }

  async getDoDComplianceReport(sprintId: string): Promise<ApiResponse<DoDComplianceReport>> {
    const { data } = await this.api.get(`/sprints/${sprintId}/dod-compliance`);
    return data;
  }

  // Definition of Ready
  async getDefinitionOfReady(teamId: string): Promise<ApiResponse<DefinitionOfReady>> {
    const { data } = await this.api.get(`/teams/${teamId}/definition-of-ready`);
    return data;
  }

  async updateDefinitionOfReady(
    teamId: string,
    items: DoRItem[]
  ): Promise<ApiResponse<DefinitionOfReady>> {
    const { data } = await this.api.put(`/teams/${teamId}/definition-of-ready`, { items });
    return data;
  }

  async getDoRHistory(teamId: string): Promise<ApiResponse<DefinitionOfReady[]>> {
    const { data } = await this.api.get(`/teams/${teamId}/definition-of-ready/history`);
    return data;
  }

  async verifyDoRForPBI(
    pbiId: string,
    verifications: { dorItemId: string; isVerified: boolean; notes?: string }[]
  ): Promise<ApiResponse<DoRChecklistVerification[]>> {
    const { data } = await this.api.post(`/product-backlog/${pbiId}/verify-dor`, { verifications });
    return data;
  }

  async getDoRVerificationsForPBI(pbiId: string): Promise<ApiResponse<DoRChecklistVerification[]>> {
    const { data } = await this.api.get(`/product-backlog/${pbiId}/dor-verifications`);
    return data;
  }
}

export const definitionService = new DefinitionService();
