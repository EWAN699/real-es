'use client';

/**
 * testimonials — motion `fade-up`.
 *
 * The section body carries the 9.6 survey line together with the caveat Caesar
 * wrote themselves ("לאור העובדה כי חברתנו מתמחה בשירותי ניהול לטווח ארוך…").
 * brand.md calls that the most credible sentence on their whole site, so it is
 * rendered as a standing note above the quotes rather than being trimmed for
 * tidiness — the qualification is the reason the number is believable.
 */
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Section } from '@/lib/content.types';

export function Testimonials({ section }: { section: Section }) {
  const { ref } = useScrollAnimation<HTMLElement>({
    preset: section.motion ?? 'fade-up',
    stagger: 0.09,
  });

  return (
    <section
      ref={ref}
      id={section.id}
      data-section-type={section.type}
      className="bg-paper py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <h2
          data-animate
          className="rule-brass max-w-2xl text-3xl font-bold tracking-tight text-balance sm:text-5xl"
        >
          {section.heading}
        </h2>

        {section.body ? (
          <p
            data-animate
            className="mt-6 max-w-3xl border-s-2 border-signal ps-5 text-base leading-relaxed text-ink-muted"
          >
            {section.body}
          </p>
        ) : null}

        {section.items?.length ? (
          <ul className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {section.items.map((item) => (
              <li key={item.id} data-animate>
                <figure className="flex h-full flex-col border-t border-line pt-6">
                  <h3 className="text-lg leading-snug font-bold text-balance">{item.title}</h3>
                  {item.body ? (
                    <blockquote className="mt-3 grow text-base leading-relaxed text-ink-muted">
                      {item.body}
                    </blockquote>
                  ) : null}
                  {item.attribution ? (
                    <figcaption className="mt-5 text-sm font-semibold">
                      {item.attribution}
                      {item.location ? (
                        <span className="font-normal text-ink-muted">, {item.location}</span>
                      ) : null}
                    </figcaption>
                  ) : null}
                </figure>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
