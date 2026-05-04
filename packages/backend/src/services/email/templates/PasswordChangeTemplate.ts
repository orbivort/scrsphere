/**
 * Password Change Confirmation Email Template
 *
 * Sent to users when they successfully change their password.
 * Includes security information and optional device details.
 */

import {
  BaseEmailTemplate,
  type BaseTemplateData,
  type RenderedEmail,
} from './BaseEmailTemplate.js';

/**
 * Data required for the password change confirmation email
 */
export interface PasswordChangeTemplateData extends BaseTemplateData {
  /** Recipient's first name */
  firstName: string;
  /** Recipient's email address */
  email: string;
  /** Timestamp of when the password was changed */
  changedAt: string;
  /** IP address from which the change was made (optional) */
  ipAddress?: string;
  /** User agent string of the device used (optional) */
  userAgent?: string;
}

/**
 * Password Change Confirmation Email Template
 *
 * Provides both HTML and text versions of the password change confirmation email.
 */
export class PasswordChangeTemplate extends BaseEmailTemplate<PasswordChangeTemplateData> {
  /**
   * Get the template name
   *
   * @returns The name of the template
   */
  getTemplateName(): string {
    return 'password-change-confirmation';
  }

  /**
   * Render the password change confirmation email
   *
   * @param data - The data to use for rendering
   * @returns Object containing html and text versions
   */
  render(data: PasswordChangeTemplateData): RenderedEmail {
    const html = this.renderHtml(this.getHtmlTemplate(data), data);
    const text = this.renderText(this.getTextTemplate(data), data);
    return { html, text };
  }

  /**
   * Get the HTML template
   *
   * @returns The HTML template string
   */
  private getHtmlTemplate(data: PasswordChangeTemplateData): string {
    const deviceInfoSection =
      data.ipAddress || data.userAgent
        ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0fdf4; border-left: 4px solid #22c55e; margin: 20px 0;">
          <tr>
            <td style="padding: 16px 20px;">
              <p style="margin: 0 0 8px 0; color: #166534; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><span style="font-weight: 600; color: #14532d;">IP Address:</span> {{ipAddress}}</p>
              <p style="margin: 0; color: #166534; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><span style="font-weight: 600; color: #14532d;">Device:</span> {{userAgent}}</p>
            </td>
          </tr>
        </table>`
        : '';

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
              <!-- Success Indicator -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align: center; margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 64px; height: 64px; background-color: #dcfce7; border-radius: 50%;">
                      <tr>
                        <td align="center" valign="middle" style="width: 64px; height: 64px; text-align: center; vertical-align: middle;">
                          <span style="color: #16a34a; font-size: 32px; font-weight: bold;">&#10003;</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="color: #16a34a; font-size: 18px; font-weight: 600; margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Password Changed Successfully</p>
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #374151; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6;">Hello <strong>{{firstName}}</strong>,</p>

              <p style="margin: 0 0 16px 0; color: #374151; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6;">Your password for your <strong>{{appName}}</strong> account has been successfully changed.</p>

              <!-- Change Details -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0fdf4; border-left: 4px solid #22c55e; margin: 20px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 8px 0; color: #166534; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><span style="font-weight: 600; color: #14532d;">Email:</span> {{email}}</p>
                    <p style="margin: 0; color: #166534; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><span style="font-weight: 600; color: #14532d;">Changed on:</span> {{changedAt}}</p>
                  </td>
                </tr>
              </table>

              <!-- Device Information (if available) -->
              ${deviceInfoSection}

              <!-- Security Warning -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><strong>Security Notice:</strong> If you did not make this change, please contact our support team immediately to secure your account.</p>
                  </td>
                </tr>
              </table>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
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
   * Get the plain text template
   *
   * @returns The plain text template string
   */
  private getTextTemplate(data: PasswordChangeTemplateData): string {
    const deviceInfo =
      data.ipAddress || data.userAgent
        ? `\nIP Address: ${data.ipAddress || 'N/A'}\nDevice: ${data.userAgent || 'N/A'}`
        : '';

    const supportSection = data.supportEmail
      ? `\n\nNeed help? Contact us at ${data.supportEmail}`
      : '';

    return `================================================================================
                              {{appName}}
================================================================================

Hello {{firstName}},

Your password for your {{appName}} account has been successfully changed.

ACCOUNT DETAILS
--------------------------------------------------------------------------------
Email: {{email}}
Changed on: {{changedAt}}${deviceInfo}

SECURITY NOTICE
--------------------------------------------------------------------------------
If you did not make this change, please contact our support team immediately
to secure your account.

--------------------------------------------------------------------------------

Thank you for using {{appName}}.${supportSection}

Visit us at: {{appUrl}}

Copyright (c) {{currentYear}} {{appName}}. All rights reserved.`;
  }
}
