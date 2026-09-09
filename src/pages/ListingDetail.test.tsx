import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { listings } from '@/content/listings';
import { buildRealEstateListing } from '@/lib/structured-data';

import { Component as ListingDetail } from './ListingDetail';

vi.mock('@/components/Seo', () => ({ Seo: () => null }));
vi.mock('@/components/JsonLd', () => ({ JsonLd: () => null }));

const listing = listings[0];

function renderListing(slug: string) {
  return render(
    <MemoryRouter initialEntries={[`/listings/${slug}`]}>
      <Routes>
        <Route path="/listings/:slug" element={<ListingDetail />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ListingDetail', () => {
  it('states that the price is on application instead of printing one', () => {
    expect(listing).toBeDefined();
    if (!listing) return;

    const { container } = renderListing(listing.slug);

    expect(listing.price).toBeUndefined();
    expect(screen.getByText('מחיר לפי פנייה')).toBeInTheDocument();
    expect(container.textContent ?? '').not.toMatch(/[₪$]\s*[\d,]/);
  });

  it('omits the offer from the structured data when there is no price', () => {
    expect(listing).toBeDefined();
    if (!listing) return;

    // The same rule at the machine-readable layer: a property priced on
    // application is not a property priced at zero.
    expect(buildRealEstateListing(listing).offers).toBeUndefined();
  });

  it('says there are no photographs rather than drawing an empty frame', () => {
    expect(listing).toBeDefined();
    if (!listing) return;

    const { container } = renderListing(listing.slug);

    expect(listing.gallery).toHaveLength(0);
    expect(container.querySelectorAll('[data-media-slug]')).toHaveLength(0);
    expect(screen.getByText(/עדיין לא פרסמנו תמונות/)).toBeInTheDocument();
  });

  it('renders the 404 for a slug that does not exist', () => {
    renderListing('not-a-listing');

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('לא נמצא');
  });

  it('has one h1, and it is the property title', () => {
    expect(listing).toBeDefined();
    if (!listing) return;

    renderListing(listing.slug);

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(listing.title);
  });
});
