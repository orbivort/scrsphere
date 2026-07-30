/**
 * HTML-escapes a string for safe insertion into HTML text content and attributes.
 * Escapes: & < > " ' `
 *
 * @param str - The string to escape
 * @returns The HTML-escaped string
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/`/g, '&#x60;');
}
