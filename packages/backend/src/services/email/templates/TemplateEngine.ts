/**
 * Template Engine
 *
 * A simple template engine for email templates with variable substitution.
 * Supports {{variableName}} pattern for variable replacement.
 */

/**
 * Template Engine for rendering email templates
 *
 * Provides methods for rendering templates with variable substitution.
 * Supports both HTML and plain text templates.
 */
export class TemplateEngine {
  /**
   * Regular expression pattern for matching {{variableName}} syntax
   * Matches alphanumeric variable names with optional underscores and dots
   */
  private static readonly VARIABLE_PATTERN =
    /\{\{([a-zA-Z_][a-zA-Z0-9_]*(?:\.[a-zA-Z_][a-zA-Z0-9_]*)*)\}\}/g;

  /**
   * Render a template with the provided data
   *
   * Replaces all {{variableName}} patterns with the corresponding values from data.
   *
   * @param template - The template string with {{variableName}} placeholders
   * @param data - Object containing values to substitute
   * @returns The rendered template with variables replaced
   */
  render(template: string, data: Record<string, unknown>): string {
    return this.substituteVariables(template, data);
  }

  /**
   * Render an HTML template with the provided data
   *
   * This is an alias for render() but provides semantic clarity for HTML templates.
   *
   * @param template - The HTML template string
   * @param data - Object containing values to substitute
   * @returns The rendered HTML with variables replaced
   */
  renderHtml(template: string, data: Record<string, unknown>): string {
    return this.render(template, data);
  }

  /**
   * Render a plain text template with the provided data
   *
   * This is an alias for render() but provides semantic clarity for text templates.
   *
   * @param template - The plain text template string
   * @param data - Object containing values to substitute
   * @returns The rendered text with variables replaced
   */
  renderText(template: string, data: Record<string, unknown>): string {
    return this.render(template, data);
  }

  /**
   * Substitute variables in a template string
   *
   * Replaces all {{variableName}} patterns with values from the data object.
   * Supports nested property access using dot notation (e.g., {{user.name}}).
   *
   * @param template - The template string
   * @param data - Object containing values to substitute
   * @returns The template with variables replaced
   */
  private substituteVariables(template: string, data: Record<string, unknown>): string {
    return template.replace(TemplateEngine.VARIABLE_PATTERN, (_match, variablePath: string) => {
      const value = this.getNestedValue(data, variablePath);

      // If value is undefined or null, return empty string
      if (value === undefined || value === null) {
        return '';
      }

      // Convert to string
      return String(value);
    });
  }

  /**
   * Get a nested value from an object using dot notation
   *
   * @param obj - The object to get the value from
   * @param path - The dot-notation path (e.g., 'user.profile.name')
   * @returns The value at the path, or undefined if not found
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }

      if (typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }

    return current;
  }
}

// Export singleton instance
export const templateEngine = new TemplateEngine();
