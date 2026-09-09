import { useRef } from 'react';
import { Outlet } from 'react-router-dom';

import { useRouteFocus } from '@/hooks/useRouteFocus';

import { Footer } from './Footer';
import { Header } from './Header';
import { WhatsAppCta } from './WhatsAppCta';

/**
 * The shell every page renders inside: skip link, header, one `<main>`, footer,
 * and the persistent WhatsApp affordance.
 *
 * Deliberately imports no motion library. This component is in the entry chunk,
 * so anything it pulls in is downloaded before first paint on every page —
 * including the pages that never animate. `Reveal` reads `prefers-reduced-motion`
 * itself and lives in the lazily loaded page chunks, which is where the cost of
 * motion belongs.
 */
export function RootLayout() {
  const mainRef = useRef<HTMLElement>(null);
  useRouteFocus(mainRef);

  return (
    <>
      <a
        href="#main"
        className="sr-only rounded-md bg-ink-900 px-4 py-2 font-semibold text-stone-50 focus:not-sr-only focus:absolute focus:top-3 focus:start-3 focus:z-50"
      >
        דילוג לתוכן המרכזי
      </a>

      <div className="flex min-h-screen flex-col">
        <Header />

        <main id="main" ref={mainRef} tabIndex={-1} className="flex-1 focus:outline-none">
          <Outlet />
        </main>

        <Footer />
      </div>

      <WhatsAppCta />
    </>
  );
}

RootLayout.displayName = 'RootLayout';
