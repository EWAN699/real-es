'use client';

/**
 * intro — motion `fade-up`.
 *
 * The three divisions are the company's own numbered structure, so they are
 * numbered here too. The figure is set in brass at a size where brass on
 * limestone still clears AA (large text), and the rule beneath each one is the
 * accent doing structural work rather than decoration.
 */
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Section } from '@/lib/content.types';

export function Intro({ section }: { section: Section }) {
  const { ref } = useScrollAnimation<HTMLElement>({ preset: section.motion ?? 'fade-up' });

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
          <p data-animate className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-muted">
            {section.body}
          </p>
        ) : null}

        {section.items?.length ? (
          <ol className="mt-16 grid gap-10 sm:grid-cols-3 sm:gap-8">
            {section.items.map((item, i) => (
              <li key={item.id} data-animate className="border-t border-line pt-6">
                <span className="numeral block text-sm font-semibold text-accent-text">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-3 text-xl leading-snug font-bold">{item.title}</h3>
                {item.body ? (
                  <p className="mt-3 text-base leading-relaxed text-ink-muted">{item.body}</p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : null}
      </div>
    </section>
  );
}
