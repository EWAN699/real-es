/**
 * Env-driven email dispatch for the contact form.
 *
 * Nothing here is configured in the repo — the provider and its key come from
 * the environment, and `.env*` is gitignored. Default is `console`, which does
 * no network I/O at all, so the route is safe to run in CI and in this
 * environment (which has no general egress).
 *
 * Adding a real provider: implement a `Sender`, register it in `SENDERS`, and
 * set EMAIL_PROVIDER in the deploy environment. See .env.example.
 */
export interface ContactMessage {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  /** The page the form was submitted from. */
  pageSlug?: string;
}

export type SendResult =
  | { ok: true; provider: string; id?: string }
  | { ok: false; provider: string; status: number; error: string };

type Sender = (msg: ContactMessage) => Promise<SendResult>;

function renderText(msg: ContactMessage): string {
  return [
    `שם: ${msg.name}`,
    `אימייל: ${msg.email}`,
    msg.phone ? `טלפון: ${msg.phone}` : null,
    msg.subject ? `נושא: ${msg.subject}` : null,
    msg.pageSlug ? `נשלח מהעמוד: ${msg.pageSlug}` : null,
    '',
    msg.message,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Default. Logs and succeeds — a stub, not a silent failure: it says so. */
const consoleSender: Sender = async (msg) => {
  console.info(
    '[contact] EMAIL_PROVIDER=console — message logged, not delivered:\n%s',
    renderText(msg),
  );
  return { ok: true, provider: 'console' };
};

/** Resend. Requires EMAIL_API_KEY, CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL. */
const resendSender: Sender = async (msg) => {
  const key = process.env.EMAIL_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;
  if (!key || !to || !from) {
    return {
      ok: false,
      provider: 'resend',
      status: 500,
      error: 'EMAIL_API_KEY, CONTACT_TO_EMAIL and CONTACT_FROM_EMAIL must all be set',
    };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: msg.email,
      subject: msg.subject?.trim() || `פנייה חדשה מהאתר — ${msg.name}`,
      text: renderText(msg),
    }),
  });

  if (!res.ok) {
    return { ok: false, provider: 'resend', status: res.status, error: await res.text() };
  }
  const body = (await res.json()) as { id?: string };
  return { ok: true, provider: 'resend', id: body.id };
};

const smtpSender: Sender = async () => ({
  ok: false,
  provider: 'smtp',
  status: 501,
  error: 'EMAIL_PROVIDER=smtp is reserved but not implemented',
});

const SENDERS: Record<string, Sender> = {
  console: consoleSender,
  resend: resendSender,
  smtp: smtpSender,
};

export function configuredProvider(): string {
  return process.env.EMAIL_PROVIDER?.trim().toLowerCase() || 'console';
}

export async function sendContactMessage(msg: ContactMessage): Promise<SendResult> {
  const name = configuredProvider();
  const sender = SENDERS[name];
  if (!sender) {
    return { ok: false, provider: name, status: 500, error: `unknown EMAIL_PROVIDER "${name}"` };
  }
  return sender(msg);
}
