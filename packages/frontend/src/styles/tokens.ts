/**
 * Design Tokens - TypeScript Implementation
 * Mirror of tokens.css for programmatic access in JavaScript/TypeScript
 *
 * This file provides type-safe access to design tokens for use in:
 * - Dynamic styling calculations
 * - Theme switching logic
 * - Component prop validation
 * - Style utilities and helpers
 */

// ========================================
// PRIMITIVE COLOR TOKENS
// ========================================

export const color = {
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  stone: {
    400: '#a8a29e',
    500: '#78716c',
  },
  emerald: {
    50: '#ecfdf5',
    400: '#34d399',
    500: '#10b981',
    800: '#065f46',
  },
  pink: {
    50: '#fce7f3',
    800: '#9d174d',
  },
  accentPurple: {
    50: '#f5f3ff',
    100: '#ede9fe',
    200: '#ddd6fe',
    300: '#c4b5fd',
    400: '#a78bfa',
    500: '#8b5cf6',
    600: '#7c3aed',
    700: '#6d28d9',
    800: '#5b21b6',
    900: '#4c1d95',
  },
  /**
   * Indigo - abbreviated scale (500/600 only, used for gradients)
   * Full 50-900 scale deferred to Phase 6 if needed
   */
  accentIndigo: {
    500: '#6366f1',
    600: '#4f46e5',
  },
} as const;

// ========================================
// SEMANTIC COLOR TOKENS (ALIAS LAYER)
// ========================================

export const semanticColor = {
  text: {
    primary: color.gray[900],
    secondary: color.gray[500],
    tertiary: color.gray[400],
    disabled: color.gray[400],
    inverse: '#ffffff',
    link: color.primary[600],
    linkHover: color.primary[700],
    success: color.success[600],
    warning: color.warning[600],
    error: color.error[600],
  },
  background: {
    page: color.gray[50],
    card: '#ffffff',
    elevated: '#ffffff',
    hover: color.gray[50],
    active: color.gray[100],
    disabled: color.gray[100],
    overlay: 'rgba(0, 0, 0, 0.5)',
  },
  border: {
    default: color.gray[200],
    hover: color.gray[300],
    active: color.primary[500],
    error: color.error[500],
    focus: color.primary[500],
  },
  interactive: {
    primary: color.primary[600],
    primaryHover: color.primary[700],
    primaryActive: color.primary[800],
    secondary: color.gray[600],
    secondaryHover: color.gray[700],
    danger: color.error[600],
    dangerHover: color.error[700],
  },
  brand: {
    gradientStart: '#667eea',
    gradientEnd: '#764ba2',
  },
  panel: {
    dorBackground: '#fffbf5',
  },
} as const;

// ========================================
// SPACING TOKENS
// ========================================

export const space = {
  0: '0',
  px: '1px',
  '0.5': '0.125rem', // 2px
  1: '0.25rem', // 4px
  2: '0.5rem', // 8px
  3: '0.75rem', // 12px
  4: '1rem', // 16px
  5: '1.25rem', // 20px
  6: '1.5rem', // 24px
  8: '2rem', // 32px
  10: '2.5rem', // 40px
  12: '3rem', // 48px
  16: '4rem', // 64px
  20: '5rem', // 80px
  24: '6rem', // 96px
  32: '8rem', // 128px
} as const;

export const semanticSpace = {
  inline: {
    xs: space[1],
    sm: space[2],
    md: space[4],
    lg: space[6],
  },
  stack: {
    xs: space[2],
    sm: space[4],
    md: space[6],
    lg: space[8],
  },
  componentPadding: space[4],
  sectionGap: space[12],
} as const;

// ========================================
// TYPOGRAPHY TOKENS
// ========================================

export const fontFamily = {
  sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'Fira Code', 'Consolas', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace",
  display: "'Inter', sans-serif",
} as const;

export const fontSize = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem', // 48px
  '6xl': '3.75rem', // 60px
} as const;

export const fontWeight = {
  light: 300,
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  extrabold: 800,
} as const;

export const lineHeight = {
  none: 1,
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.625,
  snug: 1.375,
  loose: 1.75,
} as const;

export const letterSpacing = {
  tighter: '-0.05em',
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
  wider: '0.05em',
  widest: '0.1em',
} as const;

export const fontVariant = {
  numeric: {
    default: 'normal',
    tabular: 'tabular-nums',
  },
} as const;

// ========================================
// BORDER RADIUS TOKENS
// ========================================

export const radius = {
  none: '0',
  xs: '0.125rem', // 2px
  sm: '0.25rem', // 4px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem', // 32px
  full: '9999px',
} as const;

// ========================================
// BORDER WIDTH TOKENS
// ========================================

export const borderWidth = {
  0: '0',
  1: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
} as const;

// ========================================
// SHADOW TOKENS
// ========================================

export const shadow = {
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)',
} as const;

// ========================================
// TRANSITION TOKENS
// ========================================

export const transition = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

// ========================================
// Z-INDEX TOKENS
// ========================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
  maximum: 9999,
} as const;

// ========================================
// FOCUS RING TOKENS
// ========================================

export const focusRing = {
  width: '2px',
  offset: '2px',
  color: color.primary[500],
  offsetColor: semanticColor.background.card,
  shadow: `0 0 0 2px ${semanticColor.background.card}, 0 0 0 calc(2px + 2px) ${color.primary[500]}`,
} as const;

// ========================================
// BREAKPOINT TOKENS
// ========================================

export const breakpoint = {
  xs: '320px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ========================================
// OPACITY TOKENS
// ========================================

export const opacity = {
  0: 0,
  5: 0.05,
  10: 0.1,
  20: 0.2,
  25: 0.25,
  30: 0.3,
  40: 0.4,
  50: 0.5,
  60: 0.6,
  70: 0.7,
  75: 0.75,
  80: 0.8,
  90: 0.9,
  95: 0.95,
  100: 1,
} as const;

export const easing = {
  linear: 'linear',
  in: 'cubic-bezier(0.4, 0, 1, 1)',
  out: 'cubic-bezier(0, 0, 0.2, 1)',
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

export const duration = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
} as const;

// ========================================
// UTILITY TOKENS
// ========================================

export const touchAction = {
  default: 'manipulation',
  pan: 'pan-x pan-y',
  none: 'none',
} as const;

export const textWrap = {
  default: 'auto',
  balance: 'balance',
  pretty: 'pretty',
} as const;

export const layout = {
  minWidth: {
    0: '0',
    full: '100%',
  },
} as const;

export const scroll = {
  marginTop: space[16],
} as const;

export const overscroll = {
  contain: 'contain',
} as const;

// ========================================
// COMPONENT TOKENS
// ========================================

export const component = {
  button: {
    primary: {
      background: semanticColor.interactive.primary,
      backgroundHover: semanticColor.interactive.primaryHover,
      backgroundActive: semanticColor.interactive.primaryActive,
      backgroundDisabled: color.gray[100],
      color: semanticColor.text.inverse,
      colorDisabled: color.gray[400],
    },
    secondary: {
      background: color.gray[100],
      backgroundHover: color.gray[200],
      backgroundActive: color.gray[300],
      color: color.gray[700],
    },
    danger: {
      background: semanticColor.interactive.danger,
      backgroundHover: semanticColor.interactive.dangerHover,
      color: semanticColor.text.inverse,
    },
    padding: {
      sm: `${space[1]} ${space[3]}`,
      md: `${space[2]} ${space[4]}`,
      lg: `${space[3]} ${space[6]}`,
    },
    borderRadius: radius.md,
    fontWeight: fontWeight.semibold,
  },
  input: {
    background: semanticColor.background.card,
    backgroundDisabled: color.gray[100],
    borderColor: semanticColor.border.default,
    borderColorHover: semanticColor.border.hover,
    borderColorFocus: semanticColor.border.focus,
    borderColorError: semanticColor.border.error,
    textColor: semanticColor.text.primary,
    textColorDisabled: semanticColor.text.disabled,
    placeholderColor: color.gray[400],
    padding: {
      sm: `${space[2]} ${space[3]}`,
      md: `${space[3]} ${space[4]}`,
    },
    borderRadius: radius.md,
    borderWidth: borderWidth[1],
  },
  card: {
    background: semanticColor.background.card,
    borderColor: semanticColor.border.default,
    borderRadius: radius.lg,
    padding: space[6],
    shadow: shadow.sm,
    shadowHover: shadow.md,
  },
  toast: {
    success: {
      background: color.success[50],
      borderColor: color.success[500],
      textColor: color.success[800],
      iconBackground: color.success[500],
    },
    warning: {
      background: color.warning[50],
      borderColor: color.warning[500],
      textColor: color.warning[800],
      iconBackground: color.warning[500],
    },
    error: {
      background: color.error[50],
      borderColor: color.error[500],
      textColor: color.error[800],
      iconBackground: color.error[500],
    },
    info: {
      background: color.primary[50],
      borderColor: color.primary[500],
      textColor: color.primary[800],
      iconBackground: color.primary[500],
    },
    padding: `${space[3]} ${space[4]}`,
    borderRadius: radius.md,
    shadow: shadow.lg,
  },
  modal: {
    background: semanticColor.background.card,
    overlayBackground: semanticColor.background.overlay,
    borderRadius: radius.xl,
    shadow: shadow.xl,
    padding: space[6],
    zIndex: zIndex.modal,
    backdropZIndex: zIndex.modalBackdrop,
    overscrollBehavior: overscroll.contain,
  },
} as const;

// ========================================
// COMPLETE TOKENS OBJECT
// ========================================

export const tokens = {
  color,
  semanticColor,
  space,
  semanticSpace,
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  fontVariant,
  radius,
  borderWidth,
  shadow,
  transition,
  easing,
  duration,
  zIndex,
  focusRing,
  breakpoint,
  opacity,
  touchAction,
  textWrap,
  layout,
  scroll,
  overscroll,
  component,
} as const;

// ========================================
// TYPE EXPORTS
// ========================================

export type Tokens = typeof tokens;
export type ColorTokens = typeof color;
export type SemanticColorTokens = typeof semanticColor;
export type SpaceTokens = typeof space;
export type SemanticSpaceTokens = typeof semanticSpace;
export type FontFamilyTokens = typeof fontFamily;
export type FontSizeTokens = typeof fontSize;
export type FontWeightTokens = typeof fontWeight;
export type LineHeightTokens = typeof lineHeight;
export type LetterSpacingTokens = typeof letterSpacing;
export type FontVariantTokens = typeof fontVariant;
export type RadiusTokens = typeof radius;
export type BorderWidthTokens = typeof borderWidth;
export type ShadowTokens = typeof shadow;
export type TransitionTokens = typeof transition;
export type EasingTokens = typeof easing;
export type DurationTokens = typeof duration;
export type ZIndexTokens = typeof zIndex;
export type FocusRingTokens = typeof focusRing;
export type BreakpointTokens = typeof breakpoint;
export type OpacityTokens = typeof opacity;
export type TouchActionTokens = typeof touchAction;
export type TextWrapTokens = typeof textWrap;
export type LayoutTokens = typeof layout;
export type ScrollTokens = typeof scroll;
export type OverscrollTokens = typeof overscroll;
export type ComponentTokens = typeof component;

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Get a space value in pixels (for calculations)
 * @param key - The space token key
 * @returns The space value in pixels as a number
 */
export function getSpaceInPixels(key: keyof typeof space): number {
  const value = space[key];
  if (value === '0') return 0;

  // Parse rem values (assuming 1rem = 16px)
  const remMatch = value.match(/([\d.]+)rem/);
  if (remMatch?.[1]) {
    return parseFloat(remMatch[1]) * 16;
  }

  return parseInt(value, 10) || 0;
}

/**
 * Get a breakpoint value in pixels (for media queries)
 * @param key - The breakpoint token key
 * @returns The breakpoint value in pixels as a number
 */
export function getBreakpointInPixels(key: keyof typeof breakpoint): number {
  return parseInt(breakpoint[key], 10);
}

/**
 * Check if a color combination meets WCAG AA contrast requirements
 * Note: This is a simplified check. For production, use a proper contrast ratio library.
 * @param foreground - The foreground color
 * @param background - The background color
 * @returns Whether the combination likely meets WCAG AA
 */
export function meetsContrastAA(foreground: string, background: string): boolean {
  // Simplified check - in production, calculate actual luminance ratios
  // This is a placeholder for the actual implementation
  const isLightBackground = background.includes('fff') || background.includes('f9fafb');
  const isDarkText = foreground.includes('111') || foreground.includes('1f2937');

  return isLightBackground && isDarkText;
}

export default tokens;
