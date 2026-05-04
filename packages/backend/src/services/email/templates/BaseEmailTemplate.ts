/**
 * Base Email Template
 *
 * Abstract base class for all email templates.
 * Provides a consistent interface for rendering HTML and text versions.
 */

import type { TemplateEngine } from './TemplateEngine.js';
import { templateEngine } from './TemplateEngine.js';

/**
 * Interface for rendered email content
 */
export interface RenderedEmail {
  /** HTML version of the email */
  html: string;
  /** Plain text version of the email */
  text: string;
}

/**
 * Interface for email template data
 * All template data objects must include these base properties
 */
export interface BaseTemplateData {
  /** The email subject line */
  subject: string;
  /** Recipient's name (optional) */
  recipientName?: string;
  /** Application/brand name */
  appName: string;
  /** URL to the application */
  appUrl: string;
  /** Support email address (optional) */
  supportEmail?: string;
  /** Current year for copyright */
  currentYear: number;
}

/**
 * Abstract base class for email templates
 *
 * All email templates should extend this class and implement the render() method.
 * Provides access to the template engine for variable substitution.
 *
 * @typeParam T - The type of data required to render the template
 *
 * @example
 * ```typescript
 * interface WelcomeEmailData extends BaseTemplateData {
 *   userName: string;
 *   loginUrl: string;
 * }
 *
 * class WelcomeEmailTemplate extends BaseEmailTemplate<WelcomeEmailData> {
 *   getTemplateName(): string {
 *     return 'welcome';
 *   }
 *
 *   render(data: WelcomeEmailData): RenderedEmail {
 *     const html = this.renderHtml(htmlTemplate, data);
 *     const text = this.renderText(textTemplate, data);
 *     return { html, text };
 *   }
 * }
 * ```
 */
export abstract class BaseEmailTemplate<T extends BaseTemplateData> {
  protected engine: TemplateEngine;

  constructor() {
    this.engine = templateEngine;
  }

  /**
   * Get the template name
   *
   * Used for logging and identification purposes.
   *
   * @returns The name of the template
   */
  abstract getTemplateName(): string;

  /**
   * Render the email template with the provided data
   *
   * Must return both HTML and plain text versions of the email.
   *
   * @param data - The data to use for rendering
   * @returns Object containing html and text versions
   */
  abstract render(data: T): RenderedEmail;

  /**
   * Render an HTML template string with the provided data
   *
   * @param template - The HTML template string
   * @param data - The data to substitute
   * @returns The rendered HTML
   */
  protected renderHtml(template: string, data: T): string {
    return this.engine.renderHtml(template, data as Record<string, unknown>);
  }

  /**
   * Render a plain text template string with the provided data
   *
   * @param template - The plain text template string
   * @param data - The data to substitute
   * @returns The rendered text
   */
  protected renderText(template: string, data: T): string {
    return this.engine.renderText(template, data as Record<string, unknown>);
  }
}
