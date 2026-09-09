import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { ceoName } from '@/content/contact';
import { confirmedStats, unconfirmedStats } from '@/content/stats';
import { readyTestimonials } from '@/content/testimonials';

import { Component as About } from './About';

vi.mock('@/components/Seo', () => ({ Seo: () => null }));
vi.mock('@/components/JsonLd', () => ({ JsonLd: () => null }));

function renderAbout() {
  return render(
    <MemoryRouter>
      <About />
    </MemoryRouter>,
  );
}

describe('About', () => {
  /**
   * The legacy homepage published five counters. Two contradict its own body
   * copy — 7 years' experience against "over ten", a survey score of 69 against
   * a testimonial stating 9.6 — and the other three are unverifiable. Every one
   * is `confirmed: false`, and an unconfirmed figure is withheld, not guessed at.
   */
  it('publishes no unconfirmed figure', () => {
    const { container } = renderAbout();
    const text = container.textContent ?? '';

    expect(confirmedStats).toHaveLength(0);
    expect(unconfirmedStats.length).toBeGreaterThan(0);

    for (const stat of unconfirmedStats) {
      expect(text).not.toContain(stat.label);
    }
    // The counter block itself must not render an empty shell either.
    expect(screen.queryByText('במספרים')).toBeNull();
  });

  it('names the CEO without writing his message for him', () => {
    renderAbout();

    expect(screen.getByRole('heading', { name: 'דבר המנכ״ל' })).toBeInTheDocument();
    expect(screen.getByText(ceoName)).toBeInTheDocument();
  });

  it('links the media channels rather than embedding a player or a social widget', () => {
    const { container } = renderAbout();

    expect(container.querySelectorAll('iframe, script, embed, object')).toHaveLength(0);
    expect(
      screen.getByRole('link', { name: /יוטיוב/ }).getAttribute('href'),
    ).toMatch(/^https:\/\/www\.youtube\.com\//);
  });

  it('quotes real customers, and links to the full set', () => {
    renderAbout();

    const first = readyTestimonials[0];
    expect(first).toBeDefined();
    if (!first) return;

    expect(screen.getByText(first.quote)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'לכל ההמלצות' })).toHaveAttribute(
      'href',
      '/testimonials',
    );
  });

  it('has exactly one h1', () => {
    renderAbout();

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
