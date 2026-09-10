'use client';

/**
 * process — motion `pin-reveal`. The second and last one allowed on the page.
 *
 * Six steps, so the pin is deliberately short per step: six full viewports of
 * scroll would be the single most tiring thing on the site. 0.55 keeps the
 * whole package under about three and a half screens.
 *
 * The I4 image is a single frame split down the exact centre — tired room on
 * one side, renovated on the other — and Phase 3A verified the seam lands at
 * 50%. So the reveal is driven by clipping the renovated half in from the seam
 * using `--motion-progress`, which the hook writes on the section root while
 * the pin scrubs. Under reduced motion the hook never writes past 0, so the
 * fallback below pins the clip at a static 50% and the user sees the honest
 * before-and-after with no movement at all.
 */
import { Picture } from '@/components/media/Picture';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Section } from '@/lib/content.types';

export function Process({ section }: { section: Section }) {
  const { ref, mode } = useScrollAnimation<HTMLElement>({
    preset: section.motion ?? 'pin-reveal',
    stepLength: 0.55,
  });
  const frame = section.media[0];

  return (
    <section
      ref={ref}
      id={section.id}
      data-section-type={section.type}
      className="section-dark flex min-h-svh items-center py-24"
    >
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div>
          <h2 className="rule-brass text-3xl font-bold tracking-tight text-balance sm:text-5xl">
            {section.heading}
          </h2>
          {section.subheading ? (
            <p className="mt-4 text-lg text-ink-muted">{section.subheading}</p>
          ) : null}

          <div className="motion-steps mt-12">
            {section.items?.map((item, i) => (
              <article key={item.id} data-motion-step className="border-t border-line pt-6">
                <span className="numeral text-sm font-semibold text-accent-text">
                  {String(i + 1).padStart(2, '0')} / {String(section.items?.length ?? 0)}
                </span>
                <h3 className="mt-3 text-2xl leading-snug font-bold text-balance">{item.title}</h3>
                {item.body ? (
                  <p className="mt-3 text-base leading-relaxed text-ink-muted">{item.body}</p>
                ) : null}
              </article>
            ))}
          </div>

          <div className="motion-progress mt-10" role="presentation" />
        </div>

        {frame ? (
          <div className="relative lg:sticky lg:top-28">
            <Picture
              media={frame}
              ratio="16 / 9"
              className="rounded-lg"
              sizes="(max-width: 1024px) 100vw, 32rem"
            />
            {/* The wipe: an ink veil retreating from the seam as the pin scrubs.
                At progress 0 it covers the renovated half; at 1 it is gone. */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-lg bg-ink/70 transition-none"
              style={{
                clipPath:
                  mode === 'animated'
                    ? 'inset(0 0 0 calc(50% + var(--motion-progress, 0) * 50%))'
                    : 'inset(0 0 0 50%)',
              }}
            />
          </div>
        ) : null}
      </div>
    </section>
  );
}
