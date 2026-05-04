/**
 * Welcome Email Template
 *
 * Sent to users after successful registration.
 * Includes getting started tips and support information.
 */

import {
  BaseEmailTemplate,
  type BaseTemplateData,
  type RenderedEmail,
} from './BaseEmailTemplate.js';

/**
 * Data required for the welcome email
 */
export interface WelcomeEmailTemplateData extends BaseTemplateData {
  /** Recipient's first name */
  firstName: string;
  /** Recipient's email address */
  email: string;
}

/**
 * Welcome Email Template
 *
 * Provides both HTML and text versions of the welcome email.
 */
export class WelcomeEmailTemplate extends BaseEmailTemplate<WelcomeEmailTemplateData> {
  /**
   * Get the template name
   *
   * @returns The name of the template
   */
  getTemplateName(): string {
    return 'welcome-email';
  }

  /**
   * Render the welcome email
   *
   * @param data - The data to use for rendering
   * @returns Object containing html and text versions
   */
  render(data: WelcomeEmailTemplateData): RenderedEmail {
    const html = this.renderHtml(this.getHtmlTemplate(data), data);
    const text = this.renderText(this.getTextTemplate(data), data);
    return { html, text };
  }

  /**
   * Get the HTML template
   *
   * @returns The HTML template string
   */
  private getHtmlTemplate(data: WelcomeEmailTemplateData): string {
    const supportSection = data.supportEmail
      ? `<p style="margin: 0 0 8px 0; color: #6b7280; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px;">Need help? Contact us at <a href="mailto:{{supportEmail}}" style="color: #6b7280; text-decoration: underline;">{{supportEmail}}</a></p>`
      : '';

    return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to {{appName}}</title>
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
              <!-- Welcome Icon -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="text-align: center; margin-bottom: 24px;">
                <tr>
                  <td align="center" style="padding-bottom: 16px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width: 64px; height: 64px; background-color: #ede9fe; border-radius: 50%;">
                      <tr>
                        <td align="center" valign="middle" style="width: 64px; height: 64px; text-align: center; vertical-align: middle;">
                          <span style="color: #7c3aed; font-size: 32px;">&#128075;</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <p style="color: #7c3aed; font-size: 18px; font-weight: 600; margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Welcome to {{appName}}!</p>
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #374151; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6;">Hello <strong>{{firstName}}</strong>,</p>

              <p style="margin: 0 0 16px 0; color: #374151; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6;">Thank you for creating your account! We're excited to have you on board.</p>

              <p style="margin: 0 0 24px 0; color: #374151; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6;">Your account is ready. You can now start managing your Agile Scrum lifecycle with our powerful tools.</p>

              <!-- Getting Started Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f0fdf4; border-left: 4px solid #22c55e; margin: 20px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 12px 0; color: #166534; font-size: 16px; font-weight: 600; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Your Agile Journey Starts Here</p>
                    <p style="margin: 0 0 12px 0; color: #166534; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><strong>For Scrum Masters and Product Owners:</strong></p>
                    <p style="margin: 0 0 4px 0; color: #166534; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#10003; Create your team workspace</p>
                    <p style="margin: 0 0 4px 0; color: #166534; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#10003; Invite team members to collaborate</p>
                    <p style="margin: 0 0 12px 0; color: #166534; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#10003; Start your first sprint</p>
                    <p style="margin: 0 0 12px 0; color: #166534; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><strong>For Developers:</strong></p>
                    <p style="margin: 0 0 4px 0; color: #166534; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#10003; Check your notifications for team invitations</p>
                    <p style="margin: 0 0 4px 0; color: #166534; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#10003; Contact your Scrum Master or Product Owner</p>
                    <p style="margin: 0; color: #166534; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">&#10003; Join your team and start collaborating</p>
                  </td>
                </tr>
              </table>

              <!-- Platform Capabilities -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #eff6ff; border-left: 4px solid #3b82f6; margin: 20px 0;">
                <tr>
                  <td style="padding: 16px 20px;">
                    <p style="margin: 0 0 12px 0; color: #1e40af; font-size: 16px; font-weight: 600; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">Platform Capabilities</p>
                    <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><strong>Team Collaboration</strong> - Work together with role-based permissions</p>
                    <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><strong>Sprint Planning</strong> - Plan iterations and manage your backlog</p>
                    <p style="margin: 0 0 8px 0; color: #1e40af; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><strong>Progress Tracking</strong> - Monitor velocity and burndown charts</p>
                    <p style="margin: 0; color: #1e40af; font-size: 14px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;"><strong>Agile Ceremonies</strong> - Run daily scrums and retrospectives</p>
                  </td>
                </tr>
              </table>

              <!-- Call to Action -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <!--[if mso]>
                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="{{appUrl}}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="12%" strokecolor="#667eea" fillcolor="#667eea">
                      <w:anchorlock/>
                      <center style="color:#ffffff;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;">Go to Dashboard</center>
                    </v:roundrect>
                    <![endif]-->
                    <!--[if !mso]><!-->
                    <a href="{{appUrl}}" style="display: inline-block; padding: 12px 24px; background-color: #667eea; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff !important; text-decoration: none !important; border-radius: 6px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; text-align: center; border: 1px solid #667eea;">
                      Go to Dashboard
                    </a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>

              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">

              <!-- Security Notice -->
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 16px 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                <strong>Account Security:</strong> Your account was created with email <strong>{{email}}</strong>. If this wasn't you, please contact our support team immediately.
              </p>

              <p style="color: #6b7280; font-size: 14px; margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                We're here to help you succeed. If you have any questions, don't hesitate to reach out!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="email-footer-cell" style="background-color: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px;">Thank you for choosing <strong>{{appName}}</strong>.</p>
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
  private getTextTemplate(data: WelcomeEmailTemplateData): string {
    const supportSection = data.supportEmail
      ? `\n\nNeed help? Contact us at ${data.supportEmail}`
      : '';

    return `================================================================================
                              Welcome to {{appName}}!
================================================================================

Hello {{firstName}},

Thank you for creating your account! We're excited to have you on board.

Your account is ready. You can now start managing your Agile Scrum lifecycle
with our powerful tools.

YOUR AGILE JOURNEY STARTS HERE
--------------------------------------------------------------------------------
For Scrum Masters and Product Owners:
  &#10003; Create your team workspace
  &#10003; Invite team members to collaborate
  &#10003; Start your first sprint

For Developers:
  &#10003; Check your notifications for team invitations
  &#10003; Contact your Scrum Master or Product Owner
  &#10003; Join your team and start collaborating

PLATFORM CAPABILITIES
--------------------------------------------------------------------------------
  &#8226; Team Collaboration - Work together with role-based permissions
  &#8226; Sprint Planning - Plan iterations and manage your backlog
  &#8226; Progress Tracking - Monitor velocity and burndown charts
  &#8226; Agile Ceremonies - Run daily scrums and retrospectives

Go to Dashboard: {{appUrl}}

--------------------------------------------------------------------------------

ACCOUNT SECURITY
--------------------------------------------------------------------------------
Your account was created with email: {{email}}

If this wasn't you, please contact our support team immediately.

--------------------------------------------------------------------------------

Thank you for choosing {{appName}}.${supportSection}

Visit us at: {{appUrl}}

Copyright (c) {{currentYear}} {{appName}}. All rights reserved.`;
  }
}
