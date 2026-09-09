import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Reveal } from './Reveal';

/**
 * A stand-in for IntersectionObserver whose callback is under the test's
 * control, plus a switch for whether it ever reports anything at all — which is
 * the failure the fail-open behaviour exists for.
 */
function stubObserver({ reports = true }: { reports?: boolean } = {}) {
  const calls: IntersectionObserverCallback[] = [];

  class Stub {
    constructor(callback: IntersectionObserverCallback) {
      calls.push(callback);
    }
    observe() {
      /* nothing: the test drives the callback */
    }
    disconnect() {}
    unobserve() {}
    takeRecords() {
      return [];
    }
  }

  vi.stubGlobal('IntersectionObserver', Stub);

  return {
    /** Deliver the initial "not intersecting yet" callback a real observer sends. */
    report(isIntersecting: boolean) {
      if (!reports) return;
      for (const callback of calls) {
        act(() => {
          callback(
            [{ isIntersecting } as IntersectionObserverEntry],
            {} as IntersectionObserver,
          );
        });
      }
    },
  };
}

/** Put the element below the fold, which jsdom's all-zero rect never is. */
function placeBelowFold() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 5000,
    bottom: 5400,
    left: 0,
    right: 300,
    width: 300,
    height: 400,
    x: 0,
    y: 5000,
    toJSON: () => ({}),
  });
}

/**
 * Motion must never be load-bearing. Every one of these cases asserts the same
 * thing from a different angle: the words are on the page regardless.
 */
describe('Reveal', () => {
  const originalObserver = globalThis.IntersectionObserver;

  afterEach(() => {
    globalThis.IntersectionObserver = originalObserver;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
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

  it('never hides content that is already on screen', () => {
    const observer = stubObserver();

    const { container } = render(
      <Reveal>
        <p>טקסט שנראה מיד</p>
      </Reveal>,
    );

    // jsdom reports a zero rect, i.e. at the top of the viewport. Content the
    // visitor can already see must never be taken away and faded back in.
    observer.report(false);

    expect(container.firstElementChild).toHaveAttribute('data-reveal', 'static');
    expect(screen.getByText('טקסט שנראה מיד')).toBeVisible();
  });

  it('arms content below the fold and reveals it when the observer reports it', () => {
    placeBelowFold();
    const observer = stubObserver();

    const { container } = render(
      <Reveal>
        <p>טקסט מתחת לקיפול</p>
      </Reveal>,
    );

    expect(container.firstElementChild).toHaveAttribute('data-reveal', 'armed');

    observer.report(true);

    expect(container.firstElementChild).toHaveAttribute('data-reveal', 'revealed');
  });

  it('reveals anyway when the observer never reports — the hidden state fails open', () => {
    vi.useFakeTimers();
    placeBelowFold();
    // An observer that is constructed, accepts observe(), and then never calls
    // back: a stub, a dead polyfill, an extension that tore it down. Without a
    // fail-open the section stays at opacity 0 for the life of the page.
    stubObserver({ reports: false });

    const { container } = render(
      <Reveal>
        <p>טקסט שחייב להופיע בכל מקרה</p>
      </Reveal>,
    );

    expect(container.firstElementChild).toHaveAttribute('data-reveal', 'armed');

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(container.firstElementChild).toHaveAttribute('data-reveal', 'revealed');
  });
});
