'use client';

/**
 * coverage — motion `fade-up`.
 *
 * brand.md's reading of the region counts is that 191 of 278 live listings sit
 * in two regions, so the footprint is a spine up the coastal plain rather than
 * the blanket "פריסה ארצית" implies. The bars below are drawn to scale against
 * the largest region for exactly that reason: the shape of the data is the
 * honest version of the claim, and flattening it into a tidy equal-width grid
 * would quietly overstate the south.
 *
 * Counts are `.numeral` — Latin digits inside RTL Hebrew reorder otherwise.
 */
import { Picture } from '@/components/media/Picture';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Section } from '@/lib/content.types';

export function Coverage({ section }: { section: Section }) {
  const { ref } = useScrollAnimation<HTMLElement>({
    preset: section.motion ?? 'fade-up',
    stagger: 0.05,
  });

  const counted = (section.items ?? []).filter((i) => Number.isFinite(Number(i.value)));
  const max = counted.reduce((m, i) => Math.max(m, Number(i.value)), 0);
  const plate = section.media[0];

  return (
    <section
      ref={ref}
      id={section.id}
      data-section-type={section.type}
      className="section-dark py-24 sm:py-32"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_20rem] lg:gap-16">
        <div>
          <h2
            data-animate
            className="rule-brass text-3xl font-bold tracking-tight text-balance sm:text-5xl"
          >
            {section.heading}
          </h2>
          {section.subheading ? (
            <p data-animate className="mt-4 text-lg text-ink-muted">
              {section.subheading}
            </p>
          ) : null}
          {section.body ? (
            <p data-animate className="mt-2 text-base text-ink-muted">
              {section.body}
            </p>
          ) : null}

          <ul className="mt-12 space-y-5">
            {(section.items ?? []).map((item) => {
              const n = Number(item.value);
              const pct = max > 0 && Number.isFinite(n) ? Math.max(2, (n / max) * 100) : 0;
              return (
                <li key={item.id} data-animate>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-base font-semibold">{item.title}</span>
                    {item.value ? (
                      <span className="numeral text-base font-bold text-accent-text">
                        {item.value}
                      </span>
                    ) : null}
                  </div>
                  {pct > 0 ? (
                    <div className="mt-2 h-px w-full bg-line">
                      <div className="h-px bg-brass" style={{ inlineSize: `${pct}%` }} />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>

        {plate ? (
          <div data-animate className="lg:pt-24">
            <Picture
              media={plate}
              ratio="3 / 4"
              className="rounded-lg"
              sizes="(max-width: 1024px) 100vw, 20rem"
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
