# Caesar rebuild — phase checklist

Rebuild of **https://www.caesar.co.il/** for **קיסר ניהול נכסים** (Caesar Property
Management) as a scroll-driven cinematic marketing site. Hebrew, full RTL.

**Stack:** Next.js (App Router) + TypeScript + Tailwind + GSAP ScrollTrigger + Lenis.
**Host:** Macaly Cloud.

## Environment substitutions

The original brief assumed three capabilities this environment does not have. Recorded
here so the reasoning is not lost:

| Brief assumed | Reality | Substitution |
| --- | --- | --- |
| Firecrawl scrapes every page | The connector exposes only `firecrawl_search` — no scrape, crawl or map tool. Direct egress is blocked (`EGRESS_BLOCKED`; `curl` returns `HTTP 000` for every host). | `firecrawl_search` with `includeDomains` + `highlights`, which returns real page markdown from Firecrawl's servers. Seeded by `archive/source/homepage-webscraper.csv`. |
| Vercel MCP deploys | Not installed. Connectors are Firecrawl, klingai, Macaly Cloud, github. | Macaly Cloud. |
| Kling assets download to disk | Kling MCP traffic reaches Anthropic's servers; result URLs sit on `*.klingai.com`. | **Resolved in Phase 3A.** The user allowlisted the domain between sessions; all seven assets downloaded. |

## Closed blocker — Kling asset download

**Resolved.** The `*.klingai.com` + `klingai.com` allowlist entry was in place at the
start of this session. Re-measured rather than assumed: `klingai.com` returned 301
(was 000) and the 24-hour-old V1 Step A result URL still returned 200 and 4.7 MB, so
no job was paid for twice.

The shard warning in the last session's note was right. Results came back on
`s15-kling`, `s16-kling` and `v15-kling` — allowlisting the single literal host would
have failed about half the downloads.

## Phases

- [x] **Phase 0 — Orchestrator setup.** Contracts, agent definitions, CSV committed, dead scraper removed.
- [x] **Phase 1A — `ui-motion` START.** Harvest → `content/raw-harvest.json`, `brand.md`, `pages.json`, `asset-plan.md`. **Gate: user approves the asset plan.**
- [x] **Phase 1B — `platform` START.** Scaffold, typed loader, Lenis + `useScrollAnimation`, media script, SEO, RTL, Playwright.
- [x] **Phase 2 — Contract check.** `pages.json` validates through the loader. Mismatches fixed in content, not schema.
- [x] **Phase 3A — Assets.** 8 jobs run, 7 shipped, 1 rejected and re-run. Production `npm run build` now passes.
- [ ] **Phase 3B — `ui-motion` END.** Sections, choreography, reduced motion, responsive, Lighthouse.
- [ ] **Phase 3C — `platform` END.** Optimize, build, CI, deploy, `DEPLOY.md`.
- [ ] **Phase 4 — Verification.** Orchestrator re-runs build and Lighthouse independently.

## Rules

- Commit after each phase. Never commit `.env`.
- Agents report to the orchestrator. Only two things go straight to the user: the
  asset-approval gate, and a proposal to change a contract or the framework.
- An MCP error or hang gets reported and asked about — no silent parameter swaps, no
  resubmitted paid jobs.
- Content honesty: every section carries `provenance`. The harvested/authored ratio is
  reported to the user at the end rather than smoothed over.

## Second risk — Macaly and Next.js

Macaly Cloud is connected and holds no apps yet. Its capability guide (`skill_info`)
requires an existing app id, so whether it hosts an arbitrary Next.js App Router build —
rather than only its own template shape — cannot be confirmed without creating one.
Deferred to Phase 3C rather than probed speculatively. If Macaly won't take the build,
the fallback is the repo plus `DEPLOY.md` and a one-click import on the user's own host;
that costs the demo URL from this session, not the work.

## Status log

- **Phase 0 complete.** Contracts written (`contracts/`), agents defined
  (`.claude/agents/`), homepage CSV preserved at `archive/source/`, abandoned network
  scraper deleted (it targeted a network this session cannot reach and never executed).
- **Subagent registration, as predicted.** `.claude/agents/ui-motion.md` and
  `platform.md` are not dispatchable in the session that created them — agent types
  register at session start, so `Agent type 'ui-motion' not found`. The definitions are
  correct and will register in the next session. Phase 1 therefore runs both roles as
  `general-purpose` agents pointed at those same role files, which preserves the
  two-agent split, the parallelism and the isolated contexts.
- **Phase 1 launched.** Agent A (harvest, brand, `pages.json`, asset plan) and Agent B
  (scaffold, loader, hooks, tooling) running in parallel.

- **Phase 1A complete and verified.** Provenance recounted independently
  (37 harvested / 24 rewritten / 1 authored); `pages.json` validated with a real
  Draft 2020-12 validator, 0 errors; motion presets confirmed at the contract caps.
  Harvest is real but shallow — only the site root returned full page markdown, the
  rest are widened SERP snippets.
- **Asset gate passed.** User approved all seven jobs, kept the proposed palette, and
  pinned every job to `gemini-3-pro-image` (rejecting the four-model spread). Recorded
  in `content/asset-plan.md` §0, including the cost: job I2 loses the model picked for
  mechanical detail and is the most likely to disappoint.
- **CDN blocker measured, not assumed.** Job V1 Step A ran (20 credits, completed in
  32s). Host is `s15-kling.klingai.com`; DNS resolves but the proxy refuses the
  connection. The `s15-` prefix is a shard, so the allowlist entry must be
  `*.klingai.com` + `klingai.com`, not the literal host. Remaining six jobs held.
- **Phase 1B and 2 complete and verified.** Orchestrator re-ran everything rather than
  trusting the report: `lint` 0, `typecheck` 0, `format:check` 0, `build:draft` 0
  (7/7 pages against real content). Production `build` correctly exits 1 naming all
  four placeholder assets. Cross-field contract rules independently re-tested — an
  illegal preset on `faq` was caught along with the horizontal-scroll count — and
  `pages.json` restored byte-identical.

## Known gaps carried into Phase 3

- **Build command during the pre-asset phase is `npm run build:draft`.** Plain
  `npm run build` is gated and will fail until real assets land. Deploy must use
  `npm run build`.
- **`npm run build` passes the moment `origin` values flip** from `placeholder` to
  `kling`. No code change needed.
- Agent B flagged that there is no separate `/צור-קשר` route. This is by design: the
  site is a single scroll page and `pages.json` carries a `contact` section, so the
  form has a home. Not a gap.

## Phase 3A — complete

- **Eight jobs ran; 200 credits spent, 323 left.** Seven are shipped and optimized
  inside their size ceilings. Every result was downloaded the moment it completed, so
  the 24h URL expiry is no longer a risk to anything.
- **Production build passes.** `npm run build` previously exited 1 naming four
  placeholder assets; all four are now `origin: "kling"` with real files behind them.
  `lint`, `typecheck`, `format:check` and `validate:content` are all clean
  (7 media assets, 11 sections).
- **The hero needed two post-fixes, neither a resubmission.** Kling returned
  1928×1072 rather than the contracted 1920×1080 (scaled and centre-cropped, no
  distortion), and the raw clip did not loop — fixed with the crossfade the asset plan
  had already prescribed for exactly this case. The seam was then measured, not
  assumed: 1.14 mean pixel difference at the loop point versus 3.82 for ordinary
  in-shot motion.
- **Three model defaults would have violated the contract** and were pinned:
  `resolution` (4k → 1080p), `prefer_multi_shots` (true → false, which would have cut
  the single-shot brief into multiple shots) and `enable_audio`.
- **I5 (`coverage`) was rejected, escalated, and re-run.** The first attempt produced
  a recognisable satellite map of the Levant — Dead Sea, Sea of Galilee and Jordan Rift
  all legible — the exact outcome its "no recognisable coastline shape" clause existed
  to prevent. Not silently re-run: `contracts/assets.md` forbids resubmitting after a
  bad result without asking, so it went to the user, who approved a revision. The fix
  changed the camera rather than adding more negative clauses — a top-down satellite
  view necessarily shows a landmass against a sea, so the revision uses an
  extreme-telephoto oblique filled edge to edge with city light, leaving no horizon or
  shoreline to read as geography. Cost of the mistake: 20 credits, logged rather than
  dropped.
- **One pipeline defect fixed.** `public/media/README.md` says to drop originals into
  `public/media/` and run the optimizer, which left 31 MB of source PNGs staged inside
  `public/` where they would be committed and served. Raw source extensions under
  `public/media/` are now gitignored; only the derivatives ship. Worth folding into
  the script properly in 3C so it reads from `assets/source/` instead.
- **The optimizer was silently violating its own contract.** It reported over-budget
  files and then wrote them anyway; `coverage-density` was the first frame dense enough
  to expose it (483 KB against a 400 KB ceiling). It now steps quality down until the
  file fits and reports what it did. One step sufficed: quality 74, 314 KB.
