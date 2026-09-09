import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';

import { cn } from './cn';

/**
 * Reveal-on-scroll, and nothing else. Motion in this build is decorative only.
 *
 * THE RULE: the hidden state fails open. Content is visible unless this
 * component has positively established that it can reveal it again, and it
 * gives up that certainty the moment anything looks wrong.
 *
 * Three guarantees, in the order they matter:
 *
 *  1. **No script, no problem.** The first render — the one the prerenderer
 *     serialises — carries no inline opacity at all. A visitor with JavaScript
 *     disabled, or one whose bundle failed to load, sees every word. A page
 *     whose copy is only revealed by script is the same failure mode as the
 *     legacy site's text-inside-a-JPEG hero, one layer up.
 *  2. **Nothing on screen is ever hidden.** After mount the element measures
 *     itself; only content that is genuinely below the fold is armed. Content
 *     the visitor is already looking at is left alone, so hydration cannot make
 *     a paragraph disappear and fade back in.
 *  3. **A broken observer reveals.** `IntersectionObserver` delivers an initial
 *     callback for everything it observes. If none arrives — a stub, a
 *     polyfill that never runs, an observer torn down by an extension — the
 *     timer fires and the content is shown unconditionally. The timer does
 *     *not* fire once the observer has proven itself, so a working observer
 *     still drives a real scroll reveal.
 *
 * Framer animates in JavaScript, so the global `prefers-reduced-motion` block in
 * theme.css cannot suppress it. `useReducedMotion` is the seam that does: with
 * the preference set, the element is never armed and never animates.
 */
export type RevealProps = {
  delay?: number | undefined;
  className?: string | undefined;
  children: ReactNode;
};

/**
 * How long to wait for the observer's first callback before deciding it is not
 * coming. Generous: this is a fault detector, not a timing dependency.
 */
const OBSERVER_PROOF_MS = 1200;

type Phase = 'static' | 'armed' | 'revealed';

export function Reveal({ delay = 0, className, children }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('static');
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (typeof IntersectionObserver === 'undefined') return;

    const node = ref.current;
    if (!node) return;

    // Anything at or above the fold is already on screen. Hiding it would mean
    // taking away something the visitor can see, to give it back a frame later.
    const rect = node.getBoundingClientRect();
    if (rect.top <= window.innerHeight) return;

    let observer: IntersectionObserver | null = null;
    let proofTimer = 0;

    const reveal = () => {
      window.clearTimeout(proofTimer);
      observer?.disconnect();
      observer = null;
      setPhase('revealed');
    };

    setPhase('armed');

    observer = new IntersectionObserver(
      (entries) => {
        // The first callback is proof the observer runs at all, whether or not
        // the element is intersecting yet.
        window.clearTimeout(proofTimer);
        if (entries.some((entry) => entry.isIntersecting)) reveal();
      },
      { threshold: 0.15 },
    );

    observer.observe(node);

    proofTimer = window.setTimeout(reveal, OBSERVER_PROOF_MS);

    return () => {
      window.clearTimeout(proofTimer);
      observer?.disconnect();
      observer = null;
    };
  }, [prefersReducedMotion]);

  const hidden = phase === 'armed';

  return (
    <motion.div
      ref={ref}
      className={cn(className)}
      /*
       * A test seam, and a debugging one: `armed` is the only state in which
       * anything on this page is invisible, so it is greppable in a browser.
       */
      data-reveal={phase}
      {...(phase === 'static'
        ? // No motion props at all, so framer renders a bare <div> with no
          // inline style — which is what the prerenderer serialises.
          {}
        : {
            initial: false as const,
            animate: hidden ? { opacity: 0, y: 16 } : { opacity: 1, y: 0 },
            // Arming is not an animation the visitor is meant to watch — the
            // element is off screen — so it is instant. Only the reveal eases.
            transition: hidden
              ? { duration: 0 }
              : { duration: 0.5, delay, ease: 'easeOut' as const },
          })}
    >
      {children}
    </motion.div>
  );
}
