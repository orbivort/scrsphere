// Consent Controller for GDPR Article 7 Compliance

import { type Request, type Response } from 'express';
import { consentService } from '../services/consent.service';
import {
  asyncHandler,
  createSuccessResponse,
  BadRequestError,
  UnauthorizedError,
} from '../utils/errors';
import { logger } from '../utils/logger';
import { getParamValue } from '../utils/validation';
import type { RecordConsentInput, GetConsentHistoryQuery } from '../validations/consent.validation';

export const recordConsent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const data = req.body as RecordConsentInput;
  const ipAddress = req.ip ?? req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  logger.info('Recording cookie consent', {
    userId: userId ?? 'anonymous',
    consentType: data.consentType,
    action: data.action,
  });

  const record = await consentService.recordConsent({
    userId,
    consentType: data.consentType,
    action: data.action,
    preferences: data.preferences,
    version: data.version,
    ipAddress,
    userAgent,
  });

  res.status(201).json(
    createSuccessResponse({
      id: record.id,
      consentType: record.consentType,
      action: record.action,
      createdAt: record.createdAt.toISOString(),
      message: 'Consent recorded successfully',
    })
  );
});

export const getConsentHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const query = req.query as unknown as GetConsentHistoryQuery;

  const limit = Math.min(parseInt(query.limit ?? '10', 10), 50);
  const offset = parseInt(query.offset ?? '0', 10);

  const history = await consentService.getConsentHistory(userId, limit, offset);

  res.json(
    createSuccessResponse({
      records: history.map((record) => ({
        id: record.id,
        consentType: record.consentType,
        action: record.action,
        version: record.version,
        ipAddress: record.ipAddress,
        createdAt: record.createdAt.toISOString(),
      })),
      pagination: {
        limit,
        offset,
        total: history.length,
      },
    })
  );
});

export const getLatestConsent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }

  const consent = await consentService.getLatestConsent(userId);

  if (!consent) {
    res.json(
      createSuccessResponse({
        consent: null,
        message: 'No consent record found',
      })
    );
    return;
  }

  res.json(
    createSuccessResponse({
      consent: {
        id: consent.id,
        consentType: consent.consentType,
        action: consent.action,
        version: consent.version,
        createdAt: consent.createdAt.toISOString(),
      },
    })
  );
});

export const withdrawConsent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    throw new UnauthorizedError('User not authenticated');
  }
  const ipAddress = req.ip ?? req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  logger.info('Withdrawing cookie consent', { userId });

  const record = await consentService.withdrawConsent(userId, ipAddress, userAgent);

  res.json(
    createSuccessResponse({
      id: record.id,
      action: record.action,
      createdAt: record.createdAt.toISOString(),
      message: 'Consent withdrawn successfully',
    })
  );
});

export const getAnonymousConsent = asyncHandler(async (req: Request, res: Response) => {
  const consentId = getParamValue(req.params.consentId);

  if (!consentId) {
    throw new BadRequestError('Consent ID is required');
  }

  const consent = await consentService.getConsentById(consentId);

  if (!consent) {
    res.json(
      createSuccessResponse({
        consent: null,
        message: 'No consent record found',
      })
    );
    return;
  }

  res.json(
    createSuccessResponse({
      consent: {
        id: consent.id,
        consentType: consent.consentType,
        action: consent.action,
        version: consent.version,
        createdAt: consent.createdAt.toISOString(),
      },
    })
  );
});
