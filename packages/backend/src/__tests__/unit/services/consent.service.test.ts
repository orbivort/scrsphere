import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock modules with factory functions (hoisted, so no external variables allowed)
vi.mock('../../../utils/prisma', () => ({
  default: {
    consentRecord: {
      create: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('../../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// Now import the service and other dependencies
import { consentService } from '../../../services/consent.service';
import prisma from '../../../utils/prisma';

describe('ConsentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordConsent', () => {
    it('should record consent successfully', async () => {
      const mockRecord = {
        id: 'consent-1',
        userId: 'user-1',
        consentType: 'cookie_consent',
        action: 'accepted',
        version: '1.0.0',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
      };

      vi.mocked(prisma.consentRecord.create).mockResolvedValue(mockRecord as any);

      const result = await consentService.recordConsent({
        userId: 'user-1',
        consentType: 'cookie_consent',
        action: 'accepted',
        version: '1.0.0',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
      });

      expect(result.consentType).toBe('cookie_consent');
      expect(result.action).toBe('accepted');
      expect(prisma.consentRecord.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            consentType: 'cookie_consent',
            action: 'accepted',
            version: '1.0.0',
          }),
        })
      );
    });

    it('should handle anonymous consent (no userId)', async () => {
      const mockRecord = {
        id: 'consent-1',
        userId: null,
        consentType: 'cookie_consent',
        action: 'accepted',
        version: '1.0.0',
        createdAt: new Date(),
      };

      vi.mocked(prisma.consentRecord.create).mockResolvedValue(mockRecord as any);

      const result = await consentService.recordConsent({
        consentType: 'cookie_consent',
        action: 'accepted',
        version: '1.0.0',
      });

      expect(result.userId).toBeNull();
    });
  });

  describe('getConsentHistory', () => {
    it('should return consent history for user', async () => {
      const mockRecords = [
        {
          id: 'consent-1',
          userId: 'user-1',
          consentType: 'cookie_consent',
          action: 'accepted',
          version: '1.0.0',
          createdAt: new Date('2024-01-01'),
        },
        {
          id: 'consent-2',
          userId: 'user-1',
          consentType: 'cookie_consent',
          action: 'updated',
          version: '1.0.0',
          createdAt: new Date('2024-01-15'),
        },
      ];

      vi.mocked(prisma.consentRecord.findMany).mockResolvedValue(mockRecords as any);

      const result = await consentService.getConsentHistory('user-1', 10, 0);

      expect(result).toHaveLength(2);
      expect(prisma.consentRecord.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'desc' },
          take: 10,
          skip: 0,
        })
      );
    });
  });

  describe('getLatestConsent', () => {
    it('should return latest consent for user', async () => {
      const mockRecord = {
        id: 'consent-2',
        userId: 'user-1',
        consentType: 'cookie_consent',
        action: 'updated',
        version: '1.0.0',
        createdAt: new Date('2024-01-15'),
      };

      vi.mocked(prisma.consentRecord.findFirst).mockResolvedValue(mockRecord as any);

      const result = await consentService.getLatestConsent('user-1');

      expect(result).not.toBeNull();
      expect(result!.action).toBe('updated');
    });

    it('should return null when no consent exists', async () => {
      vi.mocked(prisma.consentRecord.findFirst).mockResolvedValue(null as any);

      const result = await consentService.getLatestConsent('user-1');

      expect(result).toBeNull();
    });
  });

  describe('getConsentById', () => {
    it('should return consent by ID', async () => {
      const mockRecord = {
        id: 'consent-1',
        userId: 'user-1',
        consentType: 'cookie_consent',
        action: 'accepted',
        version: '1.0.0',
        createdAt: new Date(),
      };

      vi.mocked(prisma.consentRecord.findUnique).mockResolvedValue(mockRecord as any);

      const result = await consentService.getConsentById('consent-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('consent-1');
    });

    it('should return null for non-existent consent', async () => {
      vi.mocked(prisma.consentRecord.findUnique).mockResolvedValue(null as any);

      const result = await consentService.getConsentById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('withdrawConsent', () => {
    it('should create withdrawal record', async () => {
      const mockRecord = {
        id: 'consent-3',
        userId: 'user-1',
        consentType: 'cookie_consent',
        action: 'withdrawn',
        version: '1.0.0',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
      };

      vi.mocked(prisma.consentRecord.create).mockResolvedValue(mockRecord as any);

      const result = await consentService.withdrawConsent('user-1', '127.0.0.1', 'Mozilla/5.0');

      expect(result.action).toBe('withdrawn');
      expect(result.consentType).toBe('cookie_consent');
    });
  });

  describe('getConsentStats', () => {
    it('should return consent statistics', async () => {
      const mockRecords = [
        { action: 'accepted', consentType: 'cookie_consent' },
        { action: 'accepted', consentType: 'cookie_consent' },
        { action: 'updated', consentType: 'cookie_consent' },
        { action: 'withdrawn', consentType: 'cookie_consent' },
        { action: 'accepted', consentType: 'marketing' },
      ];

      vi.mocked(prisma.consentRecord.findMany).mockResolvedValue(mockRecords as any);

      const result = await consentService.getConsentStats();

      expect(result.totalRecords).toBe(5);
      expect(result.byAction['accepted']).toBe(3);
      expect(result.byAction['updated']).toBe(1);
      expect(result.byAction['withdrawn']).toBe(1);
      expect(result.byConsentType['cookie_consent']).toBe(4);
      expect(result.byConsentType['marketing']).toBe(1);
    });

    it('should return empty stats when no records exist', async () => {
      vi.mocked(prisma.consentRecord.findMany).mockResolvedValue([]);

      const result = await consentService.getConsentStats();

      expect(result.totalRecords).toBe(0);
      expect(Object.keys(result.byAction)).toHaveLength(0);
      expect(Object.keys(result.byConsentType)).toHaveLength(0);
    });
  });
});
