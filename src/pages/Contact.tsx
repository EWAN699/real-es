import { JsonLd } from '@/components/JsonLd';
import { LeadForm } from '@/components/forms/LeadForm';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { Heading } from '@/components/ui/Heading';
import { Prose } from '@/components/ui/Prose';
import { Section } from '@/components/ui/Section';
import { commercialArm, contact, telHref, whatsappHref } from '@/content/contact';
import { buildBreadcrumbs, buildOrganization } from '@/lib/structured-data';

/**
 * צרו קשר.
 *
 * Every detail on this page comes from `src/content/contact.ts`, which is the
 * single source the footer, the JSON-LD and the lead form all read. The numbers
 * are marked up as `tel:` links with the punctuation stripped, because a phone
 * number typed as an image or as plain text is a number a phone cannot dial.
 *
 * No street address is published. The client's site says only "בפריסה ארצית",
 * so the page says the same and the organisation node declares `areaServed`
 * instead of inventing an office — a wrong address on a contact page sends
 * someone to a building.
 *
 * No map embed. A map iframe is a third-party script, a tracking surface and a
 * layout shift, in exchange for showing a location we do not have.
 */
export function Component() {
  return (
    <>
      <Seo
        title="צרו קשר"
        description={`דברו עם קבוצת קיסר — ${contact.nationalPhone}, ${contact.email}, או השאירו פרטים ונחזור אליכם.`}
        path="/contact"
      />
      <JsonLd
        data={[
          buildOrganization(),
          buildBreadcrumbs([
            { name: 'דף הבית', path: '/' },
            { name: 'צרו קשר', path: '/contact' },
          ]),
        ]}
      />

      <PageHeader
        eyebrow="צרו קשר"
        title="דברו איתנו"
        lede="פנייה בטלפון, בוואטסאפ, במייל או בטופס — מה שנוח לכם. נחזור אליכם עם תשובה, לא עם הצעת מחיר אוטומטית."
        crumbs={[
          { label: 'דף הבית', to: '/' },
          { label: 'צרו קשר', to: '/contact' },
        ]}
      />

      <Section labelledBy="details-title" tone="default">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div>
            <Heading level={2} id="details-title">
              פרטי התקשרות
            </Heading>

            <address className="mt-6 flex flex-col gap-5 text-body not-italic">
              <ContactLine label="מוקד ארצי" href={telHref(contact.nationalPhone)}>
                {contact.nationalPhone}
              </ContactLine>

              <ContactLine label="טלפון ישיר" href={telHref(contact.directPhone)}>
                {contact.directPhone}
              </ContactLine>

              <ContactLine label="אימייל" href={`mailto:${contact.email}`}>
                {contact.email}
              </ContactLine>

              <ContactLine label="וואטסאפ" href={whatsappHref('שלום, אשמח לדבר עם קבוצת קיסר')}>
                {contact.whatsapp}
              </ContactLine>

              <div>
                <p className="text-small text-ink-600">אזור השירות</p>
                <p className="font-semibold text-ink-900">בפריסה ארצית, {contact.addressLocality}</p>
              </div>
            </address>

            <Prose className="mt-8">
              <p>
                נכסים מסחריים משווקים תחת המותג{' '}
                <a href={commercialArm.url} rel="noopener">
                  {commercialArm.name}
                </a>
                , אתר נפרד עם רשימת הנכסים שלו.
              </p>
            </Prose>
          </div>

          <div>
            <Heading level={2} id="form-title">
              השאירו פרטים
            </Heading>
            <p className="mt-4 max-w-prose text-body text-ink-600">
              בחרו את נושא הפנייה כדי שהיא תגיע ישירות לאדם הנכון.
            </p>

            <div className="mt-8">
              <LeadForm topic="general" selectableTopic submitLabel="שליחת הפנייה" />
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}

Component.displayName = 'Contact';

function ContactLine({
  label,
  href,
  children,
}: {
  label: string;
  href: string;
  children: string;
}) {
  return (
    <div>
      <p className="text-small text-ink-600">{label}</p>
      <a
        href={href}
        className="tabular font-semibold text-brand-700 underline underline-offset-4 hover:text-ink-900"
        dir="ltr"
      >
        {children}
      </a>
    </div>
  );
}
