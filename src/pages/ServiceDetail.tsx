import { Link, useParams } from 'react-router-dom';

import { divisionNav } from '@/components/layout/nav';
import { JsonLd } from '@/components/JsonLd';
import { LeadForm } from '@/components/forms/LeadForm';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { Heading } from '@/components/ui/Heading';
import { Prose } from '@/components/ui/Prose';
import { Section } from '@/components/ui/Section';
import { getService, servicePath, servicesByDivision } from '@/content/services';
import { buildBreadcrumbs } from '@/lib/structured-data';
import { Component as NotFound } from './NotFound';

/**
 * One service page, at `/services/<slug>`.
 *
 * These twenty-one pages are where the legacy site's four-level menu went. Each
 * old URL redirects here — the map in `src/lib/redirects.ts` is built from the
 * `legacyPaths` on the service records — so every one of them has to resolve.
 *
 * An unknown slug renders the 404 rather than an empty shell. The route is
 * prerendered only for slugs that exist (`getStaticPaths` in routes.tsx), so
 * this branch is for a hand-typed URL or a stale link, and it must not look
 * like a real page that happens to have nothing in it.
 */
export function Component() {
  const { slug } = useParams<{ slug: string }>();
  const service = slug ? getService(slug) : undefined;

  if (!service) return <NotFound />;

  const division = divisionNav.find((entry) => entry.division === service.division);
  const siblings = servicesByDivision(service.division).filter(
    (entry) => entry.slug !== service.slug,
  );

  const crumbs = [
    { label: 'דף הבית', to: '/' },
    ...(division ? [{ label: division.label, to: division.to }] : []),
    { label: service.title, to: servicePath(service.slug) },
  ];

  return (
    <>
      <Seo
        title={service.title}
        description={service.summary}
        path={servicePath(service.slug)}
      />
      <JsonLd
        data={buildBreadcrumbs(crumbs.map((crumb) => ({ name: crumb.label, path: crumb.to })))}
      />

      <PageHeader
        eyebrow={division?.label}
        title={service.title}
        lede={service.summary}
        crumbs={crumbs}
        {...(service.image ? { imageSlug: service.image, imageAlt: service.title } : {})}
      />

      <Section labelledBy="service-body-title" tone="default" width="narrow">
        <Heading level={2} id="service-body-title">
          על השירות
        </Heading>

        <Prose className="mt-6">
          {service.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
      </Section>

      {siblings.length > 0 && division ? (
        <Section labelledBy="service-siblings-title" tone="contrast">
          <Heading level={2} id="service-siblings-title">
            עוד בתחום {division.label}
          </Heading>

          <ul className="mt-8 grid gap-x-8 gap-y-3 md:grid-cols-2 lg:grid-cols-3">
            {siblings.map((entry) => (
              <li key={entry.slug}>
                <Link
                  to={servicePath(entry.slug)}
                  className="text-body font-semibold text-brand-700 underline underline-offset-4 hover:text-ink-900"
                >
                  {entry.title}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section labelledBy="service-lead-title" tone="default" width="narrow">
        <Heading level={2} id="service-lead-title">
          מעוניינים בשירות הזה?
        </Heading>
        <p className="mt-4 max-w-prose text-body text-ink-600">
          השאירו פרטים ונחזור אליכם עם תשובות.
        </p>

        <div className="mt-8">
          <LeadForm topic={service.division} submitLabel="שליחת פנייה" />
        </div>
      </Section>
    </>
  );
}

Component.displayName = 'ServiceDetail';
