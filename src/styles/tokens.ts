/**
 * Single source of truth for the brand palette.
 *
 * `theme.css` mirrors these values into Tailwind's `@theme` block, and
 * `tokens.test.ts` asserts both that the mirror is in sync and that every
 * pairing we actually ship clears its WCAG contrast floor.
 *
 * Background: the legacy site used #8CC542 for body text and links on white,
 * which measures ~2.1:1 against a 4.5:1 requirement. The green is the brand's
 * recognition asset so it stays — but only on large shapes. Anything carrying
 * text uses `brand.700`.
 */

export const palette = {
  brand: {
    /** On dark grounds only. */
    300: '#B4DC85',
    /** The logo green. Large shapes, graphic accents. Never text on light. */
    500: '#8CC542',
    /** Hover states, borders, large display text. Clears 3:1, not 4.5:1. */
    600: '#6FA22F',
    /** Text and links on light grounds. Clears 4.5:1. */
    700: '#4F7A1F',
  },
  ink: {
    400: '#8A9199',
    600: '#4A5259',
    900: '#14171A',
  },
  stone: {
    50: '#FFFFFF',
    100: '#F6F5F2',
    200: '#E7E4DD',
  },
} as const;

/** Pairings the design system actually ships, with the floor each must clear. */
export const contrastContract = [
  { name: 'body text on page ground', fg: palette.ink[900], bg: palette.stone[100], min: 4.5 },
  { name: 'muted text on page ground', fg: palette.ink[600], bg: palette.stone[100], min: 4.5 },
  { name: 'link on page ground', fg: palette.brand[700], bg: palette.stone[100], min: 4.5 },
  { name: 'link on white', fg: palette.brand[700], bg: palette.stone[50], min: 4.5 },
  { name: 'brand text on dark', fg: palette.brand[300], bg: palette.ink[900], min: 4.5 },
  { name: 'body text on white', fg: palette.ink[900], bg: palette.stone[50], min: 4.5 },
  // UI-only pairings: 3:1 is the bar for non-text contrast (WCAG 1.4.11).
  { name: 'brand border on white', fg: palette.brand[600], bg: palette.stone[50], min: 3 },
  { name: 'brand fill on dark', fg: palette.brand[500], bg: palette.ink[900], min: 3 },
] as const;

function channelLuminance(channel8Bit: number): number {
  const srgb = channel8Bit / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const normalized = hex.replace('#', '');
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);

  return (
    0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b)
  );
}

/** WCAG 2.1 contrast ratio between two hex colours, from 1 to 21. */
export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);

  return (lighter + 0.05) / (darker + 0.05);
}
