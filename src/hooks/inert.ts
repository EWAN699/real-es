/**
 * Make everything outside an open overlay inert, and give back a function that
 * undoes it.
 *
 * A focus trap only constrains the Tab key. A screen reader's virtual cursor
 * does not use Tab: with a trap alone, a VoiceOver or NVDA user can still read —
 * and activate — the entire page sitting behind a modal panel they cannot see.
 * `inert` is what actually removes a subtree from the accessibility tree, from
 * hit testing and from focus.
 *
 * It is applied to the overlay's *siblings*, walking up to `<body>`, rather than
 * to one known container: the mobile menu is rendered inside the header, so the
 * things to neutralise are the rest of the header, then `<main>` and the footer,
 * then the skip link and the WhatsApp affordance. Marking siblings at each level
 * covers all of them without this function knowing the page's shape, and never
 * marks an ancestor of the overlay itself.
 *
 * Elements that were already inert for another reason are left alone on release,
 * so two overlays cannot undo each other's work.
 *
 * Deliberately a plain function rather than a hook. Applying and releasing
 * `inert` has to be sequenced against moving and restoring focus — inert is
 * enforced by the browser, so `element.focus()` on a still-inert element does
 * nothing at all — and two independent effects cannot express that order:
 * React runs cleanups in the same order it ran the setups. `useFocusTrap` calls
 * this so that one effect owns both.
 *
 * React 18 has no `inert` prop — it landed in 19, and 18 drops unknown
 * non-string props — so the attribute is set on the DOM directly.
 */
export function inertOutside(overlay: HTMLElement): () => void {
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
}
