'use client';

/**
 * contact — motion `fade-up`.
 *
 * There is no separate /צור-קשר route: the site is one scroll page and this
 * section is where the form lives (recorded in PLAN.md as a decision, not a
 * gap). Items that carry an `href` become real links — `tel:` and `mailto:`
 * are the conversion on this site and should be tappable, not copy-and-paste.
 * Their values are `.numeral`/LTR-isolated so a phone number does not get
 * reordered inside RTL text.
 */
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Section } from '@/lib/content.types';

import { ContactForm } from './ContactForm';

/** Latin-digit or Latin-script values inside RTL Hebrew need isolating. */
function isLtrValue(href?: string): boolean {
  return Boolean(href && (href.startsWith('tel:') || href.startsWith('mailto:')));
}

export function Contact({ section, pageSlug }: { section: Section; pageSlug: string }) {
  const { ref } = useScrollAnimation<HTMLElement>({ preset: section.motion ?? 'fade-up' });

  return (
    <section
      ref={ref}
      id={section.id}
      data-section-type={section.type}
      className="section-stone py-24 sm:py-32"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-14 px-6 lg:grid-cols-2 lg:gap-20">
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
            <p data-animate className="mt-6 max-w-md text-base leading-relaxed text-ink-muted">
              {section.body}
            </p>
          ) : null}

          {section.items?.length ? (
            <dl className="mt-10 space-y-5">
              {section.items.map((item) => {
                const ltr = isLtrValue(item.href);
                const value = item.href ? (
                  <a
                    href={item.href}
                    className={`text-accent-text hover:underline ${ltr ? 'numeral' : ''}`}
                  >
                    {item.body}
                  </a>
                ) : (
                  <span className={ltr ? 'numeral' : undefined}>{item.body}</span>
                );

                return (
                  <div key={item.id} data-animate className="border-t border-line pt-4">
                    <dt className="text-sm text-ink-muted">{item.title}</dt>
                    <dd className="mt-1 text-lg font-semibold">{value}</dd>
                  </div>
                );
              })}
            </dl>
          ) : null}
        </div>

        <div data-animate>
          <ContactForm pageSlug={pageSlug} />
        </div>
      </div>
    </section>
  );
}
