import { Link } from 'react-router-dom';

import { LeadForm } from '@/components/forms/LeadForm';
import { contact, telHref } from '@/content/contact';
import { divisionNav } from '@/components/layout/nav';
import { JsonLd } from '@/components/JsonLd';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { MediaImage } from '@/components/ui/MediaImage';
import { Prose } from '@/components/ui/Prose';
import { Reveal } from '@/components/ui/Reveal';
import { Section } from '@/components/ui/Section';
import { buildOrganization } from '@/lib/structured-data';

/**
 * Home.
 *
 * The one thing that must not change here: "100% שירות · 0% עמלות" is real text
 * inside the `h1`. On the legacy site the group's entire differentiator was
 * typeset into a carousel JPEG — no crawler could read it, no screen reader
 * could announce it, and no one searching for it could find the page. It is the
 * headline now.
 *
 * There is also no carousel. The hero makes one statement with one image,
 * because a five-slide rotator means four of the five messages are never seen.
 *
 * Copy on this page is plausible Hebrew placeholder text pending the real
 * content layer from `caesar-data`. No figures are quoted: the legacy site's
 * counters contradicted its own body copy, and the content schema gates every
 * statistic behind a `confirmed` flag for exactly that reason. An unconfirmed
 * number is withheld, not guessed at.
 */
export function Component() {
  return (
    <>
      <Seo
        title="ניהול נכסים, בנייה ויזמות והשקעות"
        description="קבוצת קיסר — ניהול נכסים, בנייה ויזמות ועסקים והשקעות. 100% שירות, 0% עמלות."
        path="/"
      />
      {/*
       * The organisation node lives on the homepage, which is the entity's own
       * URL; every other page's structured data references it by `@id` rather
       * than repeating it. It carries no aggregateRating: the only two numbers
       * the legacy site published contradict each other, and a fabricated
       * rating is what earns a manual action.
       */}
      <JsonLd data={buildOrganization()} />

      <Hero />
      <Divisions />
      <HowWeWork />
      <ListingsBand />
      <LeadSection />
    </>
  );
}

Component.displayName = 'Home';

function Hero() {
  return (
    <section aria-labelledby="hero-title" className="bg-stone-50">
      <Container className="grid items-center gap-10 py-14 md:py-20 lg:grid-cols-2 lg:gap-16">
        <div>
          <p className="text-small font-semibold tracking-[0.2em] text-brand-700">קבוצת קיסר</p>

          <h1 id="hero-title" className="mt-4 text-h1 text-ink-900 md:text-display">
            <span className="tabular block">100% שירות · 0% עמלות</span>
            <span className="mt-2 block text-h2 font-bold text-ink-600 md:text-h1">
              ניהול נכסים, בנייה ויזמות והשקעות
            </span>
          </h1>

          <p className="mt-6 max-w-prose text-body text-ink-600">
            אנחנו מלווים בעלי נכסים, יזמים ומשקיעים לאורך כל הדרך — מניהול שוטף של דירות
            ומבנים מניבים, דרך ליווי פרויקטים והתחדשות עירונית, ועד איתור עסקאות והשקעות
            בנדל״ן מניב בישראל.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button to="/contact" size="lg">
              דברו איתנו
            </Button>
            <Button to="/listings" size="lg" variant="secondary">
              לנכסים שלנו
            </Button>
          </div>

          <p className="mt-6 text-small text-ink-600">
            מוקד ארצי{' '}
            <a
              href={telHref(contact.nationalPhone)}
              className="tabular font-semibold text-brand-700 underline underline-offset-4 hover:text-ink-900"
              dir="ltr"
            >
              {contact.nationalPhone}
            </a>
          </p>
        </div>

        <MediaImage
          slug="hero-tel-aviv-skyline"
          alt="קו הרקיע של מרכז תל אביב בשעת בין ערביים"
          aspect="4:3"
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="w-full"
        />
      </Container>
    </section>
  );
}

function Divisions() {
  return (
    <Section id="divisions" labelledBy="divisions-title" tone="default">
      <Heading level={2} id="divisions-title">
        שלושה תחומי פעילות, קבוצה אחת
      </Heading>
      <p className="mt-4 max-w-prose text-body text-ink-600">
        לכל תחום צוות ייעודי, ולכולם אותה נקודת מוצא: בעל הנכס מקבל תמונה מלאה, בזמן אמת.
      </p>

      <ul className="mt-10 grid gap-6 md:grid-cols-3">
        {divisionNav.map((item, index) => (
          <li key={item.to}>
            <Reveal delay={index * 0.08} className="h-full">
              <article className="flex h-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
                <MediaImage
                  slug={item.imageSlug}
                  alt={`${item.label} — קבוצת קיסר`}
                  aspect="16:9"
                  rounded={false}
                  sizes="(min-width: 768px) 33vw, 100vw"
                />

                <div className="flex flex-1 flex-col p-6">
                  <Heading level={3}>
                    <Link
                      to={item.to}
                      className="underline-offset-4 hover:text-brand-700 hover:underline"
                    >
                      {/* Stretching the link over the whole card would hide the
                          card's text from a screen reader's link list; the
                          heading is the link, and the description stays plain
                          text. */}
                      {item.label}
                    </Link>
                  </Heading>

                  <Prose className="mt-3 flex-1">
                    <p>{item.description}</p>
                  </Prose>

                  <p className="mt-5 text-small font-semibold text-brand-700">
                    <Link to={item.to} className="underline underline-offset-4">
                      לפרטים על {item.label}
                    </Link>
                  </p>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}

const steps = [
  {
    title: 'פגישת היכרות',
    body: 'מבינים מה יש לכם ביד, מה המטרה, ומה לוח הזמנים. בלי התחייבות ובלי עלות.',
  },
  {
    title: 'תוכנית עבודה',
    body: 'מציגים מסלול ברור — מה נעשה, מי אחראי על מה, ומה אתם אמורים לראות בכל שלב.',
  },
  {
    title: 'ליווי שוטף',
    body: 'איש קשר קבוע, דיווח תקופתי, וגישה לכל המסמכים. בלי לרדוף אחרי תשובות.',
  },
];

function HowWeWork() {
  return (
    <Section labelledBy="process-title" tone="contrast">
      <Heading level={2} id="process-title">
        איך זה עובד
      </Heading>

      <ol className="mt-10 grid gap-8 md:grid-cols-3">
        {steps.map((step, index) => (
          <li key={step.title}>
            <Reveal delay={index * 0.08}>
              {/* The numeral sits on a brand-500 fill with ink-900 text (8.7:1).
                  brand-500 as a text colour on a light ground is the exact
                  regression this rebuild exists to fix. */}
              <p
                aria-hidden="true"
                className="tabular grid size-12 place-items-center rounded-lg bg-brand-500 font-display text-h3 font-black text-ink-900"
              >
                {index + 1}
              </p>
              <Heading level={3} className="mt-4">
                {step.title}
              </Heading>
              <Prose className="mt-2">
                <p>{step.body}</p>
              </Prose>
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}

function ListingsBand() {
  return (
    <Section labelledBy="listings-title" tone="dark" spacing="sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <Heading level={2} id="listings-title" tone="dark">
            נכסים למכירה, להשכרה ולהשקעה
          </Heading>
          <Prose tone="dark" className="mt-3 max-w-prose">
            <p>
              דירות, משרדים, מבנים מסחריים וקרקעות — עם סינון לפי עיר, סוג עסקה וסוג נכס.
            </p>
          </Prose>
        </div>

        <Button to="/listings" variant="onDark" size="lg" className="shrink-0">
          לכל הנכסים
        </Button>
      </div>
    </Section>
  );
}

function LeadSection() {
  return (
    <Section labelledBy="lead-title" tone="default" width="narrow">
      <Heading level={2} id="lead-title">
        רוצים לדעת כמה הנכס שלכם שווה?
      </Heading>
      <p className="mt-4 max-w-prose text-body text-ink-600">
        השאירו פרטים ונחזור אליכם עם הערכה ראשונית ותשובות. אפשר גם פשוט להתקשר{' '}
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
        <LeadForm topic="valuation" submitLabel="שלחו לי הערכה" />
      </div>
    </Section>
  );
}
