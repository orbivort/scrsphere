import { describe, it, expect } from 'vitest';
import {
  generateUUIDv7,
  generateUUIDv7Batch,
  isValidUUID,
  extractTimestampFromUUIDv7,
  isUUIDv7,
} from '../../../utils/uuid';

describe('UUID Utilities', () => {
  describe('generateUUIDv7', () => {
    it('should generate a valid UUID string', () => {
      const uuid = generateUUIDv7();
      expect(uuid).toBeValidUUID();
    });

    it('should generate a UUIDv7 (version 7)', () => {
      const uuid = generateUUIDv7();
      expect(uuid).toBeUUIDv7();
    });

    it('should generate unique UUIDs', () => {
      const uuids = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        uuids.add(generateUUIDv7());
      }
      expect(uuids.size).toBe(1000);
    });

    it('should generate UUIDs with correct format', () => {
      const uuid = generateUUIDv7();
      const parts = uuid.split('-');
      expect(parts).toHaveLength(5);
      expect(parts[0]).toHaveLength(8);
      expect(parts[1]).toHaveLength(4);
      expect(parts[2]).toHaveLength(4);
      expect(parts[3]).toHaveLength(4);
      expect(parts[4]).toHaveLength(12);
    });

    it('should have version 7 in the correct position', () => {
      const uuid = generateUUIDv7();
      const versionChar = uuid.charAt(14);
      expect(parseInt(versionChar, 16)).toBe(7);
    });

    it('should contain a timestamp close to current time', () => {
      const beforeTime = Date.now();
      const uuid = generateUUIDv7();
      const afterTime = Date.now();

      const timestamp = extractTimestampFromUUIDv7(uuid);
      expect(timestamp).not.toBeNull();
      expect(timestamp!.getTime()).toBeGreaterThanOrEqual(beforeTime - 1);
      expect(timestamp!.getTime()).toBeLessThanOrEqual(afterTime + 1);
    });

    it('should generate time-ordered UUIDs', async () => {
      const uuid1 = generateUUIDv7();
      await new Promise((resolve) => setTimeout(resolve, 10));
      const uuid2 = generateUUIDv7();

      expect(uuid1 < uuid2).toBe(true);
    });
  });

  describe('generateUUIDv7Batch', () => {
    it('should generate the specified number of UUIDs', () => {
      const uuids = generateUUIDv7Batch(10);
      expect(uuids).toHaveLength(10);
    });

    it('should generate all valid UUIDv7s', () => {
      const uuids = generateUUIDv7Batch(100);
      uuids.forEach((uuid) => {
        expect(uuid).toBeUUIDv7();
      });
    });

    it('should generate unique UUIDs in batch', () => {
      const uuids = generateUUIDv7Batch(1000);
      const uniqueUuids = new Set(uuids);
      expect(uniqueUuids.size).toBe(1000);
    });

    it('should handle zero count', () => {
      const uuids = generateUUIDv7Batch(0);
      expect(uuids).toHaveLength(0);
    });

    it('should handle single UUID generation', () => {
      const uuids = generateUUIDv7Batch(1);
      expect(uuids).toHaveLength(1);
      expect(uuids[0]).toBeUUIDv7();
    });
  });

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

    it('should return true for UUIDv7', () => {
      const uuid = generateUUIDv7();
      expect(isValidUUID(uuid)).toBe(true);
    });

    it('should return false for invalid UUIDs', () => {
      const invalidUuids = [
        '',
        'not-a-uuid',
        '550e8400-e29b-41d4-a716',
        '550e8400-e29b-41d4-a716-44665544000',
        '550e8400-e29b-41d4-a716-4466554400000',
        '550e8400-e29b-41d4-a716-446655440000-extra',
        'gggggggg-gggg-gggg-gggg-gggggggggggg',
        '550e8400e29b41d4a716446655440000',
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

  describe('extractTimestampFromUUIDv7', () => {
    it('should extract timestamp from valid UUIDv7', () => {
      const uuid = generateUUIDv7();
      const timestamp = extractTimestampFromUUIDv7(uuid);
      expect(timestamp).not.toBeNull();
      expect(timestamp instanceof Date).toBe(true);
    });

    it('should return null for invalid UUID format', () => {
      const timestamp = extractTimestampFromUUIDv7('invalid-uuid');
      expect(timestamp).toBeNull();
    });

    it('should return null for non-UUIDv7 UUIDs with old timestamps', () => {
      const oldUuid = '00000000-0000-7000-8000-000000000000';
      const timestamp = extractTimestampFromUUIDv7(oldUuid);
      expect(timestamp).toBeNull();
    });

    it('should return a Date for valid UUID format with recent timestamp', () => {
      const uuidv4 = '550e8400-e29b-41d4-a716-446655440000';
      const timestamp = extractTimestampFromUUIDv7(uuidv4);
      expect(timestamp).toBeInstanceOf(Date);
    });

    it('should return null for UUIDs with unreasonable timestamps', () => {
      const oldUuid = '00000000-0000-7000-8000-000000000000';
      const timestamp = extractTimestampFromUUIDv7(oldUuid);
      expect(timestamp).toBeNull();
    });

    it('should extract timestamp close to generation time', () => {
      const beforeTime = Date.now();
      const uuid = generateUUIDv7();
      const afterTime = Date.now();

      const timestamp = extractTimestampFromUUIDv7(uuid);
      expect(timestamp!.getTime()).toBeGreaterThanOrEqual(beforeTime - 1);
      expect(timestamp!.getTime()).toBeLessThanOrEqual(afterTime + 1);
    });
  });

  describe('isUUIDv7', () => {
    it('should return true for valid UUIDv7', () => {
      const uuid = generateUUIDv7();
      expect(isUUIDv7(uuid)).toBe(true);
    });

    it('should return false for UUIDv4', () => {
      const uuidv4 = '550e8400-e29b-41d4-a716-446655440000';
      expect(isUUIDv7(uuidv4)).toBe(false);
    });

    it('should return false for invalid UUID', () => {
      expect(isUUIDv7('invalid')).toBe(false);
    });

    it('should return false for UUIDs with wrong version', () => {
      const uuidv1 = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
      expect(isUUIDv7(uuidv1)).toBe(false);
    });

    it('should return false for future-dated UUIDs', () => {
      const futureTimestamp = Date.now() + 120000;
      const timeHex = futureTimestamp.toString(16).padStart(12, '0');
      const futureUuid = `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-7000-8000-000000000000`;
      expect(isUUIDv7(futureUuid)).toBe(false);
    });

    it('should allow small clock skew (1 minute)', () => {
      const nearFutureTimestamp = Date.now() + 30000;
      const timeHex = nearFutureTimestamp.toString(16).padStart(12, '0');
      const nearFutureUuid = `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-7000-8000-000000000000`;
      expect(isUUIDv7(nearFutureUuid)).toBe(true);
    });
  });
});
