import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { cn } from './cn';

/**
 * Reveal-on-scroll, and nothing else. Motion in this build is decorative only.
 *
 * The first render — the one the prerenderer serialises into static HTML — is a
 * plain `<div>` with no inline opacity. That matters: a visitor with JavaScript
 * disabled must still see every word, and a page whose copy is only revealed by
 * script is the same failure mode as the legacy site's text-inside-a-JPEG hero,
 * one layer up. Motion is attached after mount, on the client, as an
 * enhancement.
 *
 * Framer animates in JavaScript, so the global `prefers-reduced-motion` block in
 * theme.css cannot suppress it. `useReducedMotion` is the seam that does.
 */
export type RevealProps = {
  delay?: number | undefined;
  className?: string | undefined;
  children: ReactNode;
};

export function Reveal({ delay = 0, className, children }: RevealProps) {
  const [enabled, setEnabled] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    // `whileInView` is driven by IntersectionObserver. Without it Framer would
    // hold the element at its initial opacity forever, so the content would
    // simply never appear. Staying plain is the correct degradation.
    setEnabled(typeof IntersectionObserver !== 'undefined');
  }, []);

  if (!enabled || prefersReducedMotion) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
