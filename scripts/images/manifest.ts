/**
 * Manifest validation and ordering.
 *
 * `content/images.manifest.ts` is hand-written prose, so it is checked here
 * rather than trusted: a typo in a slug is a silently missing image, a slot that
 * references a slot that references it back is a hang, and an alt string that
 * drifts into keyword soup is exactly the legacy defect this rebuild exists to
 * undo.
 */

import { createHash } from 'node:crypto';

import {
  ASPECT_RATIOS,
  MAX_IMAGES_PER_TASK,
  PIPELINE_VERSION,
  PROMPT_MAX_CHARS,
} from './config';

import {
  composeNegativePrompt,
  composePrompt,
  imageManifest,
  type ImageSlot,
} from '../../content/images.manifest';

export { composeNegativePrompt, composePrompt, imageManifest };
export type { ImageSlot };

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEBREW = /[\u0590-\u05ff]/;
const ALT_MAX_CHARS = 160;

/**
 * Slugs the pipeline refuses to generate.
 *
 * AI imagery may never stand in for a specific marketed property, so nothing may
 * be filed under a listing- or property- prefix, and nothing may pose as a
 * portrait of a real colleague. This is enforced rather than merely documented
 * because it is the one rule here with legal weight.
 */
const FORBIDDEN_PREFIXES = ['listing-', 'property-', 'portrait-', 'team-'];

export class ManifestError extends Error {
  constructor(readonly problems: readonly string[]) {
    super(`images.manifest.ts is invalid:\n  - ${problems.join('\n  - ')}`);
    this.name = 'ManifestError';
  }
}

export function validateManifest(slots: readonly ImageSlot[] = imageManifest): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const slot of slots) {
    const where = `slot "${slot.slug}"`;

    if (!SLUG_PATTERN.test(slot.slug)) problems.push(`${where}: slug is not kebab-case`);
    if (seen.has(slot.slug)) problems.push(`${where}: duplicate slug`);
    seen.add(slot.slug);

    for (const prefix of FORBIDDEN_PREFIXES) {
      if (slot.slug.startsWith(prefix)) {
        problems.push(
          `${where}: "${prefix}" slots may not be AI-generated — a synthetic image of a ` +
            'specific marketed property or of a real colleague is misleading. Use real photography.',
        );
      }
    }

    if (!slot.prompt.trim()) problems.push(`${where}: empty prompt`);

    const prompt = composePrompt(slot);
    if (prompt.length > PROMPT_MAX_CHARS) {
      problems.push(`${where}: composed prompt is ${prompt.length} chars (max ${PROMPT_MAX_CHARS})`);
    }
    const negative = composeNegativePrompt(slot);
    if (negative.length > PROMPT_MAX_CHARS) {
      problems.push(
        `${where}: composed negative prompt is ${negative.length} chars (max ${PROMPT_MAX_CHARS})`,
      );
    }

    if (!(slot.aspect in ASPECT_RATIOS)) problems.push(`${where}: unknown aspect ${slot.aspect}`);

    if (!Number.isInteger(slot.count) || slot.count < 1 || slot.count > MAX_IMAGES_PER_TASK) {
      problems.push(`${where}: count must be an integer 1–${MAX_IMAGES_PER_TASK}`);
    }
    const selected = slot.selectedCandidate ?? 0;
    if (!Number.isInteger(selected) || selected < 0 || selected >= slot.count) {
      problems.push(`${where}: selectedCandidate ${selected} is outside 0–${slot.count - 1}`);
    }

    if (slot.decorative) {
      if (slot.alt !== '') {
        problems.push(`${where}: decorative slots carry an empty alt so assistive tech skips them`);
      }
    } else {
      if (!slot.alt.trim()) problems.push(`${where}: missing Hebrew alt text`);
      if (slot.alt && !HEBREW.test(slot.alt)) problems.push(`${where}: alt text is not Hebrew`);
      if (slot.alt.length > ALT_MAX_CHARS) {
        problems.push(
          `${where}: alt is ${slot.alt.length} chars — describe the frame, do not list keywords`,
        );
      }
      if (slot.alt.includes('|')) {
        problems.push(`${where}: alt reads as a keyword list, not a description`);
      }
    }

    if (slot.focal) {
      const [x, y] = slot.focal;
      if (x < 0 || x > 100 || y < 0 || y > 100) {
        problems.push(`${where}: focal point must be two percentages`);
      }
    }
  }

  for (const slot of slots) {
    if (!slot.referenceSlug) continue;
    if (slot.referenceSlug === slot.slug) {
      problems.push(`slot "${slot.slug}": references itself`);
    } else if (!seen.has(slot.referenceSlug)) {
      problems.push(`slot "${slot.slug}": referenceSlug "${slot.referenceSlug}" is not in the manifest`);
    }
  }

  problems.push(...findReferenceCycles(slots));

  return problems;
}

function findReferenceCycles(slots: readonly ImageSlot[]): string[] {
  const bySlug = new Map(slots.map((slot) => [slot.slug, slot]));
  const problems: string[] = [];

  for (const start of slots) {
    const path: string[] = [];
    let current: ImageSlot | undefined = start;

    while (current?.referenceSlug) {
      if (path.includes(current.slug)) {
        problems.push(`reference cycle: ${[...path, current.slug].join(' → ')}`);
        break;
      }
      path.push(current.slug);
      current = bySlug.get(current.referenceSlug);
    }
  }

  return [...new Set(problems)];
}

export function loadManifest(slots: readonly ImageSlot[] = imageManifest): ImageSlot[] {
  const problems = validateManifest(slots);
  if (problems.length > 0) throw new ManifestError(problems);
  return orderSlots(slots);
}

/**
 * Referenced slots first: a slot that pins its look to another needs that other
 * slot's master on disk before it can be submitted.
 */
export function orderSlots(slots: readonly ImageSlot[]): ImageSlot[] {
  const bySlug = new Map(slots.map((slot) => [slot.slug, slot]));
  const ordered: ImageSlot[] = [];
  const placed = new Set<string>();

  const place = (slot: ImageSlot, guard: Set<string>): void => {
    if (placed.has(slot.slug) || guard.has(slot.slug)) return;
    guard.add(slot.slug);

    const reference = slot.referenceSlug ? bySlug.get(slot.referenceSlug) : undefined;
    if (reference) place(reference, guard);

    placed.add(slot.slug);
    ordered.push(slot);
  };

  for (const slot of slots) place(slot, new Set());
  return ordered;
}

/**
 * Groups slots into dependency waves: everything in wave 0 depends on nothing,
 * wave 1 references wave 0, and so on.
 *
 * `orderSlots` alone is not enough once tasks run concurrently — a worker would
 * happily start a slot whose reference master is still downloading. Each wave is
 * run to completion before the next begins, and the concurrency cap applies
 * within a wave.
 */
export function groupIntoWaves(slots: readonly ImageSlot[]): ImageSlot[][] {
  const bySlug = new Map(slots.map((slot) => [slot.slug, slot]));

  const depthOf = (slot: ImageSlot, guard = new Set<string>()): number => {
    if (!slot.referenceSlug || guard.has(slot.slug)) return 0;
    guard.add(slot.slug);
    const reference = bySlug.get(slot.referenceSlug);
    return reference ? depthOf(reference, guard) + 1 : 0;
  };

  const waves: ImageSlot[][] = [];
  for (const slot of orderSlots(slots)) {
    const depth = depthOf(slot);
    (waves[depth] ??= []).push(slot);
  }

  return waves.filter((wave) => wave.length > 0);
}

export type SlotParameters = {
  model: string;
  resolution: string;
};

/**
 * The identity of a generated asset.
 *
 * Everything that changes what comes back is in here, and nothing that does not:
 * re-running the pipeline after editing a comment regenerates nothing, after
 * editing a prompt regenerates exactly that slot. `PIPELINE_VERSION` is the
 * escape hatch for a change in how images are *encoded* rather than generated.
 */
export function hashSlot(slot: ImageSlot, parameters: SlotParameters): string {
  const identity = JSON.stringify({
    pipelineVersion: PIPELINE_VERSION,
    slug: slot.slug,
    prompt: composePrompt(slot),
    negativePrompt: composeNegativePrompt(slot),
    aspect: slot.aspect,
    count: slot.count,
    selectedCandidate: slot.selectedCandidate ?? 0,
    seed: slot.seed ?? null,
    referenceSlug: slot.referenceSlug ?? null,
    model: parameters.model,
    resolution: parameters.resolution,
  });

  return createHash('sha256').update(identity).digest('hex').slice(0, 16);
}
