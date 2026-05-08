/**
 * Email Service
 *
 * Core email service that provides a unified interface for sending emails.
 * Selects the appropriate provider based on configuration and logs all
 * email operations to the database.
 */

import { randomUUID } from 'node:crypto';
import prisma from '../../utils/prisma.js';
import { logger } from '../../utils/logger.js';
import { config } from '../../config/index.js';
import { SMTPProvider, type SMTPConfig } from './providers/SMTPProvider.js';
import { TestProvider, type TestProviderConfig } from './providers/TestProvider.js';
import type {
  IEmailProvider,
  SendEmailInput,
  EmailMessage,
  EmailResult,
  EmailAddress,
} from './types/index.js';

/**
 * Email Service
 *
 * Provides a unified interface for sending emails with support for:
 * - Multiple email providers (SMTP, SendGrid, SES)
 * - Test mode for development
 * - Database logging for all email operations
 * - Input validation and error handling
 */
export class EmailService {
  private provider: IEmailProvider;
  private readonly defaultFrom: EmailAddress;
  private readonly defaultReplyTo?: EmailAddress;

  constructor() {
    // Initialize the appropriate provider based on configuration
    this.provider = this.initializeProvider();

    // Set default sender information
    this.defaultFrom = {
      name: config.email.defaults.fromName,
      address: config.email.defaults.fromAddress,
    };

    // Set default reply-to if configured
    if (config.email.defaults.replyTo) {
      this.defaultReplyTo = {
        address: config.email.defaults.replyTo,
      };
    }

    logger.info('Email service initialized', {
      provider: this.provider.name,
      testMode: config.email.testMode.enabled,
      defaultFrom: this.defaultFrom.address,
    });
  }

  /**
   * Initialize the appropriate email provider based on configuration
   * @returns The initialized email provider
   */
  private initializeProvider(): IEmailProvider {
    // Use TestProvider if test mode is enabled
    if (config.email.testMode.enabled) {
      const testConfig: TestProviderConfig = {
        outputDir: config.email.testMode.outputDirectory,
        logToConsole: config.email.testMode.logToConsole,
        saveToFile: config.email.testMode.saveToFile,
      };
      return new TestProvider(testConfig);
    }

    // Select provider based on configuration
    switch (config.email.provider) {
      case 'smtp': {
        const smtpConfig: SMTPConfig = {
          host: config.email.smtp.host,
          port: config.email.smtp.port,
          secure: config.email.smtp.secure,
          auth: {
            user: config.email.smtp.auth.user,
            pass: config.email.smtp.auth.pass,
          },
          pool: config.email.smtp.pool,
          maxConnections: config.email.smtp.maxConnections,
          defaultFrom: this.defaultFrom,
        };
        return new SMTPProvider(smtpConfig);
      }

      case 'sendgrid':
        // TODO: Implement SendGrid provider
        throw new Error('SendGrid provider is not yet implemented');

      case 'ses':
        // TODO: Implement SES provider
        throw new Error('SES provider is not yet implemented');

      default:
        throw new Error(`Unknown email provider: ${config.email.provider}`);
    }
  }

  /**
   * Send a single email
   * @param input - The email input data
   * @returns Promise resolving to the send result
   */
  async send(input: SendEmailInput): Promise<EmailResult> {
    try {
      // Validate input
      this.validateInput(input);

      // Build email message
      const message = this.buildEmailMessage(input);

      // Send email via provider
      const result = await this.provider.send(message);

      // Log to database
      await this.logEmailToDatabase(input, result, this.provider.name);

      if (result.success) {
        logger.info('Email sent successfully', {
          to: this.formatRecipients(input.to),
          subject: input.subject,
          messageId: result.messageId,
          provider: this.provider.name,
        });
      } else {
        logger.warn('Email send failed', {
          to: this.formatRecipients(input.to),
          subject: input.subject,
          error: result.error,
          provider: this.provider.name,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Email service error', {
        to: this.formatRecipients(input.to),
        subject: input.subject,
        error: errorMessage,
      });

      // Return a failed result
      const failedResult: EmailResult = {
        success: false,
        error: {
          code: 'SERVICE_ERROR',
          message: errorMessage,
        },
      };

      // Attempt to log the failure
      try {
        await this.logEmailToDatabase(input, failedResult, this.provider.name);
      } catch (logError) {
        logger.error('Failed to log email to database', { error: logError });
      }

      return failedResult;
    }
  }

  /**
   * Send multiple emails in a batch
   * @param inputs - Array of email input data
   * @returns Promise resolving to an array of send results
   */
  async sendBatch(inputs: SendEmailInput[]): Promise<EmailResult[]> {
    const results: EmailResult[] = [];

    for (const input of inputs) {
      const result = await this.send(input);
      results.push(result);
    }

    logger.info('Batch email send completed', {
      total: inputs.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    });

    return results;
  }

  /**
   * Check if the email provider is healthy and ready to send emails
   * @returns Promise resolving to true if healthy, false otherwise
   */
  async isHealthy(): Promise<boolean> {
    try {
      return await this.provider.isHealthy();
    } catch (error) {
      logger.error('Email provider health check failed', { error });
      return false;
    }
  }

  /**
   * Get the current email provider instance
   * @returns The email provider
   */
  getProvider(): IEmailProvider {
    return this.provider;
  }

  /**
   * Validate email input
   * @param input - The email input to validate
   * @throws BadRequestError if validation fails
   */
  private validateInput(input: SendEmailInput): void {
    if (input.to.length === 0) {
      throw new Error('Email recipient (to) is required');
    }

    if (!input.subject || input.subject.trim().length === 0) {
      throw new Error('Email subject is required');
    }

    // Validate email addresses
    for (const recipient of input.to) {
      const address = typeof recipient === 'string' ? recipient : recipient.address;
      if (!this.isValidEmail(address)) {
        throw new Error(`Invalid email address: ${address}`);
      }
    }

    // Validate that either html or text is provided
    if (!input.html && !input.text) {
      throw new Error('Email content (html or text) is required');
    }
  }

  /**
   * Build an EmailMessage from SendEmailInput
   * @param input - The email input
   * @returns The constructed email message
   */
  private buildEmailMessage(input: SendEmailInput): EmailMessage {
    const message: EmailMessage = {
      from: this.defaultFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      attachments: input.attachments,
      metadata: input.metadata,
    };

    // Add reply-to if configured
    if (this.defaultReplyTo) {
      message.replyTo = this.defaultReplyTo;
    }

    return message;
  }

  /**
   * Log email operation to the database
   * @param input - The email input
   * @param result - The send result
   * @param providerName - The name of the provider used
   */
  private async logEmailToDatabase(
    input: SendEmailInput,
    result: EmailResult,
    providerName: string
  ): Promise<void> {
    try {
      // Determine email type from metadata or default to NOTIFICATION
      const emailType = (input.metadata?.type as string) || 'NOTIFICATION';

      // Map result to status
      const status = result.success ? 'SENT' : 'FAILED';

      // Get the first recipient email for logging
      const firstRecipient = input.to[0];
      if (!firstRecipient) {
        logger.warn('No recipient found for email log', { subject: input.subject });
        return;
      }
      const email = typeof firstRecipient === 'string' ? firstRecipient : firstRecipient.address;

      await prisma.emailLog.create({
        data: {
          id: randomUUID(),
          email,
          type: emailType as
            | 'PASSWORD_RESET'
            | 'EMAIL_VERIFICATION'
            | 'WELCOME'
            | 'PASSWORD_CHANGE'
            | 'ACCOUNT_DELETION'
            | 'TEAM_INVITATION'
            | 'NOTIFICATION',
          subject: input.subject,
          status: status as
            | 'PENDING'
            | 'SENT'
            | 'DELIVERED'
            | 'FAILED'
            | 'BOUNCED'
            | 'OPENED'
            | 'CLICKED',
          provider: providerName,
          messageId: result.messageId,
          errorMessage: result.error?.message,
          metadata: input.metadata ?? {},
          testMode: config.email.testMode.enabled,
          sentAt: result.success ? new Date() : null,
        },
      });
    } catch (error) {
      // Log error but don't throw - we don't want to fail the email send
      logger.error('Failed to log email to database', {
        error: error instanceof Error ? error.message : 'Unknown error',
        recipient: this.formatRecipients(input.to),
      });
    }
  }

  /**
   * Validate an email address format
   * @param email - The email address to validate
   * @returns True if valid, false otherwise
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Format recipients for logging
   * @param recipients - The recipients array
   * @returns Formatted string of recipients
   */
  private formatRecipients(recipients: EmailAddress[] | string[]): string {
    return recipients.map((r) => (typeof r === 'string' ? r : r.address)).join(', ');
  }
}

// Export singleton instance
export const emailService = new EmailService();
