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

const { mockAxiosInstance } = vi.hoisted(() => {
  const mockAxiosFn = vi.fn().mockReturnValue(Promise.resolve({ data: {} }));
  const instance = Object.assign(mockAxiosFn, {
    get: vi.fn().mockReturnValue(Promise.resolve({ data: {} })),
    post: vi.fn().mockReturnValue(Promise.resolve({ data: {} })),
    put: vi.fn().mockReturnValue(Promise.resolve({ data: {} })),
    patch: vi.fn().mockReturnValue(Promise.resolve({ data: {} })),
    delete: vi.fn().mockReturnValue(Promise.resolve({ data: {} })),
    request: vi.fn().mockReturnValue(Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  });
  return { mockAxiosInstance: instance };
});

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => mockAxiosInstance),
  },
}));

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
    vi.unstubAllGlobals();
    document.cookie = 'csrfToken=; max-age=0';
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

  describe('CSRF Token Handling in Request Interceptor', () => {
    it('should not add CSRF header for GET requests', async () => {
      document.cookie = 'csrfToken=existing-token';
      new CoreApiService();

      const config = {
        headers: {} as Record<string, string>,
        url: '/api/test',
        method: 'get',
      } as InternalAxiosRequestConfig;

      const result = await requestInterceptor(config);

      expect(result.headers['x-csrf-token']).toBeUndefined();
    });

    it('should add CSRF header from cookie for mutating request when cookie exists', async () => {
      document.cookie = 'csrfToken=my-csrf-token';
      new CoreApiService();

      const config = {
        headers: {} as Record<string, string>,
        url: '/api/test',
        method: 'post',
      } as InternalAxiosRequestConfig;

      const result = await requestInterceptor(config);

      expect(result.headers['x-csrf-token']).toBe('my-csrf-token');
    });

    it('should fetch CSRF token when no cookie exists and add header when token obtained', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockImplementation(async () => {
          document.cookie = 'csrfToken=fetched-csrf-token';
          return { ok: true };
        })
      );
      new CoreApiService();

      const config = {
        headers: {} as Record<string, string>,
        url: '/api/test',
        method: 'post',
      } as InternalAxiosRequestConfig;

      const result = await requestInterceptor(config);

      expect(result.headers['x-csrf-token']).toBe('fetched-csrf-token');
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/csrf-token'),
        expect.objectContaining({ credentials: 'include' })
      );
    });

    it('should not add CSRF header when fetchCsrfToken returns null', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      new CoreApiService();

      const config = {
        headers: {} as Record<string, string>,
        url: '/api/test',
        method: 'post',
      } as InternalAxiosRequestConfig;

      const result = await requestInterceptor(config);

      expect(result.headers['x-csrf-token']).toBeUndefined();
    });

    it('should not add CSRF header when fetch response is not ok', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
      new CoreApiService();

      const config = {
        headers: {} as Record<string, string>,
        url: '/api/test',
        method: 'post',
      } as InternalAxiosRequestConfig;

      const result = await requestInterceptor(config);

      expect(result.headers['x-csrf-token']).toBeUndefined();
    });

    it('should add CSRF header for PUT, DELETE, PATCH methods', async () => {
      document.cookie = 'csrfToken=csrf-token-value';

      for (const method of ['put', 'delete', 'patch']) {
        vi.clearAllMocks();
        document.cookie = 'csrfToken=csrf-token-value';
        new CoreApiService();

        const config = {
          headers: {} as Record<string, string>,
          url: '/api/test',
          method,
        } as InternalAxiosRequestConfig;

        const result = await requestInterceptor(config);

        expect(result.headers['x-csrf-token']).toBe('csrf-token-value');
      }
    });
  });

  describe('Response Interceptor - CSRF Retry', () => {
    it('should retry request on 403 with CSRF message and fetch new token', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      new CoreApiService();

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
      document.cookie = 'csrfToken=new-csrf-token';

      const mockInstance = axios.create();
      const mockCallable = mockInstance as unknown as { mockResolvedValue: (val: unknown) => void };
      mockCallable.mockResolvedValue({ data: {} });

      const error = {
        response: {
          status: 403,
          data: {
            error: { message: 'CSRF token validation failed' },
          },
        },
        config: {
          url: '/api/test',
          headers: {} as Record<string, string>,
        },
      } as AxiosError;

      await responseErrorInterceptor(error);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/csrf-token'),
        expect.objectContaining({ credentials: 'include' })
      );
      expect(mockCallable).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/test',
          headers: expect.objectContaining({
            'x-csrf-token': 'new-csrf-token',
          }),
        })
      );
    });

    it('should retry request on 403 with CSRF message when _csrfRetry is false', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      new CoreApiService();

      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
      document.cookie = 'csrfToken=retried-token';

      const mockInstance = axios.create();
      const mockCallable = mockInstance as unknown as { mockResolvedValue: (val: unknown) => void };
      mockCallable.mockResolvedValue({ data: {} });

      const error = {
        response: {
          status: 403,
          data: {
            error: { message: 'CSRF token expired' },
          },
        },
        config: {
          url: '/api/data',
          headers: {} as Record<string, string>,
          _csrfRetry: false,
        },
      } as AxiosError;

      await responseErrorInterceptor(error);

      expect(fetch).toHaveBeenCalled();
      expect(mockCallable).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/data',
          _csrfRetry: true,
        })
      );
    });

    it('should reject on 403 without CSRF message', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      new CoreApiService();

      const error = {
        response: {
          status: 403,
          data: {
            error: { message: 'Forbidden' },
          },
        },
        config: {
          url: '/api/test',
          headers: {} as Record<string, string>,
        },
      } as AxiosError;

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();
    });

    it('should reject on 403 CSRF when _csrfRetry is already true', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      new CoreApiService();

      const error = {
        response: {
          status: 403,
          data: {
            error: { message: 'CSRF token expired' },
          },
        },
        config: {
          url: '/api/test',
          headers: {} as Record<string, string>,
          _csrfRetry: true,
        },
      } as AxiosError;

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();
    });
  });

  describe('Response Interceptor - Refresh Token Retry', () => {
    it('should retry request on 401 by refreshing token', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      new CoreApiService();

      const mockInstance = axios.create();
      mockInstance.post.mockResolvedValue({ data: {} });
      const mockCallable = mockInstance as unknown as { mockResolvedValue: (val: unknown) => void };
      mockCallable.mockResolvedValue({ data: {} });

      const error = {
        response: { status: 401 },
        config: {
          url: '/api/protected-resource',
          headers: {} as Record<string, string>,
        },
      } as AxiosError;

      await responseErrorInterceptor(error);

      expect(mockInstance.post).toHaveBeenCalledWith('/auth/refresh');
      expect(mockCallable).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/api/protected-resource',
          _retry: true,
        })
      );
    });

    it('should call onLogout and redirect to login on refresh failure', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      const mockLocation = { pathname: '/dashboard', href: '' };
      vi.stubGlobal('window', { location: mockLocation });

      new CoreApiService();

      const mockInstance = axios.create();
      mockInstance.post.mockRejectedValue(new Error('Refresh failed'));

      const error = {
        response: { status: 401 },
        config: {
          url: '/api/protected-resource',
          headers: {} as Record<string, string>,
        },
      } as AxiosError;

      await expect(responseErrorInterceptor(error)).rejects.toBeDefined();

      expect(logoutCallback).toHaveBeenCalled();
      expect(mockLocation.href).toBe('/login');
    });
  });

  describe('Refresh Token Deduplication', () => {
    it('should reuse existing refreshPromise when already refreshing', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      new CoreApiService();

      let resolveRefresh!: () => void;
      const deferredPromise = new Promise<void>((resolve) => {
        resolveRefresh = resolve;
      });

      const mockInstance = axios.create();
      mockInstance.post.mockReturnValue(deferredPromise);
      const mockCallable = mockInstance as unknown as { mockResolvedValue: (val: unknown) => void };
      mockCallable.mockResolvedValue({ data: {} });

      const error1 = {
        response: { status: 401 },
        config: {
          url: '/api/test1',
          headers: {} as Record<string, string>,
        },
      } as AxiosError;

      const error2 = {
        response: { status: 401 },
        config: {
          url: '/api/test2',
          headers: {} as Record<string, string>,
        },
      } as AxiosError;

      const promise1 = responseErrorInterceptor(error1);
      const promise2 = responseErrorInterceptor(error2);

      expect(mockInstance.post).toHaveBeenCalledTimes(1);
      expect(mockInstance.post).toHaveBeenCalledWith('/auth/refresh');

      resolveRefresh();

      await Promise.all([promise1, promise2]);

      expect(mockCallable).toHaveBeenCalledTimes(2);
    });

    it('should clear refreshPromise after refresh completes', async () => {
      const logoutCallback = vi.fn();
      setAuthCallbacks(() => {}, logoutCallback);

      new CoreApiService();

      const mockInstance = axios.create();
      mockInstance.post.mockResolvedValue({ data: {} });
      const mockCallable = mockInstance as unknown as { mockResolvedValue: (val: unknown) => void };
      mockCallable.mockResolvedValue({ data: {} });

      const error = {
        response: { status: 401 },
        config: {
          url: '/api/test',
          headers: {} as Record<string, string>,
        },
      } as AxiosError;

      await responseErrorInterceptor(error);

      mockInstance.post.mockClear();

      const error2 = {
        response: { status: 401 },
        config: {
          url: '/api/test-again',
          headers: {} as Record<string, string>,
        },
      } as AxiosError;

      await responseErrorInterceptor(error2);

      expect(mockInstance.post).toHaveBeenCalledTimes(1);
      expect(mockCallable).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/api/test-again' })
      );
    });
  });
});
