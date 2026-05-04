// Consent Routes for GDPR Article 7 Compliance

import { Router, type Router as RouterType } from 'express';
import * as consentController from '../controllers/consent.controller';
import { optionalAuth, authenticate } from '../middleware/auth.middleware';
import { validateBody, validateQuery, validateParams } from '../middleware/validation.middleware';
import { apiRateLimit } from '../middleware/rateLimit.middleware';
import {
  recordConsentSchema,
  getConsentHistorySchema,
  getConsentByIdSchema,
} from '../validations/consent.validation';

const router: RouterType = Router();

router.post(
  '/record',
  optionalAuth,
  apiRateLimit,
  validateBody(recordConsentSchema),
  consentController.recordConsent
);

router.get(
  '/history',
  authenticate,
  apiRateLimit,
  validateQuery(getConsentHistorySchema),
  consentController.getConsentHistory
);

router.get('/latest', authenticate, apiRateLimit, consentController.getLatestConsent);

router.post('/withdraw', authenticate, apiRateLimit, consentController.withdrawConsent);

router.get(
  '/:consentId',
  optionalAuth,
  apiRateLimit,
  validateParams(getConsentByIdSchema),
  consentController.getAnonymousConsent
);

export default router;
