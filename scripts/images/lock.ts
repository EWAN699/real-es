/**
 * `public/media/manifest.lock.json` — what was generated, from what, when, and
 * what it cost.
 *
 * The lock is what makes the pipeline idempotent and what makes a run auditable
 * six months later, when someone asks which of these images came from a model
 * (all of them), on which model version, and whether the prompt has drifted
 * since. It is committed alongside the images.
 *
 * `mock: true` marks a placeholder produced by the offline vendor. A real run
 * replaces mock entries; a mock run never overwrites real ones, so exercising
 * the pipeline offline can never quietly destroy paid output.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

import { PIPELINE_VERSION } from './config';

export const LOCK_VERSION = 1;

export type LockEntry = {
  promptHash: string;
  model: string;
  resolution: string;
  aspect: string;
  /** Candidates requested, and which one was published. */
  candidates: number;
  selectedCandidate: number;
  generatedAt: string;
  mock: boolean;
  /** Estimated, not billed — see the provenance note in config.ts. */
  estimatedCostUsd: number;
  /** Every file on disk for this slot, relative to the repo root. */
  files: string[];
  masterWidth: number;
  masterHeight: number;
  /** The URLs the registry publishes, so a rewrite needs no re-encoding. */
  src: string;
  fallback: string;
  /** The inline placeholder, kept here for the same reason. */
  lqip: string;
};

export type Lock = {
  lockVersion: number;
  pipelineVersion: number;
  updatedAt: string;
  totals: { assets: number; images: number; estimatedCostUsd: number };
  assets: Record<string, LockEntry>;
};

export function emptyLock(): Lock {
  return {
    lockVersion: LOCK_VERSION,
    pipelineVersion: PIPELINE_VERSION,
    updatedAt: new Date(0).toISOString(),
    totals: { assets: 0, images: 0, estimatedCostUsd: 0 },
    assets: {},
  };
}

export async function readLock(lockPath: string): Promise<Lock> {
  try {
    const parsed = JSON.parse(await readFile(lockPath, 'utf8')) as Partial<Lock>;
    if (parsed.lockVersion !== LOCK_VERSION || parsed.pipelineVersion !== PIPELINE_VERSION) {
      // A format or pipeline bump invalidates every hash; treat it as a clean slate.
      return emptyLock();
    }
    return { ...emptyLock(), ...parsed, assets: parsed.assets ?? {} };
  } catch {
    return emptyLock();
  }
}

export async function writeLock(lockPath: string, lock: Lock): Promise<void> {
  const images = Object.values(lock.assets).reduce((sum, entry) => sum + entry.candidates, 0);
  const cost = Object.values(lock.assets).reduce(
    (sum, entry) => sum + entry.estimatedCostUsd,
    0,
  );

  const next: Lock = {
    ...lock,
    lockVersion: LOCK_VERSION,
    pipelineVersion: PIPELINE_VERSION,
    updatedAt: new Date().toISOString(),
    totals: {
      assets: Object.keys(lock.assets).length,
      images,
      estimatedCostUsd: Number(cost.toFixed(4)),
    },
    assets: Object.fromEntries(
      Object.entries(lock.assets).sort(([a], [b]) => a.localeCompare(b)),
    ),
  };

  // A run that generated nothing must leave no diff, so the timestamp only moves
  // when something else did.
  const previous = await readFile(lockPath, 'utf8').catch(() => '');
  if (previous && sameIgnoringTimestamp(previous, next)) return;

  await mkdir(path.dirname(lockPath), { recursive: true });
  await writeFile(lockPath, `${JSON.stringify(next, null, 2)}\n`);
}

function sameIgnoringTimestamp(previous: string, next: Lock): boolean {
  try {
    const { updatedAt: _previousAt, ...rest } = JSON.parse(previous) as Lock;
    const { updatedAt: _nextAt, ...candidate } = next;
    return JSON.stringify(rest) === JSON.stringify(candidate);
  } catch {
    return false;
  }
}

/**
 * Whether a slot can be skipped.
 *
 * Skipped when the prompt hash matches and every file it claims is still on
 * disk. A mock entry does not satisfy a real run — that is how `--mock` output
 * gets replaced by the real thing without a `--force`.
 */
export function shouldSkip(
  entry: LockEntry | undefined,
  promptHash: string,
  options: { mockRun: boolean; filesExist: (files: readonly string[]) => boolean },
): { skip: boolean; reason: string } {
  if (!entry) return { skip: false, reason: 'not generated yet' };
  if (entry.promptHash !== promptHash) return { skip: false, reason: 'prompt or params changed' };
  if (!options.filesExist(entry.files)) return { skip: false, reason: 'files missing on disk' };
  if (entry.mock && !options.mockRun) return { skip: false, reason: 'replacing mock placeholder' };

  return { skip: true, reason: entry.mock ? 'up to date (mock)' : 'up to date' };
}
