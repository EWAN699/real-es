'use client';

/**
 * cta — motion `parallax-slow`.
 *
 * The preset needs exactly two things from this component: a container that
 * clips and holds its own height, and one `[data-motion-parallax]` layer
 * inside it. globals.css already oversizes that layer to 130% so the 0.7×
 * translate never exposes an edge — which is why the layer here carries no
 * sizing of its own beyond filling the box.
 *
 * The section has a fixed min-height rather than sizing to its content, since
 * motion.spec.md rule 3 requires the parallax container to have a known height
 * before the image loads.
 */
import { Picture } from '@/components/media/Picture';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Section } from '@/lib/content.types';

import { CtaLink } from './CtaLink';

export function CallToAction({ section }: { section: Section }) {
  const { ref } = useScrollAnimation<HTMLElement>({ preset: section.motion ?? 'parallax-slow' });
  const plate = section.media[0];

  return (
    <section
      ref={ref}
      id={section.id}
      data-section-type={section.type}
      className="section-dark relative isolate flex min-h-[70svh] items-center"
    >
      {plate ? (
        <div data-motion-parallax className="absolute inset-0 -z-10">
          <Picture media={plate} fill sizes="100vw" />
        </div>
      ) : null}
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink/70" />

      <div className="mx-auto w-full max-w-6xl px-6 text-center">
        <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-5xl">
          {section.heading}
        </h2>
        {section.body ? (
          <p className="mx-auto mt-5 max-w-xl text-lg text-limestone/85">{section.body}</p>
        ) : null}
        {section.cta ? (
          <div className="mt-10">
            <CtaLink cta={section.cta} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
