/**
 * The single place GSAP plugins are registered.
 *
 * Per contracts/motion.spec.md rule 5 ("one ScrollTrigger owner") nothing else
 * imports `gsap/ScrollTrigger` directly — components go through
 * `hooks/useScrollAnimation`, which imports from here.
 */
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

export function registerGsap(): void {
  if (registered || typeof window === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);
  // Lenis drives the loop; GSAP's lag smoothing fights it.
  gsap.ticker.lagSmoothing(0);
  registered = true;
}

export { gsap, ScrollTrigger };
