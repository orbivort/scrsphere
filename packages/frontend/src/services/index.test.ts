import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockApiService = {
  login: vi.fn(),
  logout: vi.fn(),
  getTeams: vi.fn(),
};

const realApiService = {
  login: vi.fn(),
  logout: vi.fn(),
  getTeams: vi.fn(),
  setCurrentTeamContext: vi.fn(),
  clearTeamContext: vi.fn(),
};

const realSetAuthCallbacks = vi.fn();

vi.mock('./api', () => ({
  apiService: realApiService,
  setAuthCallbacks: realSetAuthCallbacks,
  ApiService: class ApiService {},
}));

vi.mock('./mockApi', () => ({
  mockApiService,
}));

describe('Services Index', () => {
  describe('with mock API', () => {
    beforeEach(() => {
      vi.resetModules();
      vi.stubGlobal('import.meta', {
        env: {
          VITE_USE_MOCK_API: undefined,
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.clearAllMocks();
    });

    it('should use mock API when VITE_USE_MOCK_API is not false', async () => {
      vi.stubGlobal('import.meta', {
        env: {
          VITE_USE_MOCK_API: undefined,
        },
      });

      const { apiService } = await import('./index');

      expect(apiService).toBeDefined();
    });

    it('should use mock API when VITE_USE_MOCK_API is true', async () => {
      vi.stubGlobal('import.meta', {
        env: {
          VITE_USE_MOCK_API: 'true',
        },
      });

      const { apiService } = await import('./index');

      expect(apiService).toBeDefined();
    });
  });

  describe('with real API', () => {
    beforeEach(() => {
      vi.resetModules();
      vi.stubGlobal('import.meta', {
        env: {
          VITE_USE_MOCK_API: 'false',
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.clearAllMocks();
    });

    it('should use real API when VITE_USE_MOCK_API is false', async () => {
      const { apiService } = await import('./index');

      expect(apiService).toBeDefined();
    });

    it('should export setAuthCallbacks for real API', async () => {
      const { setAuthCallbacks } = await import('./index');

      expect(setAuthCallbacks).toBeDefined();
    });
  });

  describe('exports', () => {
    beforeEach(() => {
      vi.stubGlobal('import.meta', {
        env: {
          VITE_USE_MOCK_API: 'false',
        },
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
      vi.clearAllMocks();
    });

    it('should export coreApiService', async () => {
      vi.doMock('./core/api.core', () => ({
        coreApiService: {
          axiosInstance: {},
          setCurrentTeamContext: vi.fn(),
          clearTeamContext: vi.fn(),
        },
      }));

      const { coreApiService } = await import('./index');

      expect(coreApiService).toBeDefined();
    });

    it('should export domain services', async () => {
      vi.doMock('./domain/auth.service', () => ({
        authService: {},
      }));
      vi.doMock('./domain/team.service', () => ({
        teamService: {},
      }));

      const exports = await import('./index');

      expect(exports).toBeDefined();
    });
  });
});
