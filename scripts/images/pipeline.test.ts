// @vitest-environment node
/**
 * The pipeline end to end, and the two pieces it is easiest to get quietly
 * wrong: the registry rewrite and the skip rule.
 *
 * The end-to-end test runs the real orchestrator — hash, submit, poll, download,
 * sharp, registry, lock — against the offline vendor, into a temporary
 * directory. Nothing is faked downstream of the transport, so the AVIF and WebP
 * files it asserts on are files sharp actually produced.
 */

import { existsSync } from 'node:fs';
import { copyFile, mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import sharp from 'sharp';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { MEDIA_REGISTRY_PATH, WIDTHS } from './config';
import { parseArgs, runPipeline, type RunOptions } from './generate';
import { shouldSkip, type LockEntry } from './lock';
import { optimiseMaster } from './optimise';
import {
  MARKER_END,
  MARKER_START,
  renderAssetsBlock,
  replaceAssetsBlock,
} from './registry';
import { synthesiseMaster } from './mock';

import type { ImageSlot } from './manifest';

/** Two slots, one pinned to the other, so the reference path runs too. */
const SLOTS: ImageSlot[] = [
  {
    slug: 'test-courtyard',
    prompt: 'the entrance courtyard of a residential building',
    aspect: '1:1',
    count: 1,
    alt: 'חצר כניסה של בניין מגורים',
    focal: [40, 60],
  },
  {
    slug: 'test-texture',
    prompt: 'flat-on texture of board-formed concrete',
    aspect: '1:1',
    count: 1,
    referenceSlug: 'test-courtyard',
    alt: '',
    decorative: true,
  },
];

describe('the whole pipeline, offline', () => {
  let root: string;
  let options: Partial<RunOptions> & { registryPath: string; lockPath: string };

  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), 'caesar-pipeline-'));
    const registryPath = path.join(root, 'media.ts');
    await copyFile(MEDIA_REGISTRY_PATH, registryPath);

    options = {
      mock: true,
      slots: SLOTS,
      outputDir: path.join(root, 'media'),
      cacheDir: path.join(root, 'cache'),
      lockPath: path.join(root, 'media', 'manifest.lock.json'),
      registryPath,
      log: () => {},
    };
  });

  afterEach(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('generates, optimises, registers and locks every slot', async () => {
    const result = await runPipeline(options);

    expect(result.outcomes.map((outcome) => outcome.status)).toEqual(['generated', 'generated']);

    // Three widths in both formats, for both slots.
    const files = (await readdir(path.join(root, 'media'))).sort();
    for (const width of WIDTHS['1:1']) {
      expect(files).toContain(`test-courtyard-${width}.avif`);
      expect(files).toContain(`test-courtyard-${width}.webp`);
    }

    // Real encodings, not copied bytes.
    const avif = await sharp(path.join(root, 'media', 'test-courtyard-640.avif')).metadata();
    expect(avif.format).toBe('heif');
    expect(avif.width).toBe(640);

    const registry = await readFile(options.registryPath, 'utf8');
    expect(registry).toContain("'test-courtyard': {");
    expect(registry).toContain("src: '/media/test-courtyard-640.avif'");
    expect(registry).toContain("fallback: '/media/test-courtyard-640.webp'");
    expect(registry).toContain('aiGenerated: true');
    expect(registry).toContain('focal: [40, 60]');
    expect(registry).toContain('data:image/webp;base64,');
    // The contract above the generated block is untouched.
    expect(registry).toContain('export function getMedia(');
    expect(registry).toContain('export const aspectClass');

    // Nothing on the site may ever point at a Kling-hosted URL.
    expect(registry).not.toMatch(/klingai|kling\.ai|https?:\/\/[^']*\.png/);

    const lock = JSON.parse(await readFile(options.lockPath, 'utf8')) as {
      totals: { assets: number; images: number; estimatedCostUsd: number };
      assets: Record<string, LockEntry>;
    };

    expect(lock.totals.assets).toBe(2);
    expect(lock.assets['test-courtyard']?.model).toBe('kling-v2-1');
    expect(lock.assets['test-courtyard']?.promptHash).toMatch(/^[0-9a-f]{16}$/);
    expect(lock.assets['test-courtyard']?.mock).toBe(true);
    expect(lock.totals.estimatedCostUsd).toBe(0);
    expect(Date.parse(lock.assets['test-courtyard']?.generatedAt ?? '')).toBeGreaterThan(0);

    // The masters are kept, which is what makes a reference image possible.
    expect(existsSync(path.join(root, 'cache', 'test-courtyard-0.png'))).toBe(true);
  }, 60_000);

  it('is idempotent: a second run regenerates nothing and leaves no diff', async () => {
    await runPipeline(options);
    const registry = await readFile(options.registryPath, 'utf8');
    const lock = await readFile(options.lockPath, 'utf8');

    const second = await runPipeline(options);

    expect(second.outcomes.every((outcome) => outcome.status === 'skipped')).toBe(true);
    expect(second.registryChanged).toBe(false);
    // Not even the lock's timestamp moves, so a no-op run is a no-op in git too.
    expect(await readFile(options.registryPath, 'utf8')).toBe(registry);
    expect(await readFile(options.lockPath, 'utf8')).toBe(lock);
  }, 60_000);

  it('regenerates just one slot behind --only', async () => {
    await runPipeline(options);
    const targeted = await runPipeline({ ...options, only: ['test-texture'], force: true });

    expect(targeted.outcomes).toHaveLength(1);
    expect(targeted.outcomes[0]?.slug).toBe('test-texture');
  }, 60_000);

  it('refuses an --only slug that is not in the manifest', async () => {
    await expect(runPipeline({ ...options, only: ['no-such-slot'] })).rejects.toThrow(
      /not in content\/images\.manifest\.ts/,
    );
  });

  it('writes nothing at all on --dry-run', async () => {
    const result = await runPipeline({ ...options, dryRun: true });

    expect(result.outcomes.every((outcome) => outcome.status === 'planned')).toBe(true);
    expect(existsSync(path.join(root, 'media'))).toBe(false);
    expect(await readFile(options.registryPath, 'utf8')).toBe(
      await readFile(MEDIA_REGISTRY_PATH, 'utf8'),
    );
  });

  it('reports a slot that fails without abandoning the rest of the run', async () => {
    const { createMockTransport } = await import('./mock');
    const transport = createMockTransport({ failFor: ['caesar-test-texture'] });

    const result = await runPipeline({ ...options, fetch: transport.fetch });

    const byStatus = Object.fromEntries(
      result.outcomes.map((outcome) => [outcome.slug, outcome.status]),
    );
    expect(byStatus['test-courtyard']).toBe('generated');
    expect(byStatus['test-texture']).toBe('failed');

    // The one that worked is still registered and still locked.
    expect(await readFile(options.registryPath, 'utf8')).toContain("'test-courtyard'");
  }, 60_000);
});

describe('the skip rule', () => {
  const entry = (over: Partial<LockEntry> = {}): LockEntry => ({
    promptHash: 'abc123',
    model: 'kling-v2-1',
    resolution: '2k',
    aspect: '4:3',
    candidates: 1,
    selectedCandidate: 0,
    generatedAt: new Date().toISOString(),
    mock: false,
    estimatedCostUsd: 0.028,
    files: ['public/media/x-960.avif'],
    masterWidth: 1440,
    masterHeight: 1080,
    src: '/media/x-960.avif',
    fallback: '/media/x-960.webp',
    lqip: 'data:image/webp;base64,AAA',
    ...over,
  });

  const present = { filesExist: () => true };
  const absent = { filesExist: () => false };

  it('skips an unchanged slot whose files are still there', () => {
    expect(shouldSkip(entry(), 'abc123', { mockRun: false, ...present }).skip).toBe(true);
  });

  it('regenerates when the prompt hash moves', () => {
    expect(shouldSkip(entry(), 'different', { mockRun: false, ...present }).skip).toBe(false);
  });

  it('regenerates when the files have gone missing', () => {
    expect(shouldSkip(entry(), 'abc123', { mockRun: false, ...absent }).skip).toBe(false);
  });

  it('replaces a mock placeholder on a real run', () => {
    const decision = shouldSkip(entry({ mock: true }), 'abc123', { mockRun: false, ...present });
    expect(decision.skip).toBe(false);
    expect(decision.reason).toMatch(/mock/);
  });

  it('never lets a mock run overwrite real, paid-for output', () => {
    expect(shouldSkip(entry({ mock: false }), 'abc123', { mockRun: true, ...present }).skip).toBe(
      true,
    );
  });
});

describe('the registry writer', () => {
  it('replaces only the generated block, whether or not it is marked', () => {
    const bare = [
      'const before = 1;',
      'export const assets: Record<string, MediaAsset> = {};',
      'export function getMedia() {}',
    ].join('\n');

    const block = renderAssetsBlock([]);
    const rewritten = replaceAssetsBlock(bare, block);

    expect(rewritten).toContain('const before = 1;');
    expect(rewritten).toContain('export function getMedia() {}');
    expect(rewritten).toContain(MARKER_START);
    expect(rewritten).toContain(MARKER_END);

    // And again, now that the markers are in place.
    expect(replaceAssetsBlock(rewritten, block)).toBe(rewritten);
  });

  it('says what to fix rather than corrupting an unrecognised registry', () => {
    expect(() => replaceAssetsBlock('export const nothing = 1;', renderAssetsBlock([])))
      .toThrow(/scripts\/images\/registry\.ts/);
  });

  it('escapes a quote in alt text rather than emitting broken TypeScript', () => {
    const block = renderAssetsBlock([
      {
        slug: 'x',
        alt: "בניין ה'קיסר' \\ ותו",
        aspect: '4:3',
        src: '/media/x.avif',
        fallback: '/media/x.webp',
        placeholder: 'data:image/webp;base64,AAA',
      },
    ]);

    expect(block).toContain("\\'קיסר\\'");
    expect(block).toContain('\\\\');
  });

  it('sorts entries so a regenerated registry has a stable diff', () => {
    const block = renderAssetsBlock([
      { slug: 'b', alt: 'ב', aspect: '1:1', src: 'a', fallback: 'b', placeholder: 'c' },
      { slug: 'a', alt: 'א', aspect: '1:1', src: 'a', fallback: 'b', placeholder: 'c' },
    ]);

    expect(block.indexOf("'a': {")).toBeLessThan(block.indexOf("'b': {"));
  });
});

describe('the optimiser', () => {
  it('produces three widths, both formats and an inline placeholder', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'caesar-optimise-'));
    try {
      const { buffer } = await synthesiseMaster('seed', '16:9');
      const optimised = await optimiseMaster(buffer, {
        slug: 'sample',
        aspect: '16:9',
        outputDir: directory,
      });

      expect(optimised.renditions).toHaveLength(6);
      expect(optimised.src).toBe('/media/sample-1280.avif');
      expect(optimised.fallback).toBe('/media/sample-1280.webp');
      expect(optimised.placeholder.startsWith('data:image/webp;base64,')).toBe(true);
      // Small enough to inline in HTML without paying for it.
      expect(optimised.placeholder.length).toBeLessThan(2000);

      for (const rendition of optimised.renditions) {
        expect(existsSync(rendition.file)).toBe(true);
        expect(rendition.bytes).toBeGreaterThan(0);
        expect(rendition.height).toBe(Math.round(rendition.width / (16 / 9)));
      }
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  }, 60_000);
});

describe('the command line', () => {
  it('reads the documented flags', () => {
    expect(parseArgs(['--mock', '--dry-run', '--force'])).toMatchObject({
      mock: true,
      dryRun: true,
      force: true,
    });
    expect(parseArgs(['--only', 'hero-tel-aviv-skyline']).only).toEqual(['hero-tel-aviv-skyline']);
    expect(parseArgs(['--only', 'a,b', '--only', 'c']).only).toEqual(['a', 'b', 'c']);
    expect(parseArgs(['--concurrency', '4']).concurrency).toBe(4);
  });

  it('refuses a flag it does not know rather than silently ignoring it', () => {
    expect(() => parseArgs(['--yolo'])).toThrow(/Unknown flag/);
    expect(() => parseArgs(['--only'])).toThrow(/needs a slug/);
    expect(() => parseArgs(['--concurrency', '0'])).toThrow(/positive integer/);
  });
});
