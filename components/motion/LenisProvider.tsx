'use client';

/**
 * Smooth scroll, wired to GSAP's ticker so ScrollTrigger and Lenis agree on
 * one clock. Mount once, in app/layout.tsx.
 *
 * Under `prefers-reduced-motion: reduce` Lenis is never instantiated — smooth
 * scrolling is itself motion the user asked not to have — and the page uses
 * native scrolling. ScrollTrigger works either way, so nothing downstream
 * branches on this.
 */
import Lenis from 'lenis';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { gsap, ScrollTrigger, registerGsap } from '@/lib/motion/gsap';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface ScrollApi {
  /** The Lenis instance, or null under reduced motion / before mount. */
  lenis: Lenis | null;
  /** Scroll to an element or offset. Falls back to native smooth-less scroll. */
  scrollTo: (target: string | number | HTMLElement, opts?: { offset?: number }) => void;
  /** Pause/resume page scrolling (modals, menus). */
  setPaused: (paused: boolean) => void;
  reducedMotion: boolean;
}

const ScrollContext = createContext<ScrollApi | null>(null);

export function useScroll(): ScrollApi {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error('useScroll must be used inside <LenisProvider>');
  return ctx;
}

export function LenisProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  // State, not a ref: consumers re-render once the instance exists.
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useIsomorphicLayoutEffect(() => {
    registerGsap();

    if (reducedMotion) {
      document.documentElement.dataset.lenis = 'off';
      return () => {
        delete document.documentElement.dataset.lenis;
      };
    }

    const instance = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      // Never smooth touch: it makes native momentum feel broken and is the
      // usual cause of "the page traps my finger" (motion.spec.md rule 4).
      syncTouch: false,
      autoRaf: false,
    });
    document.documentElement.dataset.lenis = 'on';

    instance.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => instance.raf(time * 1000);
    gsap.ticker.add(tick);

    // Pinned and scrubbed triggers measure in px; re-measure once the Hebrew
    // webfont has swapped in and the text has settled at its real height.
    void document.fonts?.ready.then(() => ScrollTrigger.refresh());

    setLenis(instance);

    return () => {
      gsap.ticker.remove(tick);
      instance.destroy();
      setLenis(null);
      delete document.documentElement.dataset.lenis;
    };
  }, [reducedMotion]);

  const api = useMemo<ScrollApi>(
    () => ({
      lenis,
      reducedMotion,
      scrollTo(target, opts) {
        if (lenis) {
          lenis.scrollTo(target, { offset: opts?.offset ?? 0 });
          return;
        }
        if (typeof target === 'number') {
          window.scrollTo({ top: target + (opts?.offset ?? 0), behavior: 'auto' });
          return;
        }
        const el =
          typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target;
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY + (opts?.offset ?? 0);
          window.scrollTo({ top, behavior: 'auto' });
        }
      },
      setPaused(paused) {
        if (lenis) {
          if (paused) lenis.stop();
          else lenis.start();
        }
        document.documentElement.style.overflow = paused ? 'hidden' : '';
      },
    }),
    [lenis, reducedMotion],
  );

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}
