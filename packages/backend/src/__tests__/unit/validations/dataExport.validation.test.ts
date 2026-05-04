// Data Export Validation Tests - Comprehensive Test Suite
import { describe, it, expect } from 'vitest';
import {
  initiateExportSchema,
  exportStatusSchema,
  exportDownloadSchema,
  exportCancellationSchema,
  EXPORT_CONSTANTS,
  EXPORT_SCHEMA_VERSION,
  DATA_CONTROLLER_INFO,
} from '../../../validations/dataExport.validation';

describe('Data Export Validation', () => {
  describe('initiateExportSchema', () => {
    describe('valid inputs', () => {
      it('should accept empty object (all defaults)', () => {
        const result = initiateExportSchema.safeParse({});
        expect(result.success).toBe(true);
      });

      it('should accept valid options with includeSessions', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            includeSessions: true,
          },
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid options with includeNotifications', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            includeNotifications: false,
          },
        });
        expect(result.success).toBe(true);
      });

      it('should accept valid options with dataCategories', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            dataCategories: ['userProfile', 'teamMemberships'],
          },
        });
        expect(result.success).toBe(true);
      });

      it('should accept all options together', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            includeSessions: true,
            includeNotifications: true,
            dataCategories: ['userProfile', 'notifications', 'sessionHistory'],
          },
        });
        expect(result.success).toBe(true);
      });

      it('should accept empty dataCategories array', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            dataCategories: [],
          },
        });
        expect(result.success).toBe(true);
      });

      it('should accept empty options object', () => {
        const result = initiateExportSchema.safeParse({
          options: {},
        });
        expect(result.success).toBe(true);
      });

      it('should apply default values when options is empty', () => {
        const result = initiateExportSchema.safeParse({
          options: {},
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.options).toEqual({
            includeSessions: true,
            includeNotifications: true,
          });
        }
      });

      it('should apply default true for includeSessions when not specified', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            includeNotifications: false,
          },
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.options?.includeSessions).toBe(true);
        }
      });

      it('should apply default true for includeNotifications when not specified', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            includeSessions: false,
          },
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.options?.includeNotifications).toBe(true);
        }
      });
    });

    describe('includeSessions validation', () => {
      it('should reject non-boolean includeSessions', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            includeSessions: 'true',
          },
        });
        expect(result.success).toBe(false);
      });

      it('should reject numeric includeSessions', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            includeSessions: 1,
          },
        });
        expect(result.success).toBe(false);
      });
    });

    describe('includeNotifications validation', () => {
      it('should reject non-boolean includeNotifications', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            includeNotifications: 'false',
          },
        });
        expect(result.success).toBe(false);
      });

      it('should reject numeric includeNotifications', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            includeNotifications: 0,
          },
        });
        expect(result.success).toBe(false);
      });
    });

    describe('dataCategories validation', () => {
      it('should reject non-array dataCategories', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            dataCategories: 'userProfile',
          },
        });
        expect(result.success).toBe(false);
      });

      it('should reject array with non-string elements', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            dataCategories: ['userProfile', 123, true],
          },
        });
        expect(result.success).toBe(false);
      });

      it('should accept array with many string categories', () => {
        const result = initiateExportSchema.safeParse({
          options: {
            dataCategories: [
              'userProfile',
              'teamMemberships',
              'dailyUpdates',
              'assignedTasks',
              'reportedImpediments',
            ],
          },
        });
        expect(result.success).toBe(true);
      });
    });

    describe('additional properties', () => {
      it('should accept additional properties in options (schema not strict)', () => {
        // The schema doesn't use strict() so extra keys are allowed
        const result = initiateExportSchema.safeParse({
          options: {
            includeSessions: true,
            invalidOption: 'value',
          },
        });
        // This passes because the schema doesn't use .strict()
        expect(result.success).toBe(true);
      });

      it('should accept additional properties at root level (schema not strict)', () => {
        // The schema doesn't use strict() so extra keys are allowed
        const result = initiateExportSchema.safeParse({
          options: {
            includeSessions: true,
          },
          invalidProperty: 'value',
        });
        // This passes because the schema doesn't use .strict()
        expect(result.success).toBe(true);
      });
    });
  });

  describe('exportStatusSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid UUID', () => {
        const result = exportStatusSchema.safeParse({
          jobId: '550e8400-e29b-41d4-a716-446655440000',
        });
        expect(result.success).toBe(true);
      });

      it('should accept UUID v7', () => {
        const result = exportStatusSchema.safeParse({
          jobId: '018e1234-5678-7abc-8def-0123456789ab',
        });
        expect(result.success).toBe(true);
      });

      it('should accept uppercase UUID', () => {
        const result = exportStatusSchema.safeParse({
          jobId: '550E8400-E29B-41D4-A716-446655440000',
        });
        expect(result.success).toBe(true);
      });

      it('should accept nil UUID', () => {
        const result = exportStatusSchema.safeParse({
          jobId: '00000000-0000-0000-0000-000000000000',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject invalid UUID format', () => {
        const result = exportStatusSchema.safeParse({
          jobId: 'invalid-uuid',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid job ID format');
        }
      });

      it('should reject empty jobId', () => {
        const result = exportStatusSchema.safeParse({
          jobId: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing jobId', () => {
        const result = exportStatusSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject UUID with wrong number of characters', () => {
        const result = exportStatusSchema.safeParse({
          jobId: '550e8400-e29b-41d4-a716',
        });
        expect(result.success).toBe(false);
      });

      it('should reject UUID without hyphens', () => {
        const result = exportStatusSchema.safeParse({
          jobId: '550e8400e29b41d4a716446655440000',
        });
        expect(result.success).toBe(false);
      });

      it('should reject numeric id', () => {
        const result = exportStatusSchema.safeParse({
          jobId: '12345',
        });
        expect(result.success).toBe(false);
      });

      it('should reject UUID with invalid characters', () => {
        const result = exportStatusSchema.safeParse({
          jobId: '550e8400-e29b-41d4-a716-44665544000g',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('exportDownloadSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid UUID', () => {
        const result = exportDownloadSchema.safeParse({
          jobId: '550e8400-e29b-41d4-a716-446655440000',
        });
        expect(result.success).toBe(true);
      });

      it('should accept UUID v7', () => {
        const result = exportDownloadSchema.safeParse({
          jobId: '018e1234-5678-7abc-8def-0123456789ab',
        });
        expect(result.success).toBe(true);
      });

      it('should accept uppercase UUID', () => {
        const result = exportDownloadSchema.safeParse({
          jobId: '550E8400-E29B-41D4-A716-446655440000',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject invalid UUID format', () => {
        const result = exportDownloadSchema.safeParse({
          jobId: 'invalid-uuid',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid job ID format');
        }
      });

      it('should reject empty jobId', () => {
        const result = exportDownloadSchema.safeParse({
          jobId: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing jobId', () => {
        const result = exportDownloadSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject UUID with wrong number of characters', () => {
        const result = exportDownloadSchema.safeParse({
          jobId: '550e8400-e29b-41d4-a716',
        });
        expect(result.success).toBe(false);
      });

      it('should reject UUID without hyphens', () => {
        const result = exportDownloadSchema.safeParse({
          jobId: '550e8400e29b41d4a716446655440000',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('exportCancellationSchema', () => {
    describe('valid inputs', () => {
      it('should accept valid UUID', () => {
        const result = exportCancellationSchema.safeParse({
          jobId: '550e8400-e29b-41d4-a716-446655440000',
        });
        expect(result.success).toBe(true);
      });

      it('should accept UUID v7', () => {
        const result = exportCancellationSchema.safeParse({
          jobId: '018e1234-5678-7abc-8def-0123456789ab',
        });
        expect(result.success).toBe(true);
      });

      it('should accept uppercase UUID', () => {
        const result = exportCancellationSchema.safeParse({
          jobId: '550E8400-E29B-41D4-A716-446655440000',
        });
        expect(result.success).toBe(true);
      });
    });

    describe('invalid inputs', () => {
      it('should reject invalid UUID format', () => {
        const result = exportCancellationSchema.safeParse({
          jobId: 'invalid-uuid',
        });
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe('Invalid job ID format');
        }
      });

      it('should reject empty jobId', () => {
        const result = exportCancellationSchema.safeParse({
          jobId: '',
        });
        expect(result.success).toBe(false);
      });

      it('should reject missing jobId', () => {
        const result = exportCancellationSchema.safeParse({});
        expect(result.success).toBe(false);
      });

      it('should reject UUID with wrong number of characters', () => {
        const result = exportCancellationSchema.safeParse({
          jobId: '550e8400-e29b-41d4-a716',
        });
        expect(result.success).toBe(false);
      });

      it('should reject UUID without hyphens', () => {
        const result = exportCancellationSchema.safeParse({
          jobId: '550e8400e29b41d4a716446655440000',
        });
        expect(result.success).toBe(false);
      });
    });
  });

  describe('EXPORT_CONSTANTS', () => {
    it('should have correct rate limiting constants', () => {
      expect(EXPORT_CONSTANTS.MAX_EXPORTS_PER_HOUR).toBe(1);
      expect(EXPORT_CONSTANTS.MAX_STATUS_CHECKS_PER_MINUTE).toBe(10);
      expect(EXPORT_CONSTANTS.MAX_DOWNLOADS_PER_MINUTE).toBe(5);
    });

    it('should have correct file constraints', () => {
      expect(EXPORT_CONSTANTS.MAX_FILE_SIZE_MB).toBe(100);
      expect(EXPORT_CONSTANTS.EXPORT_RETENTION_DAYS).toBe(7);
    });

    it('should have correct processing constants', () => {
      expect(EXPORT_CONSTANTS.MAX_PROCESSING_TIME_MS).toBe(5 * 60 * 1000);
      expect(EXPORT_CONSTANTS.POLLING_INTERVAL_MS).toBe(2000);
    });

    it('should have valid data categories array', () => {
      expect(EXPORT_CONSTANTS.VALID_DATA_CATEGORIES).toBeInstanceOf(Array);
      expect(EXPORT_CONSTANTS.VALID_DATA_CATEGORIES.length).toBeGreaterThan(0);
      expect(EXPORT_CONSTANTS.VALID_DATA_CATEGORIES).toContain('userProfile');
      expect(EXPORT_CONSTANTS.VALID_DATA_CATEGORIES).toContain('notifications');
      expect(EXPORT_CONSTANTS.VALID_DATA_CATEGORIES).toContain('sessionHistory');
    });

    it('should have all unique data categories', () => {
      const categories = EXPORT_CONSTANTS.VALID_DATA_CATEGORIES;
      const uniqueCategories = [...new Set(categories)];
      expect(categories.length).toBe(uniqueCategories.length);
    });
  });

  describe('EXPORT_SCHEMA_VERSION', () => {
    it('should be a valid semantic version string', () => {
      expect(EXPORT_SCHEMA_VERSION).toBe('1.0.0');
      expect(EXPORT_SCHEMA_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });
  });

  describe('DATA_CONTROLLER_INFO', () => {
    it('should have correct data controller name', () => {
      expect(DATA_CONTROLLER_INFO.name).toBe('ScrSphere');
    });

    it('should have contact email', () => {
      expect(DATA_CONTROLLER_INFO.contactEmail).toBe('privacy@example.com');
    });

    it('should have correct format', () => {
      expect(DATA_CONTROLLER_INFO.format).toBe('GDPR-PORTABLE-JSON');
    });
  });
});
