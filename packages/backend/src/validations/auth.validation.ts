// Auth Validation Schemas
import { z } from 'zod';
import { sanitizeString } from '../utils/sanitization';
import { VALIDATION, PASSWORD_REGEX, SUPPORTED_LOCALES } from '@scrumooth/shared';

const passwordMinLength = VALIDATION.PASSWORD.MIN_LENGTH;

const passwordRegex = {
  uppercase: PASSWORD_REGEX.UPPERCASE,
  lowercase: PASSWORD_REGEX.LOWERCASE,
  number: PASSWORD_REGEX.NUMBER,
  specialChar: PASSWORD_REGEX.SPECIAL_CHAR,
};

/**
 * Returns the translation key for the first failing password requirement,
 * or null if the password meets all requirements.
 */
const getPasswordValidationError = (password: string): string | null => {
  if (password.length < passwordMinLength) {
    return 'validation:auth.passwordTooShort';
  }
  if (!passwordRegex.uppercase.test(password)) {
    return 'validation:auth.passwordNeedsUppercase';
  }
  if (!passwordRegex.lowercase.test(password)) {
    return 'validation:auth.passwordNeedsLowercase';
  }
  if (!passwordRegex.number.test(password)) {
    return 'validation:auth.passwordNeedsNumber';
  }
  if (!passwordRegex.specialChar.test(password)) {
    return 'validation:auth.passwordNeedsSpecialChar';
  }
  return null;
};

const sanitizedString = (maxLength: number = 100) =>
  z
    .string()
    .min(1, 'validation:fieldRequired')
    .max(maxLength, 'validation:fieldTooLong')
    .transform((val) => sanitizeString(val));

export const registerSchema = z.object({
  email: z.string().email('validation:auth.invalidEmail').toLowerCase(),
  password: z
    .string()
    .min(passwordMinLength, 'validation:auth.passwordTooShort')
    .max(100, 'validation:fieldTooLong')
    .refine((val) => getPasswordValidationError(val) === null, {
      error: (ctx) =>
        getPasswordValidationError(ctx.input as string) ?? 'validation:auth.invalidPassword',
    }),
  firstName: sanitizedString(50),
  lastName: sanitizedString(50),
  termsAccepted: z.literal(true, {
    error: 'validation:auth.termsRequired',
  }),
  marketingOptIn: z.boolean().default(false),
  locale: z.enum(SUPPORTED_LOCALES as unknown as ['en', 'de', 'fr', 'it', 'es']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('validation:auth.invalidEmail').toLowerCase(),
  password: z.string().min(1, 'validation:auth.passwordRequired'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'validation:auth.refreshTokenRequired'),
});

export const deleteAccountSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT', {
    error: 'validation:auth.deleteConfirmation',
  }),
});

export const scheduleDeletionSchema = z.object({
  confirmation: z.literal('SCHEDULE DELETION', {
    error: 'validation:auth.scheduleDeletionConfirmation',
  }),
});

export const forceDeleteSchema = z.object({
  confirmation: z.literal('DELETE MY ACCOUNT', {
    error: 'validation:auth.deleteConfirmation',
  }),
});

export const updateProfileSchema = z.object({
  firstName: sanitizedString(100),
  lastName: sanitizedString(100),
  locale: z.enum(SUPPORTED_LOCALES as unknown as ['en', 'de', 'fr', 'it', 'es']).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'validation:auth.currentPasswordRequired'),
  newPassword: z
    .string()
    .min(passwordMinLength, 'validation:auth.passwordTooShort')
    .max(128, 'validation:fieldTooLong')
    .refine((val) => getPasswordValidationError(val) === null, {
      error: (ctx) =>
        getPasswordValidationError(ctx.input as string) ?? 'validation:auth.invalidPassword',
    }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('validation:auth.invalidEmail').toLowerCase(),
});

export const validateResetTokenSchema = z.object({
  token: z.string().min(1, 'validation:auth.resetTokenRequired'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'validation:auth.resetTokenRequired'),
    newPassword: z
      .string()
      .min(passwordMinLength, 'validation:auth.passwordTooShort')
      .max(128, 'validation:fieldTooLong')
      .refine((val) => getPasswordValidationError(val) === null, {
        error: (ctx) =>
          getPasswordValidationError(ctx.input as string) ?? 'validation:auth.invalidPassword',
      }),
    confirmPassword: z.string().min(1, 'validation:auth.confirmPasswordRequired'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'validation:auth.passwordsDoNotMatch',
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
