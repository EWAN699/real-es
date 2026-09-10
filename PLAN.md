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
| Kling assets download to disk | Kling MCP traffic reaches Anthropic's servers, but result URLs sit on a CDN this session cannot fetch. | **Unresolved.** See the blocker below. |

## Open blocker — Kling asset download

Kling returns assets as CDN URLs that expire in ~24h, and this session has no egress to
fetch them. Phase 3A therefore runs **one** image first, reports the CDN host, and stops.
Resolution options, user's call:

1. Add that host to the environment's Custom allowed domains and start a new session.
2. The user downloads the assets and pushes them.
3. Ship with the imagery already on the existing site, and skip Kling.

No Kling job runs before the user approves `content/asset-plan.md` either way.

## Phases

- [x] **Phase 0 — Orchestrator setup.** Contracts, agent definitions, CSV committed, dead scraper removed.
- [ ] **Phase 1A — `ui-motion` START.** Harvest → `content/raw-harvest.json`, `brand.md`, `pages.json`, `asset-plan.md`. **Gate: user approves the asset plan.**
- [ ] **Phase 1B — `platform` START.** Scaffold, typed loader, Lenis + `useScrollAnimation`, media script, SEO, RTL, Playwright.
- [ ] **Phase 2 — Contract check.** `pages.json` validates through the loader. Mismatches fixed in content, not schema.
- [ ] **Phase 3A — Assets.** Blocked on the gate and the CDN blocker.
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
