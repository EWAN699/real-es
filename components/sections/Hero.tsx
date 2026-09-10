'use client';

/**
 * hero — motion `text-split`.
 *
 * The video sits behind a scrim rather than beside the type. The source frame
 * is deliberately dark on the left (where the key light falls off), which is
 * where RTL text starts, so the scrim is a directional gradient keyed to the
 * inline axis instead of a flat wash — it only darkens where the type actually
 * lands, and leaves the brass highlight on the key visible.
 *
 * The heading carries `data-motion-heading`, which is all `text-split` needs;
 * everything below it staggers as ordinary `data-animate` children.
 */
import { BackgroundVideo } from '@/components/media/BackgroundVideo';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Section } from '@/lib/content.types';

import { CtaLink } from './CtaLink';

export function Hero({ section }: { section: Section }) {
  const { ref } = useScrollAnimation<HTMLElement>({
    preset: section.motion ?? 'text-split',
    // The hero is above the fold; waiting for it to be 85% up the viewport
    // would mean it never plays.
    start: 'top 95%',
  });
  const video = section.media.find((m) => m.kind === 'video');

  return (
    <section
      ref={ref}
      id={section.id}
      data-section-type={section.type}
      className="section-dark relative isolate flex min-h-[92svh] items-end overflow-hidden"
    >
      {video ? (
        <div className="absolute inset-0 -z-10">
          <BackgroundVideo media={video} fill />
          {/* Directional scrim: heaviest where RTL type starts. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-l from-transparent via-ink/70 to-ink"
          />
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40" />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-6xl px-6 pt-32 pb-20 sm:pb-28">
        <h1
          data-motion-heading
          className="max-w-3xl text-4xl leading-[1.12] font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl"
        >
          {section.heading}
        </h1>

        {section.body ? (
          <p
            data-animate
            className="mt-6 max-w-xl text-lg leading-relaxed text-limestone/85 sm:text-xl"
          >
            {section.body}
          </p>
        ) : null}

        {section.subheading ? (
          <p data-animate className="mt-3 text-base text-ink-muted">
            {section.subheading}
          </p>
        ) : null}

        {section.cta ? (
          <div data-animate className="mt-10">
            <CtaLink cta={section.cta} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
