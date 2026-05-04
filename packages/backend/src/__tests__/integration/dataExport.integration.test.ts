// Integration Tests for Data Export API

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { generateUUIDv7 } from '../../utils/uuid';
import bcrypt from 'bcrypt';
import { CSRF_CONSTANTS } from '../../middleware/csrf.middleware';
import { getCsrfToken, extractCsrfFromCookies } from '../helpers/test-helpers';

describe('Data Export API Integration Tests', () => {
  let authToken: string[];
  let userId: string;
  const testEmail = `test-export-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  beforeAll(async () => {
    // Create test user
    userId = generateUUIDv7();
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    await prisma.user.create({
      data: {
        id: userId,
        email: testEmail,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Export',
      },
    });

    // Login to get auth token
    const { csrfCookie, csrfToken } = await getCsrfToken();

    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .set('Cookie', csrfCookie)
      .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
      .send({
        email: testEmail,
        password: testPassword,
      });

    const setCookie = loginResponse.headers['set-cookie'];
    authToken = setCookie
      ? [...(Array.isArray(setCookie) ? setCookie : [setCookie]), csrfCookie]
      : [csrfCookie];
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.refreshToken.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });
  });

  describe('POST /api/v1/user/export-data', () => {
    it('should initiate a data export', async () => {
      const { csrfToken } = extractCsrfFromCookies(authToken);

      const response = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({});

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('jobId');
      expect(response.body.data).toHaveProperty('status', 'pending');
      expect(response.body.data).toHaveProperty('estimatedCompletionTime');
    });

    it('should reject unauthenticated requests', async () => {
      const { csrfCookie, csrfToken } = await getCsrfToken();

      const response = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', csrfCookie)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({});

      expect(response.status).toBe(401);
    });

    it('should accept export options', async () => {
      const { csrfToken } = extractCsrfFromCookies(authToken);

      // First cancel any existing export
      const activeExportsResponse = await request(app)
        .get('/api/v1/user/export-data/active')
        .set('Cookie', authToken);

      if (activeExportsResponse.body.data?.exports?.length > 0) {
        for (const exportJob of activeExportsResponse.body.data.exports) {
          await request(app)
            .delete(`/api/v1/user/export-data/${exportJob.jobId}`)
            .set('Cookie', authToken)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);
        }
      }

      const response = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({
          options: {
            includeSessions: true,
            includeNotifications: false,
          },
        });

      expect(response.status).toBe(202);
      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/v1/user/export-data/status/:jobId', () => {
    it('should return export status', async () => {
      const { csrfToken } = extractCsrfFromCookies(authToken);

      // First cancel any existing export
      const activeExportsResponse = await request(app)
        .get('/api/v1/user/export-data/active')
        .set('Cookie', authToken);

      if (activeExportsResponse.body.data?.exports?.length > 0) {
        for (const exportJob of activeExportsResponse.body.data.exports) {
          await request(app)
            .delete(`/api/v1/user/export-data/${exportJob.jobId}`)
            .set('Cookie', authToken)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);
        }
      }

      // First initiate an export
      const initiateResponse = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({});

      const jobId = initiateResponse.body.data.jobId;

      // Check status
      const response = await request(app)
        .get(`/api/v1/user/export-data/status/${jobId}`)
        .set('Cookie', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('jobId', jobId);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('progress');
    });

    it('should return 404 for non-existent job', async () => {
      const validUuid = generateUUIDv7();
      const response = await request(app)
        .get(`/api/v1/user/export-data/status/${validUuid}`)
        .set('Cookie', authToken);

      expect(response.status).toBe(404);
    });

    it('should reject invalid job ID format', async () => {
      const response = await request(app)
        .get('/api/v1/user/export-data/status/invalid-uuid')
        .set('Cookie', authToken);

      expect(response.status).toBe(422);
    });
  });

  describe('GET /api/v1/user/export-data/active', () => {
    it('should return active exports', async () => {
      const response = await request(app)
        .get('/api/v1/user/export-data/active')
        .set('Cookie', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exports');
      expect(response.body.data).toHaveProperty('count');
      expect(Array.isArray(response.body.data.exports)).toBe(true);
    });
  });

  describe('DELETE /api/v1/user/export-data/:jobId', () => {
    it('should cancel an export', async () => {
      const { csrfToken } = extractCsrfFromCookies(authToken);

      // First cancel any existing export
      const activeExportsResponse = await request(app)
        .get('/api/v1/user/export-data/active')
        .set('Cookie', authToken);

      if (activeExportsResponse.body.data?.exports?.length > 0) {
        for (const exportJob of activeExportsResponse.body.data.exports) {
          await request(app)
            .delete(`/api/v1/user/export-data/${exportJob.jobId}`)
            .set('Cookie', authToken)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);
        }
      }

      // First initiate an export
      const initiateResponse = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({});

      const jobId = initiateResponse.body.data.jobId;

      // Cancel the export
      const response = await request(app)
        .delete(`/api/v1/user/export-data/${jobId}`)
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('cancelled');
    });
  });

  describe('GDPR Compliance Verification', () => {
    it('should export data in JSON format', async () => {
      const { csrfToken } = extractCsrfFromCookies(authToken);

      // First cancel any existing export
      const activeExportsResponse = await request(app)
        .get('/api/v1/user/export-data/active')
        .set('Cookie', authToken);

      if (activeExportsResponse.body.data?.exports?.length > 0) {
        for (const exportJob of activeExportsResponse.body.data.exports) {
          await request(app)
            .delete(`/api/v1/user/export-data/${exportJob.jobId}`)
            .set('Cookie', authToken)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);
        }
      }

      const initiateResponse = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({});

      expect(initiateResponse.status).toBe(202);

      // Verify the response structure matches GDPR requirements
      const data = initiateResponse.body.data;
      expect(data).toHaveProperty('jobId');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('estimatedCompletionTime');
      expect(data).toHaveProperty('message');
    });

    it('should include proper metadata in export', async () => {
      const { csrfToken } = extractCsrfFromCookies(authToken);

      // First cancel any existing export
      const activeExportsResponse = await request(app)
        .get('/api/v1/user/export-data/active')
        .set('Cookie', authToken);

      if (activeExportsResponse.body.data?.exports?.length > 0) {
        for (const exportJob of activeExportsResponse.body.data.exports) {
          await request(app)
            .delete(`/api/v1/user/export-data/${exportJob.jobId}`)
            .set('Cookie', authToken)
            .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken);
        }
      }

      // Verify export metadata structure
      const initiateResponse = await request(app)
        .post('/api/v1/user/export-data')
        .set('Cookie', authToken)
        .set(CSRF_CONSTANTS.HEADER_NAME, csrfToken)
        .send({});

      expect(initiateResponse.body.success).toBe(true);
    });
  });
});
