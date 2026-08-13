import { describe, it, expect, beforeEach, vi } from 'vitest';
import nodemailer from 'nodemailer';
import { SMTPProvider, type SMTPConfig } from '../../../services/email/providers/SMTPProvider.js';
import { logger } from '../../../utils/logger.js';
import type { EmailMessage } from '../../../services/email/types/email.types.js';

// Mock nodemailer so tests are deterministic and never touch the network.
vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(),
  },
}));

interface MockTransporter {
  sendMail: ReturnType<typeof vi.fn>;
  verify: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

const baseConfig: SMTPConfig = {
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: 'test-user',
    pass: 'test-pass',
  },
};

const baseEmail: EmailMessage = {
  from: 'sender@example.com',
  to: ['recipient@example.com'],
  subject: 'Test Subject',
  html: '<p>Test content</p>',
};

function createMockTransporter(): MockTransporter {
  const transporter: MockTransporter = {
    sendMail: vi.fn(),
    verify: vi.fn(),
    close: vi.fn(),
  };
  vi.mocked(nodemailer.createTransport).mockReturnValue(transporter as never);
  return transporter;
}

function createNodeError(message: string, code?: string): NodeJS.ErrnoException {
  const err = new Error(message) as NodeJS.ErrnoException;
  err.code = code;
  return err;
}

describe('SMTPProvider', () => {
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    infoSpy = vi.spyOn(logger, 'info').mockImplementation(() => undefined as never);
    errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => undefined as never);
    debugSpy = vi.spyOn(logger, 'debug').mockImplementation(() => undefined as never);
  });

  describe('constructor', () => {
    it('should expose the provider name "smtp"', () => {
      const provider = new SMTPProvider(baseConfig);
      expect(provider.name).toBe('smtp');
    });

    it('should create a transporter with default options', () => {
      new SMTPProvider(baseConfig);

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          auth: { user: 'test-user', pass: 'test-pass' },
          pool: true,
          maxConnections: 5,
          maxMessages: 100,
          connectionTimeout: 30000,
          socketTimeout: 300000,
          tls: { rejectUnauthorized: true },
        })
      );
    });

    it('should use custom values for optional config', () => {
      const customConfig: SMTPConfig = {
        ...baseConfig,
        pool: false,
        maxConnections: 2,
        maxMessages: 50,
        rateLimit: 10,
        connectionTimeout: 5000,
        socketTimeout: 60000,
        tls: { rejectUnauthorized: false },
      };

      new SMTPProvider(customConfig);

      expect(nodemailer.createTransport).toHaveBeenCalledWith(
        expect.objectContaining({
          pool: false,
          maxConnections: 2,
          maxMessages: 50,
          rateLimit: 10,
          connectionTimeout: 5000,
          socketTimeout: 60000,
          tls: { rejectUnauthorized: false },
        })
      );
    });

    it('should log initialization details', () => {
      new SMTPProvider(baseConfig);

      expect(infoSpy).toHaveBeenCalledWith(
        'SMTP Provider initialized',
        expect.objectContaining({
          host: 'smtp.example.com',
          port: 587,
          secure: false,
          pool: true,
          maxConnections: 5,
        })
      );
    });
  });

  describe('send', () => {
    it('should send an email and return success with messageId', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockResolvedValue({ messageId: 'msg-123', response: '250 OK' });
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result).toEqual({ success: true, messageId: 'msg-123' });
      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'sender@example.com',
          to: 'recipient@example.com',
          subject: 'Test Subject',
          html: '<p>Test content</p>',
        })
      );
      expect(infoSpy).toHaveBeenCalledWith(
        'Email sent successfully via SMTP',
        expect.objectContaining({ messageId: 'msg-123', response: '250 OK' })
      );
    });

    it('should format EmailAddress objects and pass through optional fields', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockResolvedValue({ messageId: 'msg-456' });
      const provider = new SMTPProvider(baseConfig);

      const email: EmailMessage = {
        from: { name: 'Sender', address: 'sender@example.com' },
        to: [{ name: 'Recipient', address: 'recipient@example.com' }],
        cc: ['cc@example.com'],
        bcc: [{ name: 'BCC', address: 'bcc@example.com' }],
        replyTo: 'reply@example.com',
        subject: 'Full Email',
        html: '<p>HTML</p>',
        text: 'Plain text',
        attachments: [
          {
            filename: 'report.pdf',
            content: Buffer.from('pdf'),
            contentType: 'application/pdf',
            encoding: 'base64',
          },
        ],
        headers: { 'X-Custom-Header': 'custom-value' },
      };

      await provider.send(email);

      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '"Sender" <sender@example.com>',
          to: '"Recipient" <recipient@example.com>',
          cc: 'cc@example.com',
          bcc: '"BCC" <bcc@example.com>',
          replyTo: 'reply@example.com',
          text: 'Plain text',
          attachments: [
            {
              filename: 'report.pdf',
              content: Buffer.from('pdf'),
              contentType: 'application/pdf',
              encoding: 'base64',
            },
          ],
          headers: { 'X-Custom-Header': 'custom-value' },
        })
      );
    });

    it('should format an EmailAddress without a display name as a plain address', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockResolvedValue({ messageId: 'msg-789' });
      const provider = new SMTPProvider(baseConfig);

      await provider.send({
        ...baseEmail,
        from: { name: '', address: 'noreply@example.com' },
        to: [{ address: 'no-name@example.com' }],
      });

      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: 'noreply@example.com',
          to: 'no-name@example.com',
        })
      );
    });

    it('should return EMAIL_CONNECTION_ERROR for ECONNREFUSED', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(
        createNodeError('connect ECONNREFUSED', 'ECONNREFUSED')
      );
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_CONNECTION_ERROR');
      expect(result.error?.message).toContain('smtp.example.com:587');
      expect(result.error?.details).toEqual(
        expect.objectContaining({
          originalError: 'connect ECONNREFUSED',
          host: 'smtp.example.com',
          port: 587,
        })
      );
      expect(errorSpy).toHaveBeenCalledWith(
        'Failed to send email via SMTP',
        expect.objectContaining({
          code: 'EMAIL_CONNECTION_ERROR',
          to: 'recipient@example.com',
          subject: 'Test Subject',
        })
      );
    });

    it('should return EMAIL_CONNECTION_ERROR for ENOTFOUND', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(
        createNodeError('getaddrinfo ENOTFOUND smtp.example.com', 'ENOTFOUND')
      );
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_CONNECTION_ERROR');
    });

    it('should return EMAIL_CONNECTION_ERROR for ETIMEDOUT', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(createNodeError('connect ETIMEDOUT', 'ETIMEDOUT'));
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_CONNECTION_ERROR');
    });

    it('should return EMAIL_AUTH_ERROR for EAUTH', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(
        createNodeError('Invalid login: 535 Authentication failed', 'EAUTH')
      );
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_AUTH_ERROR');
      expect(result.error?.message).toContain('authentication failed');
      expect(result.error?.details).toEqual(
        expect.objectContaining({ originalError: 'Invalid login: 535 Authentication failed' })
      );
    });

    it('should return EMAIL_AUTH_ERROR for an "Invalid login" message without a code', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(new Error('Invalid login'));
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_AUTH_ERROR');
    });

    it('should return EMAIL_RATE_LIMIT for ERATELIMIT', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(createNodeError('rate limit exceeded', 'ERATELIMIT'));
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_RATE_LIMIT');
      expect(result.error?.details).toEqual(expect.objectContaining({ retryAfter: 60 }));
    });

    it('should return EMAIL_RATE_LIMIT for a "rate limit" message', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(new Error('SMTP rate limit reached, slow down'));
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_RATE_LIMIT');
    });

    it('should return EMAIL_RATE_LIMIT for a "too many" message', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(new Error('too many messages sent'));
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_RATE_LIMIT');
    });

    it('should return EMAIL_CONNECTION_ERROR for ESSL', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(createNodeError('SSL handshake failed', 'ESSL'));
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_CONNECTION_ERROR');
      expect(result.error?.message).toContain('SSL/TLS');
    });

    it('should return EMAIL_CONNECTION_ERROR for a TLS/certificate message', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(
        new Error('certificate is not yet valid - check TLS configuration')
      );
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_CONNECTION_ERROR');
    });

    it('should return EMAIL_CONNECTION_ERROR for ECONNECTION', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(createNodeError('connection timeout', 'ECONNECTION'));
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_CONNECTION_ERROR');
      expect(result.error?.message).toContain('timed out');
    });

    it('should return EMAIL_CONNECTION_ERROR for a "timeout" message', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(
        new Error('socket timeout while waiting for response')
      );
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_CONNECTION_ERROR');
    });

    it('should return EMAIL_PROVIDER_ERROR for a generic error', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(createNodeError('boom'));
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_PROVIDER_ERROR');
      expect(result.error?.message).toBe('boom');
      expect(result.error?.details).toEqual(
        expect.objectContaining({ originalError: 'boom', code: undefined })
      );
    });

    it('should fall back to a default message for a generic error with an empty message', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue(new Error(''));
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_PROVIDER_ERROR');
      expect(result.error?.message).toBe('Unknown SMTP error occurred');
    });

    it('should return EMAIL_PROVIDER_ERROR for a non-Error rejection', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockRejectedValue('unexpected string error');
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.send(baseEmail);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMAIL_PROVIDER_ERROR');
      expect(result.error?.message).toBe('An unexpected error occurred while sending email');
      expect(result.error?.details).toEqual(
        expect.objectContaining({ error: 'unexpected string error' })
      );
    });
  });

  describe('sendBatch', () => {
    it('should return success for all emails in the batch', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail.mockResolvedValue({ messageId: 'msg-batch' });
      const provider = new SMTPProvider(baseConfig);

      const emails: EmailMessage[] = [
        { ...baseEmail, to: ['a@example.com'], subject: 'A' },
        { ...baseEmail, to: ['b@example.com'], subject: 'B' },
      ];

      const results = await provider.sendBatch(emails);

      expect(results).toHaveLength(2);
      expect(results.every((r) => r.success)).toBe(true);
      expect(transporter.sendMail).toHaveBeenCalledTimes(2);
      expect(infoSpy).toHaveBeenCalledWith(
        'Batch email send completed',
        expect.objectContaining({ total: 2, success: 2, failed: 0 })
      );
    });

    it('should return mixed results when some emails fail', async () => {
      const transporter = createMockTransporter();
      transporter.sendMail
        .mockResolvedValueOnce({ messageId: 'ok-1' })
        .mockRejectedValueOnce(createNodeError('connect ECONNREFUSED', 'ECONNREFUSED'));
      const provider = new SMTPProvider(baseConfig);

      const emails: EmailMessage[] = [
        { ...baseEmail, to: ['a@example.com'], subject: 'A' },
        { ...baseEmail, to: ['b@example.com'], subject: 'B' },
      ];

      const results = await provider.sendBatch(emails);

      expect(results).toHaveLength(2);
      expect(results[0]?.success).toBe(true);
      expect(results[1]?.success).toBe(false);
      expect(results[1]?.error?.code).toBe('EMAIL_CONNECTION_ERROR');
      expect(infoSpy).toHaveBeenCalledWith(
        'Batch email send completed',
        expect.objectContaining({ total: 2, success: 1, failed: 1 })
      );
    });

    it('should log the batch debug message', async () => {
      createMockTransporter();
      const provider = new SMTPProvider(baseConfig);

      await provider.sendBatch([]);

      expect(debugSpy).toHaveBeenCalledWith('Sending batch emails via SMTP', { count: 0 });
    });
  });

  describe('isHealthy', () => {
    it('should return true when the transporter verifies successfully', async () => {
      const transporter = createMockTransporter();
      transporter.verify.mockResolvedValue(true);
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.isHealthy();

      expect(result).toBe(true);
      expect(debugSpy).toHaveBeenCalledWith(
        'SMTP health check passed',
        expect.objectContaining({ host: 'smtp.example.com' })
      );
    });

    it('should return false when verification fails with an Error', async () => {
      const transporter = createMockTransporter();
      transporter.verify.mockRejectedValue(new Error('cannot connect'));
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.isHealthy();

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'SMTP health check error',
        expect.objectContaining({ host: 'smtp.example.com', error: 'cannot connect' })
      );
    });

    it('should return false and log "Unknown error" for a non-Error failure', async () => {
      const transporter = createMockTransporter();
      transporter.verify.mockRejectedValue('boom');
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.isHealthy();

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        'SMTP health check error',
        expect.objectContaining({ host: 'smtp.example.com', error: 'Unknown error' })
      );
    });
  });

  describe('handleWebhook', () => {
    it('should return success and ignore the payload', async () => {
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.handleWebhook({ event: 'delivered' });

      expect(result).toEqual({ success: true });
      expect(debugSpy).toHaveBeenCalledWith('SMTP provider does not support webhooks');
    });

    it('should return success when headers are provided', async () => {
      const provider = new SMTPProvider(baseConfig);

      const result = await provider.handleWebhook({}, { 'x-signature': 'sig' });

      expect(result).toEqual({ success: true });
    });
  });

  describe('close', () => {
    it('should close the transporter and log success', () => {
      const transporter = createMockTransporter();
      const provider = new SMTPProvider(baseConfig);

      provider.close();

      expect(transporter.close).toHaveBeenCalledTimes(1);
      expect(infoSpy).toHaveBeenCalledWith(
        'SMTP transporter closed',
        expect.objectContaining({ host: 'smtp.example.com' })
      );
    });

    it('should log an error when closing the transporter throws', () => {
      const transporter = createMockTransporter();
      transporter.close.mockImplementation(() => {
        throw new Error('close failed');
      });
      const provider = new SMTPProvider(baseConfig);

      expect(() => provider.close()).not.toThrow();
      expect(errorSpy).toHaveBeenCalledWith(
        'Error closing SMTP transporter',
        expect.objectContaining({ error: 'close failed' })
      );
    });

    it('should log "Unknown error" when close throws a non-Error value', () => {
      // A thrown value that is not an Error instance (e.g. from a native addon)
      class NonError {
        message = 'close exploded';
      }
      const transporter = createMockTransporter();
      transporter.close.mockImplementation(() => {
        throw new NonError();
      });
      const provider = new SMTPProvider(baseConfig);

      expect(() => provider.close()).not.toThrow();
      expect(errorSpy).toHaveBeenCalledWith(
        'Error closing SMTP transporter',
        expect.objectContaining({ error: 'Unknown error' })
      );
    });
  });
});
