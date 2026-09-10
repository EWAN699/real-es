/**
 * Preset names and the per-type allow-list from contracts/motion.spec.md.
 *
 * `MotionPreset` itself is generated from contracts/content.schema.json, so
 * adding a preset to the schema without handling it in the hook is a type error.
 */
import type { MotionPreset, SectionType } from '@/lib/content.types';

export type { MotionPreset, SectionType };

export const MOTION_PRESETS = [
  'fade-up',
  'pin-reveal',
  'parallax-slow',
  'text-split',
  'horizontal-scroll',
  'none',
] as const satisfies readonly MotionPreset[];

/** Which presets each section type may use. Mirrors the table in motion.spec.md. */
export const ALLOWED_PRESETS: Record<SectionType, readonly MotionPreset[]> = {
  hero: ['pin-reveal', 'text-split', 'none'],
  intro: ['fade-up', 'text-split', 'none'],
  services: ['fade-up', 'horizontal-scroll', 'none'],
  stats: ['fade-up', 'none'],
  showcase: ['horizontal-scroll', 'pin-reveal', 'parallax-slow'],
  coverage: ['fade-up', 'none'],
  process: ['pin-reveal', 'fade-up', 'none'],
  testimonials: ['fade-up', 'horizontal-scroll', 'none'],
  faq: ['fade-up', 'none'],
  cta: ['fade-up', 'parallax-slow', 'none'],
  contact: ['fade-up', 'none'],
};

export function isPresetAllowed(type: SectionType, preset: MotionPreset): boolean {
  return ALLOWED_PRESETS[type]?.includes(preset) ?? false;
}

/** Data-attribute hooks the presets look for inside a section. */
export const MOTION_SELECTORS = {
  /** fade-up: the children that stagger in. */
  animate: '[data-animate]',
  /** text-split: the heading to split into lines. */
  heading: '[data-motion-heading]',
  /** parallax-slow: the layer that moves slower than the page. */
  parallax: '[data-motion-parallax]',
  /** horizontal-scroll: the track that slides. */
  track: '[data-motion-track]',
  /** pin-reveal: the inner states that advance while pinned. */
  step: '[data-motion-step]',
} as const;
