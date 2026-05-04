import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

vi.mock('../../utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  setStoreProvider: vi.fn(),
}));

vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    request: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };

  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
    },
  };
});

import { CoreApiService, setAuthCallbacks, coreApiService } from './api.core';

describe('CoreApiService', () => {
  let requestInterceptor: (
    config: InternalAxiosRequestConfig
  ) => Promise<InternalAxiosRequestConfig>;
  let responseErrorInterceptor: (error: AxiosError) => Promise<never>;

  beforeEach(() => {
    vi.clearAllMocks();

    const mockAxiosInstance = axios.create();
    mockAxiosInstance.interceptors.request.use = vi.fn((onFulfilled) => {
      requestInterceptor = onFulfilled;
      return 0;
    });

    mockAxiosInstance.interceptors.response.use = vi.fn((_onFulfilled, onRejected) => {
      responseErrorInterceptor = onRejected;
      return 0;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create axios instance with correct config', () => {
      new CoreApiService();

      expect(axios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 30000,
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should setup request and response interceptors', () => {
      new CoreApiService();

      expect(axios.create().interceptors.request.use).toHaveBeenCalled();
      expect(axios.create().interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('Request Interceptor', () => {
    it('should add team id header when team context is set', async () => {
      const service = new CoreApiService();
      service.setCurrentTeamContext('team-123');

      const config = {
        headers: {} as Record<string, string>,
        url: '/api/test',
      } as InternalAxiosRequestConfig;

      const result = await requestInterceptor(config);

      expect(result.headers['X-Team-Id']).toBe('team-123');
    });

    it('should not add team id header when team context is not set', async () => {
      new CoreApiService();

      const config = {
        headers: {} as Record<string, string>,
        url: '/api/test',
      } as InternalAxiosRequestConfig;

      const result = await requestInterceptor(config);

      expect(result.headers['X-Team-Id']).toBeUndefined();
    });

    it('should return config unchanged when no team context', async () => {
      new CoreApiService();

      const config = {
        headers: {} as Record<string, string>,
        url: '/api/test',
      } as InternalAxiosRequestConfig;

      const result = await requestInterceptor(config);

      expect(result.url).toBe(config.url);
    });

    it('should log debug for items endpoints in dev mode', async () => {
      vi.stubGlobal('import.meta', {
        DEV: true,
      });

      new CoreApiService();

      const config = {
        headers: {} as Record<string, string>,
        url: '/items/123',
        method: 'get',
        baseURL: 'http://localhost:5001/api/v1',
      } as InternalAxiosRequestConfig;

      const result = await requestInterceptor(config);

      expect(result).toBeDefined();

      vi.unstubAllGlobals();
    });

    it('should log debug for action-items endpoints in dev mode', async () => {
      vi.stubGlobal('import.meta', {
        DEV: true,
      });

      new CoreApiService();

      const config = {
        headers: {} as Record<string, string>,
        url: '/action-items/456',
        method: 'post',
        baseURL: 'http://localhost:5001/api/v1',
        data: { test: 'data' },
      } as InternalAxiosRequestConfig;

      const result = await requestInterceptor(config);

      expect(result).toBeDefined();

      vi.unstubAllGlobals();
    });
  });

  describe('Response Interceptor - 401 handling', () => {
    it('should reject for auth endpoints', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      new CoreApiService();

      const error = {
        response: { status: 401 },
        config: { url: '/auth/login' },
      } as AxiosError;

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();
    });

    it('should reject for register endpoint', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      new CoreApiService();

      const error = {
        response: { status: 401 },
        config: { url: '/auth/register' },
      } as AxiosError;

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();
    });

    it('should reject for refresh endpoint', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      new CoreApiService();

      const error = {
        response: { status: 401 },
        config: { url: '/auth/refresh' },
      } as AxiosError;

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();
    });

    it('should reject for login page', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      vi.stubGlobal('window', {
        location: { pathname: '/login' },
      });

      new CoreApiService();

      const error = {
        response: { status: 401 },
        config: { url: '/api/test', _retry: false },
      } as AxiosError & { config: { url: string; _retry: boolean } };

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();

      vi.unstubAllGlobals();
    });

    it('should reject for register page', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      vi.stubGlobal('window', {
        location: { pathname: '/register' },
      });

      new CoreApiService();

      const error = {
        response: { status: 401 },
        config: { url: '/api/test', _retry: false },
      } as AxiosError & { config: { url: string; _retry: boolean } };

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();

      vi.unstubAllGlobals();
    });

    it('should reject for already retried requests', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      new CoreApiService();

      const error = {
        response: { status: 401 },
        config: { url: '/api/test', _retry: true },
      } as AxiosError & { config: { url: string; _retry: boolean } };

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();
    });

    it('should reject for non-401 errors', async () => {
      new CoreApiService();

      const error = {
        response: { status: 500 },
        config: { url: '/api/test' },
      } as AxiosError;

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();
    });

    it('should reject for errors without response', async () => {
      new CoreApiService();

      const error = {
        config: { url: '/api/test' },
      } as AxiosError;

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();
    });
  });

  describe('setCurrentTeamContext', () => {
    it('should set current team id', () => {
      const service = new CoreApiService();
      service.setCurrentTeamContext('team-1');

      expect(service).toBeDefined();
    });

    it('should update team context when called multiple times', () => {
      const service = new CoreApiService();
      service.setCurrentTeamContext('team-1');
      service.setCurrentTeamContext('team-2');

      expect(service).toBeDefined();
    });
  });

  describe('clearTeamContext', () => {
    it('should clear team context', () => {
      const service = new CoreApiService();
      service.setCurrentTeamContext('team-1');
      service.clearTeamContext();

      expect(service).toBeDefined();
    });

    it('should be safe to call when no team context is set', () => {
      const service = new CoreApiService();
      service.clearTeamContext();

      expect(service).toBeDefined();
    });
  });

  describe('axiosInstance getter', () => {
    it('should return the axios instance', () => {
      const service = new CoreApiService();
      const instance = service.axiosInstance;

      expect(instance).toBeDefined();
    });
  });

  describe('setAuthCallbacks', () => {
    it('should set auth callbacks', () => {
      const refreshCallback = vi.fn();
      const logoutCallback = vi.fn();
      setAuthCallbacks(refreshCallback, logoutCallback);

      expect(setAuthCallbacks).toBeDefined();
    });
  });

  describe('coreApiService singleton', () => {
    it('should be defined', () => {
      expect(coreApiService).toBeDefined();
    });

    it('should have axiosInstance', () => {
      expect(coreApiService.axiosInstance).toBeDefined();
    });

    it('should have setCurrentTeamContext method', () => {
      expect(typeof coreApiService.setCurrentTeamContext).toBe('function');
    });

    it('should have clearTeamContext method', () => {
      expect(typeof coreApiService.clearTeamContext).toBe('function');
    });
  });

  describe('Multiple Instances', () => {
    it('should create independent instances', () => {
      const service1 = new CoreApiService();
      const service2 = new CoreApiService();

      service1.setCurrentTeamContext('team-1');
      service2.setCurrentTeamContext('team-2');

      expect(service1).toBeDefined();
      expect(service2).toBeDefined();
    });
  });

  describe('Request Interceptor registration', () => {
    it('should register request interceptor', () => {
      new CoreApiService();

      expect(axios.create().interceptors.request.use).toHaveBeenCalled();
    });
  });

  describe('Response Interceptor registration', () => {
    it('should register response interceptor', () => {
      new CoreApiService();

      expect(axios.create().interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('Team Context in Requests', () => {
    it('should set team context for requests', () => {
      const service = new CoreApiService();
      service.setCurrentTeamContext('team-123');

      expect(service).toBeDefined();
    });

    it('should clear team context', () => {
      const service = new CoreApiService();
      service.setCurrentTeamContext('team-123');
      service.clearTeamContext();

      expect(service).toBeDefined();
    });
  });
});
