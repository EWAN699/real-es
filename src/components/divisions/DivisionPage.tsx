import { Link } from 'react-router-dom';

import { divisionNav } from '@/components/layout/nav';
import { JsonLd } from '@/components/JsonLd';
import { LeadForm } from '@/components/forms/LeadForm';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { Prose } from '@/components/ui/Prose';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { contact, telHref } from '@/content/contact';
import { divisionHubs, getService, servicePath, servicesByDivision } from '@/content/services';
import type { Division } from '@/content/types';
import { buildBreadcrumbs } from '@/lib/structured-data';

/**
 * A division landing page. Three routes render it — `/management`,
 * `/construction`, `/investment` — with everything that differs coming out of
 * the content layer rather than out of a copy of this file.
 *
 * The page is a real index of that division's services: `servicesByDivision`
 * returns them all, the hub service supplies the opening copy, and the rest are
 * listed as links to their own pages. Twenty-one services across three
 * divisions is the whole of what the group does, and this is where a visitor
 * finds their way to any of them — replacing four levels of hover menu.
 *
 * The lead topic is fixed per division, which is what routes the enquiry to the
 * right desk without asking the visitor to classify themselves. The three
 * `Division` values are also the first three `LEAD_TOPICS`, so the division is
 * the topic — no mapping table to fall out of step.
 */

export function DivisionPage({ division }: { division: Division }) {
  const item = divisionNav.find((entry) => entry.division === division);
  const hub = getService(divisionHubs[division]);

  if (!item || !hub) {
    // A division with no hub service is a content bug, not a runtime state:
    // both records are seeded in src/content and validated at import.
    throw new Error(`No content for division ${division}`);
  }

  const others = servicesByDivision(division).filter((service) => service.slug !== hub.slug);

  return (
    <>
      <Seo title={item.label} description={hub.summary} path={item.to} />
      <JsonLd
        data={buildBreadcrumbs([
          { name: 'דף הבית', path: '/' },
          { name: item.label, path: item.to },
        ])}
      />

      <PageHeader
        eyebrow="תחום פעילות"
        title={item.label}
        lede={hub.summary}
        crumbs={[
          { label: 'דף הבית', to: '/' },
          { label: item.label, to: item.to },
        ]}
        imageSlug={item.imageSlug}
        imageAlt={`${item.label} — קבוצת קיסר`}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button to="/contact" size="lg">
            דברו איתנו
          </Button>
          <Button href={telHref(contact.nationalPhone)} size="lg" variant="secondary">
            <span className="tabular" dir="ltr">
              {contact.nationalPhone}
            </span>
          </Button>
        </div>
      </PageHeader>

      <Section labelledBy="overview-title" tone="default" width="narrow">
        <Heading level={2} id="overview-title">
          מה המחלקה עושה
        </Heading>

        <Prose className="mt-6">
          {hub.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Prose>
      </Section>

      {others.length > 0 ? (
        <Section labelledBy="services-title" tone="contrast">
          <Heading level={2} id="services-title">
            השירותים בתחום {item.label}
          </Heading>

          <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {others.map((service, index) => (
              <li key={service.slug}>
                <Reveal delay={Math.min(index, 5) * 0.06} className="h-full">
                  <article className="flex h-full flex-col rounded-lg border border-stone-200 bg-stone-50 p-6">
                    <Heading level={3}>
                      <Link
                        to={servicePath(service.slug)}
                        className="underline-offset-4 hover:text-brand-700 hover:underline"
                      >
                        {service.title}
                      </Link>
                    </Heading>

                    <Prose className="mt-3 flex-1">
                      <p>{service.summary}</p>
                    </Prose>
                  </article>
                </Reveal>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section labelledBy="division-lead-title" tone="default" width="narrow">
        <Heading level={2} id="division-lead-title">
          נשמח לשמוע מכם
        </Heading>
        <p className="mt-4 max-w-prose text-body text-ink-600">
          השאירו פרטים ונחזור אליכם. אפשר גם להתקשר{' '}
          <a
            href={telHref(contact.nationalPhone)}
            className="tabular font-semibold text-brand-700 underline underline-offset-4 hover:text-ink-900"
            dir="ltr"
          >
            {contact.nationalPhone}
          </a>
          .
        </p>

        <div className="mt-8">
          <LeadForm topic={division} submitLabel="שליחת פנייה" />
        </div>
      </Section>
    </>
  );
}
