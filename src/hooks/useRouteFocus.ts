import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Client-side navigation does not move focus or reset the scroll position the
 * way a document load does. Left alone, a screen-reader user activates a nav
 * link and nothing appears to happen — focus is still on the link, in a page
 * that has silently been replaced.
 *
 * On every navigation after the first, focus moves to the main landmark and the
 * window scrolls to the top. The initial render is skipped deliberately: the
 * page arrives prerendered, and stealing focus on load would be its own bug.
 */
export function useRouteFocus(target: RefObject<HTMLElement | null>) {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    target.current?.focus();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, target]);
}
