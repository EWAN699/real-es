/**
 * Metadata, canonical URLs and the OG image URL — all derived from
 * content/pages.json, so adding a page to the content file adds it to the
 * sitemap and gives it correct metadata with no further edit.
 */
import type { Metadata } from 'next';

import { normaliseSlug, pages, site, type Page } from '@/lib/content';

/** Canonical origin. Set NEXT_PUBLIC_SITE_URL in the deploy environment. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return raw.replace(/\/+$/, '');
}

export function absoluteUrl(pathname: string): string {
  const p = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${siteUrl()}${p === '/' ? '' : p}`;
}

export function ogImageUrl(slug: string): string {
  const u = new URL('/api/og', siteUrl());
  u.searchParams.set('slug', normaliseSlug(slug));
  return u.toString();
}

/** Metadata shared by every route; merged into by each page. */
export function rootMetadata(): Metadata {
  const home = pages.find((p) => normaliseSlug(p.slug) === '/');
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: home?.title ?? site.name,
      template: `%s | ${site.name}`,
    },
    description: site.description,
    applicationName: site.name,
    generator: 'Next.js',
    robots: { index: true, follow: true },
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: site.name,
      locale: site.locale,
      url: siteUrl(),
      title: home?.title ?? site.name,
      description: site.description,
      images: [{ url: ogImageUrl('/'), width: 1200, height: 630, alt: site.tagline }],
    },
    twitter: {
      card: 'summary_large_image',
      title: home?.title ?? site.name,
      description: site.description,
      images: [ogImageUrl('/')],
    },
    formatDetection: { telephone: true, address: false, email: true },
  };
}

export function pageMetadata(page: Page): Metadata {
  const slug = normaliseSlug(page.slug);
  const isHome = slug === '/';
  return {
    // The root template appends the site name; the home page already is it.
    title: isHome ? { absolute: page.title } : page.title,
    description: page.metaDescription,
    alternates: { canonical: slug },
    openGraph: {
      type: 'website',
      siteName: site.name,
      locale: site.locale,
      url: absoluteUrl(slug),
      title: page.title,
      description: page.metaDescription,
      images: [{ url: ogImageUrl(slug), width: 1200, height: 630, alt: page.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: page.title,
      description: page.metaDescription,
      images: [ogImageUrl(slug)],
    },
  };
}

/** JSON-LD for the organisation, emitted once in the root layout. */
export function organisationJsonLd(): string {
  const contact = site.contact;
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    name: site.name,
    description: site.description,
    slogan: site.tagline,
    url: siteUrl(),
    ...(contact?.phones?.length ? { telephone: contact.phones } : {}),
    ...(contact?.emails?.length ? { email: contact.emails } : {}),
    ...(contact?.address
      ? { address: { '@type': 'PostalAddress', streetAddress: contact.address } }
      : {}),
    ...(contact?.social?.length ? { sameAs: contact.social.map((s) => s.href) } : {}),
  });
}
