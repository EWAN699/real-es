/**
 * The offline vendor.
 *
 * `npm run images:generate -- --mock` runs the *entire* pipeline — submit, poll,
 * download, sharp, registry rewrite, lock file — against this module instead of
 * Kling. Nothing is stubbed out downstream of it: the bytes it returns are real
 * image bytes that really get encoded to AVIF and WebP and really land on disk.
 *
 * Two reasons it exists.
 *
 * 1. The build environment cannot reach Kling at all — `api.klingai.com`,
 *    `api-singapore.klingai.com`, `kling.ai` and `app.klingai.com` are all 403 at
 *    the egress proxy — so this is the only way to exercise the pipeline here.
 * 2. Even with a working key, a run costs money. Anyone changing the encoder,
 *    the registry writer or the lock format should be able to prove it end to
 *    end for free.
 *
 * The envelopes come from `fixtures/*.json`, which are recorded response shapes,
 * kept as JSON rather than inlined so they stay obviously *data*. The transport
 * only substitutes the task id and the image URLs.
 *
 * Mock output is unmistakable on sight — a flat warm gradient, no photographic
 * content — and every lock entry it writes carries `"mock": true`, so a mock
 * asset can never be quietly mistaken for a generated photograph. A real run
 * replaces mock assets; a mock run never overwrites real ones.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import sharp from 'sharp';

import { ASPECT_RATIOS, WIDTHS } from './config';

import type { FetchInit, FetchLike, FetchResponse } from './kling';
import type { MediaAspect } from '../../src/content/media';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

function fixture(name: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path.join(fixturesDir, `${name}.json`), 'utf8')) as Record<
    string,
    unknown
  >;
}

/** Exported so the unit tests assert against the same recordings the mock serves. */
export const FIXTURES = {
  submitAccepted: () => fixture('submit-accepted'),
  taskProcessing: () => fixture('task-processing'),
  taskSucceed: () => fixture('task-succeed'),
  taskFailed: () => fixture('task-failed'),
  errorAuth: () => fixture('error-auth'),
};

/** The stand-in API host. Distinct from the CDN host, exactly as Kling's are. */
export const MOCK_API_BASE = 'https://mock.klingai.invalid';
/** Where mock result images are served from. Result URLs live on a CDN host. */
export const MOCK_IMAGE_HOST = 'https://mock-cdn.klingai.invalid';

function jsonResponse(payload: unknown, status = 200): FetchResponse {
  const body = JSON.stringify(payload);
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => JSON.parse(body) as unknown,
    text: async () => body,
    arrayBuffer: async () => new TextEncoder().encode(body).buffer as ArrayBuffer,
  };
}

function bytesResponse(bytes: Buffer): FetchResponse {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => {
      throw new Error('not json');
    },
    text: async () => bytes.toString('binary'),
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
  };
}

function hash32(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * A deterministic placeholder frame: a warm diagonal gradient in the house
 * palette, with a soft horizon band so the crop and focal point are visible.
 * Deliberately not photographic — nobody should ever mistake this for output.
 */
export async function synthesiseMaster(
  seedText: string,
  aspect: MediaAspect,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const widths = WIDTHS[aspect];
  const width = widths[widths.length - 1] ?? 1280;
  const height = Math.round(width / ASPECT_RATIOS[aspect]);

  const seed = hash32(seedText);
  const hueShift = (seed % 60) / 255;
  const horizon = 0.45 + ((seed >> 8) % 20) / 100;

  const data = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    const v = y / height;
    for (let x = 0; x < width; x += 1) {
      const u = x / width;
      const diagonal = (u + v) / 2;
      const sky = v < horizon ? 1 : 0;

      // Warm limestone below, hazy warm sky above; the house palette, flattened.
      const base = sky ? 0.82 - v * 0.25 : 0.62 - (v - horizon) * 0.22;
      const r = base + 0.16 * diagonal + hueShift;
      const g = base + 0.10 * diagonal + hueShift * 0.6;
      const b = base + 0.02 * diagonal;

      const offset = (y * width + x) * 3;
      data[offset] = Math.max(0, Math.min(255, Math.round(r * 255)));
      data[offset + 1] = Math.max(0, Math.min(255, Math.round(g * 255)));
      data[offset + 2] = Math.max(0, Math.min(255, Math.round(b * 255)));
    }
  }

  const buffer = await sharp(data, { raw: { width, height, channels: 3 } })
    .png({ compressionLevel: 3 })
    .toBuffer();

  return { buffer, width, height };
}

type MockTask = {
  taskId: string;
  polls: number;
  count: number;
  aspect: MediaAspect;
  externalTaskId: string;
  fail: boolean;
};

export type MockTransport = {
  fetch: FetchLike;
  /** Every request the pipeline made, for assertions. */
  readonly requests: { method: string; url: string; body?: unknown }[];
  readonly tasks: ReadonlyMap<string, MockTask>;
};

/**
 * A `fetch` that speaks Kling.
 *
 * `processingPolls` is how many `processing` responses a task returns before it
 * succeeds — the default of 1 keeps the pipeline honest about polling without
 * making a mock run slow.
 */
export function createMockTransport(
  options: {
    processingPolls?: number;
    /** external_task_ids that should come back `failed`. */
    failFor?: readonly string[];
  } = {},
): MockTransport {
  const processingPolls = options.processingPolls ?? 1;
  const failFor = new Set(options.failFor ?? []);
  const tasks = new Map<string, MockTask>();
  const requests: { method: string; url: string; body?: unknown }[] = [];

  const fetchImpl: FetchLike = async (url: string, init?: FetchInit) => {
    const method = (init?.method ?? 'GET').toUpperCase();
    const parsedBody = init?.body ? (JSON.parse(init.body) as Record<string, unknown>) : undefined;
    requests.push({ method, url, ...(parsedBody ? { body: parsedBody } : {}) });

    if (url.startsWith(MOCK_IMAGE_HOST)) {
      const name = url.slice(MOCK_IMAGE_HOST.length + 1).replace(/\.png$/, '');
      const task = tasks.get(name.split('--')[0] ?? '');
      const { buffer } = await synthesiseMaster(name, task?.aspect ?? '4:3');
      return bytesResponse(buffer);
    }

    if (method === 'POST') {
      const externalTaskId = String(parsedBody?.external_task_id ?? 'task');
      const taskId = `mock-${hash32(externalTaskId).toString(16)}`;
      tasks.set(taskId, {
        taskId,
        polls: 0,
        count: Number(parsedBody?.n ?? 1),
        aspect: (parsedBody?.aspect_ratio as MediaAspect) ?? '4:3',
        externalTaskId,
        fail: failFor.has(externalTaskId),
      });

      const envelope = FIXTURES.submitAccepted();
      const data = envelope.data as Record<string, unknown>;
      data.task_id = taskId;
      return jsonResponse(envelope);
    }

    const taskId = decodeURIComponent(url.split('/').pop() ?? '');
    const task = tasks.get(taskId);
    if (!task) {
      return jsonResponse({ code: 1301, message: `no such task ${taskId}`, data: null }, 404);
    }

    task.polls += 1;

    if (task.fail) {
      const envelope = FIXTURES.taskFailed();
      (envelope.data as Record<string, unknown>).task_id = taskId;
      return jsonResponse(envelope);
    }

    if (task.polls <= processingPolls) {
      const envelope = FIXTURES.taskProcessing();
      (envelope.data as Record<string, unknown>).task_id = taskId;
      return jsonResponse(envelope);
    }

    const envelope = FIXTURES.taskSucceed();
    const data = envelope.data as Record<string, unknown>;
    data.task_id = taskId;
    (data.task_result as Record<string, unknown>).images = Array.from(
      { length: task.count },
      (_unused, index) => ({
        index,
        url: `${MOCK_IMAGE_HOST}/${taskId}--${task.externalTaskId}-${index}.png`,
      }),
    );
    return jsonResponse(envelope);
  };

  return { fetch: fetchImpl, requests, tasks };
}
