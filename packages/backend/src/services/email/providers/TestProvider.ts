/**
 * Test Email Provider
 *
 * A test provider that captures emails for testing purposes.
 * Does NOT send real emails - instead logs them to console and/or saves to files.
 */

import type {
  EmailAddress,
  EmailMessage,
  EmailResult,
  IEmailProvider,
} from '../types/email.types.js';
import { logger } from '../../../utils/logger.js';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';

/**
 * Configuration for the Test Provider
 */
export interface TestProviderConfig {
  /** Directory to save email files (default: 'test-emails') */
  outputDir?: string;
  /** Whether to log emails to console (default: true) */
  logToConsole?: boolean;
  /** Whether to save emails to files (default: true) */
  saveToFile?: boolean;
}

/**
 * Captured email data structure
 */
interface CapturedEmail {
  id: string;
  messageId: string;
  timestamp: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  subject: string;
  html?: string;
  text?: string;
  attachments: Array<{
    filename: string;
    contentType?: string;
    size: number;
  }>;
  headers?: Record<string, string>;
  tags?: string[];
  metadata?: Record<string, string>;
}

/**
 * Test Email Provider
 *
 * Captures emails for testing without sending real emails.
 * Useful for integration tests, development, and debugging.
 */
export class TestProvider implements IEmailProvider {
  readonly name = 'test';

  private readonly outputDir: string;
  private readonly logToConsole: boolean;
  private readonly saveToFile: boolean;
  private readonly capturedEmails: Map<string, CapturedEmail> = new Map();

  constructor(config?: TestProviderConfig) {
    this.outputDir = config?.outputDir ?? 'test-emails';
    this.logToConsole = config?.logToConsole ?? true;
    this.saveToFile = config?.saveToFile ?? true;

    // Ensure output directory exists if saving to files
    if (this.saveToFile) {
      this.ensureOutputDirectory();
    }

    logger.info('Test email provider initialized', {
      outputDir: this.outputDir,
      logToConsole: this.logToConsole,
      saveToFile: this.saveToFile,
    });
  }

  /**
   * Send an email (captures it for testing)
   */
  async send(email: EmailMessage): Promise<EmailResult> {
    const emailId = randomUUID();
    const messageId = `<${emailId}@test-provider.local>`;
    const timestamp = new Date().toISOString();

    // Build captured email object
    const capturedEmail: CapturedEmail = {
      id: emailId,
      messageId,
      timestamp,
      from: this.formatAddress(email.from),
      to: this.formatAddresses(email.to),
      cc: email.cc ? this.formatAddresses(email.cc) : undefined,
      bcc: email.bcc ? this.formatAddresses(email.bcc) : undefined,
      replyTo: email.replyTo ? this.formatAddress(email.replyTo) : undefined,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments:
        email.attachments?.map((att) => ({
          filename: att.filename,
          contentType: att.contentType,
          size: typeof att.content === 'string' ? att.content.length : att.content.length,
        })) ?? [],
      headers: email.headers,
      tags: email.tags,
      metadata: email.metadata,
    };

    // Store in memory
    this.capturedEmails.set(emailId, capturedEmail);

    // Log to console if enabled
    if (this.logToConsole) {
      this.logEmailToConsole(capturedEmail);
    }

    // Save to files if enabled
    if (this.saveToFile) {
      await this.saveEmailToFiles(capturedEmail);
    }

    logger.debug('Email captured by test provider', {
      emailId,
      messageId,
      subject: email.subject,
      to: capturedEmail.to,
    });

    return {
      success: true,
      messageId,
    };
  }

  /**
   * Send multiple emails in a batch
   */
  async sendBatch(emails: EmailMessage[]): Promise<EmailResult[]> {
    logger.debug('Sending batch of emails via test provider', {
      count: emails.length,
    });

    const results: EmailResult[] = [];

    for (const email of emails) {
      const result = await this.send(email);
      results.push(result);
    }

    return results;
  }

  /**
   * Check if the provider is healthy
   * Always returns true for the test provider
   */
  async isHealthy(): Promise<boolean> {
    return true;
  }

  /**
   * Handle webhook events (no-op for test provider)
   */
  async handleWebhook(
    _payload: unknown,
    _headers?: Record<string, string>
  ): Promise<{ success: boolean }> {
    logger.debug('Test provider received webhook (no-op)');
    return { success: true };
  }

  /**
   * Get all captured emails
   */
  getCapturedEmails(): CapturedEmail[] {
    return Array.from(this.capturedEmails.values());
  }

  /**
   * Get a specific captured email by ID
   */
  getCapturedEmail(id: string): CapturedEmail | undefined {
    return this.capturedEmails.get(id);
  }

  /**
   * Clear all captured emails
   */
  clearCapturedEmails(): void {
    this.capturedEmails.clear();
    logger.debug('All captured emails cleared');
  }

  /**
   * Get the count of captured emails
   */
  getCapturedEmailCount(): number {
    return this.capturedEmails.size;
  }

  // ==================== Private Helper Methods ====================

  /**
   * Format a single email address
   */
  private formatAddress(address: EmailAddress | string): string {
    if (typeof address === 'string') {
      return address;
    }
    return address.name ? `${address.name} <${address.address}>` : address.address;
  }

  /**
   * Format multiple email addresses
   */
  private formatAddresses(addresses: EmailAddress[] | string[]): string[] {
    return addresses.map((addr) => this.formatAddress(addr));
  }

  /**
   * Log email details to console with clear formatting
   */
  private logEmailToConsole(email: CapturedEmail): void {
    const separator = '='.repeat(60);
    const sectionSeparator = '-'.repeat(40);

    console.log(`\n${separator}`);
    console.log('TEST EMAIL CAPTURED');
    console.log(separator);
    console.log(`ID:          ${email.id}`);
    console.log(`Message-ID:  ${email.messageId}`);
    console.log(`Timestamp:   ${email.timestamp}`);
    console.log(sectionSeparator);
    console.log(`From:        ${email.from}`);
    console.log(`To:          ${email.to.join(', ')}`);
    if (email.cc && email.cc.length > 0) {
      console.log(`CC:          ${email.cc.join(', ')}`);
    }
    if (email.bcc && email.bcc.length > 0) {
      console.log(`BCC:         ${email.bcc.join(', ')}`);
    }
    if (email.replyTo) {
      console.log(`Reply-To:    ${email.replyTo}`);
    }
    console.log(sectionSeparator);
    console.log(`Subject:     ${email.subject}`);
    console.log(sectionSeparator);

    if (email.text) {
      console.log('Plain Text Body:');
      console.log(email.text);
      console.log(sectionSeparator);
    }

    if (email.html) {
      console.log('HTML Body:');
      console.log(email.html.substring(0, 500) + (email.html.length > 500 ? '...' : ''));
      console.log(sectionSeparator);
    }

    if (email.attachments.length > 0) {
      console.log('Attachments:');
      email.attachments.forEach((att) => {
        console.log(`  - ${att.filename} (${att.contentType ?? 'unknown'}, ${att.size} bytes)`);
      });
      console.log(sectionSeparator);
    }

    if (email.headers && Object.keys(email.headers).length > 0) {
      console.log('Headers:');
      Object.entries(email.headers).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
      console.log(sectionSeparator);
    }

    if (email.tags && email.tags.length > 0) {
      console.log(`Tags: ${email.tags.join(', ')}`);
    }

    if (email.metadata && Object.keys(email.metadata).length > 0) {
      console.log('Metadata:');
      Object.entries(email.metadata).forEach(([key, value]) => {
        console.log(`  ${key}: ${value}`);
      });
    }

    console.log(`${separator}\n`);
  }

  /**
   * Save email to JSON, HTML, and TXT files
   */
  private async saveEmailToFiles(email: CapturedEmail): Promise<void> {
    const emailDir = path.join(this.outputDir, email.id);

    try {
      // Create directory for this email
      await fs.promises.mkdir(emailDir, { recursive: true });

      // Save JSON file
      const jsonPath = path.join(emailDir, 'email.json');
      await fs.promises.writeFile(jsonPath, JSON.stringify(email, null, 2), 'utf-8');

      // Save HTML file
      if (email.html) {
        const htmlPath = path.join(emailDir, 'email.html');
        await fs.promises.writeFile(htmlPath, email.html, 'utf-8');
      }

      // Save TXT file
      const txtPath = path.join(emailDir, 'email.txt');
      const txtContent = this.formatEmailAsText(email);
      await fs.promises.writeFile(txtPath, txtContent, 'utf-8');

      logger.debug('Email saved to files', {
        emailId: email.id,
        directory: emailDir,
      });
    } catch (error) {
      logger.error('Failed to save email to files', {
        emailId: email.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Format email as plain text for .txt file
   */
  private formatEmailAsText(email: CapturedEmail): string {
    const lines: string[] = [
      `ID: ${email.id}`,
      `Message-ID: ${email.messageId}`,
      `Timestamp: ${email.timestamp}`,
      '',
      `From: ${email.from}`,
      `To: ${email.to.join(', ')}`,
    ];

    if (email.cc && email.cc.length > 0) {
      lines.push(`CC: ${email.cc.join(', ')}`);
    }

    if (email.bcc && email.bcc.length > 0) {
      lines.push(`BCC: ${email.bcc.join(', ')}`);
    }

    if (email.replyTo) {
      lines.push(`Reply-To: ${email.replyTo}`);
    }

    lines.push('', `Subject: ${email.subject}`, '');

    if (email.text) {
      lines.push('--- Plain Text Body ---', email.text, '');
    }

    if (email.html) {
      lines.push('--- HTML Body ---', email.html, '');
    }

    if (email.attachments.length > 0) {
      lines.push('--- Attachments ---');
      email.attachments.forEach((att) => {
        lines.push(`  ${att.filename} (${att.contentType ?? 'unknown'}, ${att.size} bytes)`);
      });
      lines.push('');
    }

    if (email.headers && Object.keys(email.headers).length > 0) {
      lines.push('--- Headers ---');
      Object.entries(email.headers).forEach(([key, value]) => {
        lines.push(`  ${key}: ${value}`);
      });
      lines.push('');
    }

    if (email.tags && email.tags.length > 0) {
      lines.push(`Tags: ${email.tags.join(', ')}`);
    }

    if (email.metadata && Object.keys(email.metadata).length > 0) {
      lines.push('--- Metadata ---');
      Object.entries(email.metadata).forEach(([key, value]) => {
        lines.push(`  ${key}: ${value}`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Ensure the output directory exists
   */
  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      logger.debug('Created test email output directory', {
        path: this.outputDir,
      });
    }
  }
}
