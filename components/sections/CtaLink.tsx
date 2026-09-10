/**
 * The one call-to-action control, in three weights.
 *
 * `tel:` links are the primary conversion on this site, so the label is kept
 * as authored (it is often the number itself) and the phone number inside it
 * is isolated for bidi — a Latin-digit phone number inside RTL Hebrew renders
 * with its parts reordered otherwise, which on a phone number is not cosmetic.
 */
import type { Cta } from '@/lib/content.types';

const STYLES = {
  primary:
    'bg-brass text-ink hover:bg-brass-lift focus-visible:bg-brass-lift border border-transparent',
  secondary:
    'bg-transparent text-current border border-current hover:border-brass hover:text-accent-text',
  ghost: 'bg-transparent text-current border border-transparent hover:text-accent-text underline',
} as const;

export function CtaLink({ cta, className }: { cta: Cta; className?: string }) {
  const tone = STYLES[cta.style ?? 'primary'];
  const isTel = cta.href.startsWith('tel:');

  return (
    <a
      href={cta.href}
      className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold transition-colors ${tone} ${className ?? ''}`}
    >
      <span className={isTel ? 'numeral' : undefined}>{cta.label}</span>
    </a>
  );
}
