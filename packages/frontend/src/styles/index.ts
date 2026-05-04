/**
 * Styles Barrel Export
 *
 * This file serves as the central export point for all design tokens
 * and style-related utilities. Import from this file to access tokens
 * in your components and utilities.
 *
 * @example
 * ```typescript
 * import { tokens, color, space, getSpaceInPixels } from '@/styles';
 *
 * // Use tokens
 * const primaryColor = tokens.color.primary[500];
 * const padding = tokens.space[4];
 *
 * // Use individual exports
 * const primaryColor = color.primary[500];
 * const paddingInPx = getSpaceInPixels(4); // 64
 * ```
 */

// Export all tokens and utilities from tokens.ts
export {
  // Main tokens object
  tokens,
  default as defaultTokens,

  // Individual token categories
  color,
  semanticColor,
  space,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  radius,
  borderWidth,
  shadow,
  transition,
  zIndex,
  focusRing,
  breakpoint,
  opacity,

  // Utility functions
  getSpaceInPixels,
  getBreakpointInPixels,
  meetsContrastAA,

  // Type exports
  type Tokens,
  type ColorTokens,
  type SemanticColorTokens,
  type SpaceTokens,
  type FontFamilyTokens,
  type FontSizeTokens,
  type FontWeightTokens,
  type LineHeightTokens,
  type RadiusTokens,
  type BorderWidthTokens,
  type ShadowTokens,
  type TransitionTokens,
  type ZIndexTokens,
  type FocusRingTokens,
  type BreakpointTokens,
  type OpacityTokens,
} from './tokens';

// Re-export tokens as the default export
export { default } from './tokens';
