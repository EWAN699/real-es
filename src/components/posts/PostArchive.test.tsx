import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { blogPosts, hasRealDate, hasRealExcerpt, newsPosts, PENDING_DATE } from '@/content/posts';

import { PostArchive } from './PostArchive';

vi.mock('@/components/Seo', () => ({ Seo: () => null }));
vi.mock('@/components/JsonLd', () => ({ JsonLd: () => null }));

function renderArchive(kind: 'blog' | 'news') {
  return render(
    <MemoryRouter>
      <PostArchive kind={kind} />
    </MemoryRouter>,
  );
}

/**
 * The archives, judged on what they refuse to print.
 *
 * The content layer holds a title and a permalink per post and marks the two
 * missing fields with conventions — a `PENDING_DATE` sentinel and an excerpt
 * that repeats the title. Rendering either would turn a placeholder into a
 * published fact.
 */
describe('PostArchive', () => {
  it('lists every post of its kind, and only that kind', () => {
    renderArchive('blog');

    expect(screen.getAllByRole('article')).toHaveLength(blogPosts.length);

    for (const post of blogPosts.slice(0, 5)) {
      expect(screen.getByRole('link', { name: post.title })).toBeInTheDocument();
    }
    expect(screen.queryByRole('link', { name: newsPosts[0]?.title ?? 'none' })).toBeNull();
  });

  it('prints no date while every record carries the pending sentinel', () => {
    const { container } = renderArchive('news');

    // Nothing in the data has a real date yet…
    expect(newsPosts.every((post) => !hasRealDate(post))).toBe(true);
    // …so no <time> element, and no trace of the sentinel, reaches the page.
    expect(container.querySelectorAll('time')).toHaveLength(0);
    expect(container.textContent ?? '').not.toContain('1900');
    expect(container.textContent ?? '').not.toContain(PENDING_DATE);
  });

  it('withholds the excerpt where it is only the title repeated', () => {
    renderArchive('blog');

    const first = blogPosts[0];
    expect(first).toBeDefined();
    if (!first) return;

    expect(hasRealExcerpt(first)).toBe(false);

    const entries = screen.getAllByRole('article');
    const entry = entries.find((article) => article.textContent?.includes(first.title));
    expect(entry).toBeDefined();

    // The title appears once in its card, as the link — not again underneath it
    // as a teaser that says the same words.
    const occurrences = (entry?.textContent?.split(first.title).length ?? 1) - 1;
    expect(occurrences).toBe(1);
  });

  it('links each post at its own permalink, which is where the legacy URLs redirect', () => {
    renderArchive('news');

    const first = newsPosts[0];
    expect(first).toBeDefined();
    if (!first) return;

    expect(screen.getByRole('link', { name: first.title })).toHaveAttribute(
      'href',
      `/news/${first.slug}`,
    );
  });

  it('has exactly one h1', () => {
    renderArchive('blog');

    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
    expect(within(headings[0] as HTMLElement).queryByRole('img')).toBeNull();
  });
});
