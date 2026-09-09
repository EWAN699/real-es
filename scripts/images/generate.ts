#!/usr/bin/env tsx
/**
 * `npm run images:generate` — manifest in, committed static assets out.
 *
 *   manifest → hash → skip what is already generated → submit → poll →
 *   download immediately → sharp to AVIF + WebP at three widths → LQIP →
 *   rewrite the assets block in src/content/media.ts → write manifest.lock.json
 *
 * Flags
 *   --mock              run the whole pipeline against the offline vendor, no network
 *   --dry-run           print the plan and touch nothing
 *   --only <slug>       one slot (repeatable, or comma-separated)
 *   --force             regenerate even when the lock says it is up to date
 *   --concurrency <n>   tasks in flight (default 2 — Kling rate-limits per account)
 *
 * Live run, on a machine that can reach Kling:
 *
 *   cp .env.example .env.local          # KLING_ACCESS_KEY / KLING_SECRET_KEY
 *   npm run images:generate -- --dry-run
 *   npm run images:generate
 *
 * International accounts authenticate against `api-singapore.klingai.com`, which
 * is the default; mainland accounts must set KLING_API_BASE. Model names move
 * between releases — check `scripts/images/config.ts` before a paid run.
 */

import { existsSync } from 'node:fs';
import { readFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import {
  CACHE_DIR,
  DEFAULT_CONCURRENCY,
  DEFAULT_RESOLUTION,
  LOCK_PATH,
  MEDIA_REGISTRY_PATH,
  OUTPUT_DIR,
  PUBLIC_BASE,
  REPO_ROOT,
  readEnv,
  resolveModel,
} from './config';
import { KlingClient, downloadToFile, mapWithConcurrency, type FetchLike } from './kling';
import { readLock, shouldSkip, writeLock, type Lock, type LockEntry } from './lock';
import {
  composeNegativePrompt,
  composePrompt,
  groupIntoWaves,
  hashSlot,
  loadManifest,
  type ImageSlot,
} from './manifest';
import { MOCK_API_BASE, createMockTransport } from './mock';
import { optimiseMaster } from './optimise';
import { writeRegistry, type RegistryEntry } from './registry';

export type RunOptions = {
  mock: boolean;
  dryRun: boolean;
  force: boolean;
  only: string[];
  concurrency: number;
  outputDir: string;
  cacheDir: string;
  lockPath: string;
  registryPath: string;
  publicBase: string;
  slots?: readonly ImageSlot[] | undefined;
  fetch?: FetchLike | undefined;
  log: (message: string) => void;
};

export type SlotOutcome = {
  slug: string;
  status: 'generated' | 'skipped' | 'planned' | 'failed';
  reason: string;
  files: string[];
  estimatedCostUsd: number;
};

export type RunResult = {
  outcomes: SlotOutcome[];
  registryChanged: boolean;
  lock: Lock;
  estimatedCostUsd: number;
};

function defaults(): RunOptions {
  return {
    mock: false,
    dryRun: false,
    force: false,
    only: [],
    concurrency: DEFAULT_CONCURRENCY,
    outputDir: OUTPUT_DIR,
    cacheDir: CACHE_DIR,
    lockPath: LOCK_PATH,
    registryPath: MEDIA_REGISTRY_PATH,
    publicBase: PUBLIC_BASE,
    log: (message) => {
      process.stdout.write(`${message}\n`);
    },
  };
}

export async function runPipeline(overrides: Partial<RunOptions> = {}): Promise<RunResult> {
  const options: RunOptions = { ...defaults(), ...overrides };
  const { log } = options;

  // Credentials are needed only for a run that will actually call Kling.
  const env = readEnv({ requireCredentials: !options.mock && !options.dryRun });
  const model = resolveModel(env.modelId);
  const resolution = DEFAULT_RESOLUTION;
  const costPerImage = options.mock
    ? 0
    : (env.costPerImageUsd ?? model.estimatedCostUsdPerImage);

  const all = loadManifest(options.slots);
  const filtered =
    options.only.length > 0 ? all.filter((slot) => options.only.includes(slot.slug)) : all;

  if (options.only.length > 0) {
    const unknown = options.only.filter((slug) => !all.some((slot) => slot.slug === slug));
    if (unknown.length > 0) {
      throw new Error(
        `--only named ${unknown.map((slug) => `"${slug}"`).join(', ')}, which ` +
          `${unknown.length === 1 ? 'is' : 'are'} not in content/images.manifest.ts.`,
      );
    }
  }

  const lock = await readLock(options.lockPath);
  const resolveFile = (file: string): string => path.resolve(REPO_ROOT, file);
  const filesExist = (files: readonly string[]): boolean =>
    files.length > 0 && files.every((file) => existsSync(resolveFile(file)));

  const plan = filtered.map((slot) => {
    const promptHash = hashSlot(slot, { model: model.id, resolution });
    const decision = options.force
      ? { skip: false, reason: 'forced' }
      : shouldSkip(lock.assets[slot.slug], promptHash, { mockRun: options.mock, filesExist });
    return { slot, promptHash, ...decision };
  });

  const pending = plan.filter((item) => !item.skip);

  log(
    `${filtered.length} slot(s) in scope · ${pending.length} to generate · ` +
      `model ${model.id} (${model.verified}) · ${resolution} · ` +
      `${options.mock ? 'MOCK — no network' : env.baseUrl}`,
  );

  if (options.dryRun) {
    for (const item of plan) {
      log(`  ${item.skip ? 'skip    ' : 'generate'} ${item.slot.slug.padEnd(28)} ${item.reason}`);
    }
    const cost = pending.reduce((sum, item) => sum + item.slot.count * costPerImage, 0);
    log(`Estimated cost of this run: $${cost.toFixed(2)} (estimate — see config.ts)`);

    return {
      outcomes: plan.map((item) => ({
        slug: item.slot.slug,
        status: item.skip ? 'skipped' : 'planned',
        reason: item.reason,
        files: [],
        estimatedCostUsd: item.skip ? 0 : item.slot.count * costPerImage,
      })),
      registryChanged: false,
      lock,
      estimatedCostUsd: cost,
    };
  }

  await mkdir(options.outputDir, { recursive: true });
  await mkdir(options.cacheDir, { recursive: true });

  const transport = options.mock ? createMockTransport() : undefined;
  const transportFetch: FetchLike | undefined = options.fetch ?? transport?.fetch;

  const client = new KlingClient({
    accessKey: env.accessKey,
    secretKey: env.secretKey,
    baseUrl: options.mock ? MOCK_API_BASE : env.baseUrl,
    model,
    resolution,
    ...(transportFetch ? { fetch: transportFetch } : {}),
    // A mock run has nothing to wait for; the poll loop still runs in full.
    ...(options.mock ? { sleep: async () => {} } : {}),
  });

  const outcomes: SlotOutcome[] = plan
    .filter((item) => item.skip)
    .map((item) => ({
      slug: item.slot.slug,
      status: 'skipped' as const,
      reason: item.reason,
      files: lock.assets[item.slot.slug]?.files ?? [],
      estimatedCostUsd: 0,
    }));

  for (const item of outcomes) log(`  skip     ${item.slug.padEnd(28)} ${item.reason}`);

  const masterPath = (slug: string, index: number): string =>
    path.join(options.cacheDir, `${slug}-${index}.png`);

  /** A reference image is a nice-to-have: a missing master must not fail a run. */
  const referenceFor = async (slot: ImageSlot): Promise<string | undefined> => {
    if (!slot.referenceSlug || !model.supportsReferenceImage) return undefined;
    const referenced = all.find((candidate) => candidate.slug === slot.referenceSlug);
    if (!referenced) return undefined;

    const file = masterPath(referenced.slug, referenced.selectedCandidate ?? 0);
    if (!existsSync(file)) {
      log(`  note     ${slot.slug.padEnd(28)} no master for ${slot.referenceSlug}, no reference`);
      return undefined;
    }
    return (await readFile(file)).toString('base64');
  };

  type PendingItem = (typeof pending)[number];

  const generateOne = async (item: PendingItem): Promise<SlotOutcome> => {
    const { slot, promptHash } = item;
    const selected = slot.selectedCandidate ?? 0;

    try {
      const reference = await referenceFor(slot);

      const task = await client.generate({
        prompt: composePrompt(slot),
        negativePrompt: composeNegativePrompt(slot),
        aspect: slot.aspect,
        count: slot.count,
        externalTaskId: `caesar-${slot.slug}`,
        ...(reference ? { referenceImageBase64: reference } : {}),
      });

      // Immediately. Kling result URLs expire, and nothing on the site may ever
      // point at one, so every candidate lands on local disk before anything else.
      const masters = await Promise.all(
        task.images.map(async (image, index) => {
          const destination = masterPath(slot.slug, index);
          await downloadToFile(image.url, destination, {
            ...(transportFetch ? { fetch: transportFetch } : {}),
          });
          return destination;
        }),
      );

      const chosen = masters[selected] ?? masters[0];
      if (!chosen) throw new Error('task succeeded but produced no downloadable image');

      const optimised = await optimiseMaster(await readFile(chosen), {
        slug: slot.slug,
        aspect: slot.aspect,
        outputDir: options.outputDir,
        publicBase: options.publicBase,
      });

      const files = optimised.renditions.map((rendition) =>
        path.relative(REPO_ROOT, rendition.file),
      );

      const entry: LockEntry = {
        promptHash,
        model: model.id,
        resolution,
        aspect: slot.aspect,
        candidates: task.images.length,
        selectedCandidate: selected,
        generatedAt: new Date().toISOString(),
        mock: options.mock,
        estimatedCostUsd: Number((task.images.length * costPerImage).toFixed(4)),
        files,
        masterWidth: optimised.masterWidth,
        masterHeight: optimised.masterHeight,
        src: optimised.src,
        fallback: optimised.fallback,
        lqip: optimised.placeholder,
      };

      lock.assets[slot.slug] = entry;

      const bytes = optimised.renditions.reduce((sum, r) => sum + r.bytes, 0);
      log(
        `  ok       ${slot.slug.padEnd(28)} ${task.images.length} candidate(s), ` +
          `${optimised.renditions.length} file(s), ${(bytes / 1024).toFixed(0)} KB`,
      );

      return {
        slug: slot.slug,
        status: 'generated' as const,
        reason: item.reason,
        files,
        estimatedCostUsd: entry.estimatedCostUsd,
      } satisfies SlotOutcome;
    } catch (error) {
      log(`  FAILED   ${slot.slug.padEnd(28)} ${error instanceof Error ? error.message : error}`);
      return {
        slug: slot.slug,
        status: 'failed' as const,
        reason: error instanceof Error ? error.message : String(error),
        files: [],
        estimatedCostUsd: 0,
      } satisfies SlotOutcome;
    }
  };

  // Wave by wave: a slot that pins its look to another needs that other slot's
  // master on disk, and two workers in flight would otherwise race it.
  for (const wave of groupIntoWaves(pending.map((item) => item.slot))) {
    const items = wave.flatMap((slot) => pending.filter((item) => item.slot === slot));
    outcomes.push(...(await mapWithConcurrency(items, options.concurrency, generateOne)));
  }

  // Slots deleted from the manifest take their files with them, but only on a
  // full run — a --only run has no opinion about the rest of the set.
  if (options.only.length === 0) {
    for (const slug of Object.keys(lock.assets)) {
      if (all.some((slot) => slot.slug === slug)) continue;
      const orphan = lock.assets[slug];
      for (const file of orphan?.files ?? []) {
        await rm(resolveFile(file), { force: true });
      }
      delete lock.assets[slug];
      log(`  removed  ${slug.padEnd(28)} no longer in the manifest`);
    }
  }

  // The registry is rebuilt from the lock plus the manifest, not from this run's
  // results: alt text, aspect and focal point live in the manifest, so fixing a
  // typo in alt text is a registry rewrite, never a regeneration.
  const entries: RegistryEntry[] = all.flatMap((slot) => {
    const entry = lock.assets[slot.slug];
    if (!entry) return [];
    return [
      {
        slug: slot.slug,
        alt: slot.alt,
        aspect: slot.aspect,
        src: entry.src,
        fallback: entry.fallback,
        placeholder: entry.lqip,
        ...(slot.focal ? { focal: slot.focal } : {}),
      },
    ];
  });

  const { changed } = await writeRegistry(options.registryPath, entries);
  await writeLock(options.lockPath, lock);

  const failed = outcomes.filter((outcome) => outcome.status === 'failed');
  const cost = outcomes.reduce((sum, outcome) => sum + outcome.estimatedCostUsd, 0);

  log(
    `${entries.length} asset(s) in the registry${changed ? ' (rewritten)' : ' (unchanged)'} · ` +
      `lock written · estimated cost of this run $${cost.toFixed(2)}` +
      (options.mock ? ' (mock — nothing was billed)' : ''),
  );
  if (failed.length > 0) {
    log(`${failed.length} slot(s) failed: ${failed.map((f) => f.slug).join(', ')}`);
  }

  return { outcomes, registryChanged: changed, lock, estimatedCostUsd: cost };
}

/* ── CLI ───────────────────────────────────────────────────────────────────── */

export function parseArgs(argv: readonly string[]): Partial<RunOptions> & { help?: boolean } {
  const options: Partial<RunOptions> & { help?: boolean } = { only: [] };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case '--mock':
        options.mock = true;
        break;
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--force':
        options.force = true;
        break;
      case '--only': {
        const value = argv[index + 1];
        if (!value || value.startsWith('--')) throw new Error('--only needs a slug');
        options.only = [...(options.only ?? []), ...value.split(',').map((s) => s.trim())];
        index += 1;
        break;
      }
      case '--concurrency': {
        const value = Number(argv[index + 1]);
        if (!Number.isInteger(value) || value < 1) {
          throw new Error('--concurrency needs a positive integer');
        }
        options.concurrency = value;
        index += 1;
        break;
      }
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        throw new Error(`Unknown flag "${arg}". Try --help.`);
    }
  }

  return options;
}

const USAGE = `
npm run images:generate [-- flags]

  --mock              run the whole pipeline offline against recorded fixtures
  --dry-run           print the plan, write nothing
  --only <slug>       restrict to one slot (repeatable, or comma-separated)
  --force             regenerate even when the lock says it is up to date
  --concurrency <n>   tasks in flight (default ${DEFAULT_CONCURRENCY})
  --help

Credentials come from KLING_ACCESS_KEY / KLING_SECRET_KEY in .env.local, read in
Node only. Never VITE_-prefixed: Vite would inline them into the client bundle.
`.trim();

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }

  const { help: _help, ...options } = parsed;
  const result = await runPipeline(options);

  if (result.outcomes.some((outcome) => outcome.status === 'failed')) {
    process.exitCode = 1;
  }
}

/** Run only when invoked as a script, so the tests can import `runPipeline`. */
const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (invokedDirectly) {
  main().catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
    process.exitCode = 1;
  });
}
