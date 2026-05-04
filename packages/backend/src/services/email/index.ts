/**
 * Email Service Exports
 *
 * Main entry point for the email service module.
 * Exports the EmailService class, singleton instance, and all related types.
 */

// Export the EmailService class and singleton instance
export { EmailService, emailService } from './EmailService.js';

// Re-export all types from the types module
export {
  type EmailAddress,
  type EmailAttachment,
  type EmailMessage,
  type EmailResult,
  type EmailError,
  type IEmailProvider,
  type SendEmailInput,
  type EmailProviderConfig,
} from './types/index.js';

// Re-export providers for direct access if needed
export { SMTPProvider, type SMTPConfig, type SMTPAuthConfig } from './providers/SMTPProvider.js';
export { TestProvider, type TestProviderConfig } from './providers/TestProvider.js';
