import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Static guards for the three rules that are easy to state, easy to break, and
 * invisible in review once a file gets long. Each one encodes a specific defect
 * found on the legacy site.
 *
 * These read source text rather than rendered output on purpose: a violation
 * should fail the moment it is written, not only if some test happens to render
 * the component that contains it.
 */
const srcRoot = resolve(process.cwd(), 'src');

const sourceFiles = readdirSync(srcRoot, { recursive: true, encoding: 'utf8' })
  .filter((entry) => entry.endsWith('.ts') || entry.endsWith('.tsx'))
  .map((entry) => join(srcRoot, entry))
  .filter((file) => !file.endsWith('.test.ts') && !file.endsWith('.test.tsx'))
  // The token module and its mirror are where the raw hex values legitimately live.
  .filter((file) => !file.endsWith('src/styles/tokens.ts'))
  // The media registry is generated and owns the placeholder data URI.
  .filter((file) => !file.endsWith('src/content/media.ts'));

function read(file: string): string {
  return readFileSync(file, 'utf8');
}

function relative(file: string): string {
  return file.replace(`${resolve(process.cwd())}/`, '');
}

describe('RTL discipline', () => {
  /**
   * Physical direction utilities work until an English locale is added, then
   * mirror the entire layout. Tailwind's logical equivalents are ms/me, ps/pe,
   * start/end, border-s/border-e and text-start/text-end.
   *
   * `mx-`, `px-`, `inset-x-` and `-y-` variants are symmetric or vertical and
   * are therefore fine.
   */
  const physical =
    /\b(?:hover:|focus:|md:|lg:|sm:|xl:|group-hover:)*-?(?:ml|mr|pl|pr|border-l|border-r|rounded-l|rounded-r|left|right)-(?:\[|\d|auto|px|full|none)|\btext-(?:left|right)\b/;

  // A guard that cannot fire is worse than no guard: it reads as coverage.
  it('flags the physical utilities it is meant to catch', () => {
    for (const sample of [
      'className="ml-4"',
      'className="mr-2 flex"',
      'className="md:pl-6"',
      'className="text-left"',
      'className="text-right"',
      'className="border-l-2"',
      'className="-mr-px"',
      'className="right-0"',
    ]) {
      expect(physical.test(sample), sample).toBe(true);
    }
  });

  it('leaves logical and symmetric utilities alone', () => {
    for (const sample of [
      'className="ms-4 me-2"',
      'className="ps-6 pe-6"',
      'className="mx-auto px-5"',
      'className="text-start text-end"',
      'className="border-s border-e"',
      'className="inset-y-0 end-0"',
      'className="-start-[9999px]"',
    ]) {
      expect(physical.test(sample), sample).toBe(false);
    }
  });

  it.each(sourceFiles.map(relative))('%s uses logical properties only', (file) => {
    const lines = read(resolve(process.cwd(), file)).split('\n');
    const offenders = lines
      .map((line, index) => ({ line, number: index + 1 }))
      .filter(({ line }) => physical.test(line));

    expect(offenders.map((o) => `${o.number}: ${o.line.trim()}`)).toEqual([]);
  });
});

describe('colour discipline', () => {
  /**
   * The regression this rebuild exists to fix: #8CC542 as a text colour on a
   * light ground measures about 2:1 against a 4.5:1 requirement. `brand-500` is
   * a fill. `text-brand-500` must never appear.
   */
  it.each(sourceFiles.map(relative))('%s never sets brand-500 as a text colour', (file) => {
    expect(read(resolve(process.cwd(), file))).not.toMatch(/\btext-brand-500\b/);
  });

  /** Retired palette: the coral and the link blue do not come back. */
  it.each(sourceFiles.map(relative))('%s does not reintroduce a retired colour', (file) => {
    const source = read(resolve(process.cwd(), file));
    expect(source.toUpperCase()).not.toContain('#FE6C61');
    expect(source.toUpperCase()).not.toContain('#5472D2');
  });

  /** Every colour comes from a token. Raw hex in a component is a fork of the palette. */
  it.each(sourceFiles.map(relative))('%s carries no raw hex colour', (file) => {
    const matches = read(resolve(process.cwd(), file)).match(/#[0-9a-fA-F]{6}\b/g) ?? [];
    expect(matches).toEqual([]);
  });
});

describe('media discipline', () => {
  /**
   * Images are addressed by slug through `getMedia`. A hardcoded path under
   * /media would break the moment the pipeline regenerates the registry, and
   * would bypass the alt text and aspect ratio that come with the asset.
   */
  it.each(sourceFiles.map(relative))('%s hardcodes no /media path', (file) => {
    expect(read(resolve(process.cwd(), file))).not.toMatch(/["'`]\/media\//);
  });
});
