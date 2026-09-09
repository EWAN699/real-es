import { describe, expect, it } from 'vitest';

import { listings } from '@/content/listings';
import { listingSchema, type Listing } from '@/content/types';

import {
  availableDealTypes,
  browseListings,
  featuredListings,
  filterListings,
  formatPrice,
  listingCities,
  parseDealParam,
  sortListings,
} from './listings';

const base = listings[0]!;

function make(overrides: Partial<Listing> & { slug: string }): Listing {
  return listingSchema.parse({ ...base, ...overrides });
}

const fixtures: Listing[] = [
  make({ slug: 'cheap', price: { amount: 1_000_000, currency: 'ILS' }, publishedAt: '2024-01-01' }),
  make({ slug: 'dear', price: { amount: 9_000_000, currency: 'ILS' }, publishedAt: '2023-01-01' }),
  make({ slug: 'on-application', publishedAt: '2025-01-01' }),
  make({ slug: 'sold', status: 'sold', publishedAt: '2026-01-01' }),
];

describe('filtering', () => {
  it('narrows by deal type, asset type and city', () => {
    expect(filterListings(listings, { deal: 'commercial' }).map((l) => l.slug)).toEqual([
      'leased-office-tower-tlv',
    ]);
    expect(filterListings(listings, { asset: 'land' }).map((l) => l.slug)).toEqual([
      'netanya-seafront-plot',
    ]);
    expect(filterListings(listings, { city: 'נתניה' })).toHaveLength(1);
  });

  it('searches title, summary, city and neighbourhood', () => {
    expect(filterListings(listings, { query: 'גני שרונה' }).map((l) => l.slug)).toEqual([
      'sarona-gardens-gindi-tlv',
    ]);
    expect(filterListings(listings, { query: 'לא קיים' })).toEqual([]);
  });

  it('can restrict to listings that actually publish a price', () => {
    expect(filterListings(fixtures, { pricedOnly: true }).map((l) => l.slug)).toEqual([
      'cheap',
      'dear',
    ]);
  });

  it('combines filters', () => {
    expect(filterListings(listings, { deal: 'sale', city: 'תל אביב-יפו' })).toHaveLength(2);
  });
});

describe('sorting', () => {
  it('puts the newest first by default', () => {
    expect(sortListings(fixtures).map((l) => l.slug)).toEqual([
      'sold',
      'on-application',
      'cheap',
      'dear',
    ]);
  });

  it('never treats an unpriced listing as free', () => {
    // The whole point: "price on application" must not sort as zero and lead a
    // cheapest-first list.
    expect(sortListings(fixtures, 'price-asc').map((l) => l.slug)).toEqual([
      'cheap',
      'dear',
      'on-application',
      'sold',
    ]);
    expect(
      sortListings(fixtures, 'price-desc')
        .slice(0, 2)
        .map((l) => l.slug),
    ).toEqual(['dear', 'cheap']);
  });

  it('does not mutate its input', () => {
    const order = fixtures.map((l) => l.slug);
    sortListings(fixtures, 'price-desc');
    expect(fixtures.map((l) => l.slug)).toEqual(order);
  });
});

describe('browse', () => {
  it('hides sold and rented properties', () => {
    expect(browseListings({}, 'newest', fixtures).map((l) => l.slug)).not.toContain('sold');
  });

  it('returns the four featured properties from the homepage', () => {
    expect(featuredListings()).toHaveLength(4);
  });

  it('lists the cities and deal types actually present', () => {
    expect(listingCities()).toEqual(['נתניה', 'תל אביב-יפו']);
    expect(availableDealTypes().sort()).toEqual(['commercial', 'sale']);
  });
});

describe('deal parameter', () => {
  it('accepts the current values', () => {
    expect(parseDealParam('rent')).toBe('rent');
    expect(parseDealParam('new-project')).toBe('new-project');
  });

  it('still understands the legacy taxonomy slugs from old bookmarks', () => {
    expect(parseDealParam('buy')).toBe('sale');
    expect(parseDealParam('new-projects')).toBe('new-project');
  });

  it('ignores anything else', () => {
    expect(parseDealParam('nonsense')).toBeUndefined();
    expect(parseDealParam(null)).toBeUndefined();
  });
});

describe('price formatting', () => {
  it('returns null when there is no price to show', () => {
    for (const listing of listings) expect(formatPrice(listing)).toBeNull();
  });

  it('formats a real price in shekels', () => {
    const formatted = formatPrice(fixtures[0]!);
    expect(formatted).toBeTruthy();
    expect(formatted).toContain('1,000,000');
  });
});
