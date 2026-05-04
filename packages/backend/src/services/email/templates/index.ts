/**
 * Email Templates Module
 *
 * Exports the template engine and base template classes for creating
 * and rendering email templates.
 */

// Export template engine
export { TemplateEngine, templateEngine } from './TemplateEngine.js';

// Export base template classes and interfaces
export {
  BaseEmailTemplate,
  type BaseTemplateData,
  type RenderedEmail,
} from './BaseEmailTemplate.js';

// Export concrete templates
export { PasswordResetTemplate, type PasswordResetTemplateData } from './PasswordResetTemplate.js';

export {
  PasswordChangeTemplate,
  type PasswordChangeTemplateData,
} from './PasswordChangeTemplate.js';

export { WelcomeEmailTemplate, type WelcomeEmailTemplateData } from './WelcomeEmailTemplate.js';

// Template file paths for custom template loading
export const TEMPLATE_PATHS = {
  BASE_HTML: 'base-template.html',
  BASE_TEXT: 'base-template.txt',
} as const;
