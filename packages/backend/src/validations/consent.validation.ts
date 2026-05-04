// Consent Validation for GDPR Article 7 Compliance

import { z } from 'zod';

// Schema for record consent request body
const recordConsentBodySchema = z.object({
  consentType: z.enum(['cookie_consent', 'marketing_consent', 'analytics_consent'], {
    error: 'Invalid consent type',
  }),
  action: z.enum(['accept_all', 'reject_all', 'custom', 'withdrawn'], {
    error: 'Invalid action',
  }),
  preferences: z
    .object({
      essential: z.boolean().default(true),
      analytics: z.boolean().default(false),
      marketing: z.boolean().default(false),
    })
    .optional(),
  version: z.string().min(1, 'Version is required'),
});

export const recordConsentSchema = recordConsentBodySchema;

// Schema for get consent history query params
const getConsentHistoryQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).optional(),
  offset: z.string().regex(/^\d+$/).optional(),
});

export const getConsentHistorySchema = getConsentHistoryQuerySchema;

// Schema for get consent by ID params
const getConsentByIdParamsSchema = z.object({
  consentId: z.string().uuid('Invalid consent ID'),
});

export const getConsentByIdSchema = getConsentByIdParamsSchema;

export type RecordConsentInput = z.infer<typeof recordConsentBodySchema>;
export type GetConsentHistoryQuery = z.infer<typeof getConsentHistoryQuerySchema>;
