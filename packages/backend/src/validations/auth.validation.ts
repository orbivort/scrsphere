// Auth Validation Schemas
import { z } from 'zod';
import { sanitizeString } from '../utils/sanitization';
import { VALIDATION, PASSWORD_REGEX } from '@scrsphere/shared';

const passwordRequirements = {
  minLength: VALIDATION.PASSWORD.MIN_LENGTH,
  requireUppercase: VALIDATION.PASSWORD.REQUIRE_UPPERCASE,
  requireLowercase: VALIDATION.PASSWORD.REQUIRE_LOWERCASE,
  requireNumber: VALIDATION.PASSWORD.REQUIRE_NUMBER,
  requireSpecialChar: VALIDATION.PASSWORD.REQUIRE_SPECIAL_CHAR,
};

const passwordRegex = {
  uppercase: PASSWORD_REGEX.UPPERCASE,
  lowercase: PASSWORD_REGEX.LOWERCASE,
  number: PASSWORD_REGEX.NUMBER,
  specialChar: PASSWORD_REGEX.SPECIAL_CHAR,
};

const getPasswordValidationError = (password: string): string | null => {
  const errors: string[] = [];

  if (password.length < passwordRequirements.minLength) {
    errors.push(`at least ${passwordRequirements.minLength} characters`);
  }
  if (!passwordRegex.uppercase.test(password)) {
    errors.push('an uppercase letter');
  }
  if (!passwordRegex.lowercase.test(password)) {
    errors.push('a lowercase letter');
  }
  if (!passwordRegex.number.test(password)) {
    errors.push('a number');
  }
  if (!passwordRegex.specialChar.test(password)) {
    errors.push('a special character (!@#$%^&* etc.)');
  }

  return errors.length > 0 ? `Password must contain ${errors.join(', ')}` : null;
};

const sanitizedString = (fieldName: string, maxLength: number = 100) =>
  z
    .string()
    .min(1, `${fieldName} is required`)
    .max(maxLength, `${fieldName} must be less than ${maxLength} characters`)
    .transform((val) => sanitizeString(val));

export const registerSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z
    .string()
    .min(
      passwordRequirements.minLength,
      `Password must be at least ${passwordRequirements.minLength} characters`
    )
    .max(100, 'Password must be less than 100 characters')
    .refine((val) => getPasswordValidationError(val) === null, {
      error: (ctx) => getPasswordValidationError(ctx.input as string) ?? 'Invalid password',
    }),
  firstName: sanitizedString('First name', 50),
  lastName: sanitizedString('Last name', 50),
  termsAccepted: z.literal(true, {
    error: 'You must accept the terms of service',
  }),
  marketingOptIn: z.boolean().default(false),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT', {
    error: 'Confirmation must be exactly "DELETE MY ACCOUNT"',
  }),
});

export const scheduleDeletionSchema = z.object({
  confirmation: z.literal('SCHEDULE DELETION', {
    error: 'Confirmation must be exactly "SCHEDULE DELETION"',
  }),
});

export const forceDeleteSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT', {
    error: 'Confirmation must be exactly "DELETE MY ACCOUNT"',
  }),
});

export const updateProfileSchema = z.object({
  firstName: sanitizedString('First name', 100),
  lastName: sanitizedString('Last name', 100),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(
      passwordRequirements.minLength,
      `Password must be at least ${passwordRequirements.minLength} characters`
    )
    .max(128, 'Password must be less than 128 characters')
    .refine((val) => getPasswordValidationError(val) === null, {
      error: (ctx) => getPasswordValidationError(ctx.input as string) ?? 'Invalid password',
    }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase(),
});

export const validateResetTokenSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z
      .string()
      .min(
        passwordRequirements.minLength,
        `Password must be at least ${passwordRequirements.minLength} characters`
      )
      .max(128, 'Password must be less than 128 characters')
      .refine((val) => getPasswordValidationError(val) === null, {
        error: (ctx) => getPasswordValidationError(ctx.input as string) ?? 'Invalid password',
      }),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
export type ScheduleDeletionInput = z.infer<typeof scheduleDeletionSchema>;
export type ForceDeleteInput = z.infer<typeof forceDeleteSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ValidateResetTokenInput = z.infer<typeof validateResetTokenSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
