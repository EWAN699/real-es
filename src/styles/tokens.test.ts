import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { contrastContract, contrastRatio, palette } from './tokens';

// Resolved from cwd rather than import.meta.url: under the jsdom environment
// import.meta.url is not a file: URL, so fileURLToPath throws at collection.
const themeCss = readFileSync(resolve(process.cwd(), 'src/styles/theme.css'), 'utf8');

describe('brand palette', () => {
  it.each(contrastContract)('$name clears $min:1', ({ fg, bg, min }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
  });

  // Guards the specific regression this rebuild exists to fix: the legacy site
  // set brand green as link and body text on white at roughly 2:1.
  it('rejects the legacy brand-500-on-white text pairing', () => {
    expect(contrastRatio(palette.brand[500], palette.stone[50])).toBeLessThan(4.5);
  });

  it('keeps theme.css in sync with tokens.ts', () => {
    const declared = Object.entries(palette).flatMap(([group, shades]) =>
      Object.entries(shades).map(([shade, hex]) => ({
        variable: `--color-${group}-${shade}`,
        hex: hex.toLowerCase(),
      })),
    );

    for (const { variable, hex } of declared) {
      expect(themeCss, `${variable} missing or stale in theme.css`).toContain(`${variable}: ${hex}`);
    }
  });
});

describe('contrastRatio', () => {
  it('returns 21 for black on white', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  });

  it('returns 1 for a colour against itself', () => {
    expect(contrastRatio('#8CC542', '#8CC542')).toBeCloseTo(1, 5);
  });

  it('is order independent', () => {
    expect(contrastRatio('#4F7A1F', '#FFFFFF')).toBeCloseTo(contrastRatio('#FFFFFF', '#4F7A1F'), 10);
  });
});
