import { vi } from 'vitest';

interface SignOptions {
  expiresIn?: string | number;
  algorithm?: string;
  issuer?: string;
  subject?: string;
  audience?: string | string[];
  notBefore?: string | number;
  issuedAt?: string | number;
}

interface VerifyOptions {
  algorithms?: string[];
  issuer?: string | string[];
  subject?: string;
  audience?: string | string[];
  ignoreExpiration?: boolean;
  ignoreNotBefore?: boolean;
}

export const mockJwt = {
  sign: vi.fn((payload: object, secret: string, _options?: SignOptions) => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 900000 })
    ).toString('base64url');
    const signature = Buffer.from(`${header}.${body}.${secret}`).toString('base64url');
    return `${header}.${body}.${signature}`;
  }),

  verify: vi.fn((token: string, _secret: string, _options?: VerifyOptions) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) {
        throw new Error('invalid token');
      }
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
      if (payload.exp && payload.exp < Date.now()) {
        throw new Error('jwt expired');
      }
      return payload;
    } catch {
      throw new Error('invalid token');
    }
  }),

  decode: vi.fn((token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3 || !parts[1]) {
        return null;
      }
      return JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    } catch {
      return null;
    }
  }),
};

export function resetJwtMocks() {
  mockJwt.sign.mockReset();
  mockJwt.verify.mockReset();
  mockJwt.decode.mockReset();

  mockJwt.sign.mockImplementation((payload: object, secret: string, _options?: SignOptions) => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(
      JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 900000 })
    ).toString('base64url');
    const signature = Buffer.from(`${header}.${body}.${secret}`).toString('base64url');
    return `${header}.${body}.${signature}`;
  });

  mockJwt.verify.mockImplementation((token: string, _secret: string, _options?: VerifyOptions) => {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) {
      throw new Error('invalid token');
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    if (payload.exp && payload.exp < Date.now()) {
      throw new Error('jwt expired');
    }
    return payload;
  });
}

export function createTestJWT(userId: string, email: string, expiresIn: number = 900000): string {
  const payload = {
    sub: userId,
    email,
    iat: Date.now(),
    exp: Date.now() + expiresIn,
  };
  return mockJwt.sign(payload, 'test-jwt-secret-key-for-testing-purposes-only');
}
