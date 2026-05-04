// Consent Service for GDPR Article 7 Compliance

import prisma from '../utils/prisma';
import { logger } from '../utils/logger';

const CONSENT_VERSION = '1.0.0';

interface RecordConsentInput {
  userId?: string;
  consentType: string;
  action: string;
  preferences?: {
    essential: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  version: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ConsentRecord {
  id: string;
  userId: string | null;
  consentType: string;
  action: string;
  version: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export const consentService = {
  async recordConsent(input: RecordConsentInput): Promise<ConsentRecord> {
    const record = await prisma.consentRecord.create({
      data: {
        userId: input.userId || null,
        consentType: input.consentType,
        action: input.action,
        version: input.version,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      },
    });

    logger.info('Consent recorded', {
      recordId: record.id,
      userId: input.userId || 'anonymous',
      consentType: input.consentType,
      action: input.action,
    });

    return record;
  },

  async getConsentHistory(userId: string, limit: number, offset: number): Promise<ConsentRecord[]> {
    return prisma.consentRecord.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  },

  async getLatestConsent(userId: string): Promise<ConsentRecord | null> {
    return prisma.consentRecord.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async getConsentById(id: string): Promise<ConsentRecord | null> {
    return prisma.consentRecord.findUnique({
      where: { id },
    });
  },

  async withdrawConsent(
    userId: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<ConsentRecord> {
    const record = await prisma.consentRecord.create({
      data: {
        userId,
        consentType: 'cookie_consent',
        action: 'withdrawn',
        version: CONSENT_VERSION,
        ipAddress,
        userAgent,
      },
    });

    logger.info('Consent withdrawn', {
      recordId: record.id,
      userId,
    });

    return record;
  },

  async getConsentStats(): Promise<{
    totalRecords: number;
    byAction: Record<string, number>;
    byConsentType: Record<string, number>;
  }> {
    const records = await prisma.consentRecord.findMany({
      select: {
        action: true,
        consentType: true,
      },
    });

    const byAction: Record<string, number> = {};
    const byConsentType: Record<string, number> = {};

    for (const record of records) {
      byAction[record.action] = (byAction[record.action] || 0) + 1;
      byConsentType[record.consentType] = (byConsentType[record.consentType] || 0) + 1;
    }

    return {
      totalRecords: records.length,
      byAction,
      byConsentType,
    };
  },
};
