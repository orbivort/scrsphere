/**
 * Password Reset Email Template
 *
 * Template for password reset emails sent when a user requests to reset their password.
 * Includes a secure reset link with expiration notice.
 */

import type { BaseTemplateData, RenderedEmail } from './BaseEmailTemplate.js';
import { BaseEmailTemplate } from './BaseEmailTemplate.js';

/**
 * Data required for the password reset email template
 */
export interface PasswordResetTemplateData extends BaseTemplateData {
  /** User's first name */
  firstName: string;
  /** User's email address */
  email: string;
  /** URL for the password reset page */
  resetUrl: string;
  /** Human-readable expiration time (e.g., "1 hour") */
  expiresIn: string;
}

/**
 * Internal interface for template rendering with content
 */
interface TemplateRenderData extends PasswordResetTemplateData {
  /** The main content to insert into the template */
  content: string;
}

/**
 * Password Reset Email Template
 *
 * Renders HTML and plain text versions of the password reset email.
 */
export class PasswordResetTemplate extends BaseEmailTemplate<PasswordResetTemplateData> {
  /**
   * Get the template name
   *
   * @returns The name of the template
   */
  getTemplateName(): string {
    return 'password-reset';
  }

  /**
   * Render the password reset email
   *
   * @param data - The data to use for rendering
   * @returns Object containing html and text versions
   */
  render(data: PasswordResetTemplateData): RenderedEmail {
    const htmlContent = this.generateHtmlContent(data);
    const textContent = this.generateTextContent(data);

    const renderData: TemplateRenderData = {
      ...data,
      recipientName: data.firstName,
      content: htmlContent,
    };

    const textRenderData: TemplateRenderData = {
      ...data,
      recipientName: data.firstName,
      content: textContent,
    };

    const html = this.renderHtml(
      this.getBaseHtmlTemplate(renderData),
      renderData as PasswordResetTemplateData
    );

    const text = this.renderText(
      this.getBaseTextTemplate(textRenderData),
      textRenderData as PasswordResetTemplateData
    );

    return { html, text };
  }

  /**
   * Generate the HTML content for the email body
   *
   * @param data - The template data
   * @returns HTML content string
   */
  private generateHtmlContent(data: PasswordResetTemplateData): string {
    return `
      <h2 style="margin: 0 0 16px 0; color: #111827; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 600;">Reset Your Password</h2>

      <p style="margin: 0 0 16px 0; color: #374151; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6;">We received a request to reset the password for your account associated with <strong>${data.email}</strong>.</p>

      <p style="margin: 0 0 16px 0; color: #374151; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6;">Click the button below to create a new password:</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
        <tr>
          <td align="center">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${data.resetUrl}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="12%" strokecolor="#667eea" fillcolor="#667eea">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;">Reset Password</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${data.resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none !important; border-radius: 6px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; text-align: center; border: 1px solid #667eea;">
              Reset Password
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0;">
        <tr>
          <td style="padding: 16px 20px;">
            <p style="margin: 0; color: #92400e; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <strong>This link will expire in ${data.expiresIn}.</strong> For security reasons, please reset your password promptly.
            </p>
          </td>
        </tr>
      </table>

      <p style="margin-top: 24px; margin-bottom: 8px; color: #374151; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6;">If the button above doesn't work, copy and paste the following link into your browser:</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 12px 16px;">
        <tr>
          <td style="padding: 12px 16px;">
            <p style="word-break: break-all; color: #6b7280; font-size: 14px; margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              ${data.resetUrl}
            </p>
          </td>
        </tr>
      </table>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

      <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <strong>Security Notice:</strong> If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
      </p>

      <p style="color: #6b7280; font-size: 14px; margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        If you have any questions or need assistance, please contact our support team.
      </p>
    `;
  }

  /**
   * Generate the plain text content for the email body
   *
   * @param data - The template data
   * @returns Plain text content string
   */
  private generateTextContent(data: PasswordResetTemplateData): string {
    return `
RESET YOUR PASSWORD

We received a request to reset the password for your account associated with ${data.email}.

To create a new password, please visit the following link:

${data.resetUrl}

IMPORTANT: This link will expire in ${data.expiresIn}. For security reasons, please reset your password promptly.

--------------------------------------------------------------------------------

SECURITY NOTICE: If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.

If you have any questions or need assistance, please contact our support team.
    `.trim();
  }

  /**
   * Get the base HTML template with content placeholder replaced
   *
   * @returns Base HTML template string
   */
  private getBaseHtmlTemplate(data: TemplateRenderData): string {
    const greeting = data.recipientName
      ? `<p style="margin-bottom: 24px;">Hello <strong>{{recipientName}}</strong>,</p>`
      : `<p style="margin-bottom: 24px;">Hello,</p>`;

    const supportSection = data.supportEmail
      ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px;">Need help? Contact us at <a href="mailto:{{supportEmail}}" style="color: #6b7280; text-decoration: underline;">{{supportEmail}}</a></p>`
      : '';

    return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{{subject}}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <style type="text/css">
    table { border-collapse: collapse; }
    td, th, div, p, a, h1, h2, h3, h4, h5, h6 { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; }
  </style>
  <![endif]-->
  <style>
    @media only screen and (max-width: 600px) {
      .email-container { width: 100% !important; border-radius: 0 !important; }
      .email-header-cell { padding: 24px 20px !important; }
      .email-content-cell { padding: 24px 20px !important; }
      .email-footer-cell { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; width: 100% !important; height: 100% !important; background-color: #f9fafb;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="width: 100%; background-color: #f9fafb;">
    <tr>
      <td align="center" style="padding: 24px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
          <!-- Header -->
          <tr>
            <td class="email-header-cell" style="background-color: #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px 40px; text-align: center;">
              <!--[if gte mso 9]>
              <v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;">
                <v:fill type="gradient" color="#667eea" color2="#764ba2" />
                <v:textbox style="mso-fit-shape-to-text:true" inset="0,0,0,0">
              <![endif]-->
              <h1 style="margin: 0; color: #ffffff; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">
                <span style="font-size: 18px; font-weight: 600;">{{appName}}</span>
              </h1>
              <!--[if gte mso 9]>
                </v:textbox>
              </v:rect>
              <![endif]-->
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td class="email-content-cell" style="padding: 40px;">
              <!-- Greeting -->
              ${greeting}

              <!-- Main content area -->
              {{content}}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer-cell" style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px;">Thank you for using <strong>{{appName}}</strong>.</p>
              ${supportSection}
              <div style="margin: 12px 0;">
                <a href="{{appUrl}}" style="display: inline-block; margin: 0 12px; color: #374151; text-decoration: none; font-size: 14px;">Visit {{appName}}</a>
              </div>
              <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
                &copy; {{currentYear}} {{appName}}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  /**
   * Get the base text template with content placeholder replaced
   *
   * @returns Base text template string
   */
  private getBaseTextTemplate(data: TemplateRenderData): string {
    const greeting = data.recipientName ? `Hello {{recipientName}},` : `Hello,`;

    const supportSection = data.supportEmail ? `\n\nNeed help? Contact us at {{supportEmail}}` : '';

    return `================================================================================
                              {{appName}}
================================================================================

${greeting}

{{content}}

--------------------------------------------------------------------------------

Thank you for using {{appName}}.${supportSection}

Visit us at: {{appUrl}}

Copyright (c) {{currentYear}} {{appName}}. All rights reserved.`;
  }
}
