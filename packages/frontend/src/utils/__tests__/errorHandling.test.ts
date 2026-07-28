import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { AxiosError } from 'axios';

// Mock functions that can be accessed both in the mock factories and in tests
const mocks = vi.hoisted(() => {
  const mockT = vi.fn((key: string) => key);
  const mockWarn = vi.fn();
  const mockI18nState = { isInitialized: false };

  return {
    mockT,
    mockWarn,
    mockI18nState,
  };
});

// Mock the logger
vi.mock('../logger', () => ({
  logger: {
    warn: mocks.mockWarn,
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock the i18n instance
vi.mock('../../i18n/config', () => ({
  i18nInstance: {
    get isInitialized() {
      return mocks.mockI18nState.isInitialized;
    },
    set isInitialized(value: boolean) {
      mocks.mockI18nState.isInitialized = value;
    },
    t: mocks.mockT,
  },
}));

// Import after mocks are defined
import { getFriendlyErrorMessage } from '../errorHandling';
import type { ApiResponse } from '../../types';

describe('errorHandling i18n fallback resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockI18nState.isInitialized = false;
    mocks.mockT.mockReset();
    mocks.mockT.mockImplementation((key: string) => key);
    mocks.mockWarn.mockReset();
  });

  describe('getFriendlyErrorMessage', () => {
    describe('when i18n is not initialized', () => {
      it('should return fallback message when i18n is not initialized', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = false;

        const error = new Error('Network error');

        // Act
        const result = getFriendlyErrorMessage(error, 'Default error message');

        // Assert
        expect(result).toBe('Network error. Please check your connection and try again.');
        expect(mocks.mockT).not.toHaveBeenCalled();
      });
    });

    describe('when i18n is initialized', () => {
      it('should return translated network error when i18n is initialized', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;
        mocks.mockT.mockReturnValue('Translated: Network error message');

        const error = new Error('Network connection failed');

        // Act
        const result = getFriendlyErrorMessage(error, 'Default error message');

        // Assert
        expect(mocks.mockT).toHaveBeenCalledWith('networkErrors.networkError');
        expect(result).toBe('Translated: Network error message');
      });

      it('should return translated timeout error when i18n is initialized', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;
        mocks.mockT.mockReturnValue('Translated: Timeout error message');

        const error = new Error('Request timeout');

        // Act
        const result = getFriendlyErrorMessage(error, 'Default error message');

        // Assert
        expect(mocks.mockT).toHaveBeenCalledWith('networkErrors.timeout');
        expect(result).toBe('Translated: Timeout error message');
      });
    });

    describe('when i18n throws an exception', () => {
      it('should return fallback message when i18n throws an exception', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;
        mocks.mockT.mockImplementation(() => {
          throw new Error('i18n translation error');
        });

        const error = new Error('Network error');

        // Act
        const result = getFriendlyErrorMessage(error, 'Default error message');

        // Assert
        expect(result).toBe('Network error. Please check your connection and try again.');
        expect(mocks.mockWarn).toHaveBeenCalledWith(
          'i18n translation failed for network error',
          undefined,
          expect.objectContaining({
            originalError: expect.any(Error),
          })
        );
      });

      it('should return fallback timeout message when i18n throws an exception', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;
        mocks.mockT.mockImplementation(() => {
          throw new Error('i18n timeout error');
        });

        const error = new Error('Timeout occurred');

        // Act
        const result = getFriendlyErrorMessage(error, 'Default error message');

        // Assert
        expect(result).toBe('Request timed out. Please try again.');
        expect(mocks.mockWarn).toHaveBeenCalledWith(
          'i18n translation failed for timeout error',
          undefined,
          expect.objectContaining({
            originalError: expect.any(Error),
          })
        );
      });
    });

    describe('when error is not network/timeout related', () => {
      it('should return original error message for non-network errors', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;

        const error = new Error('Some other error');

        // Act
        const result = getFriendlyErrorMessage(error, 'Default error message');

        // Assert
        expect(result).toBe('Some other error');
        expect(mocks.mockT).not.toHaveBeenCalled();
      });
    });

    describe('axios error handling', () => {
      it('should return axios response message when available', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = false;

        const axiosError = {
          response: {
            data: {
              error: {
                message: 'API error message',
              },
            },
          },
        } as unknown as AxiosError<ApiResponse<never>>;

        // Act
        const result = getFriendlyErrorMessage(axiosError, 'Default error message');

        // Assert
        expect(result).toBe('API error message');
      });

      it('should not use i18n when axios error has response message', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;

        const axiosError = {
          response: {
            data: {
              error: {
                message: 'Custom API error',
              },
            },
          },
        } as unknown as AxiosError<ApiResponse<never>>;

        // Act
        const result = getFriendlyErrorMessage(axiosError, 'Default error message');

        // Assert
        expect(result).toBe('Custom API error');
        expect(mocks.mockT).not.toHaveBeenCalled();
      });
    });

    describe('edge cases', () => {
      it('should return default message when error is null', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = false;

        // Act
        const result = getFriendlyErrorMessage(null, 'Default message');

        // Assert
        expect(result).toBe('Default message');
      });

      it('should return default message when error is undefined', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = false;

        // Act
        const result = getFriendlyErrorMessage(undefined, 'Default message');

        // Assert
        expect(result).toBe('Default message');
      });

      it('should handle error with empty message', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = false;

        const error = new Error('');

        // Act
        const result = getFriendlyErrorMessage(error, 'Default message');

        // Assert
        expect(result).toBe('Default message');
      });

      it('should handle network error with uppercase Network', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;
        mocks.mockT.mockReturnValue('Translated: Network error');

        const error = new Error('Network failure');

        // Act
        const result = getFriendlyErrorMessage(error, 'Default message');

        // Assert
        expect(mocks.mockT).toHaveBeenCalledWith('networkErrors.networkError');
        expect(result).toBe('Translated: Network error');
      });

      it('should handle timeout error with uppercase Timeout', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;
        mocks.mockT.mockReturnValue('Translated: Timeout');

        const error = new Error('Timeout occurred');

        // Act
        const result = getFriendlyErrorMessage(error, 'Default message');

        // Assert
        expect(mocks.mockT).toHaveBeenCalledWith('networkErrors.timeout');
        expect(result).toBe('Translated: Timeout');
      });
    });

    describe('translation key resolution', () => {
      it('should use correct key for network errors', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;
        mocks.mockT.mockReturnValue('Translated');

        const error = new Error('network error');

        // Act
        getFriendlyErrorMessage(error, 'Default');

        // Assert
        expect(mocks.mockT).toHaveBeenCalledWith('networkErrors.networkError');
      });

      it('should use correct key for timeout errors', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;
        mocks.mockT.mockReturnValue('Translated');

        const error = new Error('timeout error');

        // Act
        getFriendlyErrorMessage(error, 'Default');

        // Assert
        expect(mocks.mockT).toHaveBeenCalledWith('networkErrors.timeout');
      });
    });

    describe('i18n translation returns empty string', () => {
      it('should fallback when translation returns empty string for network error', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;
        mocks.mockT.mockReturnValue('');

        const error = new Error('network error');

        // Act
        const result = getFriendlyErrorMessage(error, 'Default message');

        // Assert
        expect(result).toBe('Network error. Please check your connection and try again.');
      });

      it('should fallback when translation returns empty string for timeout error', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;
        mocks.mockT.mockReturnValue('');

        const error = new Error('timeout error');

        // Act
        const result = getFriendlyErrorMessage(error, 'Default message');

        // Assert
        expect(result).toBe('Request timed out. Please try again.');
      });
    });

    describe('non-Error input handling', () => {
      it('should return default message for non-Error input', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = false;

        // Act
        const result = getFriendlyErrorMessage('string error', 'Default message');

        // Assert
        expect(result).toBe('Default message');
      });

      it('should handle object input gracefully', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = false;

        // Act
        const result = getFriendlyErrorMessage({ message: 'object error' }, 'Default message');

        // Assert
        expect(result).toBe('Default message');
      });
    });
  });
});
