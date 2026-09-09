import { useParams } from 'react-router-dom';

import { JsonLd } from '@/components/JsonLd';
import { LeadForm } from '@/components/forms/LeadForm';
import {
  assetTypeLabels,
  formatArea,
  listingStatusLabels,
  PRICE_ON_APPLICATION,
} from '@/components/listings/labels';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { MediaImage } from '@/components/ui/MediaImage';
import { Prose } from '@/components/ui/Prose';
import { Section } from '@/components/ui/Section';
import { contact, telHref, whatsappHref } from '@/content/contact';
import {
  dealTypeLabels,
  getListing,
  listingPath,
  listingsIndexPath,
} from '@/content/listings';
import type { Listing } from '@/content/types';
import { formatPrice } from '@/lib/listings';
import { buildBreadcrumbs, buildRealEstateListing } from '@/lib/structured-data';
import { Component as NotFound } from './NotFound';

/**
 * One property.
 *
 * This page is a set of claims about someone else's asset, so it renders what
 * the record holds and says so plainly where the record holds nothing:
 *
 *  - **Price.** `formatPrice` returns `null` when there is no price, and the
 *    page prints "מחיר לפי פנייה". It never shows a placeholder figure, and the
 *    JSON-LD omits `offers` entirely rather than emitting a zero-price offer.
 *  - **Photography.** Every gallery is currently empty. Rather than filling the
 *    space with a grey frame or, worse, a generated image of a building that is
 *    not this one, the page says there are no photographs yet and offers the
 *    way to ask for them. Publishing synthetic imagery of a specific marketed
 *    property is misleading and carries consumer-protection exposure in Israel.
 *
 * The structured data comes from `buildRealEstateListing`, which applies the
 * same rule at the machine-readable layer.
 */
export function Component() {
  const { slug } = useParams<{ slug: string }>();
  const listing = slug ? getListing(slug) : undefined;

  if (!listing) return <NotFound />;

  const price = formatPrice(listing);
  const path = listingPath(listing.slug);

  const crumbs = [
    { label: 'דף הבית', to: '/' },
    { label: 'נכסים', to: listingsIndexPath },
    { label: listing.title, to: path },
  ];

  return (
    <>
      <Seo title={listing.title} description={listing.summary} path={path} />
      <JsonLd
        data={[
          buildRealEstateListing(listing),
          buildBreadcrumbs(crumbs.map((crumb) => ({ name: crumb.label, path: crumb.to }))),
        ]}
      />

      <PageHeader
        eyebrow={`${dealTypeLabels[listing.dealType]} · ${assetTypeLabels[listing.assetType]}`}
        title={listing.title}
        lede={listing.summary}
        crumbs={crumbs}
      >
        <div className="flex flex-wrap items-center gap-3">
          <Button href={telHref(contact.directPhone)} size="lg">
            לפרטים נוספים
          </Button>
          <Button
            href={whatsappHref(`שלום, אשמח לפרטים על ${listing.title}`)}
            size="lg"
            variant="secondary"
          >
            שאלה בוואטסאפ
          </Button>
        </div>
      </PageHeader>

      <Section labelledBy="listing-facts-title" tone="default" width="narrow">
        <Heading level={2} id="listing-facts-title">
          פרטי הנכס
        </Heading>

        <dl className="mt-6 grid gap-x-8 gap-y-4 sm:grid-cols-2">
          <Fact label="עיר">{listing.city}</Fact>
          {listing.neighborhood ? <Fact label="שכונה">{listing.neighborhood}</Fact> : null}
          <Fact label="סוג עסקה">{dealTypeLabels[listing.dealType]}</Fact>
          <Fact label="סוג נכס">{assetTypeLabels[listing.assetType]}</Fact>
          {listing.rooms !== undefined ? <Fact label="חדרים">{listing.rooms}</Fact> : null}
          {listing.sizeSqm !== undefined ? (
            <Fact label="שטח">{formatArea(listing.sizeSqm)}</Fact>
          ) : null}
          <Fact label="סטטוס">{listingStatusLabels[listing.status]}</Fact>
          <Fact label="מחיר">{price ?? PRICE_ON_APPLICATION}</Fact>
        </dl>

        {price ? null : (
          <Prose className="mt-6">
            <p>
              המחיר של הנכס הזה אינו מפורסם. נמסור אותו בשיחה, יחד עם שאר הפרטים — טלפון{' '}
              <a href={telHref(contact.directPhone)} className="tabular" dir="ltr">
                {contact.directPhone}
              </a>
              .
            </p>
          </Prose>
        )}
      </Section>

      <Gallery listing={listing} />

      <Section labelledBy="listing-lead-title" tone="contrast" width="narrow">
        <Heading level={2} id="listing-lead-title">
          לקבלת פרטים על הנכס
        </Heading>
        <p className="mt-4 max-w-prose text-body text-ink-600">
          השאירו פרטים ונחזור אליכם עם המידע המלא על {listing.title}.
        </p>

        <div className="mt-8">
          <LeadForm topic="general" submitLabel="שליחת פנייה" />
        </div>
      </Section>
    </>
  );
}

Component.displayName = 'ListingDetail';

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-stone-200 pb-3">
      <dt className="text-small text-ink-600">{label}</dt>
      <dd className="mt-1 text-body font-semibold text-ink-900">{children}</dd>
    </div>
  );
}

/**
 * The gallery, or an honest statement that there is not one yet.
 *
 * The empty state is the current state of all four listings, so it is designed
 * rather than tolerated: it explains why, and it gives the visitor something to
 * do about it.
 */
function Gallery({ listing }: { listing: Listing }) {
  if (listing.gallery.length === 0) {
    return (
      <Section labelledBy="listing-gallery-title" tone="contrast" width="narrow" spacing="sm">
        <Heading level={2} id="listing-gallery-title">
          תמונות
        </Heading>
        <Prose className="mt-4">
          <p>
            עדיין לא פרסמנו תמונות של הנכס הזה. נשמח לשלוח תמונות ותוכנית — השאירו פרטים למטה או
            התקשרו{' '}
            <a href={telHref(contact.directPhone)} className="tabular" dir="ltr">
              {contact.directPhone}
            </a>
            .
          </p>
        </Prose>
      </Section>
    );
  }

  return (
    <Section labelledBy="listing-gallery-title" tone="contrast">
      <Heading level={2} id="listing-gallery-title">
        תמונות
      </Heading>

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {listing.gallery.map((mediaSlug) => (
          <li key={mediaSlug}>
            <MediaImage
              slug={mediaSlug}
              aspect="4:3"
              sizes="(min-width: 768px) 50vw, 100vw"
              className="w-full"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
