import { describe, expect, it } from 'vitest';

import { contact, telHref, whatsappHref } from '@/content/contact';
import { dealTypeLabels, legacyDealTerms, listings } from '@/content/listings';
import { hasRealDate, hasRealExcerpt, PENDING_DATE, posts } from '@/content/posts';
import { services } from '@/content/services';
import { confirmedStats, stats } from '@/content/stats';
import { testimonialLegacyPaths, testimonials } from '@/content/testimonials';
import { listingSchema, postSchema, serviceSchema, testimonialSchema } from '@/content/types';

/**
 * The content modules already parse themselves through their schemas at import
 * time, so a shape violation fails the build. What is tested here is the part a
 * schema cannot express: the honesty rules.
 */

describe('every module parses', () => {
  it.each([
    ['services', serviceSchema, services],
    ['listings', listingSchema, listings],
    ['testimonials', testimonialSchema, testimonials],
    ['posts', postSchema, posts],
  ] as const)('%s', (_label, schema, records) => {
    for (const record of records) expect(schema.safeParse(record).success).toBe(true);
  });

  it('has unique slugs within each collection', () => {
    const collections = [
      services.map((s) => s.slug),
      listings.map((l) => l.slug),
      testimonials.map((t) => t.slug),
      posts.map((p) => `${p.kind}/${p.slug}`),
    ];
    for (const slugs of collections) expect(new Set(slugs).size).toBe(slugs.length);
  });
});

describe('unverifiable figures are withheld', () => {
  it('publishes no track-record counter until the client confirms it', () => {
    // The legacy counters contradict the site's own body copy (7 years against
    // "over ten"; 69 against a 9.6 survey score). Nothing here may render.
    expect(confirmedStats).toEqual([]);
  });

  it('keeps the contradicted figures on record rather than deleting or fixing them', () => {
    expect(stats.map((stat) => stat.id)).toContain('years');
    expect(stats.find((stat) => stat.id === 'years')?.value).toBe(7);
    expect(stats.find((stat) => stat.id === 'survey-score')?.value).toBe(69);
  });
});

describe('listings', () => {
  it('omits price entirely rather than carrying a placeholder', () => {
    for (const listing of listings) {
      expect(listing).not.toHaveProperty('price', 0);
      if ('price' in listing && listing.price) expect(listing.price.amount).toBeGreaterThan(0);
    }
  });

  it('never claims imagery it does not have', () => {
    // AI-generated photography must never depict a specific marketed property,
    // and the legacy photographs are not ours to rehost.
    for (const listing of listings) expect(listing.gallery).toEqual([]);
  });

  it('is flagged for client review, because we rewrote the titles', () => {
    for (const listing of listings) expect(listing.needsReview).toBe(true);
  });

  it('drops the keyword stuffing from titles', () => {
    for (const listing of listings) {
      expect(listing.title.length).toBeLessThanOrEqual(60);
      expect(listing.title).not.toContain('|');
      // The legacy titles opened with the company name and the service.
      expect(listing.title.startsWith('קיסר ניהול נכסים')).toBe(false);
    }
  });

  it('maps all five legacy taxonomy terms onto the deal enum', () => {
    expect(Object.keys(legacyDealTerms)).toHaveLength(5);
    for (const deal of Object.values(legacyDealTerms)) {
      expect(dealTypeLabels[deal]).toBeTruthy();
    }
  });
});

describe('services', () => {
  it('marks migrated copy as migrated and drafted copy as drafted', () => {
    const migrated = services.filter((service) => !service.needsReview).map((s) => s.slug);
    // Exactly the two divisions whose descriptions the homepage printed in full.
    expect(migrated.sort()).toEqual(['construction', 'property-management']);
  });

  it('writes titles for people, not for a keyword list', () => {
    for (const service of services) {
      expect(service.title).not.toContain('|');
      expect(service.title.length).toBeLessThanOrEqual(40);
    }
  });

  it('records the legacy URL of every page it replaces', () => {
    for (const service of services) {
      expect(service.legacyPaths.length).toBeGreaterThan(0);
      for (const path of service.legacyPaths) expect(path.startsWith('/')).toBe(true);
    }
  });
});

describe('testimonials', () => {
  it('keeps only complete quotes unflagged', () => {
    for (const testimonial of testimonials) {
      // A quote that ends mid-sentence must not be presented as finished copy.
      if (!testimonial.needsReview) expect(testimonial.quote).not.toMatch(/[…]$/);
    }
  });

  it('has a legacy permalink for every entry', () => {
    for (const testimonial of testimonials) {
      expect(testimonialLegacyPaths[testimonial.slug]).toBeTruthy();
    }
    expect(Object.keys(testimonialLegacyPaths)).toHaveLength(testimonials.length);
  });
});

describe('posts', () => {
  it('flags every archive entry: we have titles and nothing else', () => {
    for (const post of posts) expect(post.needsReview).toBe(true);
  });

  it('uses an unmistakable sentinel instead of a plausible fake date', () => {
    expect(PENDING_DATE).toBe('1900-01-01');
    for (const post of posts) expect(hasRealDate(post)).toBe(false);
  });

  it('does not invent teasers', () => {
    for (const post of posts) expect(hasRealExcerpt(post)).toBe(false);
  });

  it('trims the pipe-separated keyword stacks out of titles', () => {
    for (const post of posts) expect(post.title).not.toContain('|');
  });
});

describe('contact', () => {
  it('exposes the numbers printed on the client homepage', () => {
    expect(contact.nationalPhone.replace(/\D/g, '')).toBe('1599556655');
    expect(contact.directPhone.replace(/\D/g, '')).toBe('0525416313');
    expect(contact.email).toBe('info@caesar.co.il');
  });

  it('builds tel: and wa.me links', () => {
    expect(telHref(contact.directPhone)).toBe('tel:+972525416313');
    expect(telHref(contact.nationalPhone)).toBe('tel:1599556655');
    expect(whatsappHref()).toBe('https://wa.me/972525416313');
    expect(whatsappHref('שלום')).toContain('?text=');
  });
});
