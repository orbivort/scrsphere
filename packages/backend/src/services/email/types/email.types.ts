/**
 * Email Types and Interfaces
 *
 * Core type definitions for the email service and providers.
 */

/**
 * Represents an email address with an optional display name
 */
export interface EmailAddress {
  /** Display name for the email address (optional) */
  name?: string;
  /** The email address (required) */
  address: string;
}

/**
 * Represents an email attachment
 */
export interface EmailAttachment {
  /** The filename for the attachment */
  filename: string;
  /** The content of the attachment as a Buffer or base64 encoded string */
  content: Buffer | string;
  /** MIME type of the attachment (e.g., 'application/pdf') */
  contentType?: string;
  /** Encoding for the content (e.g., 'base64', 'utf-8') */
  encoding?: string;
}

/**
 * Represents an email message to be sent
 */
export interface EmailMessage {
  /** The sender email address */
  from: EmailAddress | string;
  /** The primary recipient(s) */
  to: EmailAddress[] | string[];
  /** CC recipient(s) (optional) */
  cc?: EmailAddress[] | string[];
  /** BCC recipient(s) (optional) */
  bcc?: EmailAddress[] | string[];
  /** Reply-to address (optional) */
  replyTo?: EmailAddress | string;
  /** The email subject line */
  subject: string;
  /** HTML body content */
  html?: string;
  /** Plain text body content (optional, for fallback) */
  text?: string;
  /** Email attachments (optional) */
  attachments?: EmailAttachment[];
  /** Custom email headers (optional) */
  headers?: Record<string, string>;
  /** Tags for tracking and categorization (optional) */
  tags?: string[];
  /** Additional metadata for tracking (optional) */
  metadata?: Record<string, string>;
}

/**
 * Result of an email send operation
 */
export interface EmailResult {
  /** Whether the email was sent successfully */
  success: boolean;
  /** The message ID from the email provider (optional) */
  messageId?: string;
  /** Error information if the send failed (optional) */
  error?: EmailError;
}

/**
 * Represents an email-related error
 */
export interface EmailError {
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Additional error details (optional) */
  details?: Record<string, unknown>;
}

/**
 * Interface for email provider implementations
 *
 * Email providers must implement this interface to be used with the email service.
 */
export interface IEmailProvider {
  /** The name of the email provider (e.g., 'sendgrid', 'mailgun', 'ses') */
  readonly name: string;

  /**
   * Send a single email
   * @param email - The email message to send
   * @returns Promise resolving to the send result
   */
  send(email: EmailMessage): Promise<EmailResult>;

  /**
   * Send multiple emails in a batch
   * @param emails - Array of email messages to send
   * @returns Promise resolving to an array of send results
   */
  sendBatch(emails: EmailMessage[]): Promise<EmailResult[]>;

  /**
   * Check if the email provider is healthy and ready to send emails
   * @returns Promise resolving to true if healthy, false otherwise
   */
  isHealthy(): Promise<boolean>;

  /**
   * Handle webhook events from the email provider (optional)
   * @param payload - The webhook payload
   * @param headers - The webhook headers
   * @returns Promise resolving to success status
   */
  handleWebhook?(payload: unknown, headers?: Record<string, string>): Promise<{ success: boolean }>;
}

/**
 * Input for the email service public API
 *
 * This is the simplified interface for sending emails through the email service.
 */
export interface SendEmailInput {
  /** The primary recipient(s) */
  to: EmailAddress[] | string[];
  /** The email subject line */
  subject: string;
  /** HTML body content (optional if template is provided) */
  html?: string;
  /** Plain text body content (optional) */
  text?: string;
  /** Template name for templated emails (optional) */
  template?: string;
  /** Data to populate the template (optional) */
  templateData?: Record<string, unknown>;
  /** Email attachments (optional) */
  attachments?: EmailAttachment[];
  /** Additional metadata for tracking (optional) */
  metadata?: Record<string, string>;
}

/**
 * Base configuration for email providers
 */
export interface EmailProviderConfig {
  /** Whether this provider is enabled */
  enabled: boolean;
  /** Default sender email address */
  defaultFrom?: EmailAddress | string;
  /** Default reply-to address */
  defaultReplyTo?: EmailAddress | string;
  /** Custom headers to include in all emails */
  defaultHeaders?: Record<string, string>;
  /** Tags to include in all emails */
  defaultTags?: string[];
  /** Timeout for API requests in milliseconds */
  timeout?: number;
  /** Maximum number of retry attempts */
  maxRetries?: number;
}
