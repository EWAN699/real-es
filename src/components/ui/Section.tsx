import type { ReactNode } from 'react';

import { cn } from './cn';
import { Container } from './Container';
import type { ContainerWidth } from './Container';

/**
 * A labelled page band. Every section is a real `<section>` with an accessible
 * name, so the landmark list a screen-reader user navigates by is meaningful
 * rather than a run of unnamed regions.
 *
 * Pass `labelledBy` (the id of the heading inside) or `label` for a section
 * whose heading is visual only.
 */
export type SectionTone = 'default' | 'contrast' | 'dark' | 'brand';
export type SectionSpacing = 'sm' | 'md' | 'lg';

const toneClass: Record<SectionTone, string> = {
  default: 'bg-stone-100 text-ink-900',
  contrast: 'bg-stone-50 text-ink-900',
  dark: 'bg-ink-900 text-stone-100',
  brand: 'bg-brand-500 text-ink-900',
};

const spacingClass: Record<SectionSpacing, string> = {
  sm: 'py-12 md:py-16',
  md: 'py-16 md:py-24',
  lg: 'py-20 md:py-32',
};

export type SectionProps = {
  id?: string | undefined;
  tone?: SectionTone | undefined;
  spacing?: SectionSpacing | undefined;
  width?: ContainerWidth | undefined;
  /** Id of the heading that names this section. */
  labelledBy?: string | undefined;
  /** Accessible name for a section with no visible heading. */
  label?: string | undefined;
  className?: string | undefined;
  containerClassName?: string | undefined;
  children: ReactNode;
};

export function Section({
  id,
  tone = 'default',
  spacing = 'md',
  width = 'default',
  labelledBy,
  label,
  className,
  containerClassName,
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      className={cn(toneClass[tone], spacingClass[spacing], className)}
    >
      <Container width={width} className={containerClassName}>
        {children}
      </Container>
    </section>
  );
}
