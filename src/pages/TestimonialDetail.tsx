import { useParams } from 'react-router-dom';

import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { testimonials } from '@/content/testimonials';
import { buildBreadcrumbs } from '@/lib/structured-data';
import { Component as NotFound } from './NotFound';

/**
 * One testimonial, at `/testimonials/<slug>`.
 *
 * The legacy site gave each letter its own permalink and those URLs are still
 * linked; `testimonialLegacyPaths` maps every one of them here.
 *
 * The page prints the customer's text and their name, and nothing else. No
 * rating, no invented date, no stock portrait of a person who did not sit for
 * one — the letter is the content.
 */
export function Component() {
  const { slug } = useParams<{ slug: string }>();
  const testimonial = slug ? testimonials.find((entry) => entry.slug === slug) : undefined;

  if (!testimonial) return <NotFound />;

  const path = `/testimonials/${testimonial.slug}`;
  const title = `המלצה — ${testimonial.author}`;

  return (
    <>
      <Seo
        title={title}
        description={testimonial.quote.slice(0, 155)}
        path={path}
      />
      <JsonLd
        data={buildBreadcrumbs([
          { name: 'דף הבית', path: '/' },
          { name: 'לקוחות ממליצים', path: '/testimonials' },
          { name: testimonial.author, path },
        ])}
      />

      <PageHeader
        eyebrow="לקוחות ממליצים"
        title={testimonial.author}
        {...(testimonial.city ? { lede: testimonial.city } : {})}
        crumbs={[
          { label: 'דף הבית', to: '/' },
          { label: 'לקוחות ממליצים', to: '/testimonials' },
          { label: testimonial.author, to: path },
        ]}
      />

      <section aria-label={title} className="bg-stone-100 py-16 md:py-24">
        <Container width="narrow">
          <figure>
            <blockquote className="text-h3 text-ink-900">
              <p>{testimonial.quote}</p>
            </blockquote>
            <figcaption className="mt-6 text-body font-semibold text-ink-600">
              — {testimonial.author}
              {testimonial.city ? `, ${testimonial.city}` : ''}
            </figcaption>
          </figure>

          <div className="mt-10 flex flex-wrap gap-3">
            <Button to="/testimonials" variant="secondary">
              לכל ההמלצות
            </Button>
            <Button to="/contact">דברו איתנו</Button>
          </div>
        </Container>
      </section>
    </>
  );
}

Component.displayName = 'TestimonialDetail';
