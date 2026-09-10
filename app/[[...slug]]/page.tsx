import { notFound } from 'next/navigation';

import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { getPage, pages, sectionsOf, slugToSegments } from '@/lib/content';
import { pageMetadata } from '@/lib/seo';

type Params = { slug?: string[] };

/** Every route the site has comes from content/pages.json. Nothing else exists. */
export function generateStaticParams(): Params[] {
  return pages.map((page) => ({ slug: slugToSegments(page.slug) }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = getPage(`/${(slug ?? []).join('/')}`);
  return page ? pageMetadata(page) : {};
}

export default async function CatchAllPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const page = getPage(`/${(slug ?? []).join('/')}`);
  if (!page) notFound();

  return (
    <main id="main">
      {sectionsOf(page).map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </main>
  );
}
