# Claude Code — Multi-Agent Website Rebuild

> Fill in the two placeholders, then paste everything below the line into a fresh Claude Code session (Opus 5).
> Before running: add the MCPs to Claude Code (they don't carry over from the Claude app):
>
> ```bash
> claude mcp add --transport http firecrawl https://mcp.firecrawl.dev/v2/mcp-search
> claude mcp add --transport http klingai https://kling.ai/mcp
> claude mcp add --transport http vercel https://mcp.vercel.com/   # or your chosen host
> ```
>
> Then inside Claude Code run `/mcp` and authenticate each one.

---

## Mission

Rebuild the website at **{{SITE_URL}}** for **{{COMPANY_NAME}}** as a modern scroll-driven, cinematic marketing site. The new site must feel like it was designed *for this company* — its industry, its tone, its actual work — not a generic template. Preserve the real content and language of the original (if it is Hebrew, ship full RTL support).

You are the **orchestrator**. You will create and run two subagents, each with a defined START task and END task, coordinate them through shared contracts, and finish with a deployed demo URL I can share.

## Stack decision

Default to **Next.js (App Router) + TypeScript + Tailwind + GSAP ScrollTrigger + Lenis** (smooth scroll), deployed to **Vercel** for demo hosting. I prefer React, but if after the scrape you judge the site is purely static with no forms or dynamic needs, you may propose Astro with React islands instead — state the tradeoff in one paragraph and wait for my OK before scaffolding. Do not switch frameworks silently.

Non-negotiables:
- `prefers-reduced-motion` fallback for every animation
- Mobile-first; scroll choreography must work on touch
- Lighthouse ≥ 90 performance on mobile for the home page
- No layout shift from lazy-loaded media

## Phase 0 — Orchestrator setup (you, alone)

1. Create `PLAN.md` with the phase checklist below and keep it updated as agents report back.
2. Create the two subagent definitions in `.claude/agents/` (`ui-motion.md`, `platform.md`) using the specs below.
3. Create the shared contracts folder `contracts/` containing:
   - `content.schema.json` — the JSON schema every page/section will conform to (sections have: `id`, `type`, `heading`, `body`, `media[]`, `cta?`, `order`)
   - `motion.spec.md` — naming convention for animation presets (`fade-up`, `pin-reveal`, `parallax-slow`, `text-split`, `horizontal-scroll`), and which section types may use which
   - `assets.md` — file naming + location rules (`public/media/{section-id}/{variant}.{ext}`), max sizes, required formats (webp/avif for images, mp4 + webm for video, poster frame required)
4. Both agents must read all three contracts before starting and must not change them without reporting to you first.

## Agent A — `ui-motion`

**Role:** Brand research, visual assets, and every pixel the user sees.

**Tools:** Firecrawl MCP, Kling AI MCP, file system.

**START task — Research & assets** (blocks on my approval at step 4):
1. Use Firecrawl to scrape `{{SITE_URL}}` — every reachable page, nav structure, all copy, image alt text, meta tags, and any brand colors/fonts you can infer from the CSS.
2. Write `content/brand.md`: who the company is, what they do, who they sell to, tone of voice, palette (extracted + a proposed refined palette), typography direction, 3–5 visual metaphors that fit their industry.
3. Write `content/pages.json` conforming to `contracts/content.schema.json` — the full site content mapped into sections, rewritten only where the original copy is thin or repetitive. Keep the original language.
4. Write `content/asset-plan.md`: an itemized list of every Kling generation you intend to run (prompt, model, image vs. video, duration, aspect ratio, which section it serves). **Cap: 1 hero video + up to 6 images unless I raise it.** Kling charges per job — **STOP and present this plan to me for approval before generating anything.** Do not run trial jobs.
5. After approval: call `who_am_i` once, then generate assets with Kling, poll with `query_tasks`, download every result immediately (URLs expire in 24h), and save into `public/media/` per `contracts/assets.md`. Log each generation ID and prompt in `content/asset-log.md`.

**START deliverable:** `content/brand.md`, `content/pages.json`, `content/asset-plan.md` (approved), all assets on disk, `content/asset-log.md`.

**END task — Build the front end:**
1. Implement every section as a component under `components/sections/`, driven by `content/pages.json` through the loader Agent B provides.
2. Implement scroll choreography with GSAP ScrollTrigger + Lenis per `contracts/motion.spec.md`: pinned hero with the Kling video, text reveals, parallax on generated imagery, at least one horizontal-scroll or pin-sequence section that showcases the company's actual work.
3. Every animation has a reduced-motion path. Videos have poster frames and are lazy-loaded below the fold.
4. Responsive pass on 375px, 768px, 1440px. Verify with the Playwright screenshots Agent B sets up.
5. Run Lighthouse; fix anything under 90 on mobile.

**END deliverable:** All sections implemented and wired, `MOTION-NOTES.md` documenting each section's animation and how to tweak it, screenshots at three breakpoints, Lighthouse report.

## Agent B — `platform`

**Role:** Project skeleton, data layer, tooling, deployment.

**Tools:** file system, shell, Vercel MCP (or the host I choose).

**START task — Scaffold & plumbing** (runs in parallel with Agent A's START):
1. Scaffold the Next.js app (TypeScript, Tailwind, ESLint, Prettier). Install GSAP, Lenis, and a media helper (e.g. `sharp` for image optimization at build time).
2. Build `lib/content.ts`: a typed loader that validates `content/pages.json` against `contracts/content.schema.json` at build time and fails the build on schema errors.
3. Set up the Lenis provider and a `useScrollAnimation` hook wrapper around GSAP ScrollTrigger so Agent A doesn't re-implement setup per section.
4. Create a `scripts/optimize-media.ts` that converts anything dropped into `public/media/` into the formats required by `contracts/assets.md` and generates poster frames for videos.
5. Add SEO metadata generation from `pages.json`, `sitemap.xml`, `robots.txt`, and an OG image route.
6. If the original site has a contact form, add `app/api/contact/route.ts` with validation and an env-driven email provider stub; otherwise skip.
7. Playwright config with a screenshot script for the three breakpoints.

**START deliverable:** App boots with placeholder content, loader validates schema, hooks and scripts documented in `README.md`.

**END task — Integrate, harden, deploy:**
1. Once Agent A's END is in, run the media optimization script, run the full build, fix type/lint errors.
2. Add GitHub Actions: lint + build + Playwright screenshots on every push.
3. Deploy to Vercel (preview on every branch, production on `main`). Set env vars. Return the live demo URL.
4. Write `DEPLOY.md`: how to redeploy, where env vars live, how to point a custom domain later.

**END deliverable:** Green CI, live demo URL, `DEPLOY.md`.

## Orchestration rules

- **Phase 1:** Launch both START tasks in parallel. Agent A pauses at asset approval — surface that plan to me immediately and continue Agent B meanwhile.
- **Phase 2:** When both STARTs are done, check that `content/pages.json` validates against Agent B's loader. Resolve mismatches yourself by editing content, not the schema, unless the schema is wrong.
- **Phase 3:** Launch Agent A's END. When it reports done, launch Agent B's END.
- **Phase 4:** Run the final build and Lighthouse yourself as a check on the agents. Report to me with: demo URL, screenshots, Lighthouse scores, total Kling jobs run, and anything you cut or changed from the plan and why.
- Agents report to you, not to me, except the asset-approval gate and a framework-change proposal — those come straight to me.
- Commit after each phase with a clear message. Never commit `.env`.
- If an MCP call errors or hangs, tell me what happened and ask before retrying. Do not silently swap parameters or resubmit paid jobs.
