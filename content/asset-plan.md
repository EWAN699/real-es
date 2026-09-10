# Asset plan — Kling jobs proposed

**Status: APPROVED by the user. Generation in progress.**

## 0. Decisions taken at the approval gate

| Decision | Outcome |
| --- | --- |
| **Approve the 7 jobs?** | Yes. |
| **Asset delivery** | User allowlists the Kling CDN host in the environment's network settings. One job (V1 Step A) is run first to discover the exact host, so the change is made once. |
| **Palette** | No client brand assets available. Proceed with the proposed ink `#12181C` / brass `#B8873F` / limestone `#F4F1EC`. |
| **Model spread** | **Rejected.** All seven jobs pinned to `gemini-3-pro-image` for visual consistency across the set. |

**Consequence of the single-model decision, recorded rather than hidden:** job I2 (the
back-of-house service corridor) was specified for `gpt-image-2` because that model
handles cluttered mechanical detail and repeated industrial geometry more reliably.
On `gemini-3-pro-image` that frame is the most likely of the seven to disappoint. If it
comes back soft on the conduit and meter detail, the fix is a prompt revision, reported
before any resubmission — not a silent switch back.

**One thing the single-model choice makes easier:** `image_to_video` accepts a
Kling-hosted image URL as its input, so the hero's still→video chain (V1 Step A → Step B)
runs entirely server-side and needs no download. The CDN blocker affects only getting
finished assets into the repo, not chaining the two steps.

**Budget used:** 1 hero video + 6 images — exactly the cap, nothing held in reserve.
**Models are stated explicitly per job.** There are no server-side defaults.

Before reading the jobs, note the blocker recorded in `PLAN.md`: Kling returns results
as CDN URLs that expire in ~24h, and this session has no egress to fetch them. Approving
this plan does not by itself make the assets landable. See §4.

---

## 1. Design intent

Every job serves a section that already exists in `content/pages.json`, and each one
renders one of the five visual metaphors in `content/brand.md` §6. The palette is
`--caesar-ink #12181C`, `--caesar-brass #B8873F`, `--caesar-limestone #F4F1EC`; every
prompt names those hues in plain language so the set reads as one system rather than
seven unrelated stock frames.

Three hard rules carried into every prompt:

- **No text, no signage, no logos, no legible lettering.** Generative Hebrew is always
  wrong, and generative Latin on an Israeli building is worse.
- **No recognisable real buildings.** Caesar's current site illustrates itself with
  photos of Azrieli and Midtown, and nothing in the harvest shows they manage either
  (see `raw-harvest.json` → `coverageGaps`). Generating a recognisable landmark would
  repeat that implied claim. Everything here is deliberately generic-Israeli-urban.
- **No people with legible faces.** Silhouettes and motion-blurred figures only. Avoids
  both the uncanny-valley failure mode and any implied endorsement.

---

## 2. Hero video — 1 job

### V1 · `hero` · the key that never leaves the desk

| | |
| --- | --- |
| **Section** | `hero` (`type: hero`, motion `text-split`) |
| **Media id** | `hero-loop` → `public/media/hero/hero-loop.{mp4,webm}` + `hero-loop-poster.webp` |
| **Pipeline** | still first, then animate. **Step A** `text_to_image` · **gemini-3-pro-image**. **Step B** `image_to_video` · **kling-video-v3_0** |
| **Duration** | 5 s (v3_0 range is 3–15 s; 5 s is the shortest that loops without reading as a stutter) |
| **Aspect** | 16:9, delivered 1920×1080 |
| **Budget** | ≤ 3.5 MB per format, silent, seamless loop (`contracts/assets.md`) |

**Why this pipeline.** `kling-video-v3_0` is image-to-video, so it needs a source
still. Generating that still separately is also the cheaper failure mode: if the frame
is wrong we discard an image, not a video. gemini-3-pro-image is chosen for step A
because this frame lives or dies on believable specular highlights on brass and on a
controlled shallow depth of field.

**Step A prompt (text_to_image, gemini-3-pro-image, 16:9):**
> A single brass door key with a plain leather fob resting on a dark walnut desk,
> photographed close and slightly from above. Shallow depth of field, the key sharp,
> the background falling away fast. Behind the desk, far out of focus, the soft
> rectangular glow of an apartment building facade at dusk — indistinct, just warm
> lit windows in a dark blue field. Warm brass and near-black palette, deep charcoal
> #12181C shadows, muted gold #B8873F highlights on the metal. Single soft key light
> from the upper left, no fill, quiet and expensive. Editorial architectural
> photography, 85mm lens, no text, no lettering, no logos, no people.

**Step B prompt (image_to_video, kling-video-v3_0, 5 s):**
> Almost still. The camera drifts a few centimetres forward and to the left, very
> slowly. The out-of-focus lit windows behind flicker faintly, one going dark near the
> end. Dust moves gently in the key light. The key itself does not move. No cuts, no
> zoom, no camera shake, no people entering frame.

**Loop note.** The one lit window going dark near the end gives the loop point a
reason to exist and quietly restates the argument: occupancy is the thing being
watched. Ask for the seam to be checked at handoff; if it visibly jumps, the fix is a
short crossfade in `scripts/optimize-media.ts`, not a resubmission.

---

## 3. Images — 6 jobs

### I1 · `numbers` · lit windows at dusk, counted

| | |
| --- | --- |
| **Section** | `numbers` (`type: stats`, motion `fade-up`) — background plate behind the 300 / 9.6 / 0% / 24/7 figures |
| **Model** | `text_to_image` · **gemini-3-pro-image** |
| **Aspect** | 21:9, longest edge 2000px |
| **Alt (he)** | בניין מגורים בשעת דמדומים, חלק גדול מחלונותיו מוארים |

> A wide, flat-on elevation of a modern residential apartment block at blue hour,
> maybe forty windows in a regular grid. Most windows are lit warm amber; a handful
> are dark. The facade is pale stone and glass, the sky a deep desaturated navy.
> Absolutely frontal, architectural-survey framing, no perspective distortion, no sky
> drama. Cool near-black #12181C in the shadows, warm #B8873F in the lit windows.
> Calm, documentary, unpeopled. No text, no signage, no balconies with clutter,
> no recognisable landmark.

Needs a flat frontal plate because numerals sit on top of it. Ask for low local
contrast in the middle third.

### I2 · `services` · the service corridor

| | |
| --- | --- |
| **Section** | `services` (`type: services`, motion `horizontal-scroll`) — lead card of the track |
| **Model** | `text_to_image` · **gemini-3-pro-image** |
| **Aspect** | 4:5, longest edge 2000px |
| **Alt (he)** | מסדרון שירות בבניין מסחרי — לוח מונים ותשתיות, מואר בתאורת עבודה |

> A back-of-house service corridor in a commercial building. A bank of utility meters
> and neat conduit runs along one concrete wall, a painted floor line along the other.
> Practical strip lighting overhead, everything clean and recently maintained. Cool
> grey concrete, a single brass-toned brushed metal panel catching the light. Straight
> down the corridor, one-point perspective. Unglamorous, precise, documentary.
> No people, no text, no gauge numbers, no warning labels, no logos.

gpt-image-2 for this one: it handles cluttered mechanical detail and repeated
industrial geometry more reliably than the alternatives, and this frame is entirely
detail.

### I3 · `method` · tenant mix as a lit floorplate

| | |
| --- | --- |
| **Section** | `method` (`type: showcase`, motion `pin-reveal`) — replaces the placeholder `method-concourse` |
| **Model** | `text_to_image` · **gemini-3-pro-image** |
| **Aspect** | 16:9, longest edge 2000px |
| **Alt (he)** | מבט מלמעלה על רחבת קניון מוארת, שבה תנועת הקונים מסמנת את תמהיל החנויות |

> Looking straight down from a high atrium onto the ground floor of a shopping centre.
> Long exposure: the shoppers are soft light trails tracing paths across a polished
> pale stone floor, while the storefronts and planters stay sharp. Warm shop light
> against a cool grey floor, a brass-toned handrail catching light at the frame edge.
> Symmetrical, graphic, almost a diagram. Deep charcoal #12181C in the unlit corners,
> gold #B8873F in the trails. No text, no brand names, no shop signage, no readable
> faces.

This is the literal picture of תמהיל — the word Caesar uses for the job. It is the
argument of the showcase section, not decoration.

### I4 · `package` · before and after, one frame

| | |
| --- | --- |
| **Section** | `package` (`type: process`, motion `pin-reveal`) — replaces `package-before-after` |
| **Model** | `text_to_image` · **gemini-3-pro-image** |
| **Aspect** | 16:9, longest edge 2000px |
| **Alt (he)** | סלון דירה מצולם מאותה נקודה לפני ואחרי שיפוץ, עם תפר אנכי חד בין שני המצבים |

> One apartment living room photographed from a single fixed viewpoint, split down the
> exact middle by a hard vertical seam. Left half: tired and empty — scuffed walls,
> old tiling, bare bulb, grey daylight. Right half: the identical room renovated —
> warm oak floor, clean plaster, soft lamps, restrained modern furniture. Identical
> camera position, identical window, identical perspective on both sides; only the
> finish changes. Warm limestone #F4F1EC on the renovated side, cold grey on the
> other. No people, no text, no visible brand.

The seam is the animation handle: the showcase pin drives it across on scroll, and it
sits static at 50% under `prefers-reduced-motion`.

### I5 · `coverage` · the coastal spine

| | |
| --- | --- |
| **Section** | `coverage` (`type: coverage`, motion `fade-up`) — a new media entry; currently `media: []` |
| **Model** | `text_to_image` · **gemini-3-pro-image** |
| **Aspect** | 3:4, longest edge 2000px |
| **Alt (he)** | תצלום אוויר בלילה של רצועת עיור לאורך קו החוף, אשכולות אור צפופים ופחות צפופים |

> A high night aerial over a dense Mediterranean coastal strip. Clusters of warm city
> light thin out inland to darkness and stop hard at a black sea on one side. Seen from
> very high, almost a satellite view, no individual buildings readable. Warm amber
> lights on deep near-black #12181C. Quiet, cartographic, no clouds, no aircraft, no
> text, no borders drawn, no place labels, no recognisable coastline shape.

Honest to what the region counts actually say: 191 of 278 live listings sit in Gush
Dan and Haifa. A spine, not a blanket. **"No recognisable coastline shape" is
load-bearing** — an identifiable map of Israel would turn an illustration into a
territorial claim.

### I6 · `consult` · the building at rest

| | |
| --- | --- |
| **Section** | `consult` (`type: cta`, motion `parallax-slow`) — replaces `consult-dusk` |
| **Model** | `text_to_image` · **gemini-3-pro-image** |
| **Aspect** | 16:9 at 2.4× section height for parallax headroom, longest edge 2000px |
| **Alt (he)** | חזית בניין מגורים בשעת ערב, אור חם בכניסה ובחלק מהחלונות |

> A quiet residential building entrance in the evening. Warm light spills from a clean
> lobby through glass onto a stone forecourt; a few windows above are lit. Nobody
> present. Soft rain-damp ground reflecting the light. Deep charcoal #12181C sky,
> limestone #F4F1EC walls, a brass #B8873F handle and lobby trim. Still, welcoming,
> slightly formal. No text, no house number, no intercom labels, no signage, no people.

Per `contracts/motion.spec.md`, `parallax-slow` needs its container to have
`overflow: hidden` and a fixed aspect ratio; generating tall gives the translate room
to run without revealing an edge.

---

## 4. What is not covered, and what to decide

**Sections still without imagery after these seven jobs:** `about`, `testimonials`,
`faq`, `contact`. That is intentional — they are text-dense, and `contracts/motion.spec.md`
explicitly permits `none`/`fade-up` for dense text. They need type, not pictures.

**The `original-site` image already in `pages.json`.** `method-existing-mall` points at
a live URL on caesar.co.il and carries a credit note warning that Caesar's management
of that property is unverified. If the client cannot confirm the mandate, drop that
media entry rather than shipping an implied claim; I3 already covers the section.

**Three decisions I need back with the approval:**

1. **The CDN blocker.** These seven jobs cost money and produce URLs this session
   cannot fetch. Resolve `PLAN.md`'s open blocker first — allowlist the Kling CDN host,
   or accept that the user downloads and commits the files. Generating first and
   solving delivery afterwards risks paying twice.
2. **Brand colours are unverified.** The hex values in every prompt come from
   `brand.md` §4, which is a *proposal* — this environment blocks all image and CSS
   fetches, so I never sampled a real brand colour. If the client supplies a logo or
   brand sheet, the palette changes and all seven prompts need re-tinting **before**
   generation, not after.
3. **Model spread.** I have deliberately spread across four models rather than
   defaulting to one, matching each to what the frame demands. If you would rather
   pin everything to a single model for visual consistency, say so before approval —
   my recommendation is gemini-3-pro-image throughout, at some cost to I2's
   mechanical detail.

**On failures.** Per `contracts/assets.md`, no silent retries and no resubmission after
an error without asking. If a job returns something unusable I will report it, log it to
`content/asset-log.md`, and stop.
