import { useSearchParams } from 'react-router-dom';

import { JsonLd } from '@/components/JsonLd';
import { ListingCard } from '@/components/listings/ListingCard';
import { ListingFilters } from '@/components/listings/ListingFilters';
import type { ListingFilterValues } from '@/components/listings/ListingFilters';
import { PageHeader } from '@/components/PageHeader';
import { Seo } from '@/components/Seo';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Heading } from '@/components/ui/Heading';
import { Section } from '@/components/ui/Section';
import { listingsIndexPath } from '@/content/listings';
import { assetType } from '@/content/types';
import type { AssetType } from '@/content/types';
import { browseListings, listingCities, parseDealParam } from '@/lib/listings';
import { buildBreadcrumbs } from '@/lib/structured-data';

/** Straight off the schema, so a new asset type cannot be missing here. */
const ASSET_TYPES: readonly AssetType[] = assetType.options;

/**
 * The listings index.
 *
 * Filter state lives in the query string, so a filtered view is linkable and so
 * the legacy `property_buyorrent` taxonomy archives can redirect straight onto
 * `/listings?deal=sale`. `parseDealParam` accepts the old terms (`?deal=buy`)
 * as well as the current ones, because ten years of bookmarks still carry them.
 *
 * The page is prerendered unfiltered — every marketable property, in the HTML a
 * crawler and a scriptless browser receive — and the filters narrow that list in
 * the browser. Nothing here is fetched: four records is not a network problem.
 *
 * No price is invented for the listings that do not publish one, and no image
 * frame is drawn for the galleries that are empty. Both are the normal case in
 * the current data, and both are stated rather than papered over.
 */
export function Component() {
  const [searchParams, setSearchParams] = useSearchParams();

  const deal = parseDealParam(searchParams.get('deal'));
  const cityParam = searchParams.get('city') ?? '';
  const assetParam = searchParams.get('asset') ?? '';

  const cities = listingCities();
  const city = cities.includes(cityParam) ? cityParam : '';
  const asset = ASSET_TYPES.includes(assetParam as AssetType) ? (assetParam as AssetType) : '';

  const all = browseListings();
  const results = browseListings({
    ...(deal ? { deal } : {}),
    ...(asset ? { asset } : {}),
    ...(city ? { city } : {}),
  });

  const values: ListingFilterValues = { city, deal: deal ?? '', asset };
  const isFiltered = Boolean(city || deal || asset);

  // Only the deal types and asset types that marketable listings actually have,
  // so the filter can never offer a choice that returns nothing.
  const deals = [...new Set(all.map((listing) => listing.dealType))];
  const assets = ASSET_TYPES.filter((type) => all.some((listing) => listing.assetType === type));

  function applyFilters(next: Partial<ListingFilterValues>) {
    const merged = { ...values, ...next };

    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);

        for (const [key, value] of Object.entries(merged)) {
          if (value) params.set(key, value);
          else params.delete(key);
        }

        return params;
      },
      // A filter change is not a new place in the visitor's history: Back should
      // leave the listings index, not step through every dropdown they touched.
      { replace: true },
    );
  }

  return (
    <>
      <Seo
        title="נכסים למכירה, להשכרה ולהשקעה"
        description="הנכסים שקבוצת קיסר משווקת — דירות, בנייני משרדים וקרקעות, עם סינון לפי עיר, סוג עסקה וסוג נכס."
        path={listingsIndexPath}
      />
      <JsonLd
        data={buildBreadcrumbs([
          { name: 'דף הבית', path: '/' },
          { name: 'נכסים', path: listingsIndexPath },
        ])}
      />

      <PageHeader
        eyebrow="נכסים"
        title="נכסים למכירה, להשכרה ולהשקעה"
        lede="דירות, בנייני משרדים וקרקעות. מחיר של נכס שאינו מפרסם מחיר נמסר בפנייה — לא מוצג כאן מספר שאינו נכון."
        crumbs={[
          { label: 'דף הבית', to: '/' },
          { label: 'נכסים', to: listingsIndexPath },
        ]}
      />

      <section aria-labelledby="filters-title" className="bg-stone-100 pt-12 md:pt-16">
        <Container>
          <ListingFilters
            values={values}
            cities={cities}
            deals={deals}
            assets={assets}
            onChange={applyFilters}
            onReset={() => setSearchParams(new URLSearchParams(), { replace: true })}
            isFiltered={isFiltered}
          />
        </Container>
      </section>

      <Section labelledBy="results-title" tone="default" spacing="md">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <Heading level={2} id="results-title">
            {isFiltered ? 'תוצאות הסינון' : 'כל הנכסים'}
          </Heading>

          {/* Announced, because after a filter change the only thing that moved
              is further down the page and a screen-reader user would not know. */}
          <p aria-live="polite" className="tabular text-small text-ink-600">
            {results.length === all.length
              ? `${all.length} נכסים`
              : `${results.length} מתוך ${all.length} נכסים`}
          </p>
        </div>

        {results.length > 0 ? (
          <ul className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {results.map((listing) => (
              <li key={listing.slug}>
                <ListingCard listing={listing} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 rounded-lg border border-stone-200 bg-stone-50 p-8">
            <p className="text-body text-ink-900">
              אין כרגע נכס שמתאים לסינון הזה. אפשר לנקות את הסינון, או לספר לנו מה מחפשים — חלק
              מהנכסים שלנו לא מפורסמים באתר.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setSearchParams(new URLSearchParams(), { replace: true })}
              >
                ניקוי הסינון
              </Button>
              <Button to="/contact">ספרו לנו מה אתם מחפשים</Button>
            </div>
          </div>
        )}
      </Section>

      <Section labelledBy="listings-cta-title" tone="dark" spacing="sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <Heading level={2} id="listings-cta-title" tone="dark">
              יש לכם נכס להשכיר או למכור?
            </Heading>
            <p className="mt-3 max-w-prose text-body text-stone-200">
              אנחנו מנהלים, משווקים ומלווים — בלי דמי ניהול ובלי עמלות תיווך.
            </p>
          </div>

          <Button to="/contact" variant="onDark" size="lg" className="shrink-0">
            דברו איתנו
          </Button>
        </div>
      </Section>
    </>
  );
}

Component.displayName = 'Listings';
