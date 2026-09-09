import { listingSchema, parseAll, type DealType, type Listing } from './types';

/**
 * The four properties the client features on their homepage, remodelled.
 *
 * WHAT IS THEIRS AND WHAT IS OURS. The facts below — city, neighbourhood, asset
 * type, the 20-year lease, the 7-dunam plot, the 160 planned luxury units —
 * are the client's, taken from their own listing titles and teasers. The
 * *titles* are ours: the legacy ones were single sentences carrying the company
 * name, the service, the city and the deal type at once ("קיסר ניהול נכסים בתל
 * אביב מציע למכירה להשכרה דירות חלומיות בשכונת גני שרונה – בגינדי תל אביב").
 * That is a keyword string, not a property title. Because we rewrote them, every
 * record here is `needsReview: true` and needs the client's eye before it ships.
 *
 * PRICES ARE OMITTED, not zeroed. None of the four publishes a price, so none
 * carries a `price`. A placeholder number on a real property is a false
 * statement about someone's asset.
 *
 * GALLERIES ARE EMPTY. The legacy photographs live on the client's server and
 * are not ours to rehost, and AI imagery must never stand in for a specific
 * marketed property. Empty until the client supplies real photography.
 *
 * DATES ARE INFERRED. `publishedAt` is the month of the listing's own WordPress
 * upload directory (`/wp-content/uploads/2017/06/…`), which is when its
 * photograph was uploaded — good evidence for a property listing, but still
 * evidence rather than a stated date. Replace from the client's export.
 */
export const listings: Listing[] = parseAll(
  listingSchema,
  [
    {
      slug: 'sarona-gardens-gindi-tlv',
      title: 'דירות בגני שרונה, גינדי תל אביב',
      summary: 'מגוון דירות בפרויקט גינדי תל אביב, בשכונת גני שרונה. הנכס מוצע למכירה וגם להשכרה.',
      city: 'תל אביב-יפו',
      neighborhood: 'גני שרונה',
      // The client offers this one both for sale and to rent; the schema holds a
      // single deal type, so the primary one is recorded and the summary says so.
      dealType: 'sale' satisfies DealType,
      assetType: 'apartment',
      status: 'available',
      gallery: [],
      publishedAt: '2017-06-01',
      featured: true,
      legacyPaths: ['/listing/קיסר-ניהול-נכסים-בתל-אביב-מציע-למכירה-ל/'],
      needsReview: true,
    },
    {
      slug: 'gindi-towers-apartment',
      title: 'דירה במגדלי גינדי תל אביב',
      summary: 'דירה במגדלי גינדי תל אביב, מוצעת למכירה או להשכרה.',
      city: 'תל אביב-יפו',
      dealType: 'sale',
      assetType: 'apartment',
      status: 'available',
      gallery: [],
      publishedAt: '2017-06-01',
      featured: true,
      legacyPaths: ['/listing/קיסר-ניהול-נכסים-בתל-אביב-מציע-למכירה-א/'],
      needsReview: true,
    },
    {
      slug: 'leased-office-tower-tlv',
      title: 'בניין משרדים בתל אביב, מושכר לטווח ארוך',
      summary: 'מגדל משרדים בתל אביב המוצע למכירה, מושכר לחברת הייטק ל־20 שנה.',
      city: 'תל אביב-יפו',
      dealType: 'commercial',
      assetType: 'commercial-building',
      status: 'available',
      gallery: [],
      publishedAt: '2020-04-01',
      featured: true,
      legacyPaths: ['/listing/קיסר-שיווק-נדלן-מסחרי-שיווק-נכסים-מניב/'],
      needsReview: true,
    },
    {
      slug: 'netanya-seafront-plot',
      title: 'מגרש בקו ראשון לים בנתניה',
      summary: 'מגרש של 7 דונם בקו ראשון לים בנתניה, מיועד לבניית 160 דירות יוקרה.',
      city: 'נתניה',
      dealType: 'sale',
      assetType: 'land',
      // 7 dunam, stated in the client's own listing title.
      sizeSqm: 7000,
      status: 'available',
      gallery: [],
      publishedAt: '2020-01-01',
      featured: true,
      legacyPaths: ['/listing/קיסר-ניהול-נכסים-בנתניה-מציע-למכירה-שט/'],
      needsReview: true,
    },
  ],
  'listing',
);

/**
 * The five legacy `property_buyorrent` taxonomy terms, mapped onto our
 * `dealType` enum. These are the filter values the listings index exposes, and
 * the redirect map sends each old taxonomy archive to the matching filter.
 */
export const legacyDealTerms: Readonly<Record<string, DealType>> = {
  rent: 'rent',
  buy: 'sale',
  investment: 'investment',
  commercial: 'commercial',
  'new-projects': 'new-project',
};

/** Hebrew labels for the filter controls. */
export const dealTypeLabels: Readonly<Record<DealType, string>> = {
  sale: 'למכירה',
  rent: 'להשכרה',
  investment: 'להשקעה',
  commercial: 'מסחרי',
  'new-project': 'פרויקטים חדשים',
};

export const listingsIndexPath = '/listings';

export function listingPath(slug: string): string {
  return `${listingsIndexPath}/${slug}`;
}

/** The listings index filtered to one deal type, as the redirect map targets it. */
export function dealTypePath(deal: DealType): string {
  return `${listingsIndexPath}?deal=${deal}`;
}

export function getListing(slug: string): Listing | undefined {
  return listings.find((listing) => listing.slug === slug);
}
