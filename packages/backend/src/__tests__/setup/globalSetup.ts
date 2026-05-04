// Global test setup - runs before all test files
import dotenv from 'dotenv';
import path from 'node:path';

// Load environment variables from .env.test file first for test environment
// This ensures test database is used instead of dev database
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

export default async function setup() {
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  // Force test database URL if not set by .env.test
  process.env.DATABASE_URL =
    process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/scrsphere_test';
  process.env.JWT_SECRET =
    process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-purposes-only';
  process.env.JWT_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.SESSION_IDLE_TIMEOUT_MS = '1800000';
  process.env.SESSION_ABSOLUTE_TIMEOUT_MS = '86400000';
  process.env.SESSION_WARNING_THRESHOLD_MS = '120000';
  process.env.SESSION_CLEANUP_INTERVAL_MS = '3600000';
  process.env.MAX_CONCURRENT_SESSIONS = '5';
  process.env.BCRYPT_SALT_ROUNDS = '10';
  process.env.RATE_LIMIT_WINDOW_MS = '900000';
  process.env.RATE_LIMIT_MAX_REQUESTS = '100';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.LOG_LEVEL = 'error';
  process.env.NOTIFICATION_POLLING_INTERVAL_SECONDS = '5';
  process.env.NOTIFICATION_RETENTION_DAYS = '30';
  process.env.NOTIFICATION_MAX_PAGE_SIZE = '50';
}
