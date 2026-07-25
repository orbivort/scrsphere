import { defineConfig } from 'i18next-cli';

/**
 * i18next-cli configuration for AST-based translation key extraction.
 *
 * This is the AST-based alternative to the heuristic-based `i18n:extract` script.
 * It uses SWC-powered parsing to accurately extract translation keys from
 * useTranslation() / t() / <Trans> calls in the source code.
 *
 * Output goes to a temp directory so the extracted keys can be compared
 * against the checked-in locale files without modifying them directly.
 */
export default defineConfig({
  // English is the source of truth for key extraction
  locales: ['en'],

  extract: {
    // Scan all TypeScript/TSX source files in the frontend package
    input: ['src/**/*.{ts,tsx}'],

    // Output to a temp directory for comparison — does not overwrite
    // the checked-in locale files in public/locales/
    output: 'temp/i18n-extracted/{{language}}/{{namespace}}.json',

    // Default namespace when useTranslation() is called without arguments
    defaultNS: 'common',

    // Key separator matching i18next config in config.ts
    keySeparator: '.',

    // Namespace separator matching i18next config in config.ts
    nsSeparator: ':',

    // Default value for newly extracted keys (empty string = placeholder)
    defaultValue: '',
  },
});
