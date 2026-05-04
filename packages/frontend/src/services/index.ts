// Services Index
// Re-export all services for convenient imports

// Core infrastructure
export { coreApiService } from './core/api.core';

// Domain services
export { authService } from './domain/auth.service';
export { teamService } from './domain/team.service';
export { productBacklogService } from './domain/productBacklog.service';
export { sprintService } from './domain/sprint.service';
export { sprintBacklogService } from './domain/sprintBacklog.service';
export { dailyUpdatesService } from './domain/dailyUpdates.service';
export { impedimentsService } from './domain/impediments.service';
export { reportsService } from './domain/reports.service';
export { productGoalsService } from './domain/productGoals.service';
export { sprintConfigService } from './domain/sprintConfig.service';
export { definitionService } from './domain/definition.service';
export { incrementService } from './domain/increment.service';
export { sprintReviewService } from './domain/sprintReview.service';
export { retrospectiveService } from './domain/retrospective.service';
export { systemParamsService } from './domain/systemParams.service';

// Mapping utilities
export * from './utils/mapping.utils';

// API Service Selection (preserves mock API functionality)
import {
  apiService as realApiService,
  setAuthCallbacks as realSetAuthCallbacksFromApi,
  type ApiService,
} from './api';
import { mockApiService } from './mockApi';

// Use mock API in development mode (when no backend is available)
// Set VITE_USE_MOCK_API=false in .env to use real API
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

export const apiService = (USE_MOCK_API ? mockApiService : realApiService) as ApiService;

// Stub for setAuthCallbacks when using mock API
const mockSetAuthCallbacks = (_onLogout: () => void) => {
  // No-op for mock API
};

export const setAuthCallbacks = USE_MOCK_API ? mockSetAuthCallbacks : realSetAuthCallbacksFromApi;

// Other services
export { sessionManager } from './sessionManager';

// Type exports
export type { ApiResponse, PaginatedResponse } from '../types';
