import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { Component as Home } from './Home';

// The document head is set through vite-react-ssg's <Head>, which needs the
// HelmetProvider the SSG runtime installs. It is not what this file is testing.
vi.mock('@/components/Seo', () => ({ Seo: () => null }));

function renderHome() {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
}

describe('Home', () => {
  /**
   * The single most important assertion in the project.
   *
   * On the legacy site "100% שירות · 0% עמלות" — the group's whole
   * differentiator — was typeset into a slide of the hero carousel. No crawler
   * could index it, no screen reader could announce it, and nobody searching
   * for it could find the page. If this test ever fails because the string moved
   * into an image, the rebuild has undone its own reason for existing.
   */
  it('carries the service promise as real text inside the h1', () => {
    renderHome();

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('100% שירות · 0% עמלות');
  });

  it('states the promise in text nodes, never in an image', () => {
    const { container } = renderHome();

    const heading = screen.getByRole('heading', { level: 1 });
    expect(within(heading).queryByRole('img')).toBeNull();
    expect(heading.querySelectorAll('img, svg')).toHaveLength(0);

    for (const image of container.querySelectorAll('img')) {
      expect(image.getAttribute('alt') ?? '').not.toContain('100%');
    }
  });

  it('has exactly one h1', () => {
    renderHome();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  it('does not skip a heading level', () => {
    const { container } = renderHome();

    const levels = Array.from(container.querySelectorAll('h1, h2, h3, h4')).map((element) =>
      Number(element.tagName.slice(1)),
    );

    expect(levels[0]).toBe(1);
    levels.forEach((level, index) => {
      if (index === 0) return;
      const previous = levels[index - 1] ?? 1;
      expect(level).toBeLessThanOrEqual(previous + 1);
    });
  });

  it('presents no carousel — one statement, one image', () => {
    const { container } = renderHome();

    expect(container.querySelectorAll('[data-carousel], .swiper, .slick-slider')).toHaveLength(0);

    const hero = screen.getByRole('heading', { level: 1 }).closest('section');
    expect(hero?.querySelectorAll('img')).toHaveLength(1);
  });

  it('routes to all three divisions', () => {
    renderHome();

    for (const path of ['/management', '/construction', '/investment']) {
      expect(
        screen.getAllByRole('link').some((link) => link.getAttribute('href') === path),
      ).toBe(true);
    }
  });

  it('quotes no track-record figure while the content layer is unconfirmed', () => {
    const { container } = renderHome();

    // The legacy site's counters contradicted its own body copy — seven years
    // against "over ten", a 69 where the text described a 9.6. The schema gates
    // every stat behind `confirmed`; until then nothing numeric is asserted
    // beyond the service promise itself.
    const text = container.textContent ?? '';
    const claims = text.match(/\b\d{2,}\s*(?:שנות|שנים|לקוחות|פרויקטים|נכסים)\b/g) ?? [];
    expect(claims).toEqual([]);
  });

  it('renders every image through the media registry, with a reserved aspect ratio', () => {
    const { container } = renderHome();

    const frames = container.querySelectorAll('[data-media-slug]');
    expect(frames.length).toBeGreaterThan(0);

    for (const frame of frames) {
      expect(frame.className).toMatch(/aspect-\[/);
    }

    for (const image of container.querySelectorAll('img')) {
      expect(image.getAttribute('src') ?? '').not.toContain('/media/');
    }
  });
});
