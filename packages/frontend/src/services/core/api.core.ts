// Core API Infrastructure
import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import type { ApiResponse } from '../../types';
import { logger } from '../../utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api/v1';
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT ?? '30000', 10);

const CSRF_COOKIE_NAME = 'csrfToken';
const CSRF_HEADER_NAME = 'x-csrf-token';

function getCsrfTokenFromCookie(): string | null {
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === CSRF_COOKIE_NAME && value) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

async function fetchCsrfToken(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/csrf-token`, {
      credentials: 'include',
    });
    if (response.ok) {
      return getCsrfTokenFromCookie();
    }
  } catch (error) {
    logger.error('Failed to fetch CSRF token', undefined, {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
  return null;
}

let onLogout: (() => void) | null = null;

export const setAuthCallbacks = (_refreshCallback: () => void, logoutCallback: () => void) => {
  onLogout = logoutCallback;
};

export class CoreApiService {
  private api: AxiosInstance;
  private currentTeamId: string | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      if (this.currentTeamId) {
        config.headers['X-Team-Id'] = this.currentTeamId;
      }

      const method = config.method?.toUpperCase();
      if (method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        let csrfToken = getCsrfTokenFromCookie();
        csrfToken ??= await fetchCsrfToken();
        if (csrfToken) {
          config.headers[CSRF_HEADER_NAME] = csrfToken;
        }
      }

      if (
        import.meta.env.DEV &&
        (config.url?.includes('/items/') || config.url?.includes('/action-items/'))
      ) {
        logger.debug('API Request Debug', undefined, {
          baseURL: config.baseURL,
          requestURL: config.url,
          fullURL: config.baseURL + config.url,
          method: config.method,
          data: config.data,
        });
      }

      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse<never>>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
          _csrfRetry?: boolean;
        };
        const requestUrl = originalRequest.url ?? '';

        const isAuthEndpoint =
          requestUrl.includes('/auth/login') ||
          requestUrl.includes('/auth/register') ||
          requestUrl.includes('/auth/refresh');

        const isLoginPage =
          window.location.pathname === '/login' || window.location.pathname === '/register';

        if (
          error.response?.status === 403 &&
          !originalRequest._csrfRetry &&
          error.response.data.error?.message.includes('CSRF')
        ) {
          originalRequest._csrfRetry = true;

          const newCsrfToken = await fetchCsrfToken();
          if (newCsrfToken) {
            originalRequest.headers[CSRF_HEADER_NAME] = newCsrfToken;
            return this.api(originalRequest);
          }
        }

        if (
          error.response?.status === 401 &&
          !isAuthEndpoint &&
          !originalRequest._retry &&
          !isLoginPage
        ) {
          originalRequest._retry = true;

          try {
            await this.refreshToken();
            return this.api(originalRequest);
          } catch (refreshError) {
            onLogout?.();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.api
      .post('/auth/refresh')
      .then(() => {
        // Token refreshed successfully via httpOnly cookie
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  setCurrentTeamContext(teamId: string): void {
    this.currentTeamId = teamId;
  }

  clearTeamContext(): void {
    this.currentTeamId = null;
  }

  get axiosInstance(): AxiosInstance {
    return this.api;
  }
}

export const coreApiService = new CoreApiService();
