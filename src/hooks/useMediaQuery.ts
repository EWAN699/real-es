import { useEffect, useState } from 'react';

/**
 * Subscribe to a media query.
 *
 * Starts `false` on the server and on the first client render, so the
 * prerendered HTML and the hydrated tree always agree; the real value arrives
 * in an effect. Callers must therefore treat this as an enhancement — never as
 * the thing that decides whether content exists — which is why the responsive
 * layout itself is CSS, and this hook is only used to close an overlay that no
 * longer applies at the current width.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const list = window.matchMedia(query);
    setMatches(list.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    list.addEventListener('change', onChange);

    return () => list.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
