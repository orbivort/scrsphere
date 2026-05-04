#!/usr/bin/env node
/**
 * Icon Type Generation Script
 *
 * This script generates TypeScript types for icon names based on the
 * icon components in packages/frontend/src/components/common/Icons/
 *
 * Usage:
 *   npx tsx scripts/generate-icon-types.ts
 *   npx tsx scripts/generate-icon-types.ts --watch
 */

import { readdir, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ICONS_DIR = join(
  __dirname,
  '..',
  'packages',
  'frontend',
  'src',
  'components',
  'common',
  'Icons'
);
const OUTPUT_FILE = join(ICONS_DIR, 'types.ts');

/**
 * Generate the types file content
 */
function generateTypesContent(iconNames: string[]): string {
  const iconNameUnion = iconNames.map((name) => `'${name}'`).join(' | ');
  const iconNamesArray = iconNames.map((name) => `  '${name}',`).join('\n');

  return `// Auto-generated file. Do not edit manually.
// Run \\\`npm run generate:icon-types\\\` to regenerate.

/**
 * Union type of all available icon names
 */
export type IconName =
  ${iconNameUnion};

/**
 * Array of all available icon names
 */
export const iconNames: IconName[] = [
${iconNamesArray}
];

/**
 * Type guard to check if a string is a valid icon name
 */
export function isIconName(value: string): value is IconName {
  return iconNames.includes(value as IconName);
}
`;
}

/**
 * Get all icon names from the Icons directory
 */
async function getIconNames(): Promise<string[]> {
  const files = await readdir(ICONS_DIR);

  const iconNames = files
    .filter((file) => file.endsWith('Icon.tsx') && file !== 'types.ts')
    .map((file) => file.replace('.tsx', ''))
    .sort();

  return iconNames;
}

/**
 * Main function to generate types
 */
async function generateTypes(): Promise<void> {
  try {
    const iconNames = await getIconNames();

    if (iconNames.length === 0) {
      console.warn('No icon components found in:', ICONS_DIR);
      process.exit(0);
    }

    const content = generateTypesContent(iconNames);
    await writeFile(OUTPUT_FILE, content, 'utf-8');

    console.log(`✓ Generated types for ${iconNames.length} icons`);
    console.log(`  Output: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Error generating icon types:', error);
    process.exit(1);
  }
}

/**
 * Watch mode - regenerate types when icon files change
 */
async function watchMode(): Promise<void> {
  const { watch } = await import('fs');

  console.log('👀 Watching for changes in:', ICONS_DIR);
  console.log('Press Ctrl+C to stop\n');

  // Initial generation
  await generateTypes();

  // Watch for changes
  watch(ICONS_DIR, { recursive: false }, async (eventType, filename) => {
    if (filename && filename.endsWith('Icon.tsx')) {
      console.log(`\n📝 ${eventType}: ${filename}`);
      await generateTypes();
    }
  });
}

// Main execution
const args = process.argv.slice(2);
const isWatchMode = args.includes('--watch');

if (isWatchMode) {
  watchMode();
} else {
  generateTypes();
}
