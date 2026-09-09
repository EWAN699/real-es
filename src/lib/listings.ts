import { legacyDealTerms, listings } from '@/content/listings';
import type { AssetType, DealType, Listing } from '@/content/types';

/**
 * Filtering and sorting for the listings index.
 *
 * Pure functions over the seeded content: the site is prerendered, so this runs
 * at build time for the static index and again in the browser when a visitor
 * changes a filter. Both must agree, which is why none of it touches the DOM,
 * the clock or the network.
 */

export type ListingFilter = {
  deal?: DealType;
  asset?: AssetType;
  city?: string;
  /** Only listings that publish a price, when true. */
  pricedOnly?: boolean;
  /** Free text over title, summary, city and neighbourhood. */
  query?: string;
};

export type ListingSort = 'newest' | 'price-asc' | 'price-desc' | 'size-desc';

/** Available listings first, then under offer; sold and rented drop out. */
const MARKETABLE: ReadonlyArray<Listing['status']> = ['available', 'under-offer'];

export function filterListings(all: readonly Listing[], filter: ListingFilter = {}): Listing[] {
  const needle = filter.query?.trim().toLowerCase();

  return all.filter((listing) => {
    if (filter.deal && listing.dealType !== filter.deal) return false;
    if (filter.asset && listing.assetType !== filter.asset) return false;
    if (filter.city && listing.city !== filter.city) return false;
    if (filter.pricedOnly && !listing.price) return false;

    if (needle) {
      const haystack = [listing.title, listing.summary, listing.city, listing.neighborhood ?? '']
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(needle)) return false;
    }

    return true;
  });
}

/**
 * Sort a copy, never the input.
 *
 * A listing with no price is not "cheap": it is priced on application. Those
 * records sort to the end of a price sort in both directions rather than being
 * treated as zero, which would put every unpriced property at the top of a
 * cheapest-first list.
 */
export function sortListings(all: readonly Listing[], sort: ListingSort = 'newest'): Listing[] {
  const sorted = [...all];

  switch (sort) {
    case 'price-asc':
      return sorted.sort(byPrice(1));
    case 'price-desc':
      return sorted.sort(byPrice(-1));
    case 'size-desc':
      return sorted.sort((a, b) => (b.sizeSqm ?? -1) - (a.sizeSqm ?? -1));
    case 'newest':
    default:
      return sorted.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  }
}

function byPrice(direction: 1 | -1) {
  return (a: Listing, b: Listing): number => {
    if (!a.price && !b.price) return 0;
    if (!a.price) return 1;
    if (!b.price) return -1;
    return (a.price.amount - b.price.amount) * direction;
  };
}

/** The listings index: marketable properties only, newest first by default. */
export function browseListings(
  filter: ListingFilter = {},
  sort: ListingSort = 'newest',
  all: readonly Listing[] = listings,
): Listing[] {
  const marketable = all.filter((listing) => MARKETABLE.includes(listing.status));
  return sortListings(filterListings(marketable, filter), sort);
}

export function featuredListings(all: readonly Listing[] = listings): Listing[] {
  return browseListings({}, 'newest', all).filter((listing) => listing.featured);
}

/** Distinct cities present in the data, for the city filter. */
export function listingCities(all: readonly Listing[] = listings): string[] {
  return [...new Set(all.map((listing) => listing.city))].sort((a, b) => a.localeCompare(b, 'he'));
}

/** Deal types actually represented, so the UI never offers an empty filter. */
export function availableDealTypes(all: readonly Listing[] = listings): DealType[] {
  return [...new Set(all.map((listing) => listing.dealType))];
}

/**
 * Read a deal filter off a query string, accepting the legacy taxonomy terms.
 *
 * `?deal=buy` was the old `property_buyorrent` slug and still arrives from old
 * bookmarks; it means the same thing as `?deal=sale`.
 */
export function parseDealParam(value: string | null | undefined): DealType | undefined {
  if (!value) return undefined;
  const legacy = legacyDealTerms[value];
  if (legacy) return legacy;
  const known: readonly DealType[] = ['sale', 'rent', 'investment', 'commercial', 'new-project'];
  return known.includes(value as DealType) ? (value as DealType) : undefined;
}

/**
 * Formatted price, or `null` when the price is on application.
 *
 * Returning `null` rather than a dash or a zero forces the caller to decide what
 * to say; a component that prints a formatted `0` would be making a claim about
 * someone's property.
 */
export function formatPrice(listing: Listing): string | null {
  if (!listing.price) return null;
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: listing.price.currency,
    maximumFractionDigits: 0,
  }).format(listing.price.amount);
}
