// Mock Scrum Master Dashboard Services
// Follows the BAU mock convention (object substitution at the service boundary,
// selected in services/index.ts via VITE_USE_MOCK_API), mirroring how
// mockApiService substitutes for the real apiService.
//
// These classes implement the exact interfaces of SmDashboardService and
// HealthCheckService so the UI code is agnostic to mock vs real backend.

import type { ApiResponse } from '../types';

import { mockDelay } from './mockResponseUtils';
import {
  mockSmDashboardData,
  mockEventSchedule,
  mockHealthCheckDetails,
  mockHealthCheckTrend,
} from './mockSmDashboardData';
import type { SmDashboardData, EventSchedule } from './domain/smDashboard.service';
import type {
  HealthCheckResponsePayload,
  HealthCheckResults,
  HealthCheckTrendItem,
} from './domain/healthCheck.service';

export class MockSmDashboardService {
  async getDashboard(_teamId: string, _sprintCount = 5): Promise<ApiResponse<SmDashboardData>> {
    await mockDelay(300);
    return { success: true, data: mockSmDashboardData };
  }

  async getEventSchedule(_teamId: string): Promise<ApiResponse<EventSchedule>> {
    await mockDelay(200);
    return { success: true, data: mockEventSchedule };
  }

  async updateSprintSmNotes(_sprintId: string, _smNotes: string): Promise<ApiResponse<never>> {
    await mockDelay(200);
    return { success: true };
  }

  async updateSprintReviewSmNotes(
    _reviewId: string,
    _smNotes: string
  ): Promise<ApiResponse<never>> {
    await mockDelay(200);
    return { success: true };
  }

  async updateRetrospectiveSmNotes(
    _retroId: string,
    _smNotes: string
  ): Promise<ApiResponse<never>> {
    await mockDelay(200);
    return { success: true };
  }
}

export class MockHealthCheckService {
  async createHealthCheck(_teamId: string, _sprintId?: string): Promise<ApiResponse<never>> {
    await mockDelay(200);
    return { success: true };
  }

  async submitResponses(
    _healthCheckId: string,
    _responses: HealthCheckResponsePayload[]
  ): Promise<
    ApiResponse<{ healthCheckId: string; saved: Array<{ scrumValue: string; score: number }> }>
  > {
    await mockDelay(300);
    return {
      success: true,
      data: {
        healthCheckId: '',
        saved: [],
      },
    };
  }

  async getResults(_healthCheckId: string): Promise<ApiResponse<HealthCheckResults>> {
    await mockDelay(200);
    return { success: true, data: mockHealthCheckDetails };
  }

  async getTrend(_teamId: string): Promise<ApiResponse<HealthCheckTrendItem[]>> {
    await mockDelay(300);
    return { success: true, data: mockHealthCheckTrend };
  }
}

export const mockSmDashboardService = new MockSmDashboardService();
export const mockHealthCheckService = new MockHealthCheckService();
