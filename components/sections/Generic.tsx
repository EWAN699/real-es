'use client';

/**
 * Fallback for a section type that has no bespoke component yet.
 *
 * No content type currently routes here — every member of `SectionType` has a
 * real component. It exists so that adding a type to the schema degrades to
 * "renders plainly but completely" instead of "vanishes from the page", which
 * is the failure mode you do not notice in review.
 */
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Section } from '@/lib/content.types';

export function Generic({ section }: { section: Section }) {
  const { ref } = useScrollAnimation<HTMLElement>({ preset: section.motion ?? 'fade-up' });

  return (
    <section ref={ref} id={section.id} data-section-type={section.type} className="bg-paper py-24">
      <div className="mx-auto w-full max-w-3xl px-6">
        <h2
          data-animate
          className="rule-brass text-3xl font-bold tracking-tight text-balance sm:text-4xl"
        >
          {section.heading}
        </h2>
        {section.subheading ? (
          <p data-animate className="mt-4 text-lg text-ink-muted">
            {section.subheading}
          </p>
        ) : null}
        {section.body ? (
          <p data-animate className="mt-6 text-base leading-relaxed">
            {section.body}
          </p>
        ) : null}
        {section.items?.length ? (
          <ul className="mt-10 space-y-6">
            {section.items.map((item) => (
              <li key={item.id} data-animate className="border-t border-line pt-4">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                {item.value ? (
                  <p className="numeral text-2xl font-bold text-accent-text">{item.value}</p>
                ) : null}
                {item.body ? <p className="mt-2 text-base text-ink-muted">{item.body}</p> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
