'use client';

/**
 * The only way a section gets scroll choreography.
 *
 * contracts/motion.spec.md rule 5: triggers are created here and killed here;
 * no component calls `ScrollTrigger.create`. Rule 1: every preset has a
 * reduced-motion path, and it is decided HERE — a section asking for
 * `pin-reveal` under `prefers-reduced-motion: reduce` gets the static path from
 * this hook and never writes a branch of its own.
 *
 * Usage:
 *
 *   const { ref, mode } = useScrollAnimation<HTMLElement>({ preset: section.motion });
 *   return (
 *     <section ref={ref}>
 *       <h2 data-motion-heading>{section.heading}</h2>
 *       <p data-animate>{section.body}</p>
 *     </section>
 *   );
 *
 * The hook stamps `data-motion` and `data-motion-mode` on the element; the
 * layout rules each preset needs live in app/globals.css keyed off those, so a
 * section only supplies markup and the child data-attributes.
 *
 * Nothing is hidden by CSS. Initial states are set by GSAP inside a layout
 * effect (so before paint) and only on the animated path. If JS never runs, or
 * reduced motion is on, the section renders complete — no permanently invisible
 * content, ever.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

import { gsap, ScrollTrigger, registerGsap } from '@/lib/motion/gsap';
import { MOTION_SELECTORS, type MotionPreset } from '@/lib/motion/presets';
import { splitIntoLines } from '@/lib/motion/split-lines';
import { useIsomorphicLayoutEffect } from '@/hooks/useIsomorphicLayoutEffect';

export type MotionMode = 'animated' | 'static';

export interface ScrollAnimationOptions {
  /** Preset from contracts/motion.spec.md. Defaults to 'none'. */
  preset?: MotionPreset | null;
  /** Set false to skip entirely (e.g. section not rendered yet). */
  enabled?: boolean;
  /** fade-up / text-split: seconds between staggered children. */
  stagger?: number;
  /** fade-up: travel distance in px. */
  distance?: number;
  /** fade-up / text-split: ScrollTrigger `start`. */
  start?: string;
  /** parallax-slow: fraction of scroll speed the layer moves at. */
  speed?: number;
  /** pin-reveal: how much scroll each state consumes, in viewport heights. */
  stepLength?: number;
  /** Called with 0..1 while a scrubbed preset advances. Also written to `--motion-progress`. */
  onProgress?: (progress: number) => void;
}

export interface ScrollAnimationResult<T extends HTMLElement> {
  ref: React.RefObject<T | null>;
  /** 'static' whenever reduced motion is on, the preset is 'none', or JS has not set up yet. */
  mode: MotionMode;
}

const DEFAULTS = {
  stagger: 0.08,
  distance: 24,
  start: 'top 85%',
  speed: 0.7,
  stepLength: 1,
} as const;

/** 40ms between lines, per the text-split row of the spec. */
const LINE_STAGGER = 0.04;

export function useScrollAnimation<T extends HTMLElement = HTMLElement>(
  options: ScrollAnimationOptions = {},
): ScrollAnimationResult<T> {
  const {
    preset = 'none',
    enabled = true,
    stagger = DEFAULTS.stagger,
    distance = DEFAULTS.distance,
    start = DEFAULTS.start,
    speed = DEFAULTS.speed,
    stepLength = DEFAULTS.stepLength,
    onProgress,
  } = options;

  const ref = useRef<T | null>(null);
  const [mode, setMode] = useState<MotionMode>('static');

  // Kept in a ref so a new inline callback each render does not rebuild every
  // trigger. Assigned in an effect, never during render.
  const progressCb = useRef(onProgress);
  useEffect(() => {
    progressCb.current = onProgress;
  }, [onProgress]);

  const reportProgress = useCallback((el: HTMLElement, p: number) => {
    el.style.setProperty('--motion-progress', p.toFixed(4));
    progressCb.current?.(p);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.dataset.motion = preset ?? 'none';

    if (!enabled || !preset || preset === 'none') {
      el.dataset.motionMode = 'static';
      setMode('static');
      reportProgress(el, 0);
      return;
    }

    registerGsap();

    const mm = gsap.matchMedia();

    // The reduced-motion branch is deliberately empty of animation. Because no
    // stylesheet hides anything, "do nothing" already means "render complete".
    mm.add(
      {
        motionOk: '(prefers-reduced-motion: no-preference)',
        reduced: '(prefers-reduced-motion: reduce)',
      },
      (ctx) => {
        const motionOk = Boolean(ctx.conditions?.motionOk);

        if (!motionOk) {
          el.dataset.motionMode = 'static';
          setMode('static');
          return staticFallback(el, preset, reportProgress);
        }

        el.dataset.motionMode = 'animated';
        setMode('animated');

        const q = gsap.utils.selector(el);
        switch (preset) {
          case 'fade-up':
            return buildFadeUp(el, q, { stagger, distance, start });
          case 'text-split':
            return buildTextSplit(el, { start });
          case 'parallax-slow':
            return buildParallax(el, q, { speed });
          case 'pin-reveal':
            return buildPinReveal(el, q, { stepLength, reportProgress });
          case 'horizontal-scroll':
            return buildHorizontalScroll(el, q, { reportProgress });
          default:
            return undefined;
        }
      },
    );

    // One owner, one teardown: revert() kills every trigger and tween created
    // inside the matchMedia scope and restores the elements' original state.
    return () => {
      mm.revert();
      delete el.dataset.motionMode;
    };
  }, [preset, enabled, stagger, distance, start, speed, stepLength, reportProgress]);

  return { ref, mode };
}

/* ------------------------------------------------------------------ *
 * Static paths
 * ------------------------------------------------------------------ */

/**
 * Reduced motion. Nothing animates; the only work is keeping the affordances
 * that the animated path would otherwise have provided — a progress indicator
 * that still tracks the user's own scrolling of the degraded overflow row.
 */
function staticFallback(
  el: HTMLElement,
  preset: MotionPreset,
  reportProgress: (el: HTMLElement, p: number) => void,
): (() => void) | undefined {
  reportProgress(el, 0);
  if (preset !== 'horizontal-scroll') return undefined;

  const viewport =
    el.querySelector<HTMLElement>('[data-motion-viewport]') ??
    el.querySelector<HTMLElement>(MOTION_SELECTORS.track)?.parentElement ??
    el;

  const onScroll = () => {
    const max = viewport.scrollWidth - viewport.clientWidth;
    // scrollLeft is negative in RTL in most engines; magnitude is what we want.
    reportProgress(el, max > 0 ? Math.min(1, Math.abs(viewport.scrollLeft) / max) : 0);
  };
  viewport.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  return () => viewport.removeEventListener('scroll', onScroll);
}

/* ------------------------------------------------------------------ *
 * Animated paths
 * ------------------------------------------------------------------ */

type Q = (selector: string) => Element[];

function buildFadeUp(
  el: HTMLElement,
  q: Q,
  o: { stagger: number; distance: number; start: string },
) {
  const found = q(MOTION_SELECTORS.animate);
  const targets = found.length ? found : [el];

  gsap.set(targets, { autoAlpha: 0, y: o.distance });
  gsap.to(targets, {
    autoAlpha: 1,
    y: 0,
    duration: 0.7,
    ease: 'power2.out',
    stagger: o.stagger,
    scrollTrigger: { trigger: el, start: o.start, once: true },
  });
}

function buildTextSplit(el: HTMLElement, o: { start: string }) {
  const heading = el.querySelector<HTMLElement>(MOTION_SELECTORS.heading) ?? el;
  const split = splitIntoLines(heading);
  if (!split.lines.length) return () => split.revert();

  gsap.set(split.lines, { yPercent: 115, autoAlpha: 0 });
  gsap.to(split.lines, {
    yPercent: 0,
    autoAlpha: 1,
    duration: 0.8,
    ease: 'power3.out',
    stagger: LINE_STAGGER,
    scrollTrigger: { trigger: el, start: o.start, once: true },
    // Once the lines have arrived, stop clipping so a later reflow cannot hide
    // a wrapped second line inside the mask.
    onComplete: () => heading.classList.add('motion-split-done'),
  });

  return () => {
    heading.classList.remove('motion-split-done');
    split.revert();
  };
}

function buildParallax(el: HTMLElement, q: Q, o: { speed: number }) {
  const layer = (q(MOTION_SELECTORS.parallax)[0] ?? el.firstElementChild) as HTMLElement | null;
  if (!layer) return;

  // The layer is oversized by globals.css so this never exposes an edge.
  const travel = (1 - o.speed) * 50;
  gsap.fromTo(
    layer,
    { yPercent: -travel },
    {
      yPercent: travel,
      ease: 'none',
      scrollTrigger: {
        trigger: el,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
        invalidateOnRefresh: true,
      },
    },
  );
}

function buildPinReveal(
  el: HTMLElement,
  q: Q,
  o: { stepLength: number; reportProgress: (el: HTMLElement, p: number) => void },
) {
  const steps = q(MOTION_SELECTORS.step) as HTMLElement[];
  const count = Math.max(steps.length, 1);

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: el,
      start: 'top top',
      end: () => `+=${window.innerHeight * o.stepLength * count}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 0.6,
      invalidateOnRefresh: true,
      onUpdate: (self) => o.reportProgress(el, self.progress),
    },
  });

  if (steps.length > 1) {
    gsap.set(steps.slice(1), { autoAlpha: 0, y: 32 });
    gsap.set(steps[0], { autoAlpha: 1, y: 0 });
    for (let i = 1; i < steps.length; i += 1) {
      tl.to(steps[i - 1], { autoAlpha: 0, y: -32, ease: 'none', duration: 1 }).to(
        steps[i],
        { autoAlpha: 1, y: 0, ease: 'none', duration: 1 },
        '<',
      );
    }
  } else {
    const inner = q(MOTION_SELECTORS.animate) as HTMLElement[];
    const targets = inner.length ? inner : [el.firstElementChild as HTMLElement].filter(Boolean);
    if (targets.length) {
      gsap.set(targets, { autoAlpha: 0, y: 32 });
      tl.to(targets, { autoAlpha: 1, y: 0, ease: 'none', duration: 1, stagger: 0.2 });
    }
  }
}

function buildHorizontalScroll(
  el: HTMLElement,
  q: Q,
  o: { reportProgress: (el: HTMLElement, p: number) => void },
) {
  const track = q(MOTION_SELECTORS.track)[0] as HTMLElement | undefined;
  if (!track) return;

  // contracts/motion.spec.md rule 2: horizontal motion follows the writing
  // direction. In RTL the track starts at the right and advances leftwards,
  // which means translating it in the POSITIVE x direction.
  const rtl = getComputedStyle(el).direction === 'rtl';
  const overflow = () => Math.max(0, track.scrollWidth - el.clientWidth);

  gsap.to(track, {
    x: () => (rtl ? overflow() : -overflow()),
    ease: 'none',
    scrollTrigger: {
      trigger: el,
      start: 'top top',
      end: () => `+=${overflow()}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => o.reportProgress(el, self.progress),
    },
  });
}

/** Re-measure after webfonts land, so pinned/scrubbed ends are not short. */
export function refreshScrollTriggers(): void {
  ScrollTrigger.refresh();
}
