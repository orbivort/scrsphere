export interface ValidationErrorDetail {
  field: string;
  message: string;
}

export interface ErrorDetails {
  code?: string;
  message?: string;
  details?: ValidationErrorDetail[];
}

const FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  password: 'Password',
  firstName: 'First name',
  lastName: 'Last name',
  termsAccepted: 'Terms of Service',
  marketingOptIn: 'Marketing preferences',
};

const formatFieldName = (field: string): string => {
  return FIELD_LABELS[field] || field.charAt(0).toUpperCase() + field.slice(1);
};

export const formatValidationErrors = (details: ValidationErrorDetail[]): string => {
  if (!details || details.length === 0) {
    return 'Validation failed. Please check your input.';
  }

  if (details.length === 1) {
    const detail = details[0]!;
    const fieldLabel = formatFieldName(detail.field);
    return `${fieldLabel}: ${detail.message}`;
  }

  const formattedErrors = details.map((detail) => {
    const fieldLabel = formatFieldName(detail.field);
    return `${fieldLabel}: ${detail.message}`;
  });

  return formattedErrors.join('\n');
};

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
      ? 'Registration failed. Please try again.'
      : 'Login failed. Please check your credentials.';
  }

  const lowerMessage = backendMessage.toLowerCase();

  if (context === 'register') {
    if (
      lowerMessage.includes('email already registered') ||
      lowerMessage.includes('email already exists')
    ) {
      return 'This email address is already registered. Please use a different email or sign in if you already have an account.';
    }
    if (lowerMessage.includes('password')) {
      return 'Password does not meet requirements. Please use at least 12 characters with uppercase, lowercase, numbers, and special characters.';
    }
    if (lowerMessage.includes('email')) {
      return 'Please enter a valid email address.';
    }
  }

  if (context === 'login') {
    if (
      lowerMessage.includes('invalid credentials') ||
      lowerMessage.includes('invalid email or password')
    ) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (lowerMessage.includes('account not found') || lowerMessage.includes('user not found')) {
      return 'No account found with this email. Please check your email or create a new account.';
    }
    if (lowerMessage.includes('account locked') || lowerMessage.includes('account suspended')) {
      return 'Your account has been locked. Please contact support for assistance.';
    }
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  if (lowerMessage.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }
  if (lowerMessage.includes('server error')) {
    return 'Server error occurred. Please try again later.';
  }

  return backendMessage;
};
