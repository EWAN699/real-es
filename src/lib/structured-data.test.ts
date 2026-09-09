import { describe, expect, it } from 'vitest';

import { listings } from '@/content/listings';
import { listingSchema, type Listing } from '@/content/types';

import {
  absoluteUrl,
  buildBreadcrumbs,
  buildOrganization,
  buildRealEstateListing,
  serializeJsonLd,
} from './structured-data';

const priced: Listing = listingSchema.parse({
  ...listings[0],
  slug: 'priced-example',
  price: { amount: 4_250_000, currency: 'ILS' },
  rooms: 4,
  sizeSqm: 110,
  geo: { lat: 32.0709, lng: 34.7845 },
});

describe('Organization', () => {
  const org = buildOrganization();

  it('names the group and both of its types', () => {
    expect(org.name).toBe('קבוצת קיסר');
    expect(org['@type']).toEqual(['Organization', 'RealEstateAgent']);
  });

  it('never emits an aggregateRating', () => {
    // The only two rating-shaped numbers on the legacy site contradict each
    // other (a counter reading 69, a survey score of 9.6). Neither is verified.
    expect(org).not.toHaveProperty('aggregateRating');
    expect(JSON.stringify(org)).not.toContain('9.6');
    expect(JSON.stringify(org)).not.toContain('review');
  });

  it('declares the area served instead of inventing a postal address', () => {
    expect(org).not.toHaveProperty('address');
    expect(org.areaServed).toEqual({ '@type': 'Country', name: 'ישראל' });
  });

  it('carries a stable @id the other nodes can reference', () => {
    expect(org['@id']).toBe('https://www.caesar.co.il/#organization');
  });
});

describe('RealEstateListing', () => {
  it('omits offers entirely when the price is on application', () => {
    for (const listing of listings) {
      const node = buildRealEstateListing(listing);
      expect(node).not.toHaveProperty('offers');
      expect(JSON.stringify(node)).not.toContain('"price"');
    }
  });

  it('emits an offer when there is a real price', () => {
    const node = buildRealEstateListing(priced);
    expect(node.offers).toMatchObject({
      '@type': 'Offer',
      price: 4_250_000,
      priceCurrency: 'ILS',
      availability: 'https://schema.org/InStock',
    });
  });

  it('omits rooms, size and geo when the listing does not carry them', () => {
    const bare = listings.find((listing) => listing.rooms === undefined && !listing.geo);
    expect(bare).toBeDefined();
    const node = buildRealEstateListing(bare!);
    expect(node).not.toHaveProperty('numberOfRooms');
    expect(node).not.toHaveProperty('geo');
  });

  it('records the plot size that the client does state', () => {
    const plot = listings.find((listing) => listing.slug === 'netanya-seafront-plot');
    const node = buildRealEstateListing(plot!);
    expect(node.floorSize).toEqual({
      '@type': 'QuantitativeValue',
      value: 7000,
      unitCode: 'MTK',
    });
  });

  it('addresses the property by city and country', () => {
    const node = buildRealEstateListing(listings[0]!);
    expect(node.address).toMatchObject({ addressLocality: 'תל אביב-יפו', addressCountry: 'IL' });
  });

  it('points at the canonical listing URL', () => {
    const node = buildRealEstateListing(listings[0]!);
    expect(node.url).toBe('https://www.caesar.co.il/listings/sarona-gardens-gindi-tlv');
  });
});

describe('BreadcrumbList', () => {
  it('numbers positions from one and gives every crumb a URL', () => {
    const node = buildBreadcrumbs([
      { name: 'דף הבית', path: '/' },
      { name: 'שירותים', path: '/services' },
      { name: 'ניהול נכסים', path: '/services/property-management' },
    ]);

    expect(node.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'דף הבית', item: 'https://www.caesar.co.il/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'שירותים',
        item: 'https://www.caesar.co.il/services',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: 'ניהול נכסים',
        item: 'https://www.caesar.co.il/services/property-management',
      },
    ]);
  });
});

describe('serialization', () => {
  it('escapes < so a value cannot close the script tag', () => {
    const output = serializeJsonLd({ name: '</script><img src=x onerror=alert(1)>' });
    expect(output).not.toContain('</script>');
    expect(output).toContain('\\u003c');
  });

  it('resolves paths against the canonical origin', () => {
    expect(absoluteUrl('/contact')).toBe('https://www.caesar.co.il/contact');
  });
});
