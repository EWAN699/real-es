import { useEffect } from 'react';
import type { RefObject } from 'react';

/**
 * Make everything outside an open overlay inert while it is open.
 *
 * A focus trap only constrains the Tab key. A screen reader's virtual cursor
 * does not use the Tab key: with a trap alone, a VoiceOver or NVDA user can
 * still read — and activate — the entire page sitting behind a modal panel they
 * cannot see, which is exactly the "the menu is open but I am somewhere else"
 * confusion the trap was meant to prevent. `inert` is what actually removes a
 * subtree from the accessibility tree, from hit testing and from focus.
 *
 * It is applied to the overlay's *siblings*, walking up to `<body>`, rather than
 * to one known container: the overlay is rendered inside the header, so the
 * things to neutralise are the rest of the header, then `<main>` and the footer,
 * then the skip link and the WhatsApp affordance. Marking siblings at every
 * level covers all of them without this hook needing to know the page's shape,
 * and never marks an ancestor of the overlay itself.
 *
 * React 18 has no `inert` prop — it landed in 19, and 18 drops unknown
 * non-string props — so the attribute is set on the DOM directly.
 *
 * Elements that were already inert for another reason are left untouched on
 * cleanup, so two overlays (or a re-render) cannot un-inert each other's work.
 */
export function useInertBackground(active: boolean, overlayRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!active) return;

    const overlay = overlayRef.current;
    if (!overlay) return;

    const marked: Element[] = [];

    let node: Element | null = overlay;
    while (node && node !== document.body && node.parentElement) {
      const parent: HTMLElement = node.parentElement;

      for (const sibling of Array.from(parent.children)) {
        if (sibling === node) continue;
        if (sibling.hasAttribute('inert')) continue;

        sibling.setAttribute('inert', '');
        marked.push(sibling);
      }

      node = parent;
    }

    return () => {
      for (const element of marked) element.removeAttribute('inert');
    };
  }, [active, overlayRef]);
}
