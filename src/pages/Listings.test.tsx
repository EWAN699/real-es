import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { listings } from '@/content/listings';

import { Component as Listings } from './Listings';

// The document head is set through vite-react-ssg's <Head>, which needs the
// HelmetProvider the SSG runtime installs. Neither it nor the JSON-LD block is
// what this file is testing.
vi.mock('@/components/Seo', () => ({ Seo: () => null }));
vi.mock('@/components/JsonLd', () => ({ JsonLd: () => null }));

/**
 * The listings index, judged on the two things that would be lies rather than
 * bugs: an invented price, and a filter that hides properties without saying so.
 */
function renderListings(path = '/listings') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Listings />
    </MemoryRouter>,
  );
}

function results() {
  return screen.getAllByRole('article');
}

describe('Listings', () => {
  it('lists every marketable property when nothing is filtered', () => {
    renderListings();

    expect(results()).toHaveLength(listings.length);
    for (const listing of listings) {
      expect(screen.getByRole('link', { name: listing.title })).toBeInTheDocument();
    }
  });

  it('says the price is on application rather than printing a number for a property that has none', () => {
    renderListings();

    // None of the four publishes a price, so every card must say so.
    expect(screen.getAllByText('מחיר לפי פנייה')).toHaveLength(listings.length);

    // And no card may show a currency figure that nobody quoted.
    for (const card of results()) {
      expect(card.textContent ?? '').not.toMatch(/[₪$]\s*[\d,]/);
    }
  });

  it('draws no image frame for a listing with no photographs', () => {
    const { container } = renderListings();

    // Every gallery is empty today; a grey placeholder would imply a photograph
    // exists and is loading.
    expect(container.querySelectorAll('[data-media-slug]')).toHaveLength(0);
  });

  it('filters by city, and says how many of the total are showing', async () => {
    renderListings();

    const netanya = listings.filter((listing) => listing.city === 'נתניה');
    expect(netanya.length).toBeGreaterThan(0);

    await userEvent.selectOptions(screen.getByLabelText(/עיר/), 'נתניה');

    expect(results()).toHaveLength(netanya.length);
    expect(
      screen.getByText(`${netanya.length} מתוך ${listings.length} נכסים`),
    ).toBeInTheDocument();
  });

  it('reads the deal filter off the URL, including the legacy taxonomy term', () => {
    // `?deal=buy` is the old `property_buyorrent` slug, still arriving from
    // ten-year-old links, and means the same as `?deal=sale`.
    renderListings('/listings?deal=buy');

    const forSale = listings.filter((listing) => listing.dealType === 'sale');
    expect(results()).toHaveLength(forSale.length);
  });

  it('offers a way out when a filter matches nothing, instead of an empty page', async () => {
    renderListings();

    await userEvent.selectOptions(screen.getByLabelText(/עיר/), 'נתניה');
    await userEvent.selectOptions(screen.getByLabelText(/סוג נכס/), 'apartment');

    expect(screen.queryAllByRole('article')).toHaveLength(0);
    expect(screen.getAllByRole('button', { name: 'ניקוי הסינון' }).length).toBeGreaterThan(0);
    expect(
      screen.getByRole('link', { name: 'ספרו לנו מה אתם מחפשים' }),
    ).toBeInTheDocument();
  });

  it('offers only the filter values the data actually contains', () => {
    renderListings();

    const cities = within(screen.getByLabelText(/עיר/)).getAllByRole('option');
    const present = new Set(listings.map((listing) => listing.city));

    // The "all cities" option, plus one per city that exists.
    expect(cities).toHaveLength(present.size + 1);
  });

  it('has one h1, and it names the page', () => {
    renderListings();

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent('נכסים');
  });
});
