// @vitest-environment node
/**
 * The client's three failure-prone parts: the token, the poll loop and the
 * download.
 *
 * Kling is unreachable from CI (and costs money everywhere else), so every test
 * here drives the client through an injected `fetch`, an injected clock and an
 * injected `sleep`. The envelopes are the recorded fixtures in `fixtures/`, the
 * same ones `--mock` serves, so a change in the API's shape breaks the tests and
 * the mock run together rather than one without the other.
 */

import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { jwtVerify, decodeProtectedHeader } from 'jose';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_BASE_URL,
  IMAGE_SUBMIT_PATH,
  KLING_HOSTS,
  TOKEN_NBF_SKEW_SECONDS,
  TOKEN_TTL_SECONDS,
  resolveModel,
} from './config';
import {
  KlingApiError,
  KlingClient,
  KlingTaskFailedError,
  KlingTaskTimeoutError,
  createTokenProvider,
  downloadToFile,
  mapWithConcurrency,
  signToken,
  type FetchLike,
  type FetchResponse,
} from './kling';
import { FIXTURES, createMockTransport } from './mock';

const ACCESS_KEY = 'AK-test-access-key';
const SECRET_KEY = 'SK-test-secret-key';
const model = resolveModel('kling-v2-1');

function jsonOnce(payloads: readonly unknown[]): { fetch: FetchLike; calls: string[] } {
  const calls: string[] = [];
  let index = 0;

  const fetchImpl: FetchLike = async (url) => {
    calls.push(url);
    const payload = payloads[Math.min(index, payloads.length - 1)];
    index += 1;
    return {
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => payload,
      text: async () => JSON.stringify(payload),
      arrayBuffer: async () => new ArrayBuffer(0),
    } satisfies FetchResponse;
  };

  return { fetch: fetchImpl, calls };
}

describe('the JWT', () => {
  it('carries exactly the claims Kling specifies, signed HS256', async () => {
    const nowMs = 1_757_000_000_000;
    const { token } = await signToken(ACCESS_KEY, SECRET_KEY, nowMs);

    expect(decodeProtectedHeader(token)).toEqual({ alg: 'HS256', typ: 'JWT' });

    const { payload } = await jwtVerify(token, new TextEncoder().encode(SECRET_KEY), {
      currentDate: new Date(nowMs),
    });

    const issuedAt = Math.floor(nowMs / 1000);
    expect(payload.iss).toBe(ACCESS_KEY);
    expect(payload.exp).toBe(issuedAt + TOKEN_TTL_SECONDS);
    // `nbf` is backdated: a few seconds of clock skew on the caller's machine
    // must not make a freshly signed token "not yet valid".
    expect(payload.nbf).toBe(issuedAt - TOKEN_NBF_SKEW_SECONDS);
    expect(Object.keys(payload).sort()).toEqual(['exp', 'iss', 'nbf']);
  });

  it('rejects a token signed with the wrong secret', async () => {
    const { token } = await signToken(ACCESS_KEY, SECRET_KEY, Date.now());
    await expect(
      jwtVerify(token, new TextEncoder().encode('SK-not-the-secret')),
    ).rejects.toThrow();
  });

  it('reuses the cached token and re-signs inside the refresh buffer', async () => {
    let clock = 1_757_000_000_000;
    const provider = createTokenProvider({
      accessKey: ACCESS_KEY,
      secretKey: SECRET_KEY,
      now: () => clock,
    });

    const first = await provider();
    expect(await provider()).toBe(first);
    expect(provider.signings()).toBe(1);

    // Still comfortably inside the 30-minute life: same token.
    clock += 10 * 60_000;
    expect(await provider()).toBe(first);
    expect(provider.signings()).toBe(1);

    // Inside the five-minute buffer before expiry: re-signed.
    clock += 16 * 60_000;
    const refreshed = await provider();
    expect(refreshed).not.toBe(first);
    expect(provider.signings()).toBe(2);
  });

  it('sends the token as a bearer credential, never the secret key', async () => {
    const seen: { url: string; headers: Record<string, string> }[] = [];
    const fetchImpl: FetchLike = async (url, init) => {
      seen.push({ url, headers: init?.headers ?? {} });
      return {
        ok: true,
        status: 200,
        json: async () => FIXTURES.submitAccepted(),
        text: async () => '',
        arrayBuffer: async () => new ArrayBuffer(0),
      } satisfies FetchResponse;
    };

    const client = new KlingClient({
      accessKey: ACCESS_KEY,
      secretKey: SECRET_KEY,
      baseUrl: DEFAULT_BASE_URL,
      model,
      resolution: '2k',
      fetch: fetchImpl,
    });

    await client.submitImageTask({ prompt: 'a courtyard', aspect: '16:9', count: 1 });

    const request = seen[0];
    expect(request?.url).toBe(`${KLING_HOSTS.international}${IMAGE_SUBMIT_PATH}`);
    const authorization = request?.headers.Authorization ?? '';
    expect(authorization.startsWith('Bearer ')).toBe(true);
    expect(authorization).not.toContain(SECRET_KEY);
    expect(JSON.stringify(seen)).not.toContain(SECRET_KEY);
  });
});

describe('submitting a task', () => {
  it('sends the model, prompt, negative prompt, count and aspect from config', async () => {
    const bodies: unknown[] = [];
    const fetchImpl: FetchLike = async (_url, init) => {
      bodies.push(JSON.parse(init?.body ?? '{}'));
      return {
        ok: true,
        status: 200,
        json: async () => FIXTURES.submitAccepted(),
        text: async () => '',
        arrayBuffer: async () => new ArrayBuffer(0),
      } satisfies FetchResponse;
    };

    const client = new KlingClient({
      accessKey: ACCESS_KEY,
      secretKey: SECRET_KEY,
      baseUrl: DEFAULT_BASE_URL,
      model,
      resolution: '2k',
      fetch: fetchImpl,
    });

    const task = await client.submitImageTask({
      prompt: 'an entrance courtyard',
      negativePrompt: 'text, signage',
      aspect: '4:3',
      count: 2,
      externalTaskId: 'caesar-division-management',
    });

    expect(task.taskId).toBe('774961564466806789');
    expect(bodies[0]).toEqual({
      model_name: 'kling-v2-1',
      prompt: 'an entrance courtyard',
      negative_prompt: 'text, signage',
      n: 2,
      aspect_ratio: '4:3',
      resolution: '2k',
      external_task_id: 'caesar-division-management',
    });
  });

  it('folds nothing into the request for a model that has no negative prompt', async () => {
    const bodies: Record<string, unknown>[] = [];
    const fetchImpl: FetchLike = async (_url, init) => {
      bodies.push(JSON.parse(init?.body ?? '{}') as Record<string, unknown>);
      return {
        ok: true,
        status: 200,
        json: async () => FIXTURES.submitAccepted(),
        text: async () => '',
        arrayBuffer: async () => new ArrayBuffer(0),
      } satisfies FetchResponse;
    };

    const client = new KlingClient({
      accessKey: ACCESS_KEY,
      secretKey: SECRET_KEY,
      baseUrl: DEFAULT_BASE_URL,
      model: resolveModel('kling-image-o1'),
      resolution: '1k',
      fetch: fetchImpl,
    });

    await client.submitImageTask({
      prompt: 'a courtyard',
      negativePrompt: 'text',
      aspect: '1:1',
      count: 1,
    });

    expect(bodies[0]).not.toHaveProperty('negative_prompt');
  });

  it('turns a non-zero envelope code into an error rather than a silent success', async () => {
    const { fetch: fetchImpl } = jsonOnce([FIXTURES.errorAuth()]);
    const client = new KlingClient({
      accessKey: ACCESS_KEY,
      secretKey: SECRET_KEY,
      baseUrl: DEFAULT_BASE_URL,
      model,
      resolution: '2k',
      fetch: fetchImpl,
    });

    await expect(
      client.submitImageTask({ prompt: 'a courtyard', aspect: '16:9', count: 1 }),
    ).rejects.toBeInstanceOf(KlingApiError);
  });
});

describe('polling', () => {
  function clientWith(payloads: readonly unknown[], overrides: { timeoutMs?: number } = {}) {
    const { fetch: fetchImpl, calls } = jsonOnce(payloads);
    let clock = 1_757_000_000_000;

    const client = new KlingClient({
      accessKey: ACCESS_KEY,
      secretKey: SECRET_KEY,
      baseUrl: DEFAULT_BASE_URL,
      model,
      resolution: '2k',
      fetch: fetchImpl,
      now: () => clock,
      // Virtual time: the backoff is exercised in full without waiting for it.
      sleep: async (ms) => {
        clock += ms;
      },
      poll: { maxAttempts: 5, ...overrides },
    });

    return { client, calls, delays: () => clock - 1_757_000_000_000 };
  }

  it('returns the images once the task succeeds', async () => {
    const { client, calls } = clientWith([
      FIXTURES.taskProcessing(),
      FIXTURES.taskProcessing(),
      FIXTURES.taskSucceed(),
    ]);

    const task = await client.waitForTask('774961564466806789');

    expect(task.status).toBe('succeed');
    expect(task.images).toHaveLength(1);
    expect(task.images[0]?.url).toContain('774961564466806789-0.png');
    expect(calls).toHaveLength(3);
  });

  it('backs off exponentially between polls', async () => {
    const { client, delays } = clientWith([
      FIXTURES.taskProcessing(),
      FIXTURES.taskProcessing(),
      FIXTURES.taskProcessing(),
      FIXTURES.taskSucceed(),
    ]);

    await client.waitForTask('774961564466806789');

    // 2000 + 3200 + 5120 — increasing, not a fixed interval.
    expect(delays()).toBe(2000 + 3200 + 5120);
  });

  it('throws with Kling’s own reason when the task fails', async () => {
    const { client } = clientWith([FIXTURES.taskFailed()]);

    await expect(client.waitForTask('774961564466806789')).rejects.toBeInstanceOf(
      KlingTaskFailedError,
    );
    await expect(client.waitForTask('774961564466806789')).rejects.toThrow(
      /content moderation policy/,
    );
  });

  it('gives up on the attempt cap rather than polling for ever', async () => {
    const { client, calls } = clientWith([FIXTURES.taskProcessing()]);

    const error = await client.waitForTask('774961564466806789').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(KlingTaskTimeoutError);
    expect((error as KlingTaskTimeoutError).reason).toBe('attempts');
    expect(calls).toHaveLength(5);
  });

  it('gives up on the wall-clock deadline even with attempts to spare', async () => {
    const { client } = clientWith([FIXTURES.taskProcessing()], { timeoutMs: 3_000 });

    const error = await client.waitForTask('774961564466806789').catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(KlingTaskTimeoutError);
    expect((error as KlingTaskTimeoutError).reason).toBe('deadline');
  });

  it('refuses a task that succeeds with no images', async () => {
    const empty = FIXTURES.taskSucceed();
    (empty.data as Record<string, unknown>).task_result = { images: [] };

    const { client } = clientWith([empty]);
    await expect(client.waitForTask('774961564466806789')).rejects.toThrow(/no images/);
  });
});

describe('downloading', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(path.join(tmpdir(), 'caesar-download-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('persists the bytes to disk, creating the directory', async () => {
    // Not `Buffer.from(...).buffer` — small Buffers share a pooled ArrayBuffer.
    const payload = new TextEncoder().encode('PNG-ish bytes');
    const fetchImpl: FetchLike = async () => ({
      ok: true,
      status: 200,
      json: async () => ({}),
      text: async () => '',
      arrayBuffer: async () => payload.buffer as ArrayBuffer,
    });

    const destination = path.join(directory, 'nested', 'hero-0.png');
    const result = await downloadToFile('https://cdn.example/one.png', destination, {
      fetch: fetchImpl,
    });

    expect(result.bytes).toBe(payload.byteLength);
    expect(await readFile(destination)).toEqual(Buffer.from(payload));
  });

  it('retries a transient failure, then succeeds', async () => {
    const attempt = vi.fn();
    let calls = 0;
    const fetchImpl: FetchLike = async () => {
      attempt();
      calls += 1;
      if (calls < 3) throw new Error('ECONNRESET');
      return {
        ok: true,
        status: 200,
        json: async () => ({}),
        text: async () => '',
        arrayBuffer: async () => new TextEncoder().encode('ok').buffer as ArrayBuffer,
      };
    };

    await downloadToFile('https://cdn.example/one.png', path.join(directory, 'a.png'), {
      fetch: fetchImpl,
      sleep: async () => {},
    });

    expect(attempt).toHaveBeenCalledTimes(3);
  });

  it('explains that an expired URL cannot simply be retried later', async () => {
    const fetchImpl: FetchLike = async () => ({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
      json: async () => ({}),
      text: async () => '',
      arrayBuffer: async () => new ArrayBuffer(0),
    });

    await expect(
      downloadToFile('https://cdn.example/expired.png', path.join(directory, 'b.png'), {
        fetch: fetchImpl,
        retries: 2,
        sleep: async () => {},
      }),
    ).rejects.toThrow(/expire/);
  });

  it('downloads what the mock vendor serves, as real image bytes', async () => {
    const transport = createMockTransport({ processingPolls: 0 });
    const client = new KlingClient({
      accessKey: ACCESS_KEY,
      secretKey: SECRET_KEY,
      baseUrl: 'https://mock.klingai.invalid',
      model,
      resolution: '2k',
      fetch: transport.fetch,
      sleep: async () => {},
    });

    const task = await client.generate({
      prompt: 'a courtyard',
      aspect: '16:9',
      count: 1,
      externalTaskId: 'caesar-division-management',
    });

    const destination = path.join(directory, 'division-management-0.png');
    await downloadToFile(task.images[0]?.url ?? '', destination, { fetch: transport.fetch });

    const bytes = await readFile(destination);
    expect(bytes.byteLength).toBeGreaterThan(1000);
    // A real PNG signature, not a JSON body written to a .png.
    expect(bytes.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  });
});

describe('concurrency', () => {
  it('never exceeds the cap and keeps results in order', async () => {
    let inFlight = 0;
    let peak = 0;

    const results = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 2, async (value) => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      return value * 10;
    });

    expect(peak).toBeLessThanOrEqual(2);
    expect(results).toEqual([10, 20, 30, 40, 50, 60]);
  });
});
