/**
 * Contact form endpoint.
 *
 * The original site has a contact page at /צור-קשר/, so this is in scope.
 * Validation is Zod (hand-written here on purpose — this is a request body,
 * not site content; content types come from contracts/content.schema.json).
 *
 * Delivery is a stub by default: see lib/email.ts and .env.example.
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { sendContactMessage } from '@/lib/email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ContactSchema = z.object({
  name: z.string().trim().min(2, 'שם קצר מדי').max(80),
  email: z.email('כתובת אימייל לא תקינה').max(160),
  // Israeli numbers, loosely: digits, spaces, dashes, optional +972.
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]{6,19}$/, 'מספר טלפון לא תקין')
    .optional()
    .or(z.literal('')),
  subject: z.string().trim().max(120).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'ההודעה קצרה מדי').max(4000),
  pageSlug: z.string().trim().max(200).optional(),
  /** Honeypot. Real users never fill this; bots do. */
  company: z.string().max(0).optional().or(z.literal('')),
});

/** Crude per-IP throttle. Enough to blunt a script; a CDN rule is the real fix. */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';

  if (rateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'יותר מדי בקשות. נסו שוב בעוד דקה.' },
      { status: 429 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'גוף הבקשה אינו JSON תקין' }, { status: 400 });
  }

  const parsed = ContactSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: 'הטופס לא תקין',
        fields: z.flattenError(parsed.error).fieldErrors,
      },
      { status: 422 },
    );
  }

  const { company, ...data } = parsed.data;
  if (company) {
    // Honeypot tripped. Answer 200 so the bot learns nothing.
    return NextResponse.json({ ok: true });
  }

  const result = await sendContactMessage({
    name: data.name,
    email: data.email,
    phone: data.phone || undefined,
    subject: data.subject || undefined,
    message: data.message,
    pageSlug: data.pageSlug,
  });

  if (!result.ok) {
    console.error('[contact] delivery failed via %s: %s', result.provider, result.error);
    return NextResponse.json(
      { ok: false, error: 'שליחת ההודעה נכשלה. נסו שוב או התקשרו אלינו.' },
      { status: result.status >= 500 ? 502 : result.status },
    );
  }

  return NextResponse.json({ ok: true });
}

export function GET() {
  return NextResponse.json({ ok: false, error: 'Method Not Allowed' }, { status: 405 });
}
