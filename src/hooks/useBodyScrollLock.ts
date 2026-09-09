import { useEffect } from 'react';

/**
 * Stop the page behind an open overlay from scrolling.
 *
 * The scrollbar width is replaced with padding so the layout does not jump when
 * the bar disappears — a jump reads as a bug and, on a text-heavy RTL page,
 * visibly reflows the line the user was reading.
 */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const { body, documentElement } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingInlineEnd;
    const scrollbarWidth = window.innerWidth - documentElement.clientWidth;

    body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      body.style.paddingInlineEnd = `${scrollbarWidth}px`;
    }

    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingInlineEnd = previousPadding;
    };
  }, [locked]);
}
