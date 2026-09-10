'use client';

/**
 * showcase — motion `pin-reveal`. One of the two allowed per page.
 *
 * The section pins and the four method states advance in place beside the I3
 * concourse image. Each state is a `[data-motion-step]`; globals.css stacks
 * them into one grid cell on the animated path and lets them flow as ordinary
 * rows on the static one, so reduced motion gets the whole method as a plain
 * readable list.
 *
 * The section used to carry a second asset, `method-existing-mall`, lifted from
 * the live caesar.co.il. It is gone, for the reason content/asset-plan.md §4
 * gave in advance: its own credit note says Caesar's management of the pictured
 * property is unverified, and showing it would imply a mandate the harvest
 * cannot support. (It was also an `http://` URL, so an https page would have
 * blocked it as mixed content anyway.) I3 covers the section on its own.
 */
import { Picture } from '@/components/media/Picture';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Section } from '@/lib/content.types';

export function Showcase({ section }: { section: Section }) {
  const { ref } = useScrollAnimation<HTMLElement>({
    preset: section.motion ?? 'pin-reveal',
    // Four states at a full viewport each is a long pin. 0.7 keeps the whole
    // section under three screens of scroll, which is the point at which
    // pinning starts to feel stuck.
    stepLength: 0.7,
  });

  const plate = section.media[0];

  return (
    <section
      ref={ref}
      id={section.id}
      data-section-type={section.type}
      className="flex min-h-svh items-center bg-paper-sunk py-24"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div>
          <h2 className="rule-brass text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {section.heading}
          </h2>
          {section.body ? (
            <p className="mt-6 text-lg leading-relaxed text-ink-muted">{section.body}</p>
          ) : null}

          <div className="motion-steps mt-12">
            {section.items?.map((item, i) => (
              <article key={item.id} data-motion-step className="border-t border-line pt-6">
                <span className="numeral text-sm font-semibold text-accent-text">
                  {String(i + 1).padStart(2, '0')} / {String(section.items?.length ?? 0)}
                </span>
                <h3 className="mt-3 text-2xl leading-snug font-bold text-balance">{item.title}</h3>
                {item.body ? (
                  <p className="mt-3 text-base leading-relaxed text-ink-muted">{item.body}</p>
                ) : null}
              </article>
            ))}
          </div>

          <div className="motion-progress mt-10" role="presentation" />
        </div>

        {/* Sticky so the plate stays beside whichever step is showing rather
            than sitting marooned in the empty half of a tall pinned section. */}
        <div className="lg:sticky lg:top-28">
          {plate ? (
            <Picture
              media={plate}
              ratio="16 / 9"
              className="rounded-lg"
              sizes="(max-width: 1024px) 100vw, 32rem"
            />
          ) : null}
        </div>
      </div>
    </section>
  );
}
