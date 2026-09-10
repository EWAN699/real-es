'use client';

/**
 * Silent, looping background video for the hero.
 *
 * Two things here are performance decisions, not style ones.
 *
 * **One element, never swapped.** An earlier version rendered the poster as an
 * `<img>` until `useReducedMotion` reported back, then swapped in a `<video>`.
 * Because that hook starts `true` on the server and on the first client render,
 * *every* visitor got the swap — and since the hero is the LCP element, the
 * swap reset LCP after hydration and cost about a second. So the `<video>` is
 * always what renders, on the server too, and reduced motion changes whether it
 * plays rather than whether it exists.
 *
 * **The poster is the LCP paint, so nothing competes with it.** `preload="none"`
 * plus no `autoplay` attribute means the browser paints the poster and fetches
 * nothing else; playback is started by hand once the browser goes idle. The
 * poster is 40 KB against a 150 KB ceiling and is preloaded explicitly below,
 * so it arrives fast and holds the frame until the loop does. That preload is
 * not optional: without it LCP measured 2.9s, because a `poster` attribute
 * alone is discovered only when the video element is parsed.
 *
 * Reduced motion (motion.spec.md rule 1): playback simply never starts, so the
 * hero renders complete and still on its own poster frame. `muted` +
 * `playsInline` remain because without both, iOS refuses to autoplay at all.
 */
import { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { Media } from '@/lib/content.types';

export interface BackgroundVideoProps {
  media: Media;
  /** Ignored when `fill`; the parent reserves the space instead. */
  ratio?: string;
  className?: string;
  fill?: boolean;
}

export function BackgroundVideo({ media, ratio, className, fill }: BackgroundVideoProps) {
  const reduced = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (reduced) {
      video.pause();
      return;
    }

    const start = () => {
      video.preload = 'auto';
      video.load();
      // Autoplay can still be refused (battery saver, an OS-level setting).
      // The poster stays on screen if so, which is the intended fallback.
      void video.play().catch(() => {});
    };

    const idle = window.requestIdleCallback;
    if (typeof idle === 'function') {
      const handle = idle(start, { timeout: 2000 });
      return () => window.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(start, 400);
    return () => window.clearTimeout(timer);
  }, [reduced]);

  if (!media.src) return null;

  // The poster is the LCP paint. Hoisted into <head> as a preload so it is
  // discovered with the document rather than when the <video> tag is reached.
  if (media.poster) {
    ReactDOM.preload(media.poster, { as: 'image', fetchPriority: 'high' });
  }

  return (
    <div
      className={`media-box ${fill ? 'h-full w-full' : ''} ${className ?? ''}`}
      style={fill ? undefined : { aspectRatio: ratio }}
    >
      {/* No <track>: the loop is silent and decorative, so there is nothing to
          caption. The accessible description is the aria-label. */}
      <video
        ref={videoRef}
        aria-label={media.alt}
        poster={media.poster}
        muted
        loop
        playsInline
        preload="none"
      >
        <source src={media.src.replace(/\.mp4$/, '.webm')} type="video/webm" />
        <source src={media.src} type="video/mp4" />
      </video>
    </div>
  );
}
