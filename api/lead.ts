import {
  isHoneypotTripped,
  leadSchema,
  leadTopicLabels,
  normalizeIsraeliPhone,
  RATE_LIMIT,
  toLeadErrors,
  type Lead,
  type LeadResponse,
} from './_schemas/lead';

/**
 * `POST /api/lead` — the single lead-capture endpoint.
 *
 * Implements `docs/API_CONTRACT.md`. Used by the homepage form, the contact
 * page, the valuation request and the franchisee enquiry; `topic` routes the
 * notification.
 *
 * Three rules shape the whole file:
 *
 *  1. **Personal data never reaches a log.** The structured log line carries the
 *     topic, the source path and the outcome. Not the name, not the phone, not
 *     the email, not the message. A log is copied, shipped and retained in
 *     places a lead form's data has no business being.
 *  2. **A bot is never told it was caught.** A tripped honeypot gets the same
 *     `202 { ok: true }` a real submission gets, and the payload is dropped.
 *     Returning 400 just teaches the next attempt which field to leave alone.
 *  3. **A failed delivery is a 500.** The lead is not swallowed with a cheerful
 *     202: the client falls back to showing the phone number, so the person can
 *     still reach the business.
 *
 * No CAPTCHA. The legacy site loaded reCAPTCHA on first paint, which cost every
 * visitor a third-party round trip and sent their data to Google before they had
 * done anything. Honeypot plus rate limiting is proportionate at this volume.
 */

type Clock = () => number;

type Mailer = (lead: Lead) => Promise<void>;

export type LeadHandlerOptions = {
  send?: Mailer;
  now?: Clock;
  /** Injected in tests; production uses one shared in-memory window per instance. */
  store?: Map<string, number[]>;
};

const globalHits = new Map<string, number[]>();

export function createLeadHandler(options: LeadHandlerOptions = {}) {
  const now = options.now ?? (() => Date.now());
  const hits = options.store ?? globalHits;
  const send = options.send ?? sendViaResend;

  return async function handler(request: Request): Promise<Response> {
    const startedAt = now();

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'method_not_allowed' }, 405, { Allow: 'POST' });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, errors: { form: 'שגיאה בשליחת הטופס. נסו שוב.' } }, 400);
    }

    // Honeypot first: a bot costs us nothing beyond parsing, and it must never
    // consume the rate-limit budget of the IP it is spoofing.
    if (isHoneypotTripped(body)) {
      log({ outcome: 'discarded_honeypot', topic: readTopic(body), sourcePath: readPath(body) });
      return json({ ok: true }, 202);
    }

    const parsed = leadSchema.safeParse(body);
    if (!parsed.success) {
      log({ outcome: 'invalid', topic: readTopic(body), sourcePath: readPath(body) });
      return json({ ok: false, errors: toLeadErrors(parsed.error) }, 400);
    }
    const lead = parsed.data;

    const limit = checkRateLimit(hits, clientKey(request), now());
    if (!limit.allowed) {
      log({ outcome: 'rate_limited', topic: lead.topic, sourcePath: lead.sourcePath });
      return json({ ok: false, error: 'rate_limited', retryAfter: limit.retryAfter }, 429, {
        'Retry-After': String(limit.retryAfter),
      });
    }

    try {
      await send(lead);
    } catch (error) {
      log({
        outcome: 'delivery_failed',
        topic: lead.topic,
        sourcePath: lead.sourcePath,
        // The reason, never the payload.
        reason: error instanceof Error ? error.message : 'unknown',
      });
      return json({ ok: false, error: 'server_error' }, 500);
    }

    log({
      outcome: 'accepted',
      topic: lead.topic,
      sourcePath: lead.sourcePath,
      durationMs: now() - startedAt,
    });
    return json({ ok: true }, 202);
  };
}

export default createLeadHandler();

// ---------------------------------------------------------------- rate limiting

/**
 * A sliding window, in memory.
 *
 * Honest about its limits: serverless instances do not share memory, so the
 * effective ceiling is `max` per instance rather than globally. That is enough
 * to stop a form-spam script and is not a security control — if this endpoint
 * ever needs a real one, it belongs in a shared store (Vercel KV, Upstash),
 * not here.
 */
export function checkRateLimit(
  hits: Map<string, number[]>,
  key: string,
  at: number,
): { allowed: boolean; retryAfter: number } {
  const windowStart = at - RATE_LIMIT.windowMs;
  const recent = (hits.get(key) ?? []).filter((time) => time > windowStart);

  if (recent.length >= RATE_LIMIT.max) {
    const oldest = recent[0] ?? at;
    hits.set(key, recent);
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((oldest + RATE_LIMIT.windowMs - at) / 1000)),
    };
  }

  recent.push(at);
  hits.set(key, recent);

  // Opportunistic cleanup: without it a long-lived instance accumulates a key
  // per visitor for the lifetime of the process.
  if (hits.size > 5000) {
    for (const [otherKey, times] of hits) {
      if (times.every((time) => time <= windowStart)) hits.delete(otherKey);
    }
  }

  return { allowed: true, retryAfter: 0 };
}

/**
 * The rate-limit bucket for a request.
 *
 * `x-forwarded-for` is a list; the first entry is the client as seen by the edge.
 * The value is used as a map key and is never logged or persisted.
 */
function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const first = forwarded?.split(',')[0]?.trim();
  return first || request.headers.get('x-real-ip') || 'unknown';
}

// -------------------------------------------------------------------- delivery

/**
 * Deliver through Resend's REST API.
 *
 * Called directly over `fetch` rather than through the SDK: one HTTP call needs
 * no dependency, and a serverless function with fewer packages is a serverless
 * function with fewer supply-chain surprises.
 */
async function sendViaResend(lead: Lead): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.LEAD_NOTIFY_EMAIL;
  const from = process.env.LEAD_FROM_EMAIL ?? 'קבוצת קיסר <leads@caesar.co.il>';

  if (!apiKey || !to) {
    // Deliberately not naming which one is missing beyond the variable names —
    // and never the values.
    throw new Error('lead delivery is not configured (RESEND_API_KEY / LEAD_NOTIFY_EMAIL)');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `פנייה חדשה מהאתר — ${leadTopicLabels[lead.topic]}`,
      ...(lead.email ? { reply_to: lead.email } : {}),
      text: formatLeadEmail(lead),
    }),
  });

  if (!response.ok) {
    throw new Error(`resend responded ${response.status}`);
  }
}

/** The notification body. This is delivery, not logging: it carries the details. */
export function formatLeadEmail(lead: Lead): string {
  const phone = normalizeIsraeliPhone(lead.phone) ?? lead.phone;
  return [
    `נושא: ${leadTopicLabels[lead.topic]}`,
    `שם: ${lead.name}`,
    `טלפון: ${phone}`,
    lead.email ? `אימייל: ${lead.email}` : 'אימייל: לא נמסר',
    `נשלח מהעמוד: ${lead.sourcePath}`,
    '',
    lead.message ? lead.message : '(ללא הודעה)',
  ].join('\n');
}

// --------------------------------------------------------------------- plumbing

type LogLine = {
  outcome: 'accepted' | 'invalid' | 'rate_limited' | 'discarded_honeypot' | 'delivery_failed';
  topic?: string | undefined;
  sourcePath?: string | undefined;
  durationMs?: number | undefined;
  reason?: string | undefined;
};

/**
 * One structured line per request.
 *
 * The fields are fixed by the contract: topic, path, outcome. `topic` and
 * `sourcePath` are read defensively from unvalidated bodies for the failure
 * paths, so they are length-capped — an attacker controls those bytes and a log
 * line is not a place to let them write freely.
 */
function log(line: LogLine): void {
  console.info(
    JSON.stringify({
      event: 'lead',
      ...line,
      ...(line.topic ? { topic: line.topic.slice(0, 32) } : {}),
      ...(line.sourcePath ? { sourcePath: line.sourcePath.slice(0, 128) } : {}),
    }),
  );
}

function readTopic(body: unknown): string | undefined {
  const value = (body as { topic?: unknown } | null)?.topic;
  return typeof value === 'string' ? value : undefined;
}

function readPath(body: unknown): string | undefined {
  const value = (body as { sourcePath?: unknown } | null)?.sourcePath;
  return typeof value === 'string' ? value : undefined;
}

function json(
  payload: LeadResponse,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Nothing here is cacheable, and a cached 202 would swallow later leads.
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}
