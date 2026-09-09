// @vitest-environment node
/**
 * The manifest is prose, and prose rots. These tests hold the three things that
 * would otherwise rot silently:
 *
 *  · the set reads as one shoot — every prompt carries the house style, and no
 *    prompt is allowed to invite lettering the model would render as garbage;
 *  · alt text stays Hebrew, hand-written and descriptive rather than stuffed;
 *  · every slug the UI actually asks for exists here, and nothing here stands in
 *    for a specific marketed property.
 */

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { listings } from '@/content/listings';
import { services } from '@/content/services';
import { posts } from '@/content/posts';
import { divisionNav } from '@/components/layout/nav';

import { ASPECT_RATIOS, PROMPT_MAX_CHARS, REPO_ROOT } from './config';
import {
  composeNegativePrompt,
  composePrompt,
  groupIntoWaves,
  hashSlot,
  imageManifest,
  loadManifest,
  orderSlots,
  validateManifest,
  type ImageSlot,
} from './manifest';
import { GLOBAL_NEGATIVE, HOUSE_STYLE } from '../../content/images.manifest';

const slugs = new Set(imageManifest.map((slot) => slot.slug));

function slotFor(slug: string): ImageSlot {
  const slot = imageManifest.find((candidate) => candidate.slug === slug);
  if (!slot) throw new Error(`no slot ${slug}`);
  return slot;
}

describe('the manifest is valid', () => {
  it('passes its own validator', () => {
    expect(validateManifest()).toEqual([]);
    expect(() => loadManifest()).not.toThrow();
  });

  it('covers the whole site with a bounded set of slots', () => {
    expect(imageManifest.length).toBeGreaterThanOrEqual(20);
    expect(imageManifest.length).toBeLessThanOrEqual(40);
  });

  it('names an aspect the registry can render', () => {
    for (const slot of imageManifest) {
      expect(Object.keys(ASPECT_RATIOS)).toContain(slot.aspect);
    }
  });

  it('catches a broken slot rather than generating it', () => {
    const problems = validateManifest([
      {
        slug: 'Not Kebab Case',
        prompt: '',
        aspect: '16:9',
        count: 0,
        alt: 'no hebrew here',
        referenceSlug: 'nowhere',
      } as unknown as ImageSlot,
    ]);

    expect(problems.join('\n')).toMatch(/kebab-case/);
    expect(problems.join('\n')).toMatch(/empty prompt/);
    expect(problems.join('\n')).toMatch(/count must be/);
    expect(problems.join('\n')).toMatch(/not Hebrew/);
    expect(problems.join('\n')).toMatch(/not in the manifest/);
  });

  it('refuses a slot that would depict a specific marketed property', () => {
    const problems = validateManifest([
      {
        slug: 'listing-rothschild-penthouse',
        prompt: 'the penthouse at Rothschild 12',
        aspect: '4:3',
        count: 1,
        alt: 'פנטהאוז',
      },
    ]);

    expect(problems.join('\n')).toMatch(/misleading/);
  });

  it('refuses a reference cycle instead of hanging on it', () => {
    const problems = validateManifest([
      { slug: 'a', prompt: 'a', aspect: '1:1', count: 1, alt: 'א', referenceSlug: 'b' },
      { slug: 'b', prompt: 'b', aspect: '1:1', count: 1, alt: 'ב', referenceSlug: 'a' },
    ]);

    expect(problems.join('\n')).toMatch(/reference cycle/);
  });
});

describe('the set reads as one commissioned shoot', () => {
  it('appends the same house style to every prompt', () => {
    for (const slot of imageManifest) {
      const prompt = composePrompt(slot);
      expect(prompt.endsWith(HOUSE_STYLE)).toBe(true);
      expect(prompt.length).toBeLessThanOrEqual(PROMPT_MAX_CHARS);
    }
  });

  it('states one lens, one hour and one grade', () => {
    expect(HOUSE_STYLE).toMatch(/35mm/);
    expect(HOUSE_STYLE).toMatch(/before sunset/);
    expect(HOUSE_STYLE).toMatch(/limestone/);
    expect(HOUSE_STYLE).toMatch(/olive/);
  });

  it('pins the look of the wider set to one reference frame', () => {
    const referencing = imageManifest.filter((slot) => slot.referenceSlug);
    expect(referencing.length).toBeGreaterThan(5);
    for (const slot of referencing) {
      expect(slugs.has(slot.referenceSlug ?? '')).toBe(true);
    }
  });
});

describe('no image carries lettering', () => {
  /**
   * Kling renders Hebrew as convincing-looking nonsense. A Hebrew site showing
   * nonsense Hebrew signage is worse than one showing none, so the ban is global
   * rather than per-slot.
   */
  it('suppresses every form of type in the global negative prompt', () => {
    for (const term of [
      'text',
      'lettering',
      'signage',
      'street signs',
      'house numbers',
      'license plates',
      'watermark',
      'hebrew script',
    ]) {
      expect(GLOBAL_NEGATIVE).toContain(term);
    }
  });

  it('applies it to every slot, whatever else that slot excludes', () => {
    for (const slot of imageManifest) {
      const negative = composeNegativePrompt(slot);
      expect(negative.startsWith(GLOBAL_NEGATIVE)).toBe(true);
      expect(negative.length).toBeLessThanOrEqual(PROMPT_MAX_CHARS);
    }
  });

  it('asks for no lettering in any prompt either', () => {
    for (const slot of imageManifest) {
      expect(slot.prompt.toLowerCase()).not.toMatch(
        /\b(sign|signage|billboard|poster|banner|logo|label)\b/,
      );
    }
  });
});

describe('alt text', () => {
  it('is Hebrew and describes the frame, for every non-decorative slot', () => {
    for (const slot of imageManifest.filter((candidate) => !candidate.decorative)) {
      expect(slot.alt).toMatch(/[֐-׿]/);
      expect(slot.alt.length).toBeGreaterThan(10);
      expect(slot.alt.length).toBeLessThanOrEqual(160);
    }
  });

  it('is empty on decorative slots, so assistive tech skips them', () => {
    const decorative = imageManifest.filter((slot) => slot.decorative);
    expect(decorative.length).toBeGreaterThan(0);
    for (const slot of decorative) expect(slot.alt).toBe('');
  });

  it('is not the keyword soup the legacy site used', () => {
    for (const slot of imageManifest) {
      // The legacy pattern: the same phrase repeated with a city bolted on.
      const occurrences = slot.alt.split('ניהול נכסים').length - 1;
      expect(occurrences).toBeLessThanOrEqual(1);
      expect(slot.alt).not.toContain('|');
    }
  });

  it('says outright that the generic fallback is not a photograph of a property', () => {
    expect(slotFor('fallback-city-generic').alt).toContain('לא תצלום של נכס');
  });
});

describe('every slug the UI asks for is in the manifest', () => {
  /**
   * The UI addresses images by slug and `getMedia` is total, so a missing slug
   * is invisible at runtime — a silently empty frame rather than an error. This
   * is the only thing that catches it.
   */
  const sourceRoot = path.join(REPO_ROOT, 'src');

  const sourceFiles = readdirSync(sourceRoot, { recursive: true, encoding: 'utf8' })
    .filter((entry) => entry.endsWith('.ts') || entry.endsWith('.tsx'))
    .filter((entry) => !entry.endsWith('.test.ts') && !entry.endsWith('.test.tsx'))
    .map((entry) => path.join(sourceRoot, entry));

  const requested = new Map<string, string>();
  for (const file of sourceFiles) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(/\bslug=["']([a-z0-9-]+)["']/g)) {
      requested.set(match[1] as string, path.relative(REPO_ROOT, file));
    }
    for (const match of source.matchAll(/\bgetMedia\(\s*["']([a-z0-9-]+)["']/g)) {
      requested.set(match[1] as string, path.relative(REPO_ROOT, file));
    }
  }

  it('finds slugs to check in the first place', () => {
    expect(requested.size).toBeGreaterThan(0);
  });

  it('has a slot for every slug a component names', () => {
    const missing = [...requested].filter(([slug]) => !slugs.has(slug));
    expect(missing).toEqual([]);
  });

  it('has a slot for every division image the navigation names', () => {
    for (const item of divisionNav) expect(slugs.has(item.imageSlug)).toBe(true);
  });

  it('has a slot for every service and post image the content layer names', () => {
    for (const service of services) {
      if (service.image) expect(slugs.has(service.image)).toBe(true);
    }
    for (const post of posts) {
      if (post.image) expect(slugs.has(post.image)).toBe(true);
    }
  });

  it('offers a slot named after every service, so a page can claim one', () => {
    // Ten service slots replace the legacy icon PNGs. They are named after the
    // service slug so wiring one up needs no lookup table.
    const serviceSlots = imageManifest.filter((slot) => slot.slug.startsWith('service-'));
    expect(serviceSlots.length).toBeGreaterThanOrEqual(10);

    for (const slot of serviceSlots) {
      const serviceSlug = slot.slug.replace(/^service-/, '');
      expect(services.map((service) => service.slug)).toContain(serviceSlug);
    }
  });
});

describe('the honesty constraint', () => {
  it('leaves listing galleries to real photography', () => {
    for (const listing of listings) {
      expect(listing.gallery).toEqual([]);
      for (const slug of listing.gallery) expect(slugs.has(slug)).toBe(false);
    }
  });

  it('generates no portrait of a real colleague', () => {
    for (const slot of imageManifest) {
      expect(slot.slug.startsWith('portrait-')).toBe(false);
      expect(slot.slug.startsWith('team-')).toBe(false);
    }
  });
});

describe('hashing and ordering', () => {
  it('changes the hash when the prompt changes, and not when a comment does', () => {
    const slot = slotFor('division-management');
    const parameters = { model: 'kling-v2-1', resolution: '2k' };

    const base = hashSlot(slot, parameters);
    expect(hashSlot({ ...slot, note: 'a different note' }, parameters)).toBe(base);
    expect(hashSlot({ ...slot, alt: 'טקסט חלופי אחר לגמרי' }, parameters)).toBe(base);
    expect(hashSlot({ ...slot, prompt: `${slot.prompt} at night` }, parameters)).not.toBe(base);
    expect(hashSlot({ ...slot, seed: 42 }, parameters)).not.toBe(base);
    expect(hashSlot(slot, { ...parameters, model: 'kling-v2' })).not.toBe(base);
  });

  it('puts a referenced slot before the slot that references it', () => {
    const ordered = orderSlots(imageManifest).map((slot) => slot.slug);

    for (const slot of imageManifest) {
      if (!slot.referenceSlug) continue;
      expect(ordered.indexOf(slot.referenceSlug)).toBeLessThan(ordered.indexOf(slot.slug));
    }
  });

  it('groups slots into waves, so concurrency cannot race a reference', () => {
    const waves = groupIntoWaves(imageManifest);
    const depthBySlug = new Map<string, number>();
    waves.forEach((wave, depth) => wave.forEach((slot) => depthBySlug.set(slot.slug, depth)));

    expect(waves.length).toBeGreaterThan(1);
    for (const slot of imageManifest) {
      if (!slot.referenceSlug) continue;
      expect(depthBySlug.get(slot.referenceSlug)).toBeLessThan(depthBySlug.get(slot.slug) ?? 0);
    }
  });
});
