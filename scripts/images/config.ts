/**
 * Kling API surface and pipeline configuration.
 *
 * Everything version-dependent lives here — endpoint hosts, model names, model
 * capabilities, cost estimates, output sizes. No call site anywhere in this
 * directory hardcodes a model name or a path.
 *
 * ── Provenance (checked 2026-09-09 against Kling's published API reference and
 *    community mirrors; api.klingai.com, api-singapore.klingai.com, kling.ai and
 *    app.klingai.com are all blocked by this environment's egress proxy, so the
 *    surface below is reconstructed from reachable documentation rather than
 *    from the vendor host itself) ──
 *
 *   VERIFIED
 *     · Two hosts: `https://api-singapore.klingai.com` (international accounts)
 *       and `https://api.klingai.com` (mainland accounts). The agent brief named
 *       only the latter; international keys authenticate against Singapore, so
 *       that is the default here and the brief has been corrected.
 *     · `POST /v1/images/generations`      — submit, returns `data.task_id`
 *     · `GET  /v1/images/generations/{id}` — single task
 *     · `GET  /v1/images/generations?pageNum=&pageSize=` — task list
 *     · Auth: HS256 JWT, claims `{ iss: accessKey, exp: now+1800, nbf: now-5 }`,
 *       header `{ alg: 'HS256', typ: 'JWT' }`, sent as `Authorization: Bearer`.
 *     · `task_status` ∈ submitted | processing | succeed | failed
 *     · Results at `data.task_result.images[].url`, and those URLs expire — the
 *       pipeline downloads immediately and the site never links to a Kling host.
 *     · Request fields: model_name, prompt (≤ 2500 chars), negative_prompt, n
 *       (1–9), aspect_ratio (16:9 | 9:16 | 1:1 | 4:3 | 3:4 | 3:2 | 2:3 | 21:9),
 *       resolution (1k | 2k), image, image_reference (subject | face),
 *       image_fidelity (0–1), callback_url, external_task_id.
 *     · `model_name` enum for this endpoint: kling-v1, kling-v1-5, kling-v2,
 *       kling-v2-new, kling-v2-1.
 *
 *   REPORTED BUT NOT CONFIRMED (do not make one of these the default without
 *   checking the live docs first — see `verified: 'reported'` below)
 *     · `kling-image-o1` — "Omni Image O1", multi-reference (up to 10 images),
 *       1K/2K only.
 *     · `kling-v3-omni` — adds 4K and a separate omni endpoint is described by
 *       some aggregators as `POST /v1/images/omni-image` rather than the classic
 *       path. Both the model string and the path need confirming on the vendor
 *       host before use.
 *     · Whether the newer image models still honour `negative_prompt` is unclear;
 *       Kling 3.x documents positive *and* negative phrasing inside `prompt`
 *       itself. Hence `supportsNegativePrompt` per model: when false the pipeline
 *       folds the negative prompt into the prompt text instead of dropping it.
 *     · Per-image price. Official image generation is sold as a credit bundle /
 *       enterprise subscription, not a public per-image rate, so the figures
 *       below are ESTIMATES used only for the cost column in manifest.lock.json.
 *       Override with KLING_COST_PER_IMAGE_USD.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { MediaAspect } from '../../src/content/media';

/** Bumping this invalidates every prompt hash and forces a full regeneration. */
export const PIPELINE_VERSION = 1;

export const KLING_HOSTS = {
  /** International / overseas accounts. Default. */
  international: 'https://api-singapore.klingai.com',
  /** Mainland-China accounts. */
  mainland: 'https://api.klingai.com',
} as const;

export const DEFAULT_BASE_URL = KLING_HOSTS.international;

export const IMAGE_SUBMIT_PATH = '/v1/images/generations';
export const imageTaskPath = (taskId: string): string =>
  `${IMAGE_SUBMIT_PATH}/${encodeURIComponent(taskId)}`;

/** JWT claim shape, exactly as Kling's reference specifies it. */
export const TOKEN_TTL_SECONDS = 1800;
export const TOKEN_NBF_SKEW_SECONDS = 5;
/** Re-sign this far before expiry so a long run never presents a stale token. */
export const TOKEN_REFRESH_BUFFER_SECONDS = 300;

export const PROMPT_MAX_CHARS = 2500;
export const MAX_IMAGES_PER_TASK = 9;

export type KlingResolution = '1k' | '2k';

export type KlingImageModel = {
  /** The literal `model_name` sent to the API. */
  readonly id: string;
  readonly label: string;
  /** 'documented' — seen in a published enum. 'reported' — third-party only. */
  readonly verified: 'documented' | 'reported';
  /** Submit path, in case a model moves to its own endpoint (the omni family). */
  readonly submitPath: string;
  readonly supportsNegativePrompt: boolean;
  readonly supportsReferenceImage: boolean;
  /** No image model documents a seed parameter. Seeds are hashed, not sent. */
  readonly supportsSeed: boolean;
  readonly resolutions: readonly KlingResolution[];
  /** Estimate only. See the provenance note above. */
  readonly estimatedCostUsdPerImage: number;
  readonly note?: string;
};

export const IMAGE_MODELS: Readonly<Record<string, KlingImageModel>> = {
  'kling-v1': {
    id: 'kling-v1',
    label: 'Kling 1.0 image',
    verified: 'documented',
    submitPath: IMAGE_SUBMIT_PATH,
    supportsNegativePrompt: true,
    supportsReferenceImage: true,
    supportsSeed: false,
    resolutions: ['1k'],
    estimatedCostUsdPerImage: 0.014,
  },
  'kling-v1-5': {
    id: 'kling-v1-5',
    label: 'Kling 1.5 image',
    verified: 'documented',
    submitPath: IMAGE_SUBMIT_PATH,
    supportsNegativePrompt: true,
    supportsReferenceImage: true,
    supportsSeed: false,
    resolutions: ['1k'],
    estimatedCostUsdPerImage: 0.014,
  },
  'kling-v2': {
    id: 'kling-v2',
    label: 'Kling 2.0 image',
    verified: 'documented',
    submitPath: IMAGE_SUBMIT_PATH,
    supportsNegativePrompt: true,
    supportsReferenceImage: true,
    supportsSeed: false,
    resolutions: ['1k', '2k'],
    estimatedCostUsdPerImage: 0.028,
  },
  'kling-v2-new': {
    id: 'kling-v2-new',
    label: 'Kling 2.0 image (refreshed)',
    verified: 'documented',
    submitPath: IMAGE_SUBMIT_PATH,
    supportsNegativePrompt: true,
    supportsReferenceImage: true,
    supportsSeed: false,
    resolutions: ['1k', '2k'],
    estimatedCostUsdPerImage: 0.028,
  },
  'kling-v2-1': {
    id: 'kling-v2-1',
    label: 'Kling 2.1 image',
    verified: 'documented',
    submitPath: IMAGE_SUBMIT_PATH,
    supportsNegativePrompt: true,
    supportsReferenceImage: true,
    supportsSeed: false,
    resolutions: ['1k', '2k'],
    estimatedCostUsdPerImage: 0.028,
  },
  'kling-image-o1': {
    id: 'kling-image-o1',
    label: 'Kling Omni Image O1',
    verified: 'reported',
    submitPath: IMAGE_SUBMIT_PATH,
    supportsNegativePrompt: false,
    supportsReferenceImage: true,
    supportsSeed: false,
    resolutions: ['1k', '2k'],
    estimatedCostUsdPerImage: 0.028,
    note: 'Multi-reference (up to 10 images). Model string not confirmed on the vendor host.',
  },
  'kling-v3-omni': {
    id: 'kling-v3-omni',
    label: 'Kling 3.0 Omni Image',
    verified: 'reported',
    submitPath: IMAGE_SUBMIT_PATH,
    supportsNegativePrompt: false,
    supportsReferenceImage: true,
    supportsSeed: false,
    resolutions: ['1k', '2k'],
    estimatedCostUsdPerImage: 0.06,
    note: 'Adds 4K. Some aggregators document a distinct /v1/images/omni-image path — confirm before use.',
  },
};

/**
 * Default model. Deliberately the newest name that appears in a *published*
 * `model_name` enum rather than the newest name that exists: a wrong model
 * string fails the whole run, and the user runs this against a paid account.
 * Override per-run with KLING_IMAGE_MODEL once the newer names are confirmed.
 */
export const DEFAULT_MODEL_ID = 'kling-v2-1';

export const DEFAULT_RESOLUTION: KlingResolution = '2k';

/** Reference-image weighting when a slot pins itself to another slot's output. */
export const REFERENCE_FIDELITY = 0.35;

export function resolveModel(id: string): KlingImageModel {
  const model = IMAGE_MODELS[id];
  if (model) return model;
  throw new Error(
    `Unknown Kling image model "${id}". Known models: ${Object.keys(IMAGE_MODELS).join(', ')}. ` +
      'Model names move between releases — add the new one to scripts/images/config.ts ' +
      '(with its capabilities) rather than passing it through at a call site.',
  );
}

/** Poll tuning. Exponential backoff, capped attempts, hard per-task deadline. */
export const POLL = {
  initialDelayMs: 2_000,
  factor: 1.6,
  maxDelayMs: 15_000,
  maxAttempts: 40,
  timeoutMs: 5 * 60_000,
} as const;

/** Kling rate-limits per account; two in flight is polite and still quick. */
export const DEFAULT_CONCURRENCY = 2;

export const REQUEST_TIMEOUT_MS = 60_000;
export const DOWNLOAD_TIMEOUT_MS = 120_000;
export const DOWNLOAD_RETRIES = 3;

/* ── Paths ─────────────────────────────────────────────────────────────────── */

const here = path.dirname(fileURLToPath(import.meta.url));

export const REPO_ROOT = path.resolve(here, '..', '..');
export const MANIFEST_PATH = path.join(REPO_ROOT, 'content', 'images.manifest.ts');
export const MEDIA_REGISTRY_PATH = path.join(REPO_ROOT, 'src', 'content', 'media.ts');
export const OUTPUT_DIR = path.join(REPO_ROOT, 'public', 'media');
export const LOCK_PATH = path.join(OUTPUT_DIR, 'manifest.lock.json');
/** Gitignored scratch space: full-size masters, kept for reference images. */
export const CACHE_DIR = path.join(here, '.cache');
/** URL prefix the site serves `public/media` from. */
export const PUBLIC_BASE = '/media';

/* ── Output encoding ───────────────────────────────────────────────────────── */

export const ASPECT_RATIOS: Readonly<Record<MediaAspect, number>> = {
  '21:9': 21 / 9,
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '1:1': 1,
  '3:4': 3 / 4,
};

/**
 * Three widths per slot, scaled to how large the slot ever renders. `src` and
 * `fallback` in the media registry point at the middle width; all three are on
 * disk as `<slug>-<width>.<ext>` and listed in manifest.lock.json, so a future
 * contract amendment can expose a srcset without regenerating anything.
 */
export const WIDTHS: Readonly<Record<MediaAspect, readonly [number, number, number]>> = {
  '21:9': [960, 1600, 2400],
  '16:9': [640, 1280, 1920],
  '4:3': [480, 960, 1440],
  '1:1': [320, 640, 960],
  '3:4': [480, 960, 1440],
};

/** Index into WIDTHS used for `src`/`fallback`. */
export const DEFAULT_WIDTH_INDEX = 1;

export const ENCODE = {
  avif: { quality: 55, effort: 4 },
  webp: { quality: 78, effort: 4 },
  /** LQIP: a handful of pixels, blurred, inlined as a data URI. */
  lqip: { width: 20, blur: 1.1, quality: 32 },
} as const;

/* ── Environment ───────────────────────────────────────────────────────────── */

export type Env = {
  accessKey: string;
  secretKey: string;
  baseUrl: string;
  modelId: string;
  costPerImageUsd: number | undefined;
};

/**
 * Credentials are read from `process.env` in Node and nowhere else. They must
 * never carry a VITE_ prefix: Vite inlines any VITE_* value into the client
 * bundle, which would publish the secret key. An eslint rule and a CI grep
 * enforce this.
 */
export function readEnv(options: { requireCredentials: boolean }): Env {
  const accessKey = process.env.KLING_ACCESS_KEY ?? '';
  const secretKey = process.env.KLING_SECRET_KEY ?? '';

  if (options.requireCredentials && (!accessKey || !secretKey)) {
    throw new Error(
      'KLING_ACCESS_KEY and KLING_SECRET_KEY must be set (copy .env.example to .env.local). ' +
        'Run with --mock to exercise the pipeline offline without credentials.',
    );
  }

  const rawCost = process.env.KLING_COST_PER_IMAGE_USD;
  const parsedCost = rawCost ? Number(rawCost) : Number.NaN;

  return {
    accessKey: accessKey || 'mock-access-key',
    secretKey: secretKey || 'mock-secret-key',
    baseUrl: process.env.KLING_API_BASE ?? DEFAULT_BASE_URL,
    modelId: process.env.KLING_IMAGE_MODEL ?? DEFAULT_MODEL_ID,
    costPerImageUsd: Number.isFinite(parsedCost) ? parsedCost : undefined,
  };
}
