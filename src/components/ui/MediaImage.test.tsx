import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { getMedia } from '@/content/media';

import { MediaImage } from './MediaImage';

describe('MediaImage', () => {
  it('resolves the slug through the media registry rather than a hand-written path', () => {
    render(<MediaImage slug="hero-tel-aviv-skyline" alt="קו הרקיע של תל אביב" />);

    const image = screen.getByRole('img', { name: 'קו הרקיע של תל אביב' });

    /*
     * Asserted against what the registry returns, not against a literal path.
     * The registry answers with a real file once the pipeline has produced one
     * and with an inline placeholder before that, so a component that wrote its
     * own path would fail this in both states — which is the thing being
     * protected. Pinning the literal `/media/` prefix only worked while the
     * registry was empty.
     */
    expect(image).toHaveAttribute('src', getMedia('hero-tel-aviv-skyline').fallback);
  });

  it('reserves the aspect ratio so nothing shifts when the real file lands', () => {
    const { container } = render(<MediaImage slug="division-management" alt="" aspect="16:9" />);

    expect(container.firstElementChild?.className).toContain('aspect-[16/9]');
  });

  it('marks an unfulfilled slug so the placeholder state is visible in the DOM', () => {
    const { container } = render(<MediaImage slug="not-generated-yet" alt="" />);

    expect(container.firstElementChild).toHaveAttribute('data-media-placeholder', 'true');
    expect(container.firstElementChild).toHaveAttribute('data-media-slug', 'not-generated-yet');
  });

  it('advertises no optimised source formats while the asset is a placeholder', () => {
    // <picture> picks a <source> on its type attribute alone and does not fall
    // back if the file then fails to decode. The SVG placeholder must not be
    // announced as AVIF.
    const { container } = render(<MediaImage slug="not-generated-yet" alt="" />);

    expect(container.querySelectorAll('source')).toHaveLength(0);
  });

  it('lazy-loads by default and eagerly for above-the-fold images', () => {
    const { rerender } = render(<MediaImage slug="a-slug" alt="תמונה" />);
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy');

    rerender(<MediaImage slug="a-slug" alt="תמונה" priority />);
    const image = screen.getByRole('img');
    expect(image).toHaveAttribute('loading', 'eager');
    // Lowercase: React 18 drops the camelCase prop with a warning.
    expect(image).toHaveAttribute('fetchpriority', 'high');
  });

  it('treats an empty alt as decorative', () => {
    const { container } = render(<MediaImage slug="texture-concrete" alt="" />);

    expect(container.querySelector('img')).toHaveAttribute('alt', '');
    expect(screen.queryByRole('img')).toBeNull();
  });
});
