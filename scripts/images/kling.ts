/**
 * The Kling image client: JWT auth, task submit, poll, download.
 *
 * Three things this file is careful about.
 *
 * 1. **The token is a short-lived HS256 JWT**, not the secret key. It is cached
 *    in-process and re-signed a full five minutes before it expires, so a long
 *    run never presents a token that dies mid-flight.
 * 2. **Nothing here decides what a model is called or where it lives.** Hosts,
 *    paths, model names and capabilities all come from `config.ts`, because they
 *    move between releases and a wrong string fails a paid run.
 * 3. **Result URLs expire.** `generate()` hands back URLs and the caller must
 *    download them immediately; `downloadToFile` is in this module for that
 *    reason. No Kling URL is ever written into the site.
 *
 * Everything that touches the outside world — `fetch`, the clock, `sleep` — is
 * injectable, which is what lets the unit tests drive succeed / failed / timeout
 * paths deterministically and lets `--mock` run the whole pipeline with no
 * network at all.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { SignJWT } from 'jose';

import {
  DOWNLOAD_RETRIES,
  DOWNLOAD_TIMEOUT_MS,
  MAX_IMAGES_PER_TASK,
  POLL,
  PROMPT_MAX_CHARS,
  REQUEST_TIMEOUT_MS,
  REFERENCE_FIDELITY,
  TOKEN_NBF_SKEW_SECONDS,
  TOKEN_REFRESH_BUFFER_SECONDS,
  TOKEN_TTL_SECONDS,
  imageTaskPath,
  type KlingImageModel,
  type KlingResolution,
} from './config';

import type { MediaAspect } from '../../src/content/media';

/* ── A minimal response shape ───────────────────────────────────────────────
 * Deliberately structural rather than the DOM `Response` type: the unit tests
 * hand in plain objects, and `globalThis.fetch`'s Response satisfies this.
 */

export type FetchInit = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: AbortSignal | undefined;
};

export type FetchResponse = {
  ok: boolean;
  status: number;
  statusText?: string;
  json(): Promise<unknown>;
  text(): Promise<string>;
  arrayBuffer(): Promise<ArrayBuffer>;
};

export type FetchLike = (url: string, init?: FetchInit) => Promise<FetchResponse>;

export type Clock = () => number;
export type Sleep = (ms: number) => Promise<void>;

/** `POLL` is `as const`, which would otherwise pin these to literal types. */
export type PollSettings = { -readonly [K in keyof typeof POLL]: number };

const defaultFetch: FetchLike = (url, init) =>
  globalThis.fetch(url, init as RequestInit) as unknown as Promise<FetchResponse>;

const defaultSleep: Sleep = (ms) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/**
 * `AbortSignal.timeout` exists in Node 18+ but not in every test environment,
 * and a missing per-request deadline must not be a crash.
 */
function timeoutSignal(ms: number): AbortSignal | undefined {
  const ctor = globalThis.AbortSignal as (typeof globalThis.AbortSignal & {
    timeout?: (ms: number) => AbortSignal;
  }) | undefined;
  return typeof ctor?.timeout === 'function' ? ctor.timeout(ms) : undefined;
}

/* ── Errors ────────────────────────────────────────────────────────────────── */

/** A non-zero `code` in the envelope, or a non-2xx HTTP status. */
export class KlingApiError extends Error {
  constructor(
    message: string,
    readonly httpStatus: number,
    readonly code?: number,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'KlingApiError';
  }
}

/** The task reached `failed`. Carries Kling's own explanation. */
export class KlingTaskFailedError extends Error {
  constructor(
    readonly taskId: string,
    readonly statusMessage: string,
  ) {
    super(`Kling task ${taskId} failed: ${statusMessage || 'no reason given'}`);
    this.name = 'KlingTaskFailedError';
  }
}

/** The task never settled — either the wall-clock deadline or the attempt cap. */
export class KlingTaskTimeoutError extends Error {
  constructor(
    readonly taskId: string,
    readonly reason: 'deadline' | 'attempts',
    readonly attempts: number,
    readonly lastStatus: TaskStatus | 'unknown',
  ) {
    super(
      `Kling task ${taskId} did not settle (${reason} exhausted after ${attempts} poll(s), ` +
        `last status "${lastStatus}")`,
    );
    this.name = 'KlingTaskTimeoutError';
  }
}

/* ── Auth ──────────────────────────────────────────────────────────────────── */

export type TokenClaims = { iss: string; exp: number; nbf: number };

/** The exact claim set Kling's reference specifies. Exported so the test can assert it. */
export function tokenClaims(accessKey: string, nowMs: number): TokenClaims {
  const issuedAt = Math.floor(nowMs / 1000);
  return {
    iss: accessKey,
    exp: issuedAt + TOKEN_TTL_SECONDS,
    nbf: issuedAt - TOKEN_NBF_SKEW_SECONDS,
  };
}

export async function signToken(
  accessKey: string,
  secretKey: string,
  nowMs: number,
): Promise<{ token: string; claims: TokenClaims }> {
  const claims = tokenClaims(accessKey, nowMs);
  const token = await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .sign(new TextEncoder().encode(secretKey));
  return { token, claims };
}

export type TokenProvider = {
  (): Promise<string>;
  /** How many times a token was actually signed. The cache is worth proving. */
  readonly signings: () => number;
};

/**
 * Caches the signed token and re-signs once it is within
 * `TOKEN_REFRESH_BUFFER_SECONDS` of expiry.
 */
export function createTokenProvider(options: {
  accessKey: string;
  secretKey: string;
  now?: Clock;
}): TokenProvider {
  const now = options.now ?? Date.now;
  let cached: { token: string; expiresAtMs: number } | null = null;
  let signings = 0;

  const provider = async (): Promise<string> => {
    const nowMs = now();
    if (cached && nowMs + TOKEN_REFRESH_BUFFER_SECONDS * 1000 < cached.expiresAtMs) {
      return cached.token;
    }

    const { token, claims } = await signToken(options.accessKey, options.secretKey, nowMs);
    signings += 1;
    cached = { token, expiresAtMs: claims.exp * 1000 };
    return token;
  };

  return Object.assign(provider, { signings: () => signings }) as TokenProvider;
}

/* ── Envelope ──────────────────────────────────────────────────────────────── */

export type TaskStatus = 'submitted' | 'processing' | 'succeed' | 'failed';

export type KlingTask = {
  taskId: string;
  status: TaskStatus;
  statusMessage: string;
  /** Present only once the task has succeeded. */
  images: readonly { index: number; url: string }[];
};

type Envelope = {
  code?: number;
  message?: string;
  request_id?: string;
  data?: {
    task_id?: string;
    task_status?: string;
    task_status_msg?: string;
    task_result?: { images?: { index?: number; url?: string }[] };
  };
};

const TASK_STATUSES: readonly string[] = ['submitted', 'processing', 'succeed', 'failed'];

function readEnvelope(payload: unknown, httpStatus: number): Envelope {
  if (typeof payload !== 'object' || payload === null) {
    throw new KlingApiError('Kling returned a non-object response body', httpStatus);
  }

  const envelope = payload as Envelope;
  if (typeof envelope.code === 'number' && envelope.code !== 0) {
    throw new KlingApiError(
      `Kling error ${envelope.code}: ${envelope.message ?? 'no message'}`,
      httpStatus,
      envelope.code,
      envelope.request_id,
    );
  }

  return envelope;
}

function readTask(envelope: Envelope, httpStatus: number): KlingTask {
  const data = envelope.data;
  const taskId = data?.task_id;
  if (!taskId) {
    throw new KlingApiError('Kling response carried no data.task_id', httpStatus);
  }

  const rawStatus = data?.task_status ?? 'submitted';
  if (!TASK_STATUSES.includes(rawStatus)) {
    throw new KlingApiError(
      `Unknown task_status "${rawStatus}" — the API surface has moved; update config.ts`,
      httpStatus,
    );
  }

  const images = (data?.task_result?.images ?? [])
    .map((image, index) => ({ index: image.index ?? index, url: image.url ?? '' }))
    .filter((image) => image.url.length > 0);

  return {
    taskId,
    status: rawStatus as TaskStatus,
    statusMessage: data?.task_status_msg ?? '',
    images,
  };
}

/* ── Client ────────────────────────────────────────────────────────────────── */

export type ImageRequest = {
  prompt: string;
  negativePrompt?: string | undefined;
  aspect: MediaAspect;
  count: number;
  /** Echoed back by Kling; makes a task traceable to a manifest slot. */
  externalTaskId?: string | undefined;
  /** Base64 (no data: prefix) reference image, when a slot pins itself to another. */
  referenceImageBase64?: string | undefined;
};

export type KlingClientOptions = {
  accessKey: string;
  secretKey: string;
  baseUrl: string;
  model: KlingImageModel;
  resolution: KlingResolution;
  fetch?: FetchLike;
  now?: Clock;
  sleep?: Sleep;
  poll?: Partial<PollSettings>;
  /** Called on every poll, so the CLI can show progress without owning the loop. */
  onPoll?: (task: KlingTask, attempt: number) => void;
};

export class KlingClient {
  private readonly fetchImpl: FetchLike;
  private readonly now: Clock;
  private readonly sleep: Sleep;
  private readonly poll: PollSettings;
  readonly token: TokenProvider;

  constructor(private readonly options: KlingClientOptions) {
    this.fetchImpl = options.fetch ?? defaultFetch;
    this.now = options.now ?? Date.now;
    this.sleep = options.sleep ?? defaultSleep;
    this.poll = { ...POLL, ...options.poll };
    this.token = createTokenProvider({
      accessKey: options.accessKey,
      secretKey: options.secretKey,
      ...(options.now ? { now: options.now } : {}),
    });
  }

  private async request(
    method: 'GET' | 'POST',
    pathname: string,
    body?: unknown,
  ): Promise<Envelope> {
    const url = `${this.options.baseUrl}${pathname}`;
    const token = await this.token();

    const response = await this.fetchImpl(url, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: timeoutSignal(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      // 401/403 here almost always means a clock skew or the wrong host —
      // international keys authenticate against api-singapore, not api.
      const detail = await response.text().catch(() => '');
      throw new KlingApiError(
        `${method} ${pathname} failed: HTTP ${response.status} ${response.statusText ?? ''} ${detail}`.trim(),
        response.status,
      );
    }

    return readEnvelope(await response.json(), response.status);
  }

  /** Submits one image task and returns its id. */
  async submitImageTask(request: ImageRequest): Promise<KlingTask> {
    if (request.prompt.length > PROMPT_MAX_CHARS) {
      throw new Error(
        `Prompt for ${request.externalTaskId ?? 'task'} is ${request.prompt.length} chars, ` +
          `over Kling's ${PROMPT_MAX_CHARS}-char limit.`,
      );
    }
    if (request.count < 1 || request.count > MAX_IMAGES_PER_TASK) {
      throw new Error(`count must be 1–${MAX_IMAGES_PER_TASK}, got ${request.count}`);
    }

    const model = this.options.model;

    const body: Record<string, unknown> = {
      model_name: model.id,
      prompt: request.prompt,
      n: request.count,
      aspect_ratio: request.aspect,
      resolution: this.options.resolution,
    };

    if (request.negativePrompt && model.supportsNegativePrompt) {
      body.negative_prompt = request.negativePrompt;
    }
    if (request.externalTaskId) {
      body.external_task_id = request.externalTaskId;
    }
    if (request.referenceImageBase64 && model.supportsReferenceImage) {
      body.image = request.referenceImageBase64;
      body.image_reference = 'subject';
      body.image_fidelity = REFERENCE_FIDELITY;
    }

    const envelope = await this.request('POST', model.submitPath, body);
    return readTask(envelope, 200);
  }

  async getTask(taskId: string): Promise<KlingTask> {
    const envelope = await this.request('GET', imageTaskPath(taskId));
    return readTask(envelope, 200);
  }

  /**
   * Polls until the task succeeds or fails.
   *
   * Exponential backoff, an attempt cap and a wall-clock deadline — a task that
   * hangs must cost a bounded amount of time, not the run.
   */
  async waitForTask(taskId: string): Promise<KlingTask> {
    const deadline = this.now() + this.poll.timeoutMs;
    let delay = this.poll.initialDelayMs;
    let lastStatus: TaskStatus | 'unknown' = 'unknown';

    for (let attempt = 1; ; attempt += 1) {
      if (attempt > this.poll.maxAttempts) {
        throw new KlingTaskTimeoutError(taskId, 'attempts', attempt - 1, lastStatus);
      }
      if (this.now() > deadline) {
        throw new KlingTaskTimeoutError(taskId, 'deadline', attempt - 1, lastStatus);
      }

      const task = await this.getTask(taskId);
      lastStatus = task.status;
      this.options.onPoll?.(task, attempt);

      if (task.status === 'succeed') {
        if (task.images.length === 0) {
          throw new KlingApiError(`Task ${taskId} succeeded with no images`, 200);
        }
        return task;
      }
      if (task.status === 'failed') {
        throw new KlingTaskFailedError(taskId, task.statusMessage);
      }

      await this.sleep(Math.min(delay, this.poll.maxDelayMs));
      delay = Math.min(delay * this.poll.factor, this.poll.maxDelayMs);
    }
  }

  /** Submit + poll. The caller downloads the URLs immediately — they expire. */
  async generate(request: ImageRequest): Promise<KlingTask> {
    const submitted = await this.submitImageTask(request);
    return this.waitForTask(submitted.taskId);
  }
}

/* ── Download ──────────────────────────────────────────────────────────────── */

/**
 * Downloads a result to disk, retrying transient failures.
 *
 * Kling result URLs are short-lived, so this runs the moment a task succeeds
 * rather than in a later pass.
 */
export async function downloadToFile(
  url: string,
  destination: string,
  options: {
    fetch?: FetchLike;
    retries?: number;
    sleep?: Sleep;
    timeoutMs?: number;
  } = {},
): Promise<{ bytes: number; path: string }> {
  const fetchImpl = options.fetch ?? defaultFetch;
  const sleep = options.sleep ?? defaultSleep;
  const retries = options.retries ?? DOWNLOAD_RETRIES;
  const timeoutMs = options.timeoutMs ?? DOWNLOAD_TIMEOUT_MS;

  let lastError: unknown;

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchImpl(url, { signal: timeoutSignal(timeoutMs) });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText ?? ''}`.trim());
      }

      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.byteLength === 0) {
        throw new Error('empty body');
      }

      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, bytes);
      return { bytes: bytes.byteLength, path: destination };
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(500 * attempt);
    }
  }

  throw new Error(
    `Failed to download ${url} after ${retries} attempt(s): ${String(lastError)}. ` +
      'Kling result URLs expire — a stale URL cannot be retried later, the task must be re-run.',
  );
}

/* ── Concurrency ───────────────────────────────────────────────────────────── */

/**
 * Runs `worker` over `items` with at most `limit` in flight, preserving order.
 * Kling rate-limits per account, so the cap is a courtesy as much as a control.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    for (;;) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      results[index] = await worker(items[index] as T, index);
    }
  });

  await Promise.all(runners);
  return results;
}
