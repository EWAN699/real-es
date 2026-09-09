# קבוצת קיסר — caesar.co.il rebuild

A ground-up rebuild of the קבוצת קיסר / CAESAR site: an Israeli real-estate group covering
property management, construction and development management, and business ventures and
investment.

Hebrew-first and RTL, prerendered to static HTML, with all editorial photography generated
through the **Kling AI** API rather than bought as stock.

## Stack

Vite 6 · React 18 · TypeScript (strict) · Tailwind CSS v4 · vite-react-ssg · Zod ·
Vitest · Playwright + axe-core · sharp

Every route is prerendered. A property-marketing business lives on organic search, so a
client-rendered SPA was not an option.

## Getting started

```bash
npm install
npm run dev        # dev server
npm run verify     # typecheck + lint + unit tests + production build
npm run test:e2e   # Playwright at 375 / 768 / 1440, RTL + axe
npm run preview    # serve the prerendered build
```

Chromium is preinstalled in the remote environment — never run `playwright install` there.

## Generating the photography

Images are generated at **build time** and committed as optimised static assets, so the
runtime never holds Kling credentials and visitors never wait on a model.

```bash
cp .env.example .env.local     # add KLING_ACCESS_KEY and KLING_SECRET_KEY
npm run images:generate        # generate everything missing from the manifest
npm run images:generate -- --only hero-villa-dusk   # regenerate one slot
npm run images:generate -- --mock                   # full pipeline, no network
```

The pipeline is idempotent: it hashes each prompt and skips anything already produced, so
re-running is cheap and safe.

> **Note.** `api.klingai.com` is blocked by the egress proxy in the Claude Code remote
> environment, so real generation must run on a machine with access. `--mock` exercises the
> entire pipeline against recorded fixtures and is what CI uses.

`KLING_ACCESS_KEY` and `KLING_SECRET_KEY` must **never** carry a `VITE_` prefix — Vite
inlines any `VITE_*` value into the client bundle. An eslint rule and a CI grep enforce it.

### On AI imagery and honesty

Generated imagery is confined to atmospheric, architectural and editorial slots — hero,
division headers, service images, textures, city scenes. It is **never** used to depict a
specific marketed property: publishing a synthetic photograph of a real listing is
misleading and carries consumer-protection exposure in Israel. Every generated file records
`aiGenerated: true` in the media registry so this stays auditable.

## Design system

Tokens live in `src/styles/tokens.ts` and are mirrored into Tailwind's `@theme` block in
`src/styles/theme.css`. `tokens.test.ts` fails the build if the two drift, or if any shipped
colour pairing falls below its WCAG floor.

The brand green is kept but disciplined. The legacy site used `#8CC542` for body text and
links on white, which measures about 2:1 against a 4.5:1 requirement:

| Token | Use |
| --- | --- |
| `brand-500` `#8CC542` | The logo green. Large shapes and accents. Never text on light. |
| `brand-600` `#6FA22F` | Hover, borders, large display text (clears 3:1). |
| `brand-700` `#4F7A1F` | Text and links on light grounds (clears 4.5:1). |
| `brand-300` `#B4DC85` | Brand-coloured text on dark grounds. |

Type is Heebo (display) and Assistant (text), both real Hebrew families, subset to Hebrew
and Latin.

## Accessibility

WCAG 2.1 AA natively, targeting IS 5568 with a published `הצהרת נגישות`. The legacy site
relied on an accessibility overlay widget; overlays do not deliver compliance, so this build
does the real work — semantic landmarks, ordered headings, labelled controls, visible focus,
full keyboard operation, and an axe-core gate in CI.

## Architecture

```
src/
  components/   # caesar-ui
  pages/        # caesar-ui
  styles/       # caesar-ui — tokens live here
  content/      # caesar-data … except media.ts, which is caesar-photo
  lib/          # caesar-data — redirects, structured data, filters
api/            # caesar-data — serverless functions
scripts/images/ # caesar-photo — the Kling pipeline
content/        # caesar-photo — images.manifest.ts
```

The work is split across three agents with disjoint file ownership, defined in
`.claude/agents/`. Three files are frozen contracts that cross those boundaries and must not
be changed unilaterally: `src/content/types.ts`, `src/content/media.ts` and
`docs/API_CONTRACT.md`.

## Migration notes

The rebuild deliberately drops, from the WordPress original: the WordPress login and
registration form on the public homepage, the five-slide hero carousel, the Facebook page
embed, the ten-language machine-translation widget, a Google+ link, reCAPTCHA on first
paint, and the accessibility overlay.

`src/lib/redirects.ts` maps every legacy percent-encoded Hebrew URL to its new path, so a
decade of accumulated search equity survives the move.
