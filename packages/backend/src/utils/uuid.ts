/**
 * UUIDv7 Utility Module
 * Generates UUIDv7 compliant identifiers for PostgreSQL primary keys
 * UUIDv7 provides time-ordered values with better database performance
 * Compatible with PostgreSQL 18+ uuid data type
 */

/**
 * Generate a UUIDv7 string
 * Format: 018ff5b8-0e1a-7e8c-9d2f-4a6b8c3d5e7f
 * - First 48 bits: Unix timestamp in milliseconds
 * - Next 4 bits: version (7)
 * - Next 12 bits: random
 * - Next 2 bits: variant (10)
 * - Next 62 bits: random
 */
export function generateUUIDv7(): string {
  const now = Date.now();

  // Convert timestamp to hex (48 bits = 12 hex chars)
  const timeHex = now.toString(16).padStart(12, '0');

  // Generate random bytes for the rest
  const randomBytes = crypto.getRandomValues(new Uint8Array(10));

  // Set version (7) in the first 4 bits of the 7th byte (index 0 in our random bytes)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  randomBytes[0] = (randomBytes[0]! & 0x0f) | 0x70;

  // Set variant (10) in the first 2 bits of the 9th byte (index 2 in our random bytes)
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  randomBytes[2] = (randomBytes[2]! & 0x3f) | 0x80;

  // Convert random bytes to hex
  const randomHex = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Construct UUIDv7 string
  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-${randomHex.slice(0, 4)}-${randomHex.slice(4, 8)}-${randomHex.slice(8, 20)}`;
}

/**
 * Generate multiple UUIDv7 values
 */
export function generateUUIDv7Batch(count: number): string[] {
  return Array.from({ length: count }, () => generateUUIDv7());
}

/**
 * Validate if a string is a valid UUID format
 */
export function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

/**
 * Extract timestamp from UUIDv7 (if it's a valid UUIDv7)
 */
export function extractTimestampFromUUIDv7(uuid: string): Date | null {
  if (!isValidUUID(uuid)) {
    return null;
  }

  // Extract the first 48 bits (12 hex chars) which contain the timestamp
  const timeHex = uuid.replace(/-/g, '').slice(0, 12);
  const timestamp = parseInt(timeHex, 16);

  // Check if timestamp is reasonable (after 2020-01-01)
  if (timestamp < 1577836800000) {
    return null;
  }

  return new Date(timestamp);
}

/**
 * Check if a UUID is likely a UUIDv7 (based on version field and timestamp)
 */
export function isUUIDv7(uuid: string): boolean {
  if (!isValidUUID(uuid)) {
    return false;
  }

  // Check version field (should be 7)
  const version = parseInt(uuid.charAt(14), 16);
  if (version !== 7) {
    return false;
  }

  // Check if timestamp is reasonable
  const timestamp = extractTimestampFromUUIDv7(uuid);
  if (!timestamp) {
    return false;
  }

  // Check if timestamp is not in the future
  return timestamp.getTime() <= Date.now() + 60000; // Allow 1 minute clock skew
}
