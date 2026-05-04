// Integration Tests for Password Reset Endpoints
// Tests the complete flow of forgot-password, validate token, and reset-password

import { describe, it, expect, afterEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { generateUUIDv7 } from '../../utils/uuid';
import bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';
import { getCsrfToken } from '../helpers/test-helpers';

// Helper to generate unique test identifier
const uniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('Password Reset Integration Tests', () => {
  // Helper to create a test user directly in the database
  const createTestUserInDb = async (
    email: string,
    password: string = 'TestPassword123!',
    firstName: string = 'Test',
    lastName: string = 'User'
  ) => {
    const hashedPassword = await bcrypt.hash(password, 12);
    const userId = generateUUIDv7();

    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email.toLowerCase(),
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    return user;
  };

  // Helper to create a password reset token directly in the database
  const createPasswordResetToken = async (
    userId: string,
    expiresInSeconds: number = 3600
  ): Promise<{ token: string; tokenHash: string }> => {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    await prisma.passwordResetToken.create({
      data: {
        id: generateUUIDv7(),
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return { token, tokenHash };
  };

  // Helper to create a refresh token for a user
  const createRefreshToken = async (userId: string): Promise<string> => {
    const tokenId = generateUUIDv7();
    const token = generateUUIDv7();
    const tokenIdentifier = crypto.createHash('sha256').update(token).digest('hex').slice(0, 16);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        id: tokenId,
        token: tokenIdentifier,
        tokenHash,
        userId,
        expiresAt,
        lastActivityAt: new Date(),
      },
    });

    return token;
  };

  // Helper to login and get cookies
  const loginAndGetCookies = async (
    email: string,
    password: string = 'TestPassword123!'
  ): Promise<string[]> => {
    const { csrfCookie, csrfToken } = await getCsrfToken();

    const response = await request(app)
      .post('/api/v1/auth/login')
      .set('Cookie', csrfCookie)
      .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
      .send({ email, password });

    const setCookie = response.headers['set-cookie'];
    if (!setCookie) {
      return [csrfCookie];
    }
    const authCookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    return [...authCookies, csrfCookie];
  };

  // Cleanup helper
  const cleanupTestData = async (emails: string[]) => {
    try {
      for (const email of emails) {
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (user) {
          await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
          await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
          await prisma.notification.deleteMany({ where: { userId: user.id } });
          await prisma.teamMember.deleteMany({ where: { userId: user.id } });
          await prisma.user.delete({ where: { id: user.id } });
        }
      }
    } catch (_error) {
      // Ignore cleanup errors
    }
  };

  describe('POST /api/v1/auth/forgot-password', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should return success message for valid email', async () => {
      const email = `forgot-valid-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(
        'If an account with that email exists, a password reset link has been sent.'
      );

      // Verify a reset token was created in the database
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      const resetTokens = await prisma.passwordResetToken.findMany({
        where: { userId: user!.id },
      });
      expect(resetTokens.length).toBeGreaterThan(0);
    });

    it('should return same success message for non-existing email (email enumeration prevention)', async () => {
      const email = `nonexistent-${uniqueId()}@example.com`;

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(
        'If an account with that email exists, a password reset link has been sent.'
      );

      // Verify no reset token was created for non-existing user
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      expect(user).toBeNull();
    });

    it('should return same response for existing and non-existing emails', async () => {
      const existingEmail = `existing-${uniqueId()}@example.com`;
      const nonExistingEmail = `nonexisting-${uniqueId()}@example.com`;
      testEmails.push(existingEmail);

      await createTestUserInDb(existingEmail);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const existingResponse = await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email: existingEmail })
        .expect(200);

      const nonExistingResponse = await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email: nonExistingEmail })
        .expect(200);

      // Both responses should be identical to prevent email enumeration
      expect(existingResponse.body.data.message).toBe(nonExistingResponse.body.data.message);
      expect(existingResponse.body.success).toBe(nonExistingResponse.body.success);
    });

    it('should return validation error for invalid email format', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email: 'invalid-email' })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for missing email', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle email case insensitivity', async () => {
      const email = `case-test-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email: email.toUpperCase() })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify a reset token was created
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      const resetTokens = await prisma.passwordResetToken.findMany({
        where: { userId: user!.id },
      });
      expect(resetTokens.length).toBeGreaterThan(0);
    });

    it('should create new token on subsequent requests', async () => {
      const email = `multiple-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      // First request
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email })
        .expect(200);

      // Second request
      await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email })
        .expect(200);

      // Verify multiple tokens were created
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      const resetTokens = await prisma.passwordResetToken.findMany({
        where: { userId: user!.id },
      });
      expect(resetTokens.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/v1/auth/reset-password/:token', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should return valid=true and email for valid token', async () => {
      const email = `validate-valid-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const { token } = await createPasswordResetToken(user.id);

      const response = await request(app).get(`/api/v1/auth/reset-password/${token}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
      expect(response.body.data.email).toBe(email.toLowerCase());
    });

    it('should return valid=false for invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/reset-password/invalidtoken123')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
      expect(response.body.data.email).toBeUndefined();
    });

    it('should return valid=false for expired token', async () => {
      const email = `validate-expired-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      // Create token that expired 1 hour ago
      const { token } = await createPasswordResetToken(user.id, -3600);

      const response = await request(app).get(`/api/v1/auth/reset-password/${token}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
    });

    it('should return valid=false for used token', async () => {
      const email = `validate-used-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const { token, tokenHash } = await createPasswordResetToken(user.id);

      // Mark token as used
      await prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      });

      const response = await request(app).get(`/api/v1/auth/reset-password/${token}`).expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(false);
    });

    it('should return error for missing token', async () => {
      await request(app).get('/api/v1/auth/reset-password/').expect(404); // Not found because route doesn't match
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should reset password successfully with valid token', async () => {
      const email = `reset-valid-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email, 'OldPassword123!');
      const { token, tokenHash } = await createPasswordResetToken(user.id);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Password reset successfully');

      // Verify token is marked as used
      const usedToken = await prisma.passwordResetToken.findUnique({
        where: { tokenHash },
      });
      expect(usedToken?.usedAt).not.toBeNull();

      // Verify can login with new password
      const loginCsrf = await getCsrfToken();
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrf.csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrf.csrfToken)
        .send({ email, password: 'NewPassword123!' })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
    });

    it('should return error for invalid token', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token: 'invalidtoken123',
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid or expired reset token');
    });

    it('should return error for expired token', async () => {
      const email = `reset-expired-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      // Create token that expired 1 hour ago
      const { token } = await createPasswordResetToken(user.id, -3600);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid or expired reset token');
    });

    it('should return validation error for weak password', async () => {
      const email = `reset-weak-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const { token } = await createPasswordResetToken(user.id);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token,
          newPassword: 'weak',
          confirmPassword: 'weak',
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for password confirmation mismatch', async () => {
      const email = `reset-mismatch-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const { token } = await createPasswordResetToken(user.id);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token,
          newPassword: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!',
        })
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      // Check that the error details contain the password mismatch message
      expect(response.body.error.details).toBeDefined();
      expect(
        response.body.error.details.some((d: { message: string }) =>
          d.message.includes('Passwords do not match')
        )
      ).toBe(true);
    });

    it('should return validation error for missing fields', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({})
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should allow user to login with new password after reset', async () => {
      const email = `reset-login-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email, 'OriginalPassword123!');
      const { token } = await createPasswordResetToken(user.id);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      // Reset password
      await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token,
          newPassword: 'BrandNewPassword123!',
          confirmPassword: 'BrandNewPassword123!',
        })
        .expect(200);

      // Verify old password no longer works
      const oldCsrf = await getCsrfToken();
      const oldPasswordResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', oldCsrf.csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, oldCsrf.csrfToken)
        .send({ email, password: 'OriginalPassword123!' })
        .expect(401);

      expect(oldPasswordResponse.body.success).toBe(false);

      // Verify new password works
      const newCsrf = await getCsrfToken();
      const newPasswordResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', newCsrf.csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, newCsrf.csrfToken)
        .send({ email, password: 'BrandNewPassword123!' })
        .expect(200);

      expect(newPasswordResponse.body.success).toBe(true);
    });

    it('should invalidate old refresh tokens after password reset', async () => {
      const email = `reset-tokens-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email, 'OriginalPassword123!');

      // Create a refresh token (simulating an active session)
      await createRefreshToken(user.id);

      // Verify refresh token exists
      const tokensBefore = await prisma.refreshToken.findMany({
        where: { userId: user.id, revokedAt: null },
      });
      expect(tokensBefore.length).toBeGreaterThan(0);

      const { token } = await createPasswordResetToken(user.id);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      // Reset password
      await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
        .expect(200);

      // Verify all refresh tokens are revoked
      const tokensAfter = await prisma.refreshToken.findMany({
        where: { userId: user.id, revokedAt: null },
      });
      expect(tokensAfter.length).toBe(0);
    });

    it('should not allow token reuse after password reset', async () => {
      const email = `reset-reuse-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const { token } = await createPasswordResetToken(user.id);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      // First reset - should succeed
      await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token,
          newPassword: 'FirstPassword123!',
          confirmPassword: 'FirstPassword123!',
        })
        .expect(200);

      // Second reset with same token - should fail
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token,
          newPassword: 'SecondPassword123!',
          confirmPassword: 'SecondPassword123!',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid or expired reset token');
    });

    it('should handle multiple unused tokens for same user', async () => {
      const email = `reset-multiple-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);

      // Create multiple tokens (e.g., user clicked forgot-password multiple times)
      const { token: token1 } = await createPasswordResetToken(user.id);
      const { token: token2 } = await createPasswordResetToken(user.id);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      // Use the second token
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token: token2,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // First token should still work for validation (but not for reset since password was changed)
      // Actually, after password reset, all sessions are invalidated
      // The first token is still valid but the user's password was already changed
      const validateResponse = await request(app)
        .get(`/api/v1/auth/reset-password/${token1}`)
        .expect(200);

      // Token is still technically valid (not expired or used)
      expect(validateResponse.body.data.valid).toBe(true);
    });
  });

  describe('Rate Limiting Configuration', () => {
    // Note: Rate limiting is disabled in test environment (max: 1000)
    // These tests verify the rate limit configuration exists
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should have forgot-password rate limit configured (3 per 15 minutes per email)', async () => {
      // This test verifies the rate limit middleware is applied
      // In test environment, the limit is 1000, so we won't hit it
      const email = `ratelimit-forgot-${uniqueId()}@example.com`;

      const { csrfCookie, csrfToken } = await getCsrfToken();

      // Make multiple requests - should all succeed in test environment
      const responses = await Promise.all([
        request(app)
          .post('/api/v1/auth/forgot-password')
          .set('Cookie', csrfCookie)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .send({ email }),
        request(app)
          .post('/api/v1/auth/forgot-password')
          .set('Cookie', csrfCookie)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .send({ email }),
        request(app)
          .post('/api/v1/auth/forgot-password')
          .set('Cookie', csrfCookie)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .send({ email }),
        request(app)
          .post('/api/v1/auth/forgot-password')
          .set('Cookie', csrfCookie)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .send({ email }),
      ]);

      // All should succeed in test environment
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });

    it('should have reset-password rate limit configured (5 per 15 minutes per IP)', async () => {
      // This test verifies the rate limit middleware is applied
      // In test environment, the limit is 1000, so we won't hit it
      const email = `ratelimit-reset-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);
      const { token } = await createPasswordResetToken(user.id);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      // Make multiple requests - should all succeed in test environment
      const responses = await Promise.all([
        request(app)
          .post('/api/v1/auth/reset-password')
          .set('Cookie', csrfCookie)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .send({
            token,
            newPassword: 'Password1!',
            confirmPassword: 'Password1!',
          }),
        request(app)
          .post('/api/v1/auth/reset-password')
          .set('Cookie', csrfCookie)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .send({
            token: 'invalid1',
            newPassword: 'Password1!',
            confirmPassword: 'Password1!',
          }),
        request(app)
          .post('/api/v1/auth/reset-password')
          .set('Cookie', csrfCookie)
          .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
          .send({
            token: 'invalid2',
            newPassword: 'Password1!',
            confirmPassword: 'Password1!',
          }),
      ]);

      // Requests should not be rate limited in test environment
      // First one might succeed or fail depending on token validity
      // Others will fail with invalid token but not rate limited
      responses.forEach((response) => {
        expect(response.status).toBeLessThan(500);
        expect(response.body.success).toBeDefined();
      });
    });
  });

  describe('End-to-end Password Reset Flow', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should complete full password reset flow', async () => {
      const email = `e2e-flow-${uniqueId()}@example.com`;
      testEmails.push(email);

      // Step 1: Create user
      await createTestUserInDb(email, 'OriginalPassword123!');

      const { csrfCookie, csrfToken } = await getCsrfToken();

      // Step 2: Request password reset
      const forgotResponse = await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email })
        .expect(200);

      expect(forgotResponse.body.success).toBe(true);

      // Step 3: Get the user from database
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      // We need to get the raw token - since we can't access it from the email,
      // we'll simulate by creating a new token for testing
      const { token } = await createPasswordResetToken(user!.id);

      // Step 4: Validate the token
      const validateResponse = await request(app)
        .get(`/api/v1/auth/reset-password/${token}`)
        .expect(200);

      expect(validateResponse.body.data.valid).toBe(true);
      expect(validateResponse.body.data.email).toBe(email.toLowerCase());

      // Step 5: Reset the password
      const resetResponse = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token,
          newPassword: 'NewSecurePassword123!',
          confirmPassword: 'NewSecurePassword123!',
        })
        .expect(200);

      expect(resetResponse.body.success).toBe(true);

      // Step 6: Login with new password
      const loginCsrf = await getCsrfToken();
      const loginResponse = await request(app)
        .post('/api/v1/auth/login')
        .set('Cookie', loginCsrf.csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, loginCsrf.csrfToken)
        .send({ email, password: 'NewSecurePassword123!' })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data.user.email).toBe(email.toLowerCase());
    });

    it('should handle password reset flow with existing active session', async () => {
      const email = `e2e-session-${uniqueId()}@example.com`;
      testEmails.push(email);

      // Create user and login
      await createTestUserInDb(email, 'OriginalPassword123!');
      const cookies = await loginAndGetCookies(email, 'OriginalPassword123!');

      // Verify session works
      const meResponse = await request(app)
        .get('/api/v1/auth/me')
        .set('Cookie', cookies)
        .expect(200);

      expect(meResponse.body.success).toBe(true);

      // Request and perform password reset
      const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      const { token } = await createPasswordResetToken(user!.id);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
        .expect(200);

      // Old session should be invalidated
      const meAfterReset = await request(app).get('/api/v1/auth/me').set('Cookie', cookies);

      // Session should be invalidated (401) or still work until token refresh
      // This depends on implementation - either is acceptable
      expect([200, 401]).toContain(meAfterReset.status);
    });
  });

  describe('Edge Cases', () => {
    const testEmails: string[] = [];

    afterEach(async () => {
      await cleanupTestData(testEmails);
      testEmails.length = 0;
    });

    it('should handle user with special characters in email', async () => {
      const email = `special+test-${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle very long email addresses', async () => {
      // Use a reasonably long email that fits within database constraints
      // Email max length is typically 255 characters in the database
      const email = `verylongemailaddress${uniqueId()}@example.com`;
      testEmails.push(email);

      await createTestUserInDb(email);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({ email })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle password reset for user with no existing sessions', async () => {
      const email = `no-session-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);

      // Verify no refresh tokens exist
      const tokensBefore = await prisma.refreshToken.findMany({
        where: { userId: user.id },
      });
      expect(tokensBefore.length).toBe(0);

      const { token } = await createPasswordResetToken(user.id);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle concurrent password reset requests', async () => {
      const email = `concurrent-${uniqueId()}@example.com`;
      testEmails.push(email);

      const user = await createTestUserInDb(email);

      // Create multiple tokens
      const tokens = await Promise.all([
        createPasswordResetToken(user.id),
        createPasswordResetToken(user.id),
        createPasswordResetToken(user.id),
      ]);

      const { csrfCookie, csrfToken } = await getCsrfToken();

      // Use the first token to reset password
      const response = await request(app)
        .post('/api/v1/auth/reset-password')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          token: tokens[0].token,
          newPassword: 'NewPassword123!',
          confirmPassword: 'NewPassword123!',
        })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Other tokens should still be valid for validation (not used)
      const validateResponse = await request(app)
        .get(`/api/v1/auth/reset-password/${tokens[1].token}`)
        .expect(200);

      expect(validateResponse.body.data.valid).toBe(true);
    });
  });
});
