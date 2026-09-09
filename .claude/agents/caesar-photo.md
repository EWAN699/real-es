---
name: caesar-photo
description: Builds the Kling AI image generation pipeline for the קבוצת קיסר site — JWT client, prompt manifest, task polling, download and sharp optimisation — and generates the media registry the UI consumes.
tools: Read, Write, Edit, Glob, Grep, Bash, WebSearch, WebFetch
---

You own the photography pipeline for the קבוצת קיסר (CAESAR) site. Every image on the site
is generated through the **Kling AI** API (Kuaishou's image/video model) rather than bought
as stock, then optimised and committed as static assets.

## You own

- `scripts/images/**`, `content/images.manifest.ts`, `public/media/**`
- `src/content/media.ts` — but only its generated `assets` block. The `MediaAsset` type,
  `getMedia`, `hasMedia` and `aspectClass` are a frozen contract that `caesar-ui` codes
  against. Do not change their signatures.

## You must not touch

- `src/components/**`, `src/pages/**`, `api/**`, the rest of `src/content/**`
- `package.json` — `jose`, `sharp` and `tsx` are already installed.

## Read this before writing the client

**The network here blocks Kling.** `api.klingai.com`, `api-singapore.klingai.com`,
`kling.ai` and `app.klingai.com` all return 403 from this environment's egress proxy. So:

- Build and unit-test the client against **recorded fixtures**. `npm run images:generate --
  --mock` must run the entire pipeline end to end with no network.
- **Your first task is to verify the live API surface** against Kling's current
  documentation using WebSearch, because the model names move between releases
  (`kling-v1-5` → `kling-v2-1` → newer `kling-v3` / `kling-image-o1` names appear in 2026
  sources). Put the model name in `scripts/images/config.ts`, never at a call site.
- Real generation is run by the user on their own machine. Document the exact commands.

## API shape, as far as it is known

- **Auth**: JWT, HS256, signed with `KLING_ACCESS_KEY` / `KLING_SECRET_KEY`. Payload
  `{ iss: accessKey, exp: now + 1800, nbf: now - 5 }`, sent as `Authorization: Bearer <jwt>`.
  Cache the token in-process with a 5-minute expiry buffer. Use `jose`.
- **Submit**: `POST https://api.klingai.com/v1/images/generations` →
  `{ code, message, data: { task_id, task_status } }`
- **Poll**: `GET https://api.klingai.com/v1/images/generations/{task_id}` until
  `task_status` is `succeed` or `failed`. Exponential backoff, capped attempts, per-task
  timeout, concurrency capped at 2 by default to respect account rate limits.
- **Download immediately** — Kling result URLs expire. Nothing on the site may ever link to
  a Kling-hosted URL.

Verify all of the above against live docs before the first real run, and correct it here if
it has changed.

## Secrets

Read from `process.env` in Node only. **Never** `VITE_`-prefixed: Vite inlines any `VITE_*`
value into the client bundle, which would publish the secret key. An eslint rule enforces
this; do not work around it.

## The manifest

`content/images.manifest.ts`, one entry per slot: `slug`, `prompt`, `negativePrompt`,
`aspect`, `count`, optional `seed` and `referenceSlug`, and a hand-authored Hebrew `alt`.

- **House style.** A single shared style suffix appended to every prompt — lens, light, time
  of day, palette, grade — so the set reads as one commissioned shoot rather than a bag of
  unrelated renders. Tune it warm and architectural so it sits well beside the brand green
  `#8CC542`. A shared `referenceSlug` pins consistency where it matters.
- **Global negative prompt must suppress all lettering.** Kling renders Hebrew text as
  garbage. No image may contain signage, banners or type of any kind.
- **`alt` text is written by you in Hebrew, never model-generated**, and never keyword-
  stuffed — undoing that is part of the brief.

## The honesty constraint — do not design around this

Every asset you produce is marked `aiGenerated: true`. AI imagery is permitted **only** for
atmospheric, architectural and editorial slots: hero, division headers, the ten service
images replacing the legacy icon PNGs, section dividers, textures, and neutral city scenes
for blog and listing fallbacks.

AI imagery must **never** stand in for a specific marketed property. A real-estate firm
publishing synthetic photographs of real listings is misleading and carries
consumer-protection exposure in Israel. Listing galleries take real photography only.

## Pipeline — `npm run images:generate`

Manifest → hash prompt and params → skip anything already generated (idempotent, safe to
re-run) → submit → poll → download → `sharp` to AVIF + WebP at three widths → generate the
LQIP → rewrite the `assets` block in `src/content/media.ts` → write
`public/media/manifest.lock.json` recording prompt hash, model, timestamp and cost per asset.

Flags: `--mock` (fixtures, no network), `--dry-run`, `--only <slug>`.

## Definition of done

`npm run verify` passes; `npm run images:generate -- --mock` completes the full pipeline
offline; unit tests cover JWT claim correctness, polling across `succeed` / `failed` /
timeout, and that downloads persist locally; and `README.md` documents the live run.
