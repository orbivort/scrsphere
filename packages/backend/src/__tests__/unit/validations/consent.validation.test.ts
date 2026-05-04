// Consent Validation Tests - Comprehensive Test Suite
import { describe, it, expect } from 'vitest';
import {
  recordConsentSchema,
  getConsentHistorySchema,
  getConsentByIdSchema,
} from '../../../validations/consent.validation';

describe('Consent Validation', () => {
  describe('recordConsentSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid cookie consent with accept_all action', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: 'accept_all',
          version: '1.0.0',
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid marketing consent', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'marketing_consent',
          action: 'accept_all',
          version: '1.0.0',
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid analytics consent', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'analytics_consent',
          action: 'accept_all',
          version: '1.0.0',
        });
        expect(result.success).toBe(true);
      });

      it('should accept reject_all action', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: 'reject_all',
          version: '1.0.0',
        });
        expect(result.success).toBe(true);
      });

      it('should accept custom action with preferences', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: 'custom',
          preferences: {
            essential: true,
            analytics: true,
            marketing: false,
          },
          version: '1.0.0',
        });
        expect(result.success).toBe(true);
      });

      it('should accept withdrawn action', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'marketing_consent',
          action: 'withdrawn',
          version: '1.0.0',
        });
        expect(result.success).toBe(true);
      });

      it('should apply default values for preferences', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: 'custom',
          preferences: {},
          version: '1.0.0',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.preferences).toEqual({
            essential: true,
            analytics: false,
            marketing: false,
          });
        }
      });

      it('should accept preferences with only some fields', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: 'custom',
          preferences: {
            analytics: true,
          },
          version: '1.0.0',
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.preferences).toEqual({
            essential: true,
            analytics: true,
            marketing: false,
          });
        }
      });

      it('should accept without optional preferences', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: 'accept_all',
          version: '1.0.0',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('consentType validation', () => {
      it('should reject invalid consent type', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'invalid_type',
          action: 'accept_all',
          version: '1.0.0',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid consent type');
        }
      });

      it('should reject empty consent type', () => {
        const result = recordConsentSchema.safeParse({
          consentType: '',
          action: 'accept_all',
          version: '1.0.0',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing consent type', () => {
        const result = recordConsentSchema.safeParse({
          action: 'accept_all',
          version: '1.0.0',
        });
        expect(result.success).toBe(false);
      });

      it('should reject consent type with wrong case', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'Cookie_Consent',
          action: 'accept_all',
          version: '1.0.0',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('action validation', () => {
      it('should reject invalid action', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: 'invalid_action',
          version: '1.0.0',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid action');
        }
      });

      it('should reject empty action', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: '',
          version: '1.0.0',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing action', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          version: '1.0.0',
        });
        expect(result.success).toBe(false);
      });

      it('should accept all valid action values', () => {
        const validActions = ['accept_all', 'reject_all', 'custom', 'withdrawn'];
        validActions.forEach((action) => {
          const result = recordConsentSchema.safeParse({
            consentType: 'cookie_consent',
            action,
            version: '1.0.0',
          });
          expect(result.success).toBe(true);
        });
      });
    });

    describe('version validation', () => {
      it('should reject empty version', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: 'accept_all',
          version: '',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Version is required');
        }
      });

      it('should reject missing version', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: 'accept_all',
        });
        expect(result.success).toBe(false);
      });

      it('should accept various version formats', () => {
        const versions = ['1.0.0', 'v2.0', '2024.01', '1', '1.0.0-beta'];
        versions.forEach((version) => {
          const result = recordConsentSchema.safeParse({
            consentType: 'cookie_consent',
            action: 'accept_all',
            version,
          });
          expect(result.success).toBe(true);
        });
      });
    });

    describe('preferences validation', () => {
      it('should reject non-boolean essential preference', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: 'custom',
          preferences: {
            essential: 'true',
          },
          version: '1.0.0',
        });
        expect(result.success).toBe(false);
      });

      it('should reject non-boolean analytics preference', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: 'custom',
          preferences: {
            analytics: 'false',
          },
          version: '1.0.0',
        });
        expect(result.success).toBe(false);
      });

      it('should reject non-boolean marketing preference', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: 'custom',
          preferences: {
            marketing: 1,
          },
          version: '1.0.0',
        });
        expect(result.success).toBe(false);
      });

      it('should accept additional preference keys (zod passthrough not set)', () => {
        const result = recordConsentSchema.safeParse({
          consentType: 'cookie_consent',
          action: 'custom',
          preferences: {
            invalidKey: true,
          },
          version: '1.0.0',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('getConsentHistorySchema', () => {
    describe('valid inputs', () => {
      it('should accept empty query', () => {
        const result = getConsentHistorySchema.safeParse({});
        expect(result.success).toBe(true);
      });

      it('should accept valid limit', () => {
        const result = getConsentHistorySchema.safeParse({
          limit: '10',
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid offset', () => {
        const result = getConsentHistorySchema.safeParse({
          offset: '20',
        });
        expect(result.success).toBe(true);
      });

      it('should accept both limit and offset', () => {
        const result = getConsentHistorySchema.safeParse({
          limit: '10',
          offset: '20',
        });
        expect(result.success).toBe(true);
      });

      it('should accept limit as zero', () => {
        const result = getConsentHistorySchema.safeParse({
          limit: '0',
        });
        expect(result.success).toBe(true);
      });

      it('should accept large numbers', () => {
        const result = getConsentHistorySchema.safeParse({
          limit: '999999',
          offset: '999999',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('limit validation', () => {
      it('should reject non-numeric limit', () => {
        const result = getConsentHistorySchema.safeParse({
          limit: 'ten',
        });
        expect(result.success).toBe(false);
      });

      it('should reject limit with decimal', () => {
        const result = getConsentHistorySchema.safeParse({
          limit: '10.5',
        });
        expect(result.success).toBe(false);
      });

      it('should reject negative limit', () => {
        const result = getConsentHistorySchema.safeParse({
          limit: '-10',
        });
        expect(result.success).toBe(false);
      });

      it('should accept limit with leading zeros', () => {
        const result = getConsentHistorySchema.safeParse({
          limit: '010',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('offset validation', () => {
      it('should reject non-numeric offset', () => {
        const result = getConsentHistorySchema.safeParse({
          offset: 'twenty',
        });
        expect(result.success).toBe(false);
      });

      it('should reject offset with decimal', () => {
        const result = getConsentHistorySchema.safeParse({
          offset: '20.5',
        });
        expect(result.success).toBe(false);
      });

      it('should reject negative offset', () => {
        const result = getConsentHistorySchema.safeParse({
          offset: '-20',
        });
        expect(result.success).toBe(false);
      });
    });

    describe('additional query parameters', () => {
      it('should accept additional query parameters (schema not strict)', () => {
        const result = getConsentHistorySchema.safeParse({
          limit: '10',
          invalidParam: 'value',
        });
        expect(result.success).toBe(true);
      });
    });
  });

  describe('getConsentByIdSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid UUID', () => {
        const result = getConsentByIdSchema.safeParse({
          consentId: '550e8400-e29b-41d4-a716-446655440000',
        });
        expect(result.success).toBe(true);
      });

      it('should accept UUID v7', () => {
        const result = getConsentByIdSchema.safeParse({
          consentId: '018e1234-5678-7abc-8def-0123456789ab',
        });
        expect(result.success).toBe(true);
      });

      it('should accept uppercase UUID', () => {
        const result = getConsentByIdSchema.safeParse({
          consentId: '550E8400-E29B-41D4-A716-446655440000',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject invalid UUID format', () => {
        const result = getConsentByIdSchema.safeParse({
          consentId: 'invalid-uuid',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid consent ID');
        }
      });

      it('should reject empty consentId', () => {
        const result = getConsentByIdSchema.safeParse({
          consentId: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing consentId', () => {
        const result = getConsentByIdSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject UUID with wrong number of characters', () => {
        const result = getConsentByIdSchema.safeParse({
          consentId: '550e8400-e29b-41d4-a716',
        });
        expect(result.success).toBe(false);
      });

      it('should reject UUID without hyphens', () => {
        const result = getConsentByIdSchema.safeParse({
          consentId: '550e8400e29b41d4a716446655440000',
        });
        expect(result.success).toBe(false);
      });

      it('should reject numeric id', () => {
        const result = getConsentByIdSchema.safeParse({
          consentId: '12345',
        });
        expect(result.success).toBe(false);
      });
    });
  });
});
