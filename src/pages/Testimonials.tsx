import { Link } from 'react-router-dom';

import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { testimonials } from '@/content/testimonials';
import { buildBreadcrumbs } from '@/lib/structured-data';

/**
 * לקוחות ממליצים — the letters customers actually sent.
 *
 * Every quote here is the client's published text, with the customers' own
 * spelling and punctuation left alone. `needsReview` on a testimonial means
 * "the homepage truncated this one mid-sentence, restore the full letter from
 * the export" — not "do not publish it" — so the archive shows all of them, and
 * shows each one only as far as the client's own text goes.
 *
 * No `aggregateRating` is emitted for any of this. A star rating assembled out
 * of prose testimonials is a fabricated metric, and the two numbers the legacy
 * site did publish (a counter reading 69, a survey score of 9.6) contradict each
 * other.
 *
 * Each testimonial has its own page because each had one on the legacy site, and
 * those URLs redirect here.
 */
export function Component() {
  return (
    <>
      <Seo
        title="לקוחות ממליצים"
        description="מכתבים והמלצות של בעלי נכסים, שוכרים ומשקיעים שעבדו עם קבוצת קיסר."
        path="/testimonials"
      />
      <JsonLd
        data={buildBreadcrumbs([
          { name: 'דף הבית', path: '/' },
          { name: 'לקוחות ממליצים', path: '/testimonials' },
        ])}
      />

      <PageHeader
        eyebrow="הקבוצה"
        title="לקוחות ממליצים"
        lede="מכתבים שקיבלנו מבעלי נכסים, שוכרים ומשקיעים. הטקסט הוא שלהם, כפי שנכתב."
        crumbs={[
          { label: 'דף הבית', to: '/' },
          { label: 'הקבוצה', to: '/about' },
          { label: 'לקוחות ממליצים', to: '/testimonials' },
        ]}
      />

      <Section labelledBy="testimonials-title" tone="default">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <Heading level={2} id="testimonials-title">
            כל ההמלצות
          </Heading>
          <p className="tabular text-small text-ink-600">{testimonials.length} המלצות</p>
        </div>

        <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <li key={testimonial.slug}>
              <Reveal delay={Math.min(index, 5) * 0.05} className="h-full">
                <figure className="flex h-full flex-col rounded-lg border border-stone-200 bg-stone-50 p-6">
                  <blockquote className="flex-1 text-body text-ink-900">
                    <p>{testimonial.quote}</p>
                  </blockquote>

                  <figcaption className="mt-5 border-t border-stone-200 pt-4 text-small">
                    <span className="font-semibold text-ink-900">{testimonial.author}</span>
                    {testimonial.city ? (
                      <span className="text-ink-600"> · {testimonial.city}</span>
                    ) : null}
                    <Link
                      to={`/testimonials/${testimonial.slug}`}
                      className="mt-2 block font-semibold text-brand-700 underline underline-offset-4 hover:text-ink-900"
                    >
                      {/* Not "the full testimonial": some of these quotes are
                          themselves partial until the client's export lands, and
                          the link must not promise more than the page holds. */}
                      <span className="sr-only">{testimonial.author}: </span>
                      לעמוד ההמלצה
                    </Link>
                  </figcaption>
                </figure>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      <Section labelledBy="testimonials-cta-title" tone="dark" spacing="sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <Heading level={2} id="testimonials-cta-title" tone="dark">
            רוצים שנטפל גם בנכס שלכם?
          </Heading>
          <Button to="/contact" variant="onDark" size="lg" className="shrink-0">
            דברו איתנו
          </Button>
        </div>
      </Section>
    </>
  );
}

Component.displayName = 'Testimonials';
