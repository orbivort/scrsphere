import { describe, it, expect, vi, beforeEach } from 'vitest';

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
import { getUserFriendlyErrorMessage, formatValidationErrors } from '../authErrors';
import type { ValidationErrorDetail, ErrorDetails } from '../authErrors';

describe('authErrors i18n fallback resilience', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.mockI18nState.isInitialized = false;
    mocks.mockT.mockReset();
    mocks.mockT.mockImplementation((key: string) => key);
    mocks.mockWarn.mockReset();
  });

  describe('safeTranslate fallback behavior', () => {
    describe('when i18n is not initialized', () => {
      it('should return fallback message when i18n is not initialized', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = false;

        // Act
        const result = getUserFriendlyErrorMessage(undefined, 'register');

        // Assert
        expect(result).toBe('Registration failed. Please try again.');
        expect(mocks.mockT).not.toHaveBeenCalled();
      });
    });

    describe('when translation key does not exist', () => {
      it('should return fallback message when translation key does not exist', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;
        mocks.mockT.mockReturnValue('');

        // Act
        const result = getUserFriendlyErrorMessage(undefined, 'login');

        // Assert
        expect(result).toBe('Login failed. Please check your credentials.');
      });
    });

    describe('when i18n is initialized and key exists', () => {
      it('should return translated message when i18n is initialized and key exists', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;
        mocks.mockT.mockReturnValue('Translated: Registration failed');

        // Act
        const result = getUserFriendlyErrorMessage(undefined, 'register');

        // Assert
        expect(mocks.mockT).toHaveBeenCalledWith('auth:register.failed');
        expect(result).toBe('Translated: Registration failed');
      });
    });

    describe('when i18n throws an exception', () => {
      it('should return fallback message when i18n throws an exception', () => {
        // Arrange
        mocks.mockI18nState.isInitialized = true;
        mocks.mockT.mockImplementation(() => {
          throw new Error('i18n error');
        });

        // Act
        const result = getUserFriendlyErrorMessage(undefined, 'login');

        // Assert
        expect(result).toBe('Login failed. Please check your credentials.');
        expect(mocks.mockWarn).toHaveBeenCalledWith(
          'i18n translation failed, using fallback',
          undefined,
          expect.objectContaining({
            key: 'auth:login.failed',
            error: expect.any(Error),
          })
        );
      });
    });
  });

  describe('getUserFriendlyErrorMessage', () => {
    it('should handle email already registered error with translation', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = true;
      mocks.mockT.mockReturnValue('Translated: Email already registered');

      // Act
      const result = getUserFriendlyErrorMessage('Email already registered', 'register');

      // Assert
      expect(mocks.mockT).toHaveBeenCalledWith('auth:register.emailAlreadyRegistered');
      expect(result).toBe('Translated: Email already registered');
    });

    it('should handle invalid credentials error with fallback', () => {
      // Arrange - i18n not initialized
      mocks.mockI18nState.isInitialized = false;

      // Act
      const result = getUserFriendlyErrorMessage('Invalid credentials', 'login');

      // Assert
      expect(result).toBe(
        'Invalid email or password. Please check your credentials and try again.'
      );
    });

    it('should handle network error with translation', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = true;
      mocks.mockT.mockReturnValue('Translated: Network error');

      // Act
      const result = getUserFriendlyErrorMessage('Network connection failed', 'login');

      // Assert
      expect(mocks.mockT).toHaveBeenCalledWith('auth:network.error');
      expect(result).toBe('Translated: Network error');
    });

    it('should handle timeout error with fallback when i18n fails', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = true;
      mocks.mockT.mockImplementation(() => {
        throw new Error('i18n timeout');
      });

      // Act
      const result = getUserFriendlyErrorMessage('Request timeout', 'register');

      // Assert
      expect(result).toBe('Request timed out. Please try again.');
      expect(mocks.mockWarn).toHaveBeenCalled();
    });

    it('should return original message for unrecognized errors', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = true;

      // Act
      const result = getUserFriendlyErrorMessage('Some unknown error', 'login');

      // Assert
      expect(result).toBe('Some unknown error');
    });
  });

  describe('formatValidationErrors', () => {
    it('should handle FIELD_LABELS translation with fallback', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = false;

      const details: ValidationErrorDetail[] = [
        { field: 'email', message: 'Invalid email format' },
      ];

      // Act
      const result = formatValidationErrors(details);

      // Assert
      expect(result).toBe('Email: Invalid email format');
    });

    it('should translate field labels when i18n is available', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = true;
      mocks.mockT.mockImplementation((key: string) => {
        if (key === 'auth:fields.email') return 'Translated: Email';
        return key;
      });

      const details: ValidationErrorDetail[] = [
        { field: 'email', message: 'Invalid email format' },
      ];

      // Act
      const result = formatValidationErrors(details);

      // Assert
      expect(mocks.mockT).toHaveBeenCalledWith('auth:fields.email');
      expect(result).toBe('Translated: Email: Invalid email format');
    });

    it('should handle validation error formatting with translation', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = true;
      mocks.mockT.mockImplementation((key: string) => {
        if (key === 'auth:fields.password') return 'Translated: Password';
        return key;
      });

      const details: ValidationErrorDetail[] = [
        { field: 'password', message: 'Too short' },
        { field: 'email', message: 'Invalid' },
      ];

      // Act
      const result = formatValidationErrors(details);

      // Assert
      expect(result).toContain('Translated: Password: Too short');
    });

    it('should use fallback for empty validation details', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = false;

      // Act
      const result = formatValidationErrors([]);

      // Assert
      expect(result).toBe('Validation failed. Please check your input.');
    });

    it('should handle error details in getUserFriendlyErrorMessage', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = true;
      mocks.mockT.mockImplementation((key: string) => {
        if (key === 'auth:fields.email') return 'Email Address';
        return key;
      });

      const errorDetails: ErrorDetails = {
        details: [{ field: 'email', message: 'Required field' }],
      };

      // Act
      const result = getUserFriendlyErrorMessage('Generic error', 'register', errorDetails);

      // Assert
      expect(result).toBe('Email Address: Required field');
    });
  });

  describe('field name formatting', () => {
    it('should capitalize unknown field names as fallback', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = false;

      const details: ValidationErrorDetail[] = [{ field: 'unknownField', message: 'Some error' }];

      // Act
      const result = formatValidationErrors(details);

      // Assert
      expect(result).toBe('UnknownField: Some error');
    });

    it('should translate known field names with i18n', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = true;
      mocks.mockT.mockImplementation((key: string) => {
        const translations: Record<string, string> = {
          'auth:fields.firstName': 'Translated: First Name',
          'auth:fields.lastName': 'Translated: Last Name',
        };
        return translations[key] ?? key;
      });

      const details: ValidationErrorDetail[] = [
        { field: 'firstName', message: 'Required' },
        { field: 'lastName', message: 'Required' },
      ];

      // Act
      const result = formatValidationErrors(details);

      // Assert
      expect(mocks.mockT).toHaveBeenCalledWith('auth:fields.firstName');
      expect(mocks.mockT).toHaveBeenCalledWith('auth:fields.lastName');
      expect(result).toContain('Translated: First Name: Required');
      expect(result).toContain('Translated: Last Name: Required');
    });
  });

  describe('context-specific error handling', () => {
    it('should handle register context errors', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = false;

      // Act
      const result = getUserFriendlyErrorMessage('Password is too weak', 'register');

      // Assert
      expect(result).toBe(
        'Password does not meet requirements. Please use at least 12 characters with uppercase, lowercase, numbers, and special characters.'
      );
    });

    it('should handle login context errors', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = false;

      // Act
      const result = getUserFriendlyErrorMessage('Account locked', 'login');

      // Assert
      expect(result).toBe('Your account has been locked. Please contact support for assistance.');
    });

    it('should handle account not found error with translation', () => {
      // Arrange
      mocks.mockI18nState.isInitialized = true;
      mocks.mockT.mockReturnValue('Translated: Account not found');

      // Act
      const result = getUserFriendlyErrorMessage('Account not found', 'login');

      // Assert
      expect(mocks.mockT).toHaveBeenCalledWith('auth:login.accountNotFound');
      expect(result).toBe('Translated: Account not found');
    });
  });
});
