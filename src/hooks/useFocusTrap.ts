import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

import { inertOutside } from './inert';

/**
 * Confine keyboard focus to a container while it is open, and hand focus back
 * to whatever opened it on close.
 *
 * Written rather than pulled in as a dependency: it is forty lines, and the
 * project's rule is that accessibility is built in, not bolted on.
 *
 * Three behaviours matter and are all tested:
 *  - Tab from the last element wraps to the first, Shift+Tab from the first
 *    wraps to the last. Without this a keyboard user tabs straight out of an
 *    open dialog and onto page content that is visually behind an overlay.
 *  - Focus is restored to the trigger on close, so the user resumes where they
 *    were instead of at the top of the document.
 *  - Given `inertOutsideRef`, everything outside that element is made `inert`
 *    while the trap is active. The Tab key is only one way into the page: a
 *    screen reader's virtual cursor ignores it entirely, and would otherwise
 *    browse the whole site behind a panel the user cannot see.
 *
 * The inert marking is deliberately owned by this effect rather than by a hook
 * of its own, because the two have to be sequenced against each other. The
 * trigger is captured *before* anything is marked (marking it blurs it, and the
 * blurred target is what focus returns to), and everything is unmarked *before*
 * focus is restored — `focus()` on an element inside an inert subtree is
 * silently ignored by the browser, which loses focus to `<body>` on close.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => !element.hasAttribute('hidden') && element.getAttribute('aria-hidden') !== 'true',
  );
}

export function useFocusTrap<T extends HTMLElement>(
  active: boolean,
  inertOutsideRef?: RefObject<HTMLElement | null>,
) {
  const containerRef = useRef<T | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    // Captured first: marking the page inert blurs whatever had focus, and
    // this is the element focus has to come back to.
    restoreRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const overlay = inertOutsideRef?.current ?? null;
    const releaseInert = overlay ? inertOutside(overlay) : null;

    const initial = getFocusable(container)[0] ?? container;
    initial.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Tab' || !container) return;

      const focusable = getFocusable(container);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (!first || !last) {
        // Nothing to move to: keep focus pinned to the container itself.
        event.preventDefault();
        container.focus();
        return;
      }

      const activeElement = document.activeElement;

      if (event.shiftKey && (activeElement === first || activeElement === container)) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown, true);

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      // Released before the restore: an inert trigger cannot take focus.
      releaseInert?.();
      restoreRef.current?.focus();
    };
  }, [active, inertOutsideRef]);

  return containerRef;
}
