/**
 * Password Reset Email Template
 *
 * Template for password reset emails sent when a user requests to reset their password.
 * Includes a secure reset link with expiration notice.
 */

import type { BaseTemplateData, RenderedEmail } from './BaseEmailTemplate.js';
import { BaseEmailTemplate } from './BaseEmailTemplate.js';
import type { Locale } from '@scrumooth/shared';
import { escapeHtml } from '@scrumooth/shared';
import { i18nInstance } from '../../../i18n/config.js';

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
  /** Recipient's preferred locale */
  locale: Locale;
}

/**
 * Internal interface for template rendering with content
 */
interface TemplateRenderData extends PasswordResetTemplateData {
  /** The main content to insert into the template */
  content: string;
}

/**
 * Pre-resolved localized footer strings passed to base template methods
 */
interface FooterStrings {
  greeting: string;
  needHelp: string;
  thankYouForUsing: string;
  visitApp: string;
  allRightsReserved: string;
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
    const t = i18nInstance.getFixedT(data.locale, 'emails');
    const localizedSubject = t('passwordReset.subject');
    const htmlContent = this.generateHtmlContent(data, t);
    const textContent = this.generateTextContent(data, t);

    const footerStrings: FooterStrings = {
      greeting: t('common.greeting'),
      needHelp: t('common.needHelp'),
      thankYouForUsing: t('common.thankYouForUsing'),
      visitApp: t('common.visitApp'),
      allRightsReserved: t('common.allRightsReserved'),
    };

    const renderData: TemplateRenderData = {
      ...data,
      subject: localizedSubject,
      recipientName: data.firstName,
      content: htmlContent,
      locale: data.locale,
    };

    const textRenderData: TemplateRenderData = {
      ...data,
      subject: localizedSubject,
      recipientName: data.firstName,
      content: textContent,
      locale: data.locale,
    };

    // Escape user-controlled values for HTML output to prevent HTML injection
    const htmlRenderData: TemplateRenderData = {
      ...renderData,
      recipientName: escapeHtml(renderData.recipientName ?? ''),
      subject: escapeHtml(renderData.subject),
      appName: escapeHtml(renderData.appName),
      supportEmail: renderData.supportEmail ? escapeHtml(renderData.supportEmail) : undefined,
    };

    const html = this.renderHtml(
      this.getBaseHtmlTemplate(renderData, footerStrings),
      htmlRenderData
    );

    const text = this.renderText(
      this.getBaseTextTemplate(textRenderData, footerStrings),
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
  private generateHtmlContent(
    data: PasswordResetTemplateData,
    t: ReturnType<typeof i18nInstance.getFixedT>
  ): string {
    return `
      <h2 style="margin: 0 0 16px 0; color: #111827; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 600;">${escapeHtml(t('passwordReset.heading', { name: data.firstName }))}</h2>

      <p style="margin: 0 0 16px 0; color: #374151; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6;">${escapeHtml(t('passwordReset.bodyIntro', { email: data.email }))}</p>

      <p style="margin: 0 0 16px 0; color: #374151; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6;">${escapeHtml(t('passwordReset.buttonHint'))}</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
        <tr>
          <td align="center">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${escapeHtml(data.resetUrl)}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="12%" strokecolor="#667eea" fillcolor="#667eea">
              <w:anchorlock/>
              <center style="color:#ffffff;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;">${escapeHtml(t('passwordReset.cta'))}</center>
            </v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="${escapeHtml(data.resetUrl)}" style="display: inline-block; padding: 12px 24px; background-color: #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none !important; border-radius: 6px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; text-align: center; border: 1px solid #667eea;">
              ${escapeHtml(t('passwordReset.cta'))}
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px 20px; margin: 20px 0;">
        <tr>
          <td style="padding: 16px 20px;">
            <p style="margin: 0; color: #92400e; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <strong>${escapeHtml(t('passwordReset.expiresIn', { duration: data.expiresIn }))}</strong>
            </p>
          </td>
        </tr>
      </table>

      <p style="margin-top: 24px; margin-bottom: 8px; color: #374151; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6;">${escapeHtml(t('passwordReset.fallbackLinkHint'))}</p>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6; padding: 12px 16px;">
        <tr>
          <td style="padding: 12px 16px;">
            <p style="word-break: break-all; color: #6b7280; font-size: 14px; margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              ${escapeHtml(data.resetUrl)}
            </p>
          </td>
        </tr>
      </table>

      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

      <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        ${escapeHtml(t('passwordReset.ignoreIfNotRequested'))}
      </p>

      <p style="color: #6b7280; font-size: 14px; margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        ${escapeHtml(t('passwordReset.supportContact'))}
      </p>
    `;
  }

  /**
   * Generate the plain text content for the email body
   *
   * @param data - The template data
   * @returns Plain text content string
   */
  private generateTextContent(
    data: PasswordResetTemplateData,
    t: ReturnType<typeof i18nInstance.getFixedT>
  ): string {
    return `
${t('passwordReset.heading', { name: data.firstName }).toUpperCase()}

${t('passwordReset.bodyIntro', { email: data.email })}

${t('passwordReset.buttonHint')}

${data.resetUrl}

IMPORTANT: ${t('passwordReset.expiresIn', { duration: data.expiresIn })}

--------------------------------------------------------------------------------

${t('passwordReset.ignoreIfNotRequested').toUpperCase()}

${t('passwordReset.supportContact')}
    `.trim();
  }

  /**
   * Get the base HTML template with content placeholder replaced
   *
   * @returns Base HTML template string
   */
  private getBaseHtmlTemplate(data: TemplateRenderData, footerStrings: FooterStrings): string {
    const greeting = data.recipientName
      ? `<p style="margin-bottom: 24px;">${escapeHtml(footerStrings.greeting)} <strong>{{recipientName}}</strong>,</p>`
      : `<p style="margin-bottom: 24px;">${escapeHtml(footerStrings.greeting)},</p>`;

    const supportSection = data.supportEmail
      ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px;">${escapeHtml(footerStrings.needHelp)} <a href="mailto:{{supportEmail}}" style="color: #6b7280; text-decoration: underline;">{{supportEmail}}</a></p>`
      : '';

    return `<!DOCTYPE html>
<html lang="{{locale}}" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
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
              <p style="margin: 0 0 8px 0; color: #6b7280; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px;">${escapeHtml(footerStrings.thankYouForUsing)} <strong>{{appName}}</strong>.</p>
              ${supportSection}
              <div style="margin: 12px 0;">
                <a href="{{appUrl}}" style="display: inline-block; margin: 0 12px; color: #374151; text-decoration: none; font-size: 14px;">${escapeHtml(footerStrings.visitApp)} {{appName}}</a>
              </div>
              <p style="margin-top: 16px; font-size: 12px; color: #9ca3af;">
                &copy; {{currentYear}} {{appName}}. ${escapeHtml(footerStrings.allRightsReserved)}
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
  private getBaseTextTemplate(data: TemplateRenderData, footerStrings: FooterStrings): string {
    const greeting = data.recipientName
      ? `${footerStrings.greeting} {{recipientName}},`
      : `${footerStrings.greeting},`;

    const supportSection = data.supportEmail
      ? `\n\n${footerStrings.needHelp} {{supportEmail}}`
      : '';

    return `================================================================================
                              {{appName}}
================================================================================

${greeting}

{{content}}

--------------------------------------------------------------------------------

${footerStrings.thankYouForUsing} {{appName}}.${supportSection}

${footerStrings.visitApp} us at: {{appUrl}}

Copyright (c) {{currentYear}} {{appName}}. ${footerStrings.allRightsReserved}`;
  }
}
