# API contract

**Frozen in Phase 0.** Implemented by `caesar-data`, consumed by `caesar-ui`, and mocked
by the MSW handlers that back UI tests. If a shape here needs to change, raise it rather
than editing unilaterally — another agent is coding against it right now.

All endpoints are Vercel serverless functions under `/api`. The site itself is fully
prerendered static HTML; these are the only dynamic surfaces.

---

## `POST /api/lead`

The single lead-capture endpoint, used by the homepage form, the contact page, the
valuation request ("רוצה לדעת כמה הדירה שלך שווה?") and the franchisee enquiry.

### Request

```jsonc
{
  "name": "ישראל ישראלי",       // required, 2–80 chars
  "phone": "052-1234567",        // required, Israeli mobile or landline
  "email": "a@b.co.il",          // optional
  "message": "",                 // optional, ≤ 2000 chars
  "topic": "management",         // required, see below
  "sourcePath": "/services/tama-38", // required, page the form was submitted from
  "company": ""                  // honeypot — MUST be empty
}
```

`topic` is one of `management` | `construction` | `investment` | `valuation` |
`franchise` | `general`. It routes the notification and is recorded on the lead.

`company` is a honeypot field. It is rendered off-screen and hidden from assistive
technology; any request arriving with it populated is a bot. The server returns `202` as
though the submission succeeded, and discards it — telling a bot it was detected only
helps it retry.

### Responses

| Status | Body | Meaning |
| --- | --- | --- |
| `202` | `{ "ok": true }` | Accepted. Also returned for discarded honeypot hits. |
| `400` | `{ "ok": false, "errors": { "<field>": "<Hebrew message>" } }` | Validation failed. Messages are Hebrew and safe to render directly. |
| `429` | `{ "ok": false, "error": "rate_limited", "retryAfter": 60 }` | Too many submissions from this IP. |
| `500` | `{ "ok": false, "error": "server_error" }` | Delivery failed. The client shows the phone number as a fallback. |

Validation is a Zod schema exported from `api/_schemas/lead.ts` and imported by both the
handler and the client form, so the two can never drift.

### Rules

- Rate limit: 5 submissions per IP per 10 minutes.
- Never echo submitted values back in an error message (reflected-XSS surface).
- Never log `phone` or `email` in plain text; log the topic, path and outcome only.
- Delivery via Resend to `LEAD_NOTIFY_EMAIL`. A delivery failure must still return `500`
  rather than silently swallowing the lead.
- No third-party CAPTCHA. The legacy site loaded reCAPTCHA on first paint, which cost
  performance and sent every visitor's data to a third party; honeypot plus rate limiting
  covers this volume.

---

## `POST /api/images/generate` — phase 2, not built yet

Reserved for an admin-triggered Kling regeneration endpoint. Not part of Phase 1: images
are generated at build time by `npm run images:generate` and committed as static assets,
so the runtime never holds Kling credentials.

Documented here only so the route is not claimed for something else.

---

## Environment

Server-side only. **Never** `VITE_`-prefixed — Vite inlines any `VITE_*` value into the
client bundle, which would publish the secret.

| Variable | Used by |
| --- | --- |
| `RESEND_API_KEY` | `/api/lead` |
| `LEAD_NOTIFY_EMAIL` | `/api/lead` |
| `KLING_ACCESS_KEY` / `KLING_SECRET_KEY` | `scripts/images/*` only, never a serverless function |
