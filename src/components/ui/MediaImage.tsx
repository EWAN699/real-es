import { aspectClass, getMedia, hasMedia } from '@/content/media';
import type { MediaAspect } from '@/content/media';

import { cn } from './cn';

/**
 * The only way this codebase renders an image.
 *
 * Images are addressed by slug and resolved through `getMedia`, which is total:
 * a slug with no file yet returns a neutral placeholder. That is what lets the
 * pages be built before the photography pipeline has run, and it is why no path
 * under `/media` is ever written by hand.
 *
 * The wrapper always reserves the asset's aspect ratio, so nothing shifts when
 * the real file lands.
 */
export type MediaImageProps = {
  slug: string;
  /**
   * Overrides the registry's hand-authored Hebrew alt text. Pass it while the
   * registry is still empty. An empty string marks the image decorative.
   */
  alt?: string | undefined;
  aspect?: MediaAspect | undefined;
  /** Above-the-fold images load eagerly and take fetch priority. */
  priority?: boolean | undefined;
  sizes?: string | undefined;
  className?: string | undefined;
  imgClassName?: string | undefined;
  /** Rounds the frame. Off for full-bleed bands. */
  rounded?: boolean | undefined;
};

export function MediaImage({
  slug,
  alt,
  aspect = '4:3',
  priority = false,
  sizes,
  className,
  imgClassName,
  rounded = true,
}: MediaImageProps) {
  const asset = getMedia(slug, aspect);
  const resolvedAlt = alt ?? asset.alt;
  const isPlaceholder = !hasMedia(slug);

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-stone-200',
        rounded && 'rounded-lg',
        aspectClass[asset.aspect],
        className,
      )}
      data-media-slug={slug}
      data-media-placeholder={isPlaceholder ? 'true' : undefined}
    >
      <picture>
        {/*
         * Only advertise the optimised formats once a real file exists. The
         * placeholder is an SVG data URI, and a <source type="image/avif">
         * pointing at it would be selected on the type attribute alone and then
         * fail to decode — <picture> does not fall back on a decode error.
         */}
        {!isPlaceholder && <source srcSet={asset.src} type="image/avif" />}
        {!isPlaceholder && <source srcSet={asset.fallback} type="image/webp" />}
        <img
          src={asset.fallback}
          alt={resolvedAlt}
          sizes={sizes}
          loading={priority ? 'eager' : 'lazy'}
          /*
           * Lowercase on purpose. React 18 does not know the camelCase
           * `fetchPriority` prop — that landed in 19 — and warns while dropping
           * it. An all-lowercase unknown attribute is passed straight through to
           * the DOM, which is what the browser actually reads.
           */
          {...(priority ? { fetchpriority: 'high' } : {})}
          decoding={priority ? 'sync' : 'async'}
          className={cn('absolute inset-0 h-full w-full object-cover', imgClassName)}
          style={
            asset.focal
              ? { objectPosition: `${asset.focal[0]}% ${asset.focal[1]}%` }
              : undefined
          }
        />
      </picture>
    </div>
  );
}
