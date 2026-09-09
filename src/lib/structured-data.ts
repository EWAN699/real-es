import { ceoName, commercialArm, contact } from '@/content/contact';
import { listingPath } from '@/content/listings';
import type { Listing } from '@/content/types';

/**
 * JSON-LD builders.
 *
 * Structured data is a set of machine-readable claims about a business and about
 * other people's property, so the rule here is the same as everywhere else in
 * this layer: emit what the client has actually said, and omit the rest. An
 * absent property costs a rich-result feature; a wrong one is a false statement
 * that Google, and a buyer, will hold them to.
 *
 * Specifically NOT emitted:
 *
 *  - `aggregateRating`. The legacy counter reads 69 and the customer-survey
 *    testimonial says 9.6; neither is a verified rating and the two contradict
 *    each other. A fabricated rating is exactly the kind of markup that earns a
 *    manual action.
 *  - `offers` on a listing with no published price. There is no such thing as a
 *    zero-price property.
 *  - `PostalAddress` on the organisation. No street address is published
 *    anywhere we could read, so the organisation declares the area it serves
 *    instead of inventing an office.
 */

export const SITE_ORIGIN = 'https://www.caesar.co.il';

export type JsonLd = Record<string, unknown>;

const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;

export function absoluteUrl(path: string): string {
  return new URL(path, SITE_ORIGIN).toString();
}

/**
 * The sitewide organisation node. Every other node references it by `@id`
 * rather than repeating it, so the graph has one publisher, not twenty.
 */
export function buildOrganization(): JsonLd {
  return {
    '@context': 'https://schema.org',
    // RealEstateAgent is the specific type; Organization keeps consumers that
    // only understand the general one working.
    '@type': ['Organization', 'RealEstateAgent'],
    '@id': ORGANIZATION_ID,
    name: 'קבוצת קיסר',
    alternateName: 'CAESAR',
    url: SITE_ORIGIN,
    telephone: contact.nationalPhone,
    email: contact.email,
    areaServed: { '@type': 'Country', name: contact.addressLocality },
    employee: {
      '@type': 'Person',
      name: ceoName,
      jobTitle: 'מנכ"ל',
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: contact.nationalPhone,
        email: contact.email,
        availableLanguage: ['he', 'en'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        telephone: contact.directPhone,
      },
    ],
    sameAs: [
      'https://www.facebook.com/caesar.co.il',
      'https://www.youtube.com/channel/UCkAAPCEwmKKiomBSZLl5v2A',
      commercialArm.url,
    ],
  };
}

/**
 * A single property.
 *
 * Everything optional is genuinely optional: rooms, size, geo and price each
 * appear only when the listing carries them.
 */
export function buildRealEstateListing(listing: Listing): JsonLd {
  const url = absoluteUrl(listingPath(listing.slug));

  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    '@id': `${url}#listing`,
    url,
    name: listing.title,
    description: listing.summary,
    datePosted: listing.publishedAt,
    provider: { '@id': ORGANIZATION_ID },
    address: {
      '@type': 'PostalAddress',
      addressLocality: listing.city,
      addressCountry: 'IL',
      ...(listing.neighborhood ? { addressRegion: listing.neighborhood } : {}),
    },
  };

  if (listing.geo) {
    node.geo = { '@type': 'GeoCoordinates', latitude: listing.geo.lat, longitude: listing.geo.lng };
  }

  if (listing.sizeSqm !== undefined) {
    node.floorSize = { '@type': 'QuantitativeValue', value: listing.sizeSqm, unitCode: 'MTK' };
  }

  if (listing.rooms !== undefined) {
    node.numberOfRooms = listing.rooms;
  }

  // No price, no offer. A listing priced on application is not priced at zero.
  if (listing.price) {
    node.offers = {
      '@type': 'Offer',
      price: listing.price.amount,
      priceCurrency: listing.price.currency,
      availability:
        listing.status === 'available'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      seller: { '@id': ORGANIZATION_ID },
    };
  }

  return node;
}

export type Crumb = { name: string; path: string };

/**
 * A breadcrumb trail for a nested page.
 *
 * Positions are 1-based and every item carries an absolute `item` URL, including
 * the last one — Google drops trails whose final crumb has no URL.
 */
export function buildBreadcrumbs(crumbs: readonly Crumb[]): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/**
 * Serialise for a `<script type="application/ld+json">` block.
 *
 * `<` is escaped because a `</script>` sequence inside a string value would
 * close the tag early and turn content into markup — the standard XSS hole in
 * hand-rolled JSON-LD.
 */
export function serializeJsonLd(node: JsonLd | JsonLd[]): string {
  return JSON.stringify(node).replace(/</g, '\\u003c');
}
