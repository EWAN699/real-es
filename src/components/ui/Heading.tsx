import type { ReactNode } from 'react';

import { cn } from './cn';

/**
 * Heading level and visual size are separate on purpose.
 *
 * The document outline must stay ordered (one `h1`, no skipped levels), but the
 * design sometimes wants an `h3` that reads large. The legacy site solved this
 * backwards — it shipped `h1` at 18px and `h2` at 24px, so the headline was
 * physically smaller than the subhead.
 */
export type HeadingLevel = 1 | 2 | 3 | 4;
export type HeadingSize = 'display' | 'h1' | 'h2' | 'h3';

const sizeClass: Record<HeadingSize, string> = {
  display: 'text-h1 md:text-display',
  h1: 'text-h2 md:text-h1',
  h2: 'text-h3 md:text-h2',
  h3: 'text-h3',
};

const levelSize: Record<HeadingLevel, HeadingSize> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h3',
};

/**
 * Colour is a prop, not something a caller patches in through `className`.
 * Two competing `text-*` utilities in one class attribute are resolved by
 * stylesheet order, not by the order they were written — so an override that
 * looks right in the JSX can silently lose.
 */
export type HeadingTone = 'light' | 'dark' | 'inherit';

const toneClass: Record<HeadingTone, string> = {
  light: 'text-ink-900',
  dark: 'text-stone-50',
  inherit: '',
};

export type HeadingProps = {
  level: HeadingLevel;
  size?: HeadingSize | undefined;
  tone?: HeadingTone | undefined;
  id?: string | undefined;
  className?: string | undefined;
  children: ReactNode;
};

export function Heading({ level, size, tone = 'light', id, className, children }: HeadingProps) {
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4';

  return (
    <Tag
      id={id}
      className={cn(toneClass[tone], sizeClass[size ?? levelSize[level]], className)}
    >
      {children}
    </Tag>
  );
}
