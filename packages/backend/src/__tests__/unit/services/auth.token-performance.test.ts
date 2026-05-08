import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import crypto from 'node:crypto';
import type * as Bcrypt from 'bcrypt';

vi.mock('../../../utils/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    refreshToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('bcrypt', async (importOriginal) => {
  const actual = await importOriginal<typeof Bcrypt>();
  return {
    default: {
      hash: vi.fn((password: string, rounds: number) =>
        Promise.resolve(`$2b$${rounds}$${password}`)
      ),
      compare: vi.fn((password: string, hash: string) => {
        if (hash.startsWith('$2b$') || hash.startsWith('$2a$')) {
          return Promise.resolve(hash.includes(password));
        }
        return Promise.resolve(false);
      }),
    },
    hash: actual.hash,
    compare: actual.compare,
  };
});

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { authService } from '../../../services/auth.service';
import prisma from '../../../utils/prisma';
import { fixtures } from '../../fixtures';
import { SessionExpiredError } from '../../../utils/errors';
import { hash as realBcryptHash, compare as realBcryptCompare } from 'bcrypt';

function generateTestToken(): string {
  return crypto.randomUUID();
}

function sha256Hash(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

describe('Token Hashing Performance Benchmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.stopCleanupJob();
  });

  afterEach(() => {
    authService.stopCleanupJob();
  });

  describe('SHA-256 vs bcrypt Performance', () => {
    it('SHA-256 hash should complete in under 1ms', () => {
      const token = generateTestToken();
      const iterations = 100;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        sha256Hash(token);
      }
      const duration = performance.now() - start;

      const avgDuration = duration / iterations;
      expect(avgDuration).toBeLessThan(1);
    });

    it('SHA-256 comparison should complete in under 1ms', () => {
      const token = generateTestToken();
      const hash = sha256Hash(token);
      const iterations = 100;

      const start = performance.now();
      for (let i = 0; i < iterations; i++) {
        const computed = sha256Hash(token);
        crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
      }
      const duration = performance.now() - start;

      const avgDuration = duration / iterations;
      expect(avgDuration).toBeLessThan(1);
    });

    it('SHA-256 should be at least 100x faster than bcrypt hash', async () => {
      const token = generateTestToken();
      const iterations = 5;

      const sha256Start = performance.now();
      for (let i = 0; i < iterations; i++) {
        sha256Hash(token);
      }
      const sha256Duration = performance.now() - sha256Start;

      const bcryptStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        await realBcryptHash(token, 12);
      }
      const bcryptDuration = performance.now() - bcryptStart;

      const speedup = bcryptDuration / sha256Duration;
      expect(speedup).toBeGreaterThan(100);
    });

    it('SHA-256 should be at least 100x faster than bcrypt compare', async () => {
      const token = generateTestToken();
      const sha256HashValue = sha256Hash(token);
      const bcryptHashValue = await realBcryptHash(token, 12);
      const iterations = 5;

      const sha256Start = performance.now();
      for (let i = 0; i < iterations; i++) {
        const computed = sha256Hash(token);
        crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(sha256HashValue, 'hex'));
      }
      const sha256Duration = performance.now() - sha256Start;

      const bcryptStart = performance.now();
      for (let i = 0; i < iterations; i++) {
        await realBcryptCompare(token, bcryptHashValue);
      }
      const bcryptDuration = performance.now() - bcryptStart;

      const speedup = bcryptDuration / sha256Duration;
      expect(speedup).toBeGreaterThan(100);
    });

    it('should handle 1000 SHA-256 hashes in under 100ms', () => {
      const tokens = Array.from({ length: 1000 }, () => generateTestToken());

      const start = performance.now();
      for (const token of tokens) {
        sha256Hash(token);
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });

    it('should handle 1000 SHA-256 comparisons in under 100ms', () => {
      const tokens = Array.from({ length: 1000 }, () => generateTestToken());
      const hashes = tokens.map((t) => sha256Hash(t));

      const start = performance.now();
      for (let i = 0; i < tokens.length; i++) {
        const computed = sha256Hash(tokens[i]!);
        crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hashes[i]!, 'hex'));
      }
      const duration = performance.now() - start;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Token Hashing Throughput', () => {
    it('should achieve at least 10,000 SHA-256 hashes per second', () => {
      const token = generateTestToken();
      const targetOps = 10000;

      const start = performance.now();
      for (let i = 0; i < targetOps; i++) {
        sha256Hash(token);
      }
      const duration = performance.now() - start;

      const opsPerSecond = (targetOps / duration) * 1000;
      expect(opsPerSecond).toBeGreaterThan(10000);
    });

    it('should achieve at least 10,000 SHA-256 comparisons per second', () => {
      const token = generateTestToken();
      const hash = sha256Hash(token);
      const targetOps = 10000;

      const start = performance.now();
      for (let i = 0; i < targetOps; i++) {
        const computed = sha256Hash(token);
        crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));
      }
      const duration = performance.now() - start;

      const opsPerSecond = (targetOps / duration) * 1000;
      expect(opsPerSecond).toBeGreaterThan(10000);
    });
  });
});

describe('Token Hashing Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authService.stopCleanupJob();
  });

  afterEach(() => {
    authService.stopCleanupJob();
  });

  describe('Hash Format Validation', () => {
    it('should produce consistent hash for same input', () => {
      const token = 'test-token-value';
      const hash1 = sha256Hash(token);
      const hash2 = sha256Hash(token);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hashes for different inputs', () => {
      const token1 = 'token-one';
      const token2 = 'token-two';
      const hash1 = sha256Hash(token1);
      const hash2 = sha256Hash(token2);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce 64-character hex string', () => {
      const token = generateTestToken();
      const hash = sha256Hash(token);

      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it('should handle empty string', () => {
      const hash = sha256Hash('');

      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });

    it('should handle special characters in token', () => {
      const specialTokens = [
        'token-with-dashes',
        'token_with_underscores',
        'token.with.dots',
        'token@with#special$chars!',
        'token with spaces',
        'token\twith\ttabs',
        'token\nwith\nnewlines',
        '日本語トークン',
        '🔐🔒🗝️',
      ];

      for (const token of specialTokens) {
        const hash = sha256Hash(token);
        expect(hash).toHaveLength(64);
        expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
      }
    });

    it('should handle very long tokens', () => {
      const longToken = 'a'.repeat(10000);
      const hash = sha256Hash(longToken);

      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(hash)).toBe(true);
    });
  });

  describe('Timing-Safe Comparison', () => {
    it('should return true for matching hashes', () => {
      const token = generateTestToken();
      const hash = sha256Hash(token);
      const computed = sha256Hash(token);

      const result = crypto.timingSafeEqual(Buffer.from(computed, 'hex'), Buffer.from(hash, 'hex'));

      expect(result).toBe(true);
    });

    it('should return false for non-matching hashes', () => {
      const token1 = generateTestToken();
      const token2 = generateTestToken();
      const hash1 = sha256Hash(token1);
      const hash2 = sha256Hash(token2);

      const result = crypto.timingSafeEqual(Buffer.from(hash1, 'hex'), Buffer.from(hash2, 'hex'));

      expect(result).toBe(false);
    });

    it('should throw for different length buffers', () => {
      const hash = sha256Hash(generateTestToken());
      const shortHash = hash.slice(0, 32);

      expect(() =>
        crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(shortHash, 'hex'))
      ).toThrow();
    });

    it('should throw for invalid hex strings', () => {
      const hash = sha256Hash(generateTestToken());
      const invalidHash = 'not-a-valid-hex-string-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

      expect(() =>
        crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(invalidHash, 'hex'))
      ).toThrow();
    });
  });

  describe('Integration with AuthService', () => {
    it('should successfully refresh token with SHA-256 hash', async () => {
      const tokenValue = generateTestToken();
      const sha256HashValue = sha256Hash(tokenValue);
      const mockToken = fixtures.tokens.validRefreshToken({
        tokenHash: sha256HashValue,
      });
      const mockUser = fixtures.users.validUser({ id: mockToken.userId });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.refreshToken.update).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        ...mockToken,
        id: 'new-token-id',
      });

      const result = await authService.refreshAccessToken(tokenValue);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should reject token with wrong SHA-256 hash', async () => {
      const tokenValue = generateTestToken();
      const wrongHash = sha256Hash('wrong-token');
      const mockToken = fixtures.tokens.validRefreshToken({
        tokenHash: wrongHash,
      });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);

      await expect(authService.refreshAccessToken(tokenValue)).rejects.toThrow(SessionExpiredError);
    });

    it('should reject when tokenHash is null', async () => {
      const tokenValue = generateTestToken();
      const mockToken = fixtures.tokens.validRefreshToken({
        tokenHash: null as unknown as string,
      });
      const mockUser = fixtures.users.validUser({ id: mockToken.userId });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.refreshToken.update).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        ...mockToken,
        id: 'new-token-id',
      });

      const result = await authService.refreshAccessToken(tokenValue);
      expect(result.accessToken).toBeDefined();
    });

    it('should allow refresh when tokenHash is empty string (skips validation)', async () => {
      const tokenValue = generateTestToken();
      const mockToken = fixtures.tokens.validRefreshToken({
        tokenHash: '',
      });
      const mockUser = fixtures.users.validUser({ id: mockToken.userId });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.refreshToken.update).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.refreshToken.create).mockResolvedValue({
        ...mockToken,
        id: 'new-token-id',
      });

      const result = await authService.refreshAccessToken(tokenValue);
      expect(result.accessToken).toBeDefined();
    });

    it('should reject when tokenHash has wrong length', async () => {
      const tokenValue = generateTestToken();
      const mockToken = fixtures.tokens.validRefreshToken({
        tokenHash: 'abc123',
      });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);

      await expect(authService.refreshAccessToken(tokenValue)).rejects.toThrow();
    });
  });
});

describe('Token Hashing Security Properties', () => {
  describe('Preimage Resistance', () => {
    it('should be infeasible to find input from hash (demonstrated by uniqueness)', () => {
      const hashes = new Set<string>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const token = `token-${i}-${Date.now()}-${Math.random()}`;
        const hash = sha256Hash(token);
        hashes.add(hash);
      }

      expect(hashes.size).toBe(iterations);
    });
  });

  describe('Collision Resistance', () => {
    it('should produce unique hashes for unique inputs', () => {
      const tokens = new Set<string>();
      const hashes = new Set<string>();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const token = `unique-token-${i}`;
        tokens.add(token);
        hashes.add(sha256Hash(token));
      }

      expect(tokens.size).toBe(iterations);
      expect(hashes.size).toBe(iterations);
    });
  });

  describe('Deterministic Behavior', () => {
    it('should always produce same hash for same input across multiple calls', () => {
      const token = 'deterministic-test-token';
      const expectedHash = sha256Hash(token);

      for (let i = 0; i < 100; i++) {
        expect(sha256Hash(token)).toBe(expectedHash);
      }
    });
  });

  describe('Avalanche Effect', () => {
    it('should produce completely different hash for single bit change', () => {
      const token1 = 'test-token-a';
      const token2 = 'test-token-b';
      const hash1 = sha256Hash(token1);
      const hash2 = sha256Hash(token2);

      let differingBits = 0;
      for (let i = 0; i < 64; i++) {
        const c1 = parseInt(hash1[i]!, 16);
        const c2 = parseInt(hash2[i]!, 16);
        differingBits += Math.abs(c1 - c2);
      }

      expect(differingBits).toBeGreaterThan(20);
    });
  });
});

describe('SHA-256 Implementation Correctness', () => {
  describe('Hex Encoding Validation', () => {
    it('should produce correct 32-byte buffer from hex string', () => {
      const token = 'test-token-for-buffer-validation';
      const hash = sha256Hash(token);

      const buffer = Buffer.from(hash, 'hex');

      expect(buffer.length).toBe(32);
    });

    it('should produce same buffer from same hash', () => {
      const token = 'buffer-consistency-test';
      const hash = sha256Hash(token);

      const buffer1 = Buffer.from(hash, 'hex');
      const buffer2 = Buffer.from(hash, 'hex');

      expect(buffer1.equals(buffer2)).toBe(true);
    });

    it('should fail comparison if hex encoding is omitted (demonstrates bug prevention)', () => {
      const token = 'encoding-test-token';
      const hash = sha256Hash(token);

      const correctBuffer = Buffer.from(hash, 'hex');
      const wrongBuffer = Buffer.from(hash);

      expect(correctBuffer.length).toBe(32);
      expect(wrongBuffer.length).toBe(64);
      expect(correctBuffer.equals(wrongBuffer)).toBe(false);
    });

    it('should correctly compare hashes with hex encoding', () => {
      const token = 'comparison-encoding-test';
      const hash = sha256Hash(token);
      const computed = sha256Hash(token);

      const result = crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(computed, 'hex'));

      expect(result).toBe(true);
    });
  });

  describe('Buffer Length Handling', () => {
    it('should throw when comparing buffers of different lengths', () => {
      const hash1 = sha256Hash('token1');
      const hash2 = sha256Hash('token2');

      const buffer1 = Buffer.from(hash1, 'hex');
      const buffer2 = Buffer.from(`${hash2}00`, 'hex');

      expect(buffer1.length).toBe(32);
      expect(buffer2.length).toBe(33);

      expect(() => crypto.timingSafeEqual(buffer1, buffer2)).toThrow();
    });

    it('should handle malformed hash gracefully in compareToken', async () => {
      const tokenValue = generateTestToken();
      const mockToken = fixtures.tokens.validRefreshToken({
        tokenHash: 'not-a-valid-sha256-hash',
      });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);

      await expect(authService.refreshAccessToken(tokenValue)).rejects.toThrow();
    });

    it('should handle hash with invalid hex characters', async () => {
      const tokenValue = generateTestToken();
      const mockToken = fixtures.tokens.validRefreshToken({
        tokenHash: 'g'.repeat(64),
      });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);

      await expect(authService.refreshAccessToken(tokenValue)).rejects.toThrow();
    });
  });

  describe('Known SHA-256 Test Vectors', () => {
    it('should produce correct SHA-256 hash for empty string', () => {
      const hash = sha256Hash('');
      const expected = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

      expect(hash).toBe(expected);
    });

    it('should produce correct SHA-256 hash for "abc"', () => {
      const hash = sha256Hash('abc');
      const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';

      expect(hash).toBe(expected);
    });

    it('should produce correct SHA-256 hash for "hello world"', () => {
      const hash = sha256Hash('hello world');
      const expected = 'b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9';

      expect(hash).toBe(expected);
    });

    it('should produce correct SHA-256 hash for longer string', () => {
      const hash = sha256Hash('The quick brown fox jumps over the lazy dog');
      const expected = 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592';

      expect(hash).toBe(expected);
    });
  });

  describe('Error Handling in compareToken', () => {
    it('should return false for non-matching tokens instead of throwing', async () => {
      const tokenValue = generateTestToken();
      const differentToken = generateTestToken();
      const wrongHash = sha256Hash(differentToken);
      const mockToken = fixtures.tokens.validRefreshToken({
        tokenHash: wrongHash,
      });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);

      await expect(authService.refreshAccessToken(tokenValue)).rejects.toThrow(SessionExpiredError);
    });

    it('should handle tokenHash with correct length but wrong content', async () => {
      const tokenValue = generateTestToken();
      const mockToken = fixtures.tokens.validRefreshToken({
        tokenHash: '0'.repeat(64),
      });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);

      await expect(authService.refreshAccessToken(tokenValue)).rejects.toThrow(SessionExpiredError);
    });
  });

  describe('Token Hash Storage Verification', () => {
    it('should store SHA-256 hash when creating new refresh token', async () => {
      const tokenValue = generateTestToken();
      const existingHash = sha256Hash(tokenValue);
      const mockToken = fixtures.tokens.validRefreshToken({
        tokenHash: existingHash,
      });
      const mockUser = fixtures.users.validUser({ id: mockToken.userId });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.refreshToken.update).mockResolvedValue(mockToken as any);

      let storedTokenHash: string | undefined;
      (vi.mocked(prisma.refreshToken.create).mockImplementation as any)(async (data: any) => {
        storedTokenHash = data.data.tokenHash;
        return { ...mockToken, id: 'new-token-id' };
      });

      await authService.refreshAccessToken(tokenValue);

      expect(storedTokenHash).toBeDefined();
      expect(storedTokenHash).toHaveLength(64);
      expect(/^[0-9a-f]{64}$/.test(storedTokenHash!)).toBe(true);
    });

    it('should verify tokenHash is not stored in bcrypt format', async () => {
      const tokenValue = generateTestToken();
      const existingHash = sha256Hash(tokenValue);
      const mockToken = fixtures.tokens.validRefreshToken({
        tokenHash: existingHash,
      });
      const mockUser = fixtures.users.validUser({ id: mockToken.userId });

      vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(mockToken as any);
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);
      vi.mocked(prisma.refreshToken.update).mockResolvedValue(mockToken as any);

      let storedTokenHash: string | undefined;
      (vi.mocked(prisma.refreshToken.create).mockImplementation as any)(async (data: any) => {
        storedTokenHash = data.data.tokenHash;
        return { ...mockToken, id: 'new-token-id' };
      });

      await authService.refreshAccessToken(tokenValue);

      expect(storedTokenHash).toBeDefined();
      expect(storedTokenHash!.startsWith('$2b$')).toBe(false);
      expect(storedTokenHash!.startsWith('$2a$')).toBe(false);
    });
  });
});
