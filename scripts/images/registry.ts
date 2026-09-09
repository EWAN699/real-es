/**
 * Rewrites the generated `assets` block in `src/content/media.ts`.
 *
 * That file is a frozen contract owned jointly: `MediaAsset`, `getMedia`,
 * `hasMedia` and `aspectClass` belong to the UI and are never touched here. Only
 * the region between the two GENERATED markers is replaced, and the replacement
 * is a plain object literal — no imports, no JSON side-car — so the registry
 * stays readable in review and tree-shakes like ordinary code.
 *
 * Every entry written here is `aiGenerated: true`, because every entry written
 * here came from a model. The flag is what makes the honesty rule auditable
 * rather than aspirational: a listing gallery asserting `aiGenerated: false`
 * cannot be satisfied by anything this pipeline produces.
 */

import { readFile, writeFile } from 'node:fs/promises';

import type { MediaAspect } from '../../src/content/media';

export const MARKER_START =
  '/* GENERATED:assets — rewritten by `npm run images:generate`. Do not edit by hand. */';
export const MARKER_END = '/* GENERATED:assets:end */';

const MARKED_BLOCK = /\/\* GENERATED:assets[\s\S]*?GENERATED:assets:end \*\//;
const BARE_BLOCK = /export const assets: Record<string, MediaAsset> = \{[\s\S]*?\n?\};/;

export type RegistryEntry = {
  slug: string;
  alt: string;
  aspect: MediaAspect;
  src: string;
  fallback: string;
  placeholder: string;
  focal?: [number, number] | undefined;
};

function quote(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

export function renderAssetsBlock(entries: readonly RegistryEntry[]): string {
  const sorted = [...entries].sort((a, b) => a.slug.localeCompare(b.slug));

  if (sorted.length === 0) {
    return [
      MARKER_START,
      'export const assets: Record<string, MediaAsset> = {};',
      MARKER_END,
    ].join('\n');
  }

  const body = sorted
    .map((entry) => {
      const lines = [
        `  ${quote(entry.slug)}: {`,
        `    slug: ${quote(entry.slug)},`,
        `    alt: ${quote(entry.alt)},`,
        `    aspect: ${quote(entry.aspect)},`,
        `    src: ${quote(entry.src)},`,
        `    fallback: ${quote(entry.fallback)},`,
        `    placeholder:`,
        `      ${quote(entry.placeholder)},`,
      ];
      if (entry.focal) lines.push(`    focal: [${entry.focal[0]}, ${entry.focal[1]}],`);
      lines.push('    aiGenerated: true,', '  },');
      return lines.join('\n');
    })
    .join('\n');

  return [
    MARKER_START,
    'export const assets: Record<string, MediaAsset> = {',
    body,
    '};',
    MARKER_END,
  ].join('\n');
}

/** Replaces the generated block in place, leaving the rest of the file untouched. */
export function replaceAssetsBlock(source: string, block: string): string {
  if (MARKED_BLOCK.test(source)) return source.replace(MARKED_BLOCK, block);
  if (BARE_BLOCK.test(source)) return source.replace(BARE_BLOCK, block);

  throw new Error(
    'Could not find the generated assets block in the media registry. Expected either the ' +
      'GENERATED:assets markers or `export const assets: Record<string, MediaAsset> = { … };`. ' +
      'The contract in src/content/media.ts has changed — fix scripts/images/registry.ts rather ' +
      'than hand-editing the registry.',
  );
}

export async function writeRegistry(
  registryPath: string,
  entries: readonly RegistryEntry[],
): Promise<{ changed: boolean }> {
  const source = await readFile(registryPath, 'utf8');
  const next = replaceAssetsBlock(source, renderAssetsBlock(entries));
  if (next === source) return { changed: false };

  await writeFile(registryPath, next);
  return { changed: true };
}
