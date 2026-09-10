'use client';

/**
 * stats — motion `fade-up`.
 *
 * The I1 plate sits behind the figures. Phase 3A flagged that it came back
 * with more window-to-facade contrast across the middle third than was asked
 * for, so the numerals get a real scrim rather than relying on the image being
 * quiet enough: an ink wash plus a vertical gradient. Without it the 300+ sits
 * on lit windows and half its strokes disappear.
 *
 * Figures are `.numeral` because Hebrew runs RTL while '300+', '9.6' and '24/7'
 * must not be reordered by the bidi algorithm.
 */
import { Picture } from '@/components/media/Picture';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Section } from '@/lib/content.types';

/**
 * content/brand.md §4 reserves the signal green for externally verifiable
 * facts rather than claims — it names the survey score and the zero-fees line
 * specifically. Everything else takes the ordinary brass accent.
 */
const VERIFIED = new Set(['stat-survey', 'stat-fees']);

export function Stats({ section }: { section: Section }) {
  const { ref } = useScrollAnimation<HTMLElement>({
    preset: section.motion ?? 'fade-up',
    stagger: 0.1,
  });
  const plate = section.media[0];

  return (
    <section
      ref={ref}
      id={section.id}
      data-section-type={section.type}
      className="section-dark relative isolate overflow-hidden py-24 sm:py-32"
    >
      {plate ? (
        <div className="absolute inset-0 -z-10">
          <Picture media={plate} fill sizes="100vw" />
          {/* Enough veil for the figures to hold, not so much that the plate
              disappears — I1 came back with more window-to-facade contrast
              across the middle third than the brief asked for. */}
          <div aria-hidden className="absolute inset-0 bg-ink/60" />
          {/* Vertical falloff so the plate stays visible at the edges while the
              band the figures sit on goes darker. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-ink/40 via-ink/75 to-ink/40"
          />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-6xl px-6">
        <h2
          data-animate
          className="rule-brass text-3xl font-bold tracking-tight text-balance sm:text-5xl"
        >
          {section.heading}
        </h2>

        {section.items?.length ? (
          <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-12 lg:grid-cols-4">
            {section.items.map((item) => (
              <div key={item.id} data-animate>
                <dt className="visually-hidden">{item.title}</dt>
                <dd>
                  <span
                    className={`numeral block text-5xl leading-none font-bold tracking-tight sm:text-6xl ${
                      VERIFIED.has(item.id) ? 'text-signal' : 'text-brass'
                    }`}
                  >
                    {item.value}
                  </span>
                  <span className="mt-4 block text-base font-semibold">{item.title}</span>
                  {item.body ? (
                    <span className="mt-2 block text-sm leading-relaxed text-ink-muted">
                      {item.body}
                    </span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
    </section>
  );
}
