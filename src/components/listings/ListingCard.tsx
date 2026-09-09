import { Link } from 'react-router-dom';

import { dealTypeLabels, listingPath } from '@/content/listings';
import type { Listing } from '@/content/types';
import { formatPrice } from '@/lib/listings';
import { Heading } from '@/components/ui/Heading';
import { MediaImage } from '@/components/ui/MediaImage';
import { assetTypeLabels, formatArea, PRICE_ON_APPLICATION } from './labels';

/**
 * One property, as it appears in the index.
 *
 * Two honest-rendering rules, both of which the current data exercises on every
 * card:
 *
 *  - **No price, no number.** `formatPrice` returns `null` for a listing priced
 *    on application, and the card says so in words. It never prints a
 *    placeholder figure, a dash or a zero.
 *  - **No photograph, no frame.** Every gallery is empty: the legacy photographs
 *    are on the client's server and are not ours to rehost, and AI imagery may
 *    never stand in for a specific marketed property. A card with no picture is
 *    laid out as a text card rather than as a card with a grey hole in it.
 *
 * The heading is the link, and the rest of the card is plain text. Stretching a
 * link across the whole card would swallow that text into the link's accessible
 * name and make the screen-reader link list unreadable.
 */
export function ListingCard({ listing }: { listing: Listing }) {
  const price = formatPrice(listing);
  const cover = listing.gallery[0];

  const facts = [
    listing.rooms !== undefined ? `${listing.rooms} חדרים` : null,
    listing.sizeSqm !== undefined ? formatArea(listing.sizeSqm) : null,
  ].filter((fact): fact is string => fact !== null);

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-lg border border-stone-200 bg-stone-50">
      {cover ? (
        <MediaImage
          slug={cover}
          aspect="16:9"
          rounded={false}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        />
      ) : null}

      <div className="flex flex-1 flex-col p-6">
        <p className="flex flex-wrap items-center gap-2 text-small font-semibold text-ink-600">
          <span className="rounded-sm bg-stone-200 px-2 py-0.5 text-ink-900">
            {dealTypeLabels[listing.dealType]}
          </span>
          <span>{assetTypeLabels[listing.assetType]}</span>
        </p>

        <Heading level={3} className="mt-3">
          <Link
            to={listingPath(listing.slug)}
            className="underline-offset-4 hover:text-brand-700 hover:underline"
          >
            {listing.title}
          </Link>
        </Heading>

        <p className="mt-2 text-small text-ink-600">
          {listing.neighborhood ? `${listing.city} · ${listing.neighborhood}` : listing.city}
        </p>

        <p className="mt-3 flex-1 text-body text-ink-600">{listing.summary}</p>

        {facts.length > 0 ? (
          <p className="tabular mt-4 text-small text-ink-600">{facts.join(' · ')}</p>
        ) : null}

        <p className="mt-4 border-t border-stone-200 pt-4 text-body font-semibold text-ink-900">
          {price ?? PRICE_ON_APPLICATION}
        </p>
      </div>
    </article>
  );
}
