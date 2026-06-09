#!/usr/bin/env node
/**
 * Configuration Validation Script
 *
 * Validates environment variables before starting the application.
 * Run this before deployment to catch configuration errors early.
 *
 * Usage:
 *   node dist/scripts/validate-config.js
 *   # or in Docker:
 *   docker run --rm --env-file .env.production ghcr.io/orbivort/scrumooth/backend:latest node dist/scripts/validate-config.js
 */

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

interface EnvConfig {
  [key: string]: string | undefined;
}

class ConfigValidator {
  private env: EnvConfig;
  private result: ValidationResult;

  constructor() {
    this.env = process.env;
    this.result = {
      valid: true,
      errors: [],
      warnings: [],
    };
  }

  validate(): ValidationResult {
    console.log('🔍 Validating configuration...\n');

    this.validateRequiredVariables();
    this.validateNodeEnv();
    this.validateJwtSecret();
    this.validateDatabaseUrl();
    this.validateCorsOrigin();
    this.validateEmailConfig();
    this.validatePortConfig();

    return this.result;
  }

  private addError(message: string): void {
    this.result.errors.push(message);
    this.result.valid = false;
  }

  private addWarning(message: string): void {
    this.result.warnings.push(message);
  }

  private validateRequiredVariables(): void {
    const required = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV', 'CORS_ORIGIN', 'FRONTEND_URL'];

    for (const varName of required) {
      if (!this.env[varName]) {
        this.addError(`Missing required environment variable: ${varName}`);
      }
    }
  }

  private validateNodeEnv(): void {
    const nodeEnv = this.env.NODE_ENV;
    if (!nodeEnv) return;

    const validEnvs = ['development', 'production', 'test'];
    if (!validEnvs.includes(nodeEnv)) {
      this.addError(`Invalid NODE_ENV: ${nodeEnv}. Must be one of: ${validEnvs.join(', ')}`);
    }

    if (nodeEnv === 'development') {
      this.addWarning(
        'NODE_ENV is set to "development". Use "production" for production deployments.'
      );
    }
  }

  private validateJwtSecret(): void {
    const jwtSecret = this.env.JWT_SECRET;
    if (!jwtSecret) return;

    if (jwtSecret.length < 64) {
      this.addError(
        `JWT_SECRET is too short (${jwtSecret.length} characters). ` +
          `Must be at least 64 characters for production security. ` +
          `Generate with: openssl rand -hex 64`
      );
    }

    // Check for common weak secrets
    const weakSecrets = ['secret', 'password', 'jwt-secret', 'change-me', 'your-secret-key'];
    if (weakSecrets.some((weak) => jwtSecret.toLowerCase().includes(weak))) {
      this.addError(
        'JWT_SECRET appears to contain a weak or placeholder value. Use a strong, random secret.'
      );
    }
  }

  private validateDatabaseUrl(): void {
    const dbUrl = this.env.DATABASE_URL;
    if (!dbUrl) return;

    try {
      const url = new URL(dbUrl);

      if (!url.protocol.startsWith('postgresql:') && !url.protocol.startsWith('postgres:')) {
        this.addError(
          `Invalid DATABASE_URL protocol: ${url.protocol}. Must be postgresql:// or postgres://`
        );
      }

      if (!url.hostname) {
        this.addError('DATABASE_URL must include a hostname');
      }

      if (!url.pathname || url.pathname === '/') {
        this.addError('DATABASE_URL must include a database name');
      }

      // Check for placeholder values
      if (url.hostname === 'localhost' && this.env.NODE_ENV === 'production') {
        this.addWarning(
          'DATABASE_URL uses localhost in production. Ensure this is correct for your deployment.'
        );
      }
    } catch (error) {
      this.addError(`Invalid DATABASE_URL format: ${dbUrl}`);
    }
  }

  private validateCorsOrigin(): void {
    const corsOrigin = this.env.CORS_ORIGIN;
    if (!corsOrigin) return;

    const origins = corsOrigin.split(',').map((o) => o.trim());

    for (const origin of origins) {
      try {
        const url = new URL(origin);

        if (url.protocol !== 'https:' && this.env.NODE_ENV === 'production') {
          this.addWarning(`CORS_ORIGIN contains non-HTTPS URL in production: ${origin}`);
        }

        // Check for localhost in production
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          if (this.env.NODE_ENV === 'production') {
            this.addError(
              `CORS_ORIGIN contains localhost in production: ${origin}. This is a security risk.`
            );
          }
        }
      } catch (error) {
        this.addError(`Invalid CORS_ORIGIN URL: ${origin}`);
      }
    }
  }

  private validateEmailConfig(): void {
    const emailProvider = this.env.EMAIL_PROVIDER;
    const emailTestMode = this.env.EMAIL_TEST_MODE;

    if (emailProvider && !['smtp', 'sendgrid', 'ses'].includes(emailProvider)) {
      this.addError(
        `Invalid EMAIL_PROVIDER: ${emailProvider}. Must be one of: smtp, sendgrid, ses`
      );
    }

    if (emailTestMode === 'true' && this.env.NODE_ENV === 'production') {
      this.addError(
        'EMAIL_TEST_MODE is set to "true" in production. ' +
          'Emails will NOT be sent. Set EMAIL_TEST_MODE=false for production.'
      );
    }

    // Validate SMTP config if provider is SMTP
    if (emailProvider === 'smtp') {
      if (!this.env.SMTP_HOST) {
        this.addError('SMTP_HOST is required when EMAIL_PROVIDER=smtp');
      }
      if (!this.env.SMTP_USER) {
        this.addError('SMTP_USER is required when EMAIL_PROVIDER=smtp');
      }
      if (!this.env.SMTP_PASS) {
        this.addError('SMTP_PASS is required when EMAIL_PROVIDER=smtp');
      }
    }

    // Validate SendGrid config if provider is SendGrid
    if (emailProvider === 'sendgrid') {
      const apiKey = this.env.SENDGRID_API_KEY;
      if (!apiKey) {
        this.addError('SENDGRID_API_KEY is required when EMAIL_PROVIDER=sendgrid');
      } else if (!apiKey.startsWith('SG.')) {
        this.addError('SENDGRID_API_KEY must start with "SG."');
      }
    }

    // Validate email addresses
    if (this.env.EMAIL_FROM_ADDRESS) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(this.env.EMAIL_FROM_ADDRESS)) {
        this.addError(`Invalid EMAIL_FROM_ADDRESS: ${this.env.EMAIL_FROM_ADDRESS}`);
      }
    }
  }

  private validatePortConfig(): void {
    const port = this.env.PORT;
    if (port) {
      const portNum = parseInt(port, 10);
      if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
        this.addError(`Invalid PORT: ${port}. Must be a number between 1 and 65535`);
      }
    }
  }
}

// Main execution
const validator = new ConfigValidator();
const result = validator.validate();

console.log('═'.repeat(60));

if (result.errors.length > 0) {
  console.log('\n❌ ERRORS:\n');
  result.errors.forEach((error, i) => {
    console.log(`  ${i + 1}. ${error}`);
  });
}

if (result.warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:\n');
  result.warnings.forEach((warning, i) => {
    console.log(`  ${i + 1}. ${warning}`);
  });
}

if (result.valid) {
  console.log('\n✅ Configuration is valid!\n');
  console.log('═'.repeat(60));
  process.exit(0);
} else {
  console.log('\n❌ Configuration validation failed!\n');
  console.log('Please fix the errors above before deploying.\n');
  console.log('═'.repeat(60));
  process.exit(1);
}
