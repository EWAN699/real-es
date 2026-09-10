'use client';

/**
 * SCAFFOLD ONLY — Agent A (ui-motion) owns this file from Phase 3B.
 *
 * It renders every section type as the same unstyled block so the app boots,
 * routes resolve and screenshots have something on them before the real
 * sections exist. What it does establish, and what the real components should
 * keep, is the contract with the motion layer:
 *
 *   - one `useScrollAnimation({ preset: section.motion })` per section,
 *   - the returned `ref` on the section root,
 *   - children marked with `data-animate` / `data-motion-heading` /
 *     `data-motion-step` / `data-motion-track` / `data-motion-parallax`,
 *   - no `prefers-reduced-motion` branch in the component.
 */
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Section } from '@/lib/content.types';

export function SectionRenderer({ section }: { section: Section }) {
  const { ref } = useScrollAnimation<HTMLElement>({ preset: section.motion ?? 'none' });

  return (
    <section
      ref={ref}
      id={section.id}
      data-section-type={section.type}
      className="mx-auto w-full max-w-5xl px-6 py-20"
    >
      <h2 data-motion-heading className="text-3xl font-bold text-balance sm:text-5xl">
        {section.heading}
      </h2>

      {section.subheading ? (
        <p data-animate className="mt-3 text-lg text-ink-muted">
          {section.subheading}
        </p>
      ) : null}

      {section.body ? (
        <p data-animate className="mt-6 max-w-prose text-base leading-relaxed">
          {section.body}
        </p>
      ) : null}

      {section.items?.length ? (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2">
          {section.items.map((item) => (
            <li key={item.id} data-animate className="border-s-2 border-line ps-4">
              <h3 className="font-semibold">{item.title}</h3>
              {item.value ? <p className="text-2xl font-bold">{item.value}</p> : null}
              {item.body ? <p className="mt-1 text-sm text-ink-muted">{item.body}</p> : null}
              {item.attribution ? (
                <p className="mt-2 text-sm text-ink-muted">— {item.attribution}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {section.cta ? (
        <p className="mt-10">
          <a
            data-animate
            href={section.cta.href}
            className="inline-block rounded-full bg-accent px-6 py-3 font-semibold text-white"
          >
            {section.cta.label}
          </a>
        </p>
      ) : null}
    </section>
  );
}
