'use client';

/**
 * Dispatches a section to its component by `type`.
 *
 * The map is keyed by every member of `SectionType`, so adding a type to
 * contracts/content.schema.json without building a component for it is a
 * compile error rather than a blank space on the page.
 *
 * Types the content does not currently use still need an entry. They fall back
 * to `Generic`, which renders heading/body/items honestly rather than nothing —
 * a section that exists in content should never silently disappear.
 *
 * Each component owns exactly one `useScrollAnimation` call and supplies the
 * data-attributes its preset needs. None of them branch on reduced motion;
 * that decision lives in the hook (motion.spec.md rule 1).
 */
import type { Section, SectionType } from '@/lib/content.types';

import { CallToAction } from './CallToAction';
import { Contact } from './Contact';
import { Coverage } from './Coverage';
import { Faq } from './Faq';
import { Generic } from './Generic';
import { Hero } from './Hero';
import { Intro } from './Intro';
import { Process } from './Process';
import { Services } from './Services';
import { Showcase } from './Showcase';
import { Stats } from './Stats';
import { Testimonials } from './Testimonials';

interface Props {
  section: Section;
  pageSlug: string;
}

type SectionComponent = (props: Props) => React.ReactElement;

const BY_TYPE: Record<SectionType, SectionComponent> = {
  hero: ({ section }) => <Hero section={section} />,
  intro: ({ section }) => <Intro section={section} />,
  services: ({ section }) => <Services section={section} />,
  stats: ({ section }) => <Stats section={section} />,
  showcase: ({ section }) => <Showcase section={section} />,
  coverage: ({ section }) => <Coverage section={section} />,
  process: ({ section }) => <Process section={section} />,
  testimonials: ({ section }) => <Testimonials section={section} />,
  faq: ({ section }) => <Faq section={section} />,
  cta: ({ section }) => <CallToAction section={section} />,
  contact: ({ section, pageSlug }) => <Contact section={section} pageSlug={pageSlug} />,
};

export function SectionRenderer({ section, pageSlug }: Props) {
  const Component = BY_TYPE[section.type] ?? Generic;
  return <Component section={section} pageSlug={pageSlug} />;
}
