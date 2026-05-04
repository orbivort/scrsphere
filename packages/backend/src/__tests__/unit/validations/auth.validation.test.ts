// Auth Validation Tests - Comprehensive Test Suite
import { describe, it, expect } from 'vitest';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  deleteAccountSchema,
  scheduleDeletionSchema,
  forceDeleteSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../../../validations/auth.validation';

describe('Auth Validation', () => {
  describe('registerSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid registration data with all fields', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
          marketingOptIn: true,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe('test@example.com');
          expect(result.data.firstName).toBe('John');
          expect(result.data.lastName).toBe('Doe');
          expect(result.data.termsAccepted).toBe(true);
          expect(result.data.marketingOptIn).toBe(true);
        }
      });

      it('should accept valid registration with marketingOptIn defaulting to false', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.marketingOptIn).toBe(false);
        }
      });

      it('should accept password with various special characters', () => {
        const specialChars = ['!', '@', '#', '$', '%', '^', '&', '*', '(', ')', '_', '+', '-', '='];
        specialChars.forEach((char) => {
          const result = registerSchema.safeParse({
            email: 'test@example.com',
            password: `StrongPass123${char}`,
            firstName: 'John',
            lastName: 'Doe',
            termsAccepted: true,
          });
          expect(result.success).toBe(true);
        });
      });

      it('should convert email to lowercase', () => {
        const result = registerSchema.safeParse({
          email: 'TEST@EXAMPLE.COM',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe('test@example.com');
        }
      });

      it('should sanitize firstName and lastName', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: '<script>alert(1)</script>John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(true);
        if (result.success) {
          // sanitize-html strips the tags completely
          expect(result.data.firstName).toBe('John');
        }
      });
    });

    describe('email validation', () => {
      it('should reject invalid email format', () => {
        const result = registerSchema.safeParse({
          email: 'invalid-email',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid email address');
        }
      });

      it('should reject empty email', () => {
        const result = registerSchema.safeParse({
          email: '',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
      });

      it('should reject email without @ symbol', () => {
        const result = registerSchema.safeParse({
          email: 'testexample.com',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
      });

      it('should reject email without domain', () => {
        const result = registerSchema.safeParse({
          email: 'test@',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('password validation', () => {
      it('should reject password shorter than 12 characters', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'Short1!',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('at least 12 characters');
        }
      });

      it('should reject password longer than 100 characters', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: `A1!${'a'.repeat(98)}`,
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('less than 100 characters');
        }
      });

      it('should reject password without uppercase letter', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'lowercase123!',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('uppercase letter');
        }
      });

      it('should reject password without lowercase letter', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'UPPERCASE123!',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('lowercase letter');
        }
      });

      it('should reject password without number', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'NoNumbersHere!',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('number');
        }
      });

      it('should reject password without special character', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'NoSpecialChar123',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('special character');
        }
      });

      it('should reject empty password', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: '',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
      });

      it('should provide error message for password that is too short', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'short',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          const message = result.error.issues[0]?.message;
          expect(message).toContain('at least 12 characters');
        }
      });
    });

    describe('firstName validation', () => {
      it('should reject empty first name', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: '',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('First name is required');
        }
      });

      it('should reject first name over 50 characters', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: 'a'.repeat(51),
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('less than 50 characters');
        }
      });

      it('should accept first name at exactly 50 characters', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: 'a'.repeat(50),
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing firstName', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          lastName: 'Doe',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('lastName validation', () => {
      it('should reject empty last name', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: '',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('Last name is required');
        }
      });

      it('should reject last name over 50 characters', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'a'.repeat(51),
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('less than 50 characters');
        }
      });

      it('should accept last name at exactly 50 characters', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'a'.repeat(50),
          termsAccepted: true,
        });
        expect(result.success).toBe(true);
      });

      it('should reject missing lastName', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: 'John',
          termsAccepted: true,
        });
        expect(result.success).toBe(false);
      });
    });

    describe('termsAccepted validation', () => {
      it('should reject termsAccepted as false', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: false,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('accept the terms');
        }
      });

      it('should reject missing termsAccepted', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'Doe',
        });
        expect(result.success).toBe(false);
      });

      it('should reject termsAccepted as string', () => {
        const result = registerSchema.safeParse({
          email: 'test@example.com',
          password: 'StrongPassword123!',
          firstName: 'John',
          lastName: 'Doe',
          termsAccepted: 'true',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('loginSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid login data', () => {
        const result = loginSchema.safeParse({
          email: 'test@example.com',
          password: 'anypassword',
        });
        expect(result.success).toBe(true);
      });

      it('should convert email to lowercase', () => {
        const result = loginSchema.safeParse({
          email: 'TEST@EXAMPLE.COM',
          password: 'anypassword',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.email).toBe('test@example.com');
        }
      });
    });

    describe('email validation', () => {
      it('should reject invalid email', () => {
        const result = loginSchema.safeParse({
          email: 'invalid-email',
          password: 'anypassword',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid email address');
        }
      });

      it('should reject empty email', () => {
        const result = loginSchema.safeParse({
          email: '',
          password: 'anypassword',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing email', () => {
        const result = loginSchema.safeParse({
          password: 'anypassword',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('password validation', () => {
      it('should reject empty password', () => {
        const result = loginSchema.safeParse({
          email: 'test@example.com',
          password: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Password is required');
        }
      });

      it('should reject missing password', () => {
        const result = loginSchema.safeParse({
          email: 'test@example.com',
        });
        expect(result.success).toBe(false);
      });

      it('should accept any non-empty password (no complexity requirements for login)', () => {
        const result = loginSchema.safeParse({
          email: 'test@example.com',
          password: 'a',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('refreshTokenSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid refresh token', () => {
        const result = refreshTokenSchema.safeParse({
          refreshToken: 'valid-refresh-token-string',
        });
        expect(result.success).toBe(true);
      });

      it('should accept UUID as refresh token', () => {
        const result = refreshTokenSchema.safeParse({
          refreshToken: '550e8400-e29b-41d4-a716-446655440000',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject empty refresh token', () => {
        const result = refreshTokenSchema.safeParse({
          refreshToken: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Refresh token is required');
        }
      });

      it('should reject missing refresh token', () => {
        const result = refreshTokenSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should accept whitespace refresh token (zod min(1) only checks length)', () => {
        // Zod's min(1) only checks that the string has at least 1 character
        // Whitespace-only strings pass this validation
        const result = refreshTokenSchema.safeParse({
          refreshToken: '   ',
        });
        // This will pass because '   ' has length 3
        expect(result.success).toBe(true);
      });
    });
  });

  describe('deleteAccountSchema', () => {
    describe('valid inputs', () => {
      it('should accept exact confirmation phrase', () => {
        const result = deleteAccountSchema.safeParse({
          confirmation: 'DELETE MY ACCOUNT',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject wrong case confirmation phrase', () => {
        const result = deleteAccountSchema.safeParse({
          confirmation: 'delete my account',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('DELETE MY ACCOUNT');
        }
      });

      it('should reject partial confirmation phrase', () => {
        const result = deleteAccountSchema.safeParse({
          confirmation: 'DELETE MY',
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty confirmation', () => {
        const result = deleteAccountSchema.safeParse({
          confirmation: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject confirmation with extra whitespace', () => {
        const result = deleteAccountSchema.safeParse({
          confirmation: ' DELETE MY ACCOUNT ',
        });
        expect(result.success).toBe(false);
      });

      it('should reject confirmation with different words', () => {
        const result = deleteAccountSchema.safeParse({
          confirmation: 'DELETE MY PROFILE',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing confirmation', () => {
        const result = deleteAccountSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  describe('scheduleDeletionSchema', () => {
    describe('valid inputs', () => {
      it('should accept exact confirmation phrase', () => {
        const result = scheduleDeletionSchema.safeParse({
          confirmation: 'SCHEDULE DELETION',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject wrong case confirmation phrase', () => {
        const result = scheduleDeletionSchema.safeParse({
          confirmation: 'schedule deletion',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('SCHEDULE DELETION');
        }
      });

      it('should reject partial confirmation phrase', () => {
        const result = scheduleDeletionSchema.safeParse({
          confirmation: 'SCHEDULE',
        });
        expect(result.success).toBe(false);
      });

      it('should reject empty confirmation', () => {
        const result = scheduleDeletionSchema.safeParse({
          confirmation: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject confirmation with extra whitespace', () => {
        const result = scheduleDeletionSchema.safeParse({
          confirmation: ' SCHEDULE DELETION ',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing confirmation', () => {
        const result = scheduleDeletionSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  describe('forceDeleteSchema', () => {
    describe('valid inputs', () => {
      it('should accept exact confirmation phrase', () => {
        const result = forceDeleteSchema.safeParse({
          confirmation: 'DELETE MY ACCOUNT',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject wrong case confirmation phrase', () => {
        const result = forceDeleteSchema.safeParse({
          confirmation: 'delete my account',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('DELETE MY ACCOUNT');
        }
      });

      it('should reject empty confirmation', () => {
        const result = forceDeleteSchema.safeParse({
          confirmation: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject confirmation with extra whitespace', () => {
        const result = forceDeleteSchema.safeParse({
          confirmation: ' DELETE MY ACCOUNT ',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing confirmation', () => {
        const result = forceDeleteSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  describe('updateProfileSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid profile update data', () => {
        const result = updateProfileSchema.safeParse({
          firstName: 'Jane',
          lastName: 'Smith',
        });
        expect(result.success).toBe(true);
      });

      it('should require both fields', () => {
        // The schema uses sanitizedString which requires min(1)
        // Both firstName and lastName are required fields
        const result = updateProfileSchema.safeParse({
          firstName: 'Jane',
        });
        // This should fail because lastName is missing
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.path).toContain('lastName');
        }
      });

      it('should sanitize HTML from names', () => {
        const result = updateProfileSchema.safeParse({
          firstName: '<script>alert(1)</script>Jane',
          lastName: '<b>Smith</b>',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          // sanitize-html strips the tags completely
          expect(result.data.firstName).toBe('Jane');
          expect(result.data.lastName).toBe('Smith');
        }
      });

      it('should accept names at maximum length (100 characters)', () => {
        const result = updateProfileSchema.safeParse({
          firstName: 'a'.repeat(100),
          lastName: 'b'.repeat(100),
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject empty firstName', () => {
        const result = updateProfileSchema.safeParse({
          firstName: '',
          lastName: 'Smith',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('First name is required');
        }
      });

      it('should reject empty lastName', () => {
        const result = updateProfileSchema.safeParse({
          firstName: 'Jane',
          lastName: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('Last name is required');
        }
      });

      it('should reject firstName over 100 characters', () => {
        const result = updateProfileSchema.safeParse({
          firstName: 'a'.repeat(101),
          lastName: 'Smith',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('less than 100 characters');
        }
      });

      it('should reject lastName over 100 characters', () => {
        const result = updateProfileSchema.safeParse({
          firstName: 'Jane',
          lastName: 'b'.repeat(101),
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('less than 100 characters');
        }
      });

      it('should reject missing both fields', () => {
        const result = updateProfileSchema.safeParse({});
        expect(result.success).toBe(false);
      });
    });
  });

  describe('changePasswordSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid password change data', () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword123!',
        });
        expect(result.success).toBe(true);
      });

      it('should accept new password at minimum length (12 characters)', () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: 'OldPassword123!',
          newPassword: 'A1!aaaaaaaaa',
        });
        expect(result.success).toBe(true);
      });

      it('should accept new password at maximum length (128 characters)', () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: 'OldPassword123!',
          newPassword: `A1!${'a'.repeat(125)}`,
        });
        expect(result.success).toBe(true);
      });
    });

    describe('currentPassword validation', () => {
      it('should reject empty currentPassword', () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: '',
          newPassword: 'NewPassword123!',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Current password is required');
        }
      });

      it('should reject missing currentPassword', () => {
        const result = changePasswordSchema.safeParse({
          newPassword: 'NewPassword123!',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('newPassword validation', () => {
      it('should reject newPassword shorter than 12 characters', () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: 'OldPassword123!',
          newPassword: 'Short1!',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('at least 12 characters');
        }
      });

      it('should reject newPassword longer than 128 characters', () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: 'OldPassword123!',
          newPassword: `A1!${'a'.repeat(126)}`,
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('less than 128 characters');
        }
      });

      it('should reject newPassword without uppercase letter', () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: 'OldPassword123!',
          newPassword: 'lowercase123!',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('uppercase letter');
        }
      });

      it('should reject newPassword without lowercase letter', () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: 'OldPassword123!',
          newPassword: 'UPPERCASE123!',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('lowercase letter');
        }
      });

      it('should reject newPassword without number', () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: 'OldPassword123!',
          newPassword: 'NoNumbersHere!',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('number');
        }
      });

      it('should reject newPassword without special character', () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: 'OldPassword123!',
          newPassword: 'NoSpecialChar123',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toContain('special character');
        }
      });

      it('should reject empty newPassword', () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: 'OldPassword123!',
          newPassword: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing newPassword', () => {
        const result = changePasswordSchema.safeParse({
          currentPassword: 'OldPassword123!',
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
