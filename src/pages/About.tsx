import { Link } from 'react-router-dom';

import { divisionNav } from '@/components/layout/nav';
import { JsonLd } from '@/components/JsonLd';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { Prose } from '@/components/ui/Prose';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { ceoName, commercialArm, contact, telHref } from '@/content/contact';
import { divisionHubs, getService } from '@/content/services';
import { confirmedStats } from '@/content/stats';
import { readyTestimonials } from '@/content/testimonials';
import { buildBreadcrumbs, buildOrganization } from '@/lib/structured-data';

/**
 * הקבוצה — who the group is.
 *
 * Three things this page deliberately does not do.
 *
 * **It quotes no figures.** `confirmedStats` is the only source it will read,
 * and that list is empty: every counter on the legacy site is unconfirmed, and
 * two of them contradict the client's own copy on the same page (7 years of
 * experience against "over ten"; a customer-survey score of 69 against a
 * testimonial stating 9.6). The block below is written so that it appears the
 * day a figure is confirmed and stays invisible until then — the alternative,
 * republishing numbers we know to be inconsistent, is how the original problem
 * happened.
 *
 * **It does not write the CEO's message.** The legacy "דבר המנכ״ל" page could
 * not be read, so the section names him, links to him, and says the message is
 * on its way. Drafting a founder's personal statement for him would be putting
 * words in his mouth on his own website.
 *
 * **It does not embed the media coverage.** "קיסר בתקשורת" links to the group's
 * own channels rather than loading a YouTube player or a Facebook embed — the
 * legacy homepage carried both, on first paint, for every visitor.
 */
const profileLabels: Readonly<Record<string, string>> = {
  'www.facebook.com': 'עמוד הפייסבוק של קבוצת קיסר',
  'www.youtube.com': 'ערוץ היוטיוב של קבוצת קיסר',
};

export function Component() {
  const hubs = divisionNav.map((item) => ({
    ...item,
    service: getService(divisionHubs[item.division]),
  }));

  // The one place these URLs are written is the organisation node, so the page
  // and the structured data can never advertise different profiles.
  const sameAs = (buildOrganization().sameAs as string[] | undefined) ?? [];
  const profiles = sameAs
    .map((url) => {
      const label = profileLabels[safeHost(url)];
      return label ? { url, label } : null;
    })
    .filter((profile): profile is { url: string; label: string } => profile !== null);

  return (
    <>
      <Seo
        title="הקבוצה"
        description="קבוצת קיסר — ניהול נכסים, בנייה ויזמות ועסקים והשקעות. מי אנחנו, דבר המנכ״ל וקיסר בתקשורת."
        path="/about"
      />
      <JsonLd
        data={buildBreadcrumbs([
          { name: 'דף הבית', path: '/' },
          { name: 'הקבוצה', path: '/about' },
        ])}
      />

      <PageHeader
        eyebrow="הקבוצה"
        title="קבוצת קיסר"
        lede="קבוצה אחת עם שלוש מחלקות — ניהול נכסים, בנייה ויזמות, ועסקים והשקעות. אותו איש קשר מלווה את בעל הנכס בכל אחת מהן."
        crumbs={[
          { label: 'דף הבית', to: '/' },
          { label: 'הקבוצה', to: '/about' },
        ]}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button to="/contact" size="lg">
            דברו איתנו
          </Button>
          <Button to="/testimonials" size="lg" variant="secondary">
            לקוחות ממליצים
          </Button>
        </div>
      </PageHeader>

      <Section labelledBy="divisions-title" tone="default">
        <Heading level={2} id="divisions-title">
          שלוש מחלקות
        </Heading>

        <ul className="mt-10 grid gap-8 md:grid-cols-3">
          {hubs.map((hub, index) => (
            <li key={hub.to}>
              <Reveal delay={index * 0.08} className="h-full">
                <article className="flex h-full flex-col">
                  <Heading level={3}>
                    <Link
                      to={hub.to}
                      className="underline-offset-4 hover:text-brand-700 hover:underline"
                    >
                      {hub.label}
                    </Link>
                  </Heading>

                  <Prose className="mt-3 flex-1">
                    {hub.service ? (
                      hub.service.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
                    ) : (
                      <p>{hub.description}</p>
                    )}
                  </Prose>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      </Section>

      {/*
       * Renders only once the client confirms a figure. `confirmedStats` is
       * empty today, so nothing here reaches the page — which is the point.
       */}
      {confirmedStats.length > 0 ? (
        <Section labelledBy="stats-title" tone="brand" spacing="sm">
          <Heading level={2} id="stats-title">
            במספרים
          </Heading>

          <dl className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {confirmedStats.map((stat) => (
              <div key={stat.id}>
                <dt className="text-body font-semibold text-ink-900">{stat.label}</dt>
                <dd className="tabular font-display text-h1 font-black text-ink-900">
                  {stat.value}
                  {stat.suffix ?? ''}
                </dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}

      <Section id="ceo" labelledBy="ceo-title" tone="contrast" width="narrow">
        <Heading level={2} id="ceo-title">
          דבר המנכ״ל
        </Heading>

        <Prose className="mt-6">
          <p>
            <strong>{ceoName}</strong> הוא המייסד והמנכ״ל של קבוצת קיסר.
          </p>
          <p>
            המכתב האישי שלו מהאתר הקודם נמצא בהעברה, ויעלה לכאן במלואו. עד אז — הדלת פתוחה: אפשר
            להתקשר{' '}
            <a href={telHref(contact.directPhone)} className="tabular" dir="ltr">
              {contact.directPhone}
            </a>{' '}
            או לכתוב ל־<a href={`mailto:${contact.email}`}>{contact.email}</a>.
          </p>
        </Prose>
      </Section>

      <Section id="press" labelledBy="press-title" tone="default" width="narrow">
        <Heading level={2} id="press-title">
          קיסר בתקשורת
        </Heading>

        <Prose className="mt-6">
          <p>
            הופעות התקשורת של הקבוצה, לרבות ראיונות טלוויזיה, מתפרסמות בערוצים של הקבוצה. אנחנו
            מקשרים אליהם ולא מטמיעים אותם בדף: נגן וידאו או תוסף חברתי היו נטענים אצל כל מבקר,
            עוד לפני שביקש לצפות במשהו.
          </p>
        </Prose>

        <ul className="mt-6 flex flex-col gap-3">
          {profiles.map((profile) => (
            <li key={profile.url}>
              <a
                href={profile.url}
                rel="noopener"
                className="text-body font-semibold text-brand-700 underline underline-offset-4 hover:text-ink-900"
              >
                {profile.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={commercialArm.url}
              rel="noopener"
              className="text-body font-semibold text-brand-700 underline underline-offset-4 hover:text-ink-900"
            >
              {commercialArm.name} — האתר המסחרי של הקבוצה
            </a>
          </li>
        </ul>
      </Section>

      {readyTestimonials.length > 0 ? (
        <Section labelledBy="about-testimonials-title" tone="contrast">
          <Heading level={2} id="about-testimonials-title">
            לקוחות מספרים
          </Heading>

          <ul className="mt-10 grid gap-6 md:grid-cols-3">
            {readyTestimonials.slice(0, 3).map((testimonial) => (
              <li key={testimonial.slug}>
                <figure className="flex h-full flex-col rounded-lg border border-stone-200 bg-stone-50 p-6">
                  <blockquote className="flex-1 text-body text-ink-900">
                    <p>{testimonial.quote}</p>
                  </blockquote>
                  <figcaption className="mt-4 text-small font-semibold text-ink-600">
                    {testimonial.author}
                    {testimonial.city ? ` · ${testimonial.city}` : ''}
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>

          <p className="mt-8">
            <Link
              to="/testimonials"
              className="text-body font-semibold text-brand-700 underline underline-offset-4 hover:text-ink-900"
            >
              לכל ההמלצות
            </Link>
          </p>
        </Section>
      ) : null}
    </>
  );
}

Component.displayName = 'About';

/** Hostname, or an empty string for anything that is not a parseable URL. */
function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}
