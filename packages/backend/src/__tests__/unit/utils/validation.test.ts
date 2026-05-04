import { describe, it, expect } from 'vitest';
import { isValidUUID, getParamValue } from '../../../utils/validation';

describe('Validation Utilities', () => {
  describe('isValidUUID', () => {
    it('should return true for valid UUIDs', () => {
      const validUuids = [
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
        '00000000-0000-0000-0000-000000000000',
        'ffffffff-ffff-ffff-ffff-ffffffffffff',
      ];

      validUuids.forEach((uuid) => {
        expect(isValidUUID(uuid)).toBe(true);
      });
    });

    it('should return false for invalid UUIDs', () => {
      const invalidUuids = [
        '',
        'not-a-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-44665544000',
        'gggggggg-gggg-gggg-gggg-gggggggggggg',
      ];

      invalidUuids.forEach((uuid) => {
        expect(isValidUUID(uuid)).toBe(false);
      });
    });

    it('should handle uppercase UUIDs', () => {
      const uuid = '550E8400-E29B-41D4-A716-446655440000';
      expect(isValidUUID(uuid)).toBe(true);
    });

    it('should handle mixed case UUIDs', () => {
      const uuid = '550e8400-E29B-41d4-A716-446655440000';
      expect(isValidUUID(uuid)).toBe(true);
    });
  });

  describe('getParamValue', () => {
    it('should return string parameter as is', () => {
      expect(getParamValue('test-id')).toBe('test-id');
      expect(getParamValue('')).toBe('');
    });

    it('should return first element of array parameter', () => {
      expect(getParamValue(['first', 'second'])).toBe('first');
      expect(getParamValue(['only'])).toBe('only');
    });

    it('should return undefined for undefined parameter', () => {
      expect(getParamValue(undefined)).toBeUndefined();
    });
  });
});
