import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Reveal } from './Reveal';

/**
 * Motion must never be load-bearing. Every one of these cases asserts the same
 * thing from a different angle: the words are on the page regardless.
 */
describe('Reveal', () => {
  const originalObserver = globalThis.IntersectionObserver;

  afterEach(() => {
    globalThis.IntersectionObserver = originalObserver;
    vi.unstubAllGlobals();
  });

  it('renders its content when IntersectionObserver is unavailable', () => {
    // jsdom has none, which is also the state of a browser that lacks it.
    render(
      <Reveal>
        <p>ניהול נכסים בפריסה ארצית</p>
      </Reveal>,
    );

    expect(screen.getByText('ניהול נכסים בפריסה ארצית')).toBeVisible();
  });

  it('emits no inline opacity on the first render, which is what the prerenderer serialises', () => {
    const { container } = render(
      <Reveal>
        <p>טקסט</p>
      </Reveal>,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.getAttribute('style')).toBeNull();
  });

  it('passes the caller class through so layout does not depend on the motion state', () => {
    const { container } = render(
      <Reveal className="h-full">
        <p>טקסט</p>
      </Reveal>,
    );

    expect(container.firstElementChild).toHaveClass('h-full');
  });
});
