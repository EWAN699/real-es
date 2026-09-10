# Asset generation log

Every Kling job, logged as it happens per `contracts/assets.md`. A job appears here the
moment it is submitted, so a failed or lost run can be traced without re-running it.

**Result URLs expire ~24 hours after generation.** All seven jobs below were downloaded
to `assets/source/` immediately on completion, so the expiry no longer matters.

**Phase 3A totals:** 7 jobs, 180 credits (V1 Step A 20 + V1 Step B 40 + six images at 20).
Balance after the run: 343 credits. All seven pinned to the models the user fixed at the
approval gate — `gemini-3-pro-image` for stills, `kling-video-v3_0` for the hero.

| Job | Section | Generation id | Model | Credits | Finished (UTC) | Took | Outcome |
| --- | --- | --- | --- | --- | --- | --- | --- |
| V1 A | `hero` | `Afz-ql1IMT_KBWeaeM-GlKxw-CusTDu9KeuF5NcwvtId1zO6yftGUdrC-UtXKgVCUN_RbJoI` | gemini-3-pro-image | 20 | 2026-09-09 | 32s | ✅ shipped |
| V1 B | `hero` | `AWI6VTEKVxW9ZQNaAMIwLa5TwvG0Ry5IuV3GR4W6WplyKW5rZH9qFa5pyDeE5WxDvMhWYgHw` | kling-video-v3_0 | 40 | 2026-09-10 10:35:28Z | 245s | ✅ shipped |
| I1 | `numbers` | `AbwzylAagQU1jbNW41ODVkoAjLQuu7IE62zu6LP0unZa6FNnrxG7tsdlsil9vVnznBPXqNJj` | gemini-3-pro-image | 20 | 2026-09-10 10:32:00Z | 33s | ✅ shipped |
| I2 | `services` | `AYaNy5mVN0Fg1u3rq5d9wGO5a79Tmz8KIMeQIMjtQr1de6tAkTmEi4minRJmLfyuFAXtBAi-` | gemini-3-pro-image | 20 | 2026-09-10 10:32:18Z | 47s | ✅ shipped |
| I3 | `method` | `AUtBE7w1rjPbhMoY862lS4OJj3VSLw9SPsyg_I2mNFGxbXLGUYbj-QLGvdHycKwZg1T98PRZ` | gemini-3-pro-image | 20 | 2026-09-10 10:32:17Z | 41s | ✅ shipped |
| I4 | `package` | `AcvDEgcze8mKZJOP_Sn0E3ONM2xNGvDyjxjbx1K20NOTcFeMe2WjbbhByce_mCNfUjRMIVae` | gemini-3-pro-image | 20 | 2026-09-10 10:32:12Z | 32s | ✅ shipped |
| I5 | `coverage` | `AYjg_4v4TUScU2mF-Sa7d139XWeayER5U2BV4ShbmODb6SIVNTmWTfW7buwOk_kAj8e6k1Yc` | gemini-3-pro-image | 20 | 2026-09-10 10:32:15Z | 31s | ⛔ **rejected — see below** |
| I6 | `consult` | `AXnBUEDSBZOkNgqAxQlbERMjHc0wp9ccuv51b8YG_pFlAnwJMlozJj4femFTM-FlnGpJBzQD` | gemini-3-pro-image | 20 | 2026-09-10 10:32:22Z | 34s | ✅ shipped |

---

## CDN blocker — RESOLVED

The allowlist entry landed between sessions. Measured again at the start of Phase 3A
rather than assumed:

```
curl https://klingai.com/            →  301   (was 000)
curl <V1 Step A result url>          →  200, 4,730,349 bytes
```

The 24h-old Step A URL was still live and downloaded intact, so no job had to be paid
for twice.

**The shard warning was correct.** This run's results came back on three different
hosts — `s15-kling`, `s16-kling`, and `v15-kling` for the video. Allowlisting the
single literal host `s15-kling.klingai.com` would have failed roughly half these
downloads. The `*.klingai.com` + `klingai.com` entry is what made the phase work.

---

## V1 · hero · `hero/hero-loop`

Two steps: `text_to_image` for the frame, then `image_to_video` to animate it.

**Step B parameters, and why they were pinned rather than defaulted.** The model's
defaults would have broken the contract three ways, so all three were set explicitly:

| Argument | Default | Set to | Reason |
| --- | --- | --- | --- |
| `resolution` | `4k` | `1080p` | `contracts/assets.md` caps the hero at 1920×1080 and 3.5 MB per format. |
| `prefer_multi_shots` | `true` | `false` | Smart shot-splitting inserts cuts; the brief says "no cuts". |
| `enable_audio` | `false` | `false` | Contract requires a silent loop. Set explicitly so a default change cannot ship audio. |
| `duration` | `5` | `5` | Shortest that loops without reading as a stutter. |

**Delivered:** 1928×1072, 5.04s, 24fps, no audio stream. Two deviations handled in
post rather than by resubmitting:

1. **Dimensions.** 1928×1072 is not the contracted 1920×1080. Scaled to height 1080
   (lanczos) and centre-cropped to exactly 1920×1080 — no distortion, ~11px lost per
   side.
2. **Loop seam.** Frame 0 and the final frame were visibly different framings, so a
   hard loop would jump. Fixed with the crossfade the asset plan already prescribed for
   this case ("the fix is a short crossfade … not a resubmission"): the first 0.8s is
   dropped from the body and the body's tail is cross-dissolved into that same head,
   giving 4.25s whose first and last frames match.

   **Seam verified, not asserted.** Mean absolute pixel difference, 0–255:

   | Pair | Difference |
   | --- | --- |
   | first frame vs last frame (the loop point) | **1.14** |
   | first frame vs frame 30 (ordinary motion) | 3.82 |

   The loop point is now a smaller visual step than normal movement inside the shot.

**Shipped:** `hero-loop.mp4` 592 KB, `hero-loop.webm` 152 KB, `hero-loop-poster.webp`
40 KB — against ceilings of 3.5 MB / 3.5 MB / 150 KB.

---

## I5 · `coverage` · REJECTED, held for a decision

**The job succeeded technically and failed its own acceptance criterion.**

The prompt ended with "no borders drawn, no place labels, no recognisable coastline
shape", and the asset plan flagged why that clause mattered:

> **"No recognisable coastline shape" is load-bearing** — an identifiable map of Israel
> would turn an illustration into a territorial claim.

What came back is a recognisable night satellite view of the Levant: the Mediterranean
coast, the Dead Sea, the Sea of Galilee and the Jordan Rift are all legible. That is
precisely the outcome the clause existed to prevent, so it has **not** been placed in
`public/media/` and `coverage` still carries `media: []`.

Not re-run. `contracts/assets.md` forbids resubmission after a bad result without
asking, so the decision is the user's. The 20 credits are spent either way.

The production build does **not** depend on this: `coverage` had no media entry to
begin with, so nothing is gated on it.

---

## Notes carried to Phase 3B

- **I2 beat its own forecast.** The plan predicted the service corridor was the most
  likely of the seven to disappoint on `gemini-3-pro-image` rather than `gpt-image-2`.
  It came back with clean meter banks, sharp conduit runs and correct one-point
  perspective. The single-model decision cost nothing here. One deviation: the painted
  floor line rendered safety-yellow, which sits outside the ink/brass/limestone system.
  Legible as a real service corridor; flagged in case 3B wants it toned down.
- **I1 needs a scrim.** The plate is correctly flat and frontal, but window-to-facade
  contrast across the middle third is higher than asked. The 300 / 9.6 / 0% / 24-7
  figures will need a scrim or a darkened band to stay readable.
- **I4's seam is exactly centred**, so the `pin-reveal` handle can assume 50%.
- **Hero alt text corrected.** It described a "reflection" of a building facade; the
  frame shows the facade itself, defocused behind the key. `contracts/assets.md`
  requires alt to describe content, so the wording was changed to match what is there.
