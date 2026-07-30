import { i18nInstance } from '../i18n/config';

import { logger } from './logger';

export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ErrorDetails {
  code?: string;
  message?: string;
  details?: ValidationErrorDetail[];
}

/**
 * Safely translates a key with fallback message when i18n is unavailable or fails.
 * @param key - The translation key to lookup
 * @param fallback - The hardcoded English fallback message
 * @returns The translated string or fallback message
 */
function safeTranslate(key: string, fallback: string): string {
  try {
    if (!i18nInstance.isInitialized) {
      return fallback;
    }
    // Cast to any to bypass strict i18next key typing for dynamic keys
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const translated = (i18nInstance.t as any)(key) as string;
    return translated || fallback;
  } catch (error) {
    logger.warn('i18n translation failed, using fallback', undefined, { key, error });
    return fallback;
  }
}

/**
 * Gets a user-friendly field name with i18n support and fallback.
 * @param field - The field identifier
 * @returns The translated field name or fallback
 */
const formatFieldName = (field: string): string => {
  const fieldKeyMap: Record<string, string> = {
    email: 'auth:fields.email',
    password: 'auth:fields.password',
    firstName: 'auth:fields.firstName',
    lastName: 'auth:fields.lastName',
    termsAccepted: 'auth:fields.termsAccepted',
    marketingOptIn: 'auth:fields.marketingOptIn',
  };

  const key = fieldKeyMap[field];
  if (key) {
    // Fallback to capitalized field name
    const fallback = field.charAt(0).toUpperCase() + field.slice(1);
    return safeTranslate(key, fallback);
  }

  // Default fallback: capitalize the field name
  return field.charAt(0).toUpperCase() + field.slice(1);
};

/**
 * Formats validation errors into a user-friendly message with i18n support.
 * @param details - Array of validation error details
 * @returns Formatted error message string
 */
export const formatValidationErrors = (details: ValidationErrorDetail[]): string => {
  if (details.length === 0) {
    return safeTranslate('auth:validation.failed', 'Validation failed. Please check your input.');
  }

  if (details.length === 1) {
    const detail = details[0];
    if (!detail) {
      return safeTranslate('auth:validation.failed', 'Validation failed. Please check your input.');
    }
    const fieldLabel = formatFieldName(detail.field);
    return `${fieldLabel}: ${detail.message}`;
  }

  const formattedErrors = details.map((detail) => {
    const fieldLabel = formatFieldName(detail.field);
    return `${fieldLabel}: ${detail.message}`;
  });

  return formattedErrors.join('\n');
};

/**
 * Converts backend error messages into user-friendly messages with i18n support.
 * @param backendMessage - The raw error message from the backend
 * @param context - The authentication context ('login' or 'register')
 * @param errorDetails - Optional structured error details
 * @returns User-friendly error message string
 */
export const getUserFriendlyErrorMessage = (
  backendMessage: string | undefined,
  context: 'login' | 'register',
  errorDetails?: ErrorDetails
): string => {
  if (errorDetails?.details && errorDetails.details.length > 0) {
    return formatValidationErrors(errorDetails.details);
  }

  if (!backendMessage) {
    return context === 'register'
      ? safeTranslate('auth:register.failed', 'Registration failed. Please try again.')
      : safeTranslate('auth:login.failed', 'Login failed. Please check your credentials.');
  }

  const lowerMessage = backendMessage.toLowerCase();

  if (context === 'register') {
    if (
      lowerMessage.includes('email already registered') ||
      lowerMessage.includes('email already exists')
    ) {
      return safeTranslate(
        'auth:register.emailAlreadyRegistered',
        'This email address is already registered. Please use a different email or sign in if you already have an account.'
      );
    }
    if (lowerMessage.includes('password')) {
      return safeTranslate(
        'auth:validation.passwordRequirements',
        'Password does not meet requirements. Please use at least 12 characters with uppercase, lowercase, numbers, and special characters.'
      );
    }
    if (lowerMessage.includes('email')) {
      return safeTranslate('auth:validation.emailInvalid', 'Please enter a valid email address.');
    }
  }

  if (context === 'login') {
    if (
      lowerMessage.includes('invalid credentials') ||
      lowerMessage.includes('invalid email or password')
    ) {
      return safeTranslate(
        'auth:login.invalidCredentials',
        'Invalid email or password. Please check your credentials and try again.'
      );
    }
    if (lowerMessage.includes('account not found') || lowerMessage.includes('user not found')) {
      return safeTranslate(
        'auth:login.accountNotFound',
        'No account found with this email. Please check your email or create a new account.'
      );
    }
    if (lowerMessage.includes('account locked') || lowerMessage.includes('account suspended')) {
      return safeTranslate(
        'auth:login.accountLocked',
        'Your account has been locked. Please contact support for assistance.'
      );
    }
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return safeTranslate(
      'auth:network.error',
      'Network connection issue. Please check your internet connection and try again.'
    );
  }
  if (lowerMessage.includes('timeout')) {
    return safeTranslate('auth:network.timeout', 'Request timed out. Please try again.');
  }
  if (lowerMessage.includes('server error')) {
    return safeTranslate(
      'auth:network.serverError',
      'Server error occurred. Please try again later.'
    );
  }

  return backendMessage;
};
