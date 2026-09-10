/**
 * The still-image primitive, implementing contracts/assets.md.
 *
 * It reserves its space before anything loads. motion.spec.md rule 3 says
 * anything that animates reserves its space first, and a lazy image that pops
 * in at its natural height is the classic way to break that — so the caller
 * gives an aspect ratio and the box holds it whether or not the file arrives.
 *
 * `src` in content is the .webp path. The .avif sits beside it with the same
 * stem (scripts/optimize-media.ts guarantees that), so the <source> is derived
 * rather than stored a second time in content/pages.json.
 *
 * Server component: this is static markup and has no reason to ship JS.
 */
import type { Media } from '@/lib/content.types';

/** /media/x/y.webp -> /media/x/y.avif */
function avifFor(src: string): string {
  return src.replace(/\.webp$/, '.avif');
}

export interface PictureProps {
  media: Media;
  /** CSS aspect-ratio for the reserved box, e.g. '16 / 9'. Ignored when `fill`. */
  ratio?: string;
  className?: string;
  /** Only the above-the-fold candidate should set this. */
  priority?: boolean;
  sizes?: string;
  /**
   * Full-bleed background: the box takes its size from an already-sized parent
   * instead of reserving its own. An aspect-ratio here would fight that parent
   * and letterbox the image, so it is deliberately not set — the parent is what
   * reserves the space, which still satisfies motion.spec.md rule 3.
   */
  fill?: boolean;
}

export function Picture({ media, ratio, className, priority, sizes, fill }: PictureProps) {
  if (!media.src) return null;

  return (
    <figure
      className={`media-box ${fill ? 'h-full w-full' : ''} ${className ?? ''}`}
      style={fill ? undefined : { aspectRatio: ratio }}
    >
      <picture>
        <source srcSet={avifFor(media.src)} type="image/avif" />
        <source srcSet={media.src} type="image/webp" />
        {/* A plain <img>, not next/image: these paths are content-driven and
            scripts/optimize-media.ts has already resized and compressed them to
            the ceilings in contracts/assets.md. Re-encoding them at request time
            would duplicate that work and put a second, disagreeing authority in
            charge of asset budgets. */}
        <img
          src={media.src}
          alt={media.alt}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
        />
      </picture>
      {media.credit ? <figcaption className="visually-hidden">{media.credit}</figcaption> : null}
    </figure>
  );
}
