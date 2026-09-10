'use client';

/**
 * faq — motion `fade-up`.
 *
 * Native <details>/<summary>, deliberately. It is keyboard-operable, findable
 * by in-page search when open, works with no JS at all, and is announced
 * correctly without a single ARIA attribute — all of which a hand-rolled
 * accordion has to re-earn. The marker is replaced with a brass sign that
 * flips on open; `list-none` plus the webkit pseudo-element covers both engines.
 */
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Section } from '@/lib/content.types';

export function Faq({ section }: { section: Section }) {
  const { ref } = useScrollAnimation<HTMLElement>({
    preset: section.motion ?? 'fade-up',
    stagger: 0.06,
  });

  return (
    <section
      ref={ref}
      id={section.id}
      data-section-type={section.type}
      className="bg-paper-sunk py-24 sm:py-32"
    >
      <div className="mx-auto w-full max-w-3xl px-6">
        <h2
          data-animate
          className="rule-brass text-3xl font-bold tracking-tight text-balance sm:text-4xl"
        >
          {section.heading}
        </h2>

        {section.body ? (
          <p data-animate className="mt-6 text-lg leading-relaxed text-ink-muted">
            {section.body}
          </p>
        ) : null}

        <div className="mt-12 divide-y divide-line border-y border-line">
          {section.items?.map((item) => (
            <details key={item.id} data-animate className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-start text-lg font-semibold [&::-webkit-details-marker]:hidden">
                <span className="text-balance">{item.title}</span>
                <span
                  aria-hidden
                  className="mt-1 shrink-0 text-2xl leading-none text-accent-text transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              {item.body ? (
                <p className="mt-4 text-base leading-relaxed text-ink-muted">{item.body}</p>
              ) : null}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
