// Integration tests for registration email-domain restriction enforcement
// and the public registration policy endpoint.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import app from '../../app';
import prisma from '../../utils/prisma';
import { getCsrfToken } from '../helpers/test-helpers';

// Mock the config registration section so the domain restriction can be
// toggled per test while exercising the real HTTP + service stack.
// Default: restriction disabled (open registration).
const { mockAllowedEmailDomains } = vi.hoisted(() => ({ mockAllowedEmailDomains: [] as string[] }));
import type * as ConfigModule from '../../config';

vi.mock('../../config', async (importOriginal) => {
  const actual = await importOriginal<typeof ConfigModule>();
  const overriddenConfig = {
    ...actual.config,
    registration: {
      get allowedEmailDomains() {
        return mockAllowedEmailDomains;
      },
      get isRestricted() {
        return mockAllowedEmailDomains.length > 0;
      },
    },
  };
  return {
    ...actual,
    config: overriddenConfig,
    default: overriddenConfig,
  };
});

/** Set the allowed domains for a test (mutates the shared array in place). */
const setAllowedDomains = (domains: string[]): void => {
  mockAllowedEmailDomains.splice(0, mockAllowedEmailDomains.length, ...domains);
};

const uniqueId = () => `${Date.now()}-${Math.random().toString(36).substring(7)}`;

describe('Registration Domain Restriction', () => {
  beforeEach(() => {
    setAllowedDomains([]);
  });

  afterEach(async () => {
    // Clean up any users created during tests.
    await prisma.user.deleteMany({ where: { email: { startsWith: 'restrict-test-' } } });
  });

  const registerPayload = (email: string) => ({
    email,
    password: 'TestPassword123!',
    firstName: 'Restrict',
    lastName: 'Test',
    termsAccepted: true,
  });

  const postRegister = async (email: string): Promise<request.Response> => {
    const { csrfCookie, csrfToken } = await getCsrfToken();
    return request(app)
      .post('/api/v1/auth/register')
      .set('Cookie', csrfCookie)
      .set('X-CSRF-Token', csrfToken)
      .send(registerPayload(email));
  };

  describe('GET /api/v1/auth/registration-policy', () => {
    it('reports open registration (restricted:false) when restriction is disabled', async () => {
      const response = await request(app).get('/api/v1/auth/registration-policy').expect(200);

      expect(response.body.data).toEqual({ restricted: false, allowedDomains: [] });
    });

    it('reports restricted state with allowed domains when restriction is active', async () => {
      setAllowedDomains(['acme.com', 'acme.eu']);

      const response = await request(app).get('/api/v1/auth/registration-policy').expect(200);

      expect(response.body.data).toEqual({
        restricted: true,
        allowedDomains: ['acme.com', 'acme.eu'],
      });
    });
  });

  describe('POST /api/v1/auth/register', () => {
    it('accepts an allowed domain when restriction is active', async () => {
      setAllowedDomains(['acme.com']);
      const email = `restrict-test-${uniqueId()}@acme.com`;

      const response = await postRegister(email);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(email);
    });

    it('rejects a disallowed domain with 403 and a localized message', async () => {
      setAllowedDomains(['acme.com']);
      const email = `restrict-test-${uniqueId()}@gmail.com`;

      const response = await postRegister(email);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBeDefined();
      // Message must be localized (not the raw key).
      expect(response.body.error.message).not.toBe('validation:auth.emailDomainNotAllowed');
    });

    it('accepts any email when restriction is disabled', async () => {
      const email = `restrict-test-${uniqueId()}@example.com`;

      const response = await postRegister(email);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(email);
    });

    it('rejects a subdomain when only the parent domain is allowed (exact match)', async () => {
      setAllowedDomains(['acme.com']);
      const email = `restrict-test-${uniqueId()}@sub.acme.com`;

      const response = await postRegister(email);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('enforces server-side even when a client pre-check is bypassed', async () => {
      setAllowedDomains(['acme.com']);
      // Direct API call with a disallowed domain (as if the client skipped any
      // client-side hint) must still be rejected.
      const email = `restrict-test-${uniqueId()}@notallowed.org`;

      const response = await postRegister(email);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('accepts multiple configured allowed domains', async () => {
      setAllowedDomains(['acme.com', 'acme.eu']);
      const email = `restrict-test-${uniqueId()}@acme.eu`;

      const response = await postRegister(email);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(email);
    });
  });
});
