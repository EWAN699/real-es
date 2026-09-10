'use client';

/**
 * services — motion `horizontal-scroll`. Exactly one per page (motion.spec.md).
 *
 * Structure the preset requires:
 *   [data-motion-viewport]  the clipping window
 *   [data-motion-track]     the row that slides
 *   .motion-progress        the visible indicator the spec mandates
 *
 * The hook drives the track and writes `--motion-progress` on the section root
 * in BOTH modes — animated, and the degraded overflow row under reduced motion,
 * where it follows the user's own swiping. So the indicator is wired once here
 * and is correct either way.
 *
 * RTL is handled inside the hook (it translates positive-x in RTL). This
 * component must only avoid hard-coding a direction, which it does by using
 * logical properties throughout.
 *
 * The lead card is the I2 corridor image — the track opens on a picture of the
 * unglamorous work before it lists the services, which is the argument the
 * section is making.
 */
import { Picture } from '@/components/media/Picture';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Section } from '@/lib/content.types';

export function Services({ section }: { section: Section }) {
  const { ref } = useScrollAnimation<HTMLElement>({
    preset: section.motion ?? 'horizontal-scroll',
  });
  const lead = section.media[0];

  return (
    <section
      ref={ref}
      id={section.id}
      data-section-type={section.type}
      className="section-stone flex min-h-svh flex-col justify-center overflow-hidden py-20"
    >
      <div className="mx-auto w-full max-w-6xl px-6">
        <h2 className="rule-brass text-3xl font-bold tracking-tight text-balance sm:text-5xl">
          {section.heading}
        </h2>
        {section.subheading ? (
          <p className="mt-4 max-w-xl text-lg text-ink-muted">{section.subheading}</p>
        ) : null}
      </div>

      <div data-motion-viewport className="mt-14">
        <ul data-motion-track className="gap-6 px-6 ps-[max(1.5rem,calc(50vw-36rem))] pb-2">
          {lead ? (
            <li className="w-[78vw] shrink-0 sm:w-[38vw] lg:w-[26rem]">
              <Picture
                media={lead}
                ratio="4 / 5"
                className="h-full rounded-lg"
                sizes="(max-width: 640px) 78vw, 26rem"
              />
            </li>
          ) : null}

          {section.items?.map((item, i) => (
            <li
              key={item.id}
              className="flex w-[78vw] shrink-0 flex-col border-t border-line pt-6 sm:w-[38vw] lg:w-[24rem]"
            >
              <span className="numeral text-sm font-semibold text-accent-text">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-3 text-xl leading-snug font-bold text-balance">{item.title}</h3>
              {item.body ? (
                <p className="mt-3 text-base leading-relaxed text-ink-muted">{item.body}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto mt-10 w-full max-w-6xl px-6">
        <div className="motion-progress" role="presentation" />
        <p className="visually-hidden">גללו לצדדים כדי לראות את כל תחומי הניהול.</p>
      </div>
    </section>
  );
}
