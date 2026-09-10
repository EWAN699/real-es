/**
 * The typed content layer.
 *
 * `content/pages.json` is validated against `contracts/content.schema.json`
 * with Ajv the first time this module is imported. Because every page, the
 * sitemap and the metadata all import it, that validation runs during
 * `next build` and a schema error fails the build. `scripts/validate-content.ts`
 * runs the same gate from `prebuild` so the failure is legible before Next
 * starts compiling.
 *
 * Two gates live here:
 *   1. SCHEMA GATE      — always on. Any violation throws.
 *   2. PLACEHOLDER GATE — on for production builds. Any media carrying
 *                         `origin: "placeholder"` throws, per contracts/assets.md.
 *                         Escape hatch: ALLOW_PLACEHOLDER_MEDIA=1, for the
 *                         pre-asset phase only. The deploy pipeline must not set it.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { Ajv2020, type ErrorObject } from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

import { ContentValidationError } from './content-error';

import type {
  Cta,
  Item,
  Media,
  MotionPreset,
  Page,
  Section,
  SectionType,
  SiteContent,
} from './content.types';

export type { Cta, Item, Media, MotionPreset, Page, Section, SectionType, SiteContent };

const ROOT = process.cwd();
const SCHEMA_PATH = path.join(ROOT, 'contracts/content.schema.json');
const CONTENT_PATH = path.join(ROOT, 'content/pages.json');

export { ContentValidationError };

function formatAjvError(err: ErrorObject): string {
  const where = err.instancePath || '(root)';
  const extra =
    err.keyword === 'additionalProperties'
      ? ` (unexpected property "${(err.params as { additionalProperty?: string }).additionalProperty}")`
      : err.keyword === 'enum'
        ? ` (allowed: ${JSON.stringify((err.params as { allowedValues?: unknown[] }).allowedValues)})`
        : '';
  return `  ${where} ${err.message}${extra}`;
}

/**
 * True when this run must not tolerate placeholder media.
 *
 * This is a gate on PRODUCING a build, not on serving one. `next build` and
 * `next start` both run with NODE_ENV=production, so NODE_ENV cannot tell them
 * apart; next.config.ts stamps CONTENT_GATE=production when Next reports the
 * production-build phase, and `npm run build` sets it too so the gate does not
 * depend on that propagation alone.
 *
 * A server running a build that was already allowed through must not 500 on
 * every request because a placeholder is still in the content — the decision
 * was made at build time and stands.
 *
 * `ALLOW_PLACEHOLDER_MEDIA=1` (what `npm run build:draft` sets) suspends the
 * gate for the pre-asset phase. Safe by default, permissive only on request;
 * the deploy pipeline must never set it.
 */
export function placeholderGateActive(): boolean {
  if (process.env.ALLOW_PLACEHOLDER_MEDIA === '1') return false;
  return process.env.CONTENT_GATE === 'production';
}

/** Every media object in the tree, with a human-readable path to it. */
function walkMedia(content: SiteContent): Array<{ at: string; media: Media }> {
  const out: Array<{ at: string; media: Media }> = [];
  for (const page of content.pages) {
    for (const section of page.sections) {
      for (const [i, media] of (section.media ?? []).entries()) {
        out.push({ at: `${page.slug} › ${section.id} › media[${i}] (${media.id})`, media });
      }
      for (const item of section.items ?? []) {
        if (item.media) {
          out.push({
            at: `${page.slug} › ${section.id} › item ${item.id} › media (${item.media.id})`,
            media: item.media,
          });
        }
      }
    }
  }
  return out;
}

/**
 * Checks the schema cannot express: duplicate slugs, duplicate section ids
 * within a page, and motion presets used on a section type that
 * contracts/motion.spec.md does not allow them on.
 */
const ALLOWED_PRESETS: Record<SectionType, readonly MotionPreset[]> = {
  hero: ['pin-reveal', 'text-split', 'none'],
  intro: ['fade-up', 'text-split', 'none'],
  services: ['fade-up', 'horizontal-scroll', 'none'],
  stats: ['fade-up', 'none'],
  showcase: ['horizontal-scroll', 'pin-reveal', 'parallax-slow'],
  coverage: ['fade-up', 'none'],
  process: ['pin-reveal', 'fade-up', 'none'],
  testimonials: ['fade-up', 'horizontal-scroll', 'none'],
  faq: ['fade-up', 'none'],
  cta: ['fade-up', 'parallax-slow', 'none'],
  contact: ['fade-up', 'none'],
};

function crossFieldErrors(content: SiteContent): string[] {
  const errors: string[] = [];
  const seenSlugs = new Set<string>();

  for (const page of content.pages) {
    if (seenSlugs.has(page.slug)) errors.push(`  duplicate page slug "${page.slug}"`);
    seenSlugs.add(page.slug);

    const seenSections = new Set<string>();
    let pins = 0;
    let horizontals = 0;

    for (const section of page.sections) {
      if (seenSections.has(section.id)) {
        errors.push(`  ${page.slug}: duplicate section id "${section.id}"`);
      }
      seenSections.add(section.id);

      const preset = section.motion ?? 'none';
      const allowed = ALLOWED_PRESETS[section.type];
      if (allowed && !allowed.includes(preset)) {
        errors.push(
          `  ${page.slug} › ${section.id}: motion "${preset}" is not allowed on type "${section.type}" (allowed: ${allowed.join(', ')}) — contracts/motion.spec.md`,
        );
      }
      if (preset === 'pin-reveal') pins += 1;
      if (preset === 'horizontal-scroll') horizontals += 1;
    }

    if (pins > 2)
      errors.push(
        `  ${page.slug}: ${pins} pin-reveal sections; contracts/motion.spec.md allows at most 2`,
      );
    if (horizontals > 1) {
      errors.push(
        `  ${page.slug}: ${horizontals} horizontal-scroll sections; contracts/motion.spec.md allows exactly 1`,
      );
    }
  }

  if (!content.pages.some((p) => p.slug === '/')) errors.push('  no page has slug "/"');
  return errors;
}

function loadAndValidate(): SiteContent {
  let raw: string;
  let schemaRaw: string;
  try {
    raw = readFileSync(CONTENT_PATH, 'utf8');
  } catch {
    throw new ContentValidationError(`content/pages.json is missing at ${CONTENT_PATH}`, []);
  }
  try {
    schemaRaw = readFileSync(SCHEMA_PATH, 'utf8');
  } catch {
    throw new ContentValidationError(
      `contracts/content.schema.json is missing at ${SCHEMA_PATH}`,
      [],
    );
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (err) {
    throw new ContentValidationError(
      `content/pages.json is not valid JSON: ${(err as Error).message}`,
      [],
    );
  }

  const ajv = new Ajv2020({ allErrors: true, strict: false, allowUnionTypes: true });
  addFormats(ajv);
  const validate = ajv.compile(JSON.parse(schemaRaw));

  if (!validate(data)) {
    const details = (validate.errors ?? []).map(formatAjvError);
    throw new ContentValidationError(
      `content/pages.json failed contracts/content.schema.json (${details.length} error${details.length === 1 ? '' : 's'})`,
      details,
    );
  }

  const content = data as SiteContent;

  const cross = crossFieldErrors(content);
  if (cross.length) {
    throw new ContentValidationError(
      `content/pages.json broke a contract rule the schema cannot express (${cross.length})`,
      cross,
    );
  }

  if (placeholderGateActive()) {
    const placeholders = walkMedia(content).filter((m) => m.media.origin === 'placeholder');
    if (placeholders.length) {
      throw new ContentValidationError(
        `${placeholders.length} media asset${placeholders.length === 1 ? '' : 's'} still carry origin: "placeholder"; contracts/assets.md forbids shipping them`,
        [
          ...placeholders.map((p) => `  ${p.at}`),
          '',
          '  Replace each with a real asset and set origin to "kling" or "original-site".',
          '  To build anyway during the pre-asset phase: npm run build:draft',
        ],
      );
    }
  } else {
    const placeholders = walkMedia(content).filter((m) => m.media.origin === 'placeholder');
    if (placeholders.length) {
      console.warn(
        `[content] ${placeholders.length} placeholder asset(s) present. A production build will reject them.`,
      );
    }
  }

  return content;
}

/**
 * Validated site content. Module-scope so the gates run once, at import time —
 * which during `next build` means at build time.
 */
export const content: SiteContent = loadAndValidate();

export const site = content.site;
export const pages = content.pages;

/** Sections sorted by `order`, which is authoritative over array position. */
export function sectionsOf(page: Page): Section[] {
  return [...page.sections].sort((a, b) => a.order - b.order);
}

export function getPage(slug: string): Page | undefined {
  const normalised = normaliseSlug(slug);
  return pages.find((p) => normaliseSlug(p.slug) === normalised);
}

/** "/" stays "/", everything else loses its trailing slash. */
export function normaliseSlug(slug: string): string {
  const decoded = decodeURIComponent(slug);
  const withLead = decoded.startsWith('/') ? decoded : `/${decoded}`;
  return withLead.length > 1 ? withLead.replace(/\/+$/, '') : '/';
}

/** Slug as route segments, for generateStaticParams. `/` -> []. */
export function slugToSegments(slug: string): string[] {
  const n = normaliseSlug(slug);
  return n === '/' ? [] : n.slice(1).split('/');
}

export function allMedia(): Array<{ at: string; media: Media }> {
  return walkMedia(content);
}
