import type { ReactNode } from 'react';

import { cn } from './cn';

/**
 * Long-form body copy. The typography plugin is not installed, so the rules the
 * design actually needs are declared here with arbitrary variants — fewer
 * classes than a plugin, and every colour is a token.
 *
 * `tone="dark"` is for ink-900 grounds: links flip to `brand-300`, because
 * `brand-700` on dark fails contrast just as badly as `brand-500` on light.
 */
export type ProseTone = 'light' | 'dark';

const toneClass: Record<ProseTone, string> = {
  light: [
    'text-ink-600',
    '[&_strong]:text-ink-900 [&_strong]:font-semibold',
    '[&_a]:text-brand-700 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-ink-900',
  ].join(' '),
  dark: [
    'text-stone-200',
    '[&_strong]:text-stone-50 [&_strong]:font-semibold',
    '[&_a]:text-brand-300 [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-stone-50',
  ].join(' '),
};

const structure = [
  'text-body',
  '[&>*+*]:mt-4',
  '[&_ul]:list-disc [&_ul]:ps-6 [&_ol]:list-decimal [&_ol]:ps-6',
  '[&_li+li]:mt-2',
].join(' ');

export type ProseProps = {
  tone?: ProseTone | undefined;
  className?: string | undefined;
  children: ReactNode;
};

export function Prose({ tone = 'light', className, children }: ProseProps) {
  return <div className={cn(structure, toneClass[tone], className)}>{children}</div>;
}
