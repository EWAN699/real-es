/**
 * Master image → the files the site actually serves.
 *
 * Three widths per slot in both AVIF and WebP, plus an inline LQIP. The registry
 * currently exposes the middle width as `src`/`fallback`, but all three are on
 * disk and recorded in the lock file, so exposing a full `srcset` later is a
 * change to `MediaAsset` alone — no regeneration, no second Kling bill.
 *
 * Nothing here reaches the network. It takes bytes and returns paths.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

import { ASPECT_RATIOS, DEFAULT_WIDTH_INDEX, ENCODE, PUBLIC_BASE, WIDTHS } from './config';

import type { MediaAspect } from '../../src/content/media';

export type RenditionFile = {
  width: number;
  height: number;
  format: 'avif' | 'webp';
  /** Path on disk. */
  file: string;
  /** URL the site uses. */
  url: string;
  bytes: number;
};

export type OptimisedAsset = {
  slug: string;
  aspect: MediaAspect;
  renditions: RenditionFile[];
  /** The middle-width AVIF. */
  src: string;
  /** The middle-width WebP. */
  fallback: string;
  /** Inline base64 data URI. */
  placeholder: string;
  masterWidth: number;
  masterHeight: number;
};

export async function optimiseMaster(
  input: Buffer,
  options: {
    slug: string;
    aspect: MediaAspect;
    outputDir: string;
    publicBase?: string;
  },
): Promise<OptimisedAsset> {
  const { slug, aspect, outputDir } = options;
  const publicBase = options.publicBase ?? PUBLIC_BASE;

  await mkdir(outputDir, { recursive: true });

  const metadata = await sharp(input).metadata();
  const widths = WIDTHS[aspect];
  const ratio = ASPECT_RATIOS[aspect];
  const renditions: RenditionFile[] = [];

  for (const width of widths) {
    const height = Math.round(width / ratio);

    // `rotate()` first so EXIF orientation is baked in before the crop.
    const resized = sharp(input)
      .rotate()
      .resize(width, height, { fit: 'cover', position: 'centre' });

    for (const format of ['avif', 'webp'] as const) {
      const file = path.join(outputDir, `${slug}-${width}.${format}`);
      const encoded =
        format === 'avif'
          ? await resized.clone().avif(ENCODE.avif).toBuffer()
          : await resized.clone().webp(ENCODE.webp).toBuffer();

      await writeFile(file, encoded);
      renditions.push({
        width,
        height,
        format,
        file,
        url: `${publicBase}/${slug}-${width}.${format}`,
        bytes: encoded.byteLength,
      });
    }
  }

  const placeholder = await makeLqip(input, aspect);

  const chosenWidth = widths[DEFAULT_WIDTH_INDEX] ?? widths[0];
  const pick = (format: 'avif' | 'webp'): string => {
    const match = renditions.find((r) => r.width === chosenWidth && r.format === format);
    if (!match) throw new Error(`No ${format} rendition at width ${chosenWidth} for ${slug}`);
    return match.url;
  };

  return {
    slug,
    aspect,
    renditions,
    src: pick('avif'),
    fallback: pick('webp'),
    placeholder,
    masterWidth: metadata.width ?? 0,
    masterHeight: metadata.height ?? 0,
  };
}

/**
 * A twenty-pixel-wide blurred WebP, inlined as a data URI.
 *
 * Small enough to sit in the HTML without cost, warm enough that the block of
 * colour it paints belongs to the image that replaces it.
 */
export async function makeLqip(input: Buffer, aspect: MediaAspect): Promise<string> {
  const width = ENCODE.lqip.width;
  const height = Math.max(1, Math.round(width / ASPECT_RATIOS[aspect]));

  const buffer = await sharp(input)
    .rotate()
    .resize(width, height, { fit: 'cover', position: 'centre' })
    .blur(ENCODE.lqip.blur)
    .webp({ quality: ENCODE.lqip.quality })
    .toBuffer();

  return `data:image/webp;base64,${buffer.toString('base64')}`;
}
